/**
 * The live summaries, read from the Apps Script web app.
 *
 * Each day's summary is a Google Doc (apps-script/recap-docs.gs); the
 * endpoint returns each doc's export and edit link. Recaps stored by the
 * earlier password editor are still returned and still readable for a day
 * with no doc. Like the prompts, this does not use JSONP: an export is
 * kilobytes, and a plain GET is enough.
 */

import { APPS_SCRIPT_ENDPOINT, appsScriptEnabled } from './apps-script';
import type { DayRecap } from '@/data/types';

export const recapLiveEnabled = appsScriptEnabled;

export type StoredRecap = { recap: DayRecap; updated: string };

/** A day's Google Doc: `html` is null while the doc cannot be read. */
export type RecapDoc = { url: string; html: string | null };

export type RecapsState = {
  docs: Record<number, RecapDoc>;
  recaps: Record<number, StoredRecap>;
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/** Every day's doc and stored recap, or null when the endpoint cannot be reached. */
export async function loadRecaps(): Promise<RecapsState | null> {
  const timeout = withTimeout(20000);
  try {
    const response = await fetch(`${APPS_SCRIPT_ENDPOINT}?action=recaps`, {
      signal: timeout.signal,
      cache: 'no-store',
    });
    const data = await response.json();
    if (data?.status !== 'ok' || typeof data.recaps !== 'object') return null;
    return { docs: data.docs ?? {}, recaps: data.recaps ?? {} };
  } catch {
    return null;
  } finally {
    timeout.done();
  }
}
