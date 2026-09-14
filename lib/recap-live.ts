/**
 * The live recaps: read from, and published to, the Apps Script web app.
 *
 * The recap a reader sees is the live copy when one exists, and the empty
 * repository fallback when it does not — so a day that has not been
 * summarised still says "to be published", exactly as before. Like the
 * prompts, this does not use JSONP: a recap is kilobytes and publishing
 * carries a password, neither of which belongs in a URL. Reads are a plain
 * GET and saves a POST whose body is text/plain — a "simple" request, with
 * no preflight the script could not answer. When a save's response is lost
 * anyway, the recap is read back to find out whether it landed.
 */

import { APPS_SCRIPT_ENDPOINT, appsScriptEnabled } from './apps-script';

export const recapLiveEnabled = appsScriptEnabled;

export type StoredRecap = { recap: DayRecapShape; updated: string };

export type RecapsState = {
  editable: boolean;
  recaps: Record<number, StoredRecap>;
};

export type SaveStatus =
  | 'saved'
  | 'conflict'
  | 'denied'
  | 'invalid'
  | 'limit'
  | 'closed'
  | 'unconfigured'
  | 'error';

export type SaveResult = { status: SaveStatus; recap?: StoredRecap | null };

const SAVE_ANSWERS: SaveStatus[] = [
  'saved',
  'conflict',
  'denied',
  'invalid',
  'limit',
  'closed',
  'unconfigured',
];

import type { DayRecap } from '@/data/types';

/** What crosses the wire: a recap plus the day it belongs to. */
export type DayRecapShape = DayRecap & { day: number };

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/** Every published recap, or null when the endpoint cannot be reached. */
export async function loadRecaps(): Promise<RecapsState | null> {
  const timeout = withTimeout(20000);
  try {
    const response = await fetch(`${APPS_SCRIPT_ENDPOINT}?action=recaps`, {
      signal: timeout.signal,
      cache: 'no-store',
    });
    const data = await response.json();
    if (data?.status !== 'ok' || typeof data.recaps !== 'object') return null;
    return { editable: Boolean(data.editable), recaps: data.recaps ?? {} };
  } catch {
    return null;
  } finally {
    timeout.done();
  }
}

/**
 * Publishes a day's recap. `base` is the `updated` stamp the edit started
 * from ('' for a first publication); an empty `recap` unpublishes the day.
 */
export async function saveRecap(
  day: number,
  recap: DayRecapShape | null,
  password: string,
  base: string,
): Promise<SaveResult> {
  const timeout = withTimeout(30000);
  try {
    const response = await fetch(APPS_SCRIPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'recap',
        day,
        recap,
        password,
        base,
      }),
      signal: timeout.signal,
    });
    const data = await response.json();
    const status = SAVE_ANSWERS.includes(data?.status) ? data.status : 'error';
    return { status, recap: data?.recap ?? null };
  } catch {
    // The write may have landed even though its answer did not.
    const state = await loadRecaps();
    const stored = state?.recaps[day];
    const landed = recap === null ? !stored : stored != null;
    return landed ? { status: 'saved', recap: stored ?? null } : { status: 'error' };
  } finally {
    timeout.done();
  }
}