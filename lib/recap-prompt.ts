/**
 * The live recap prompts: read from, and saved to, the Apps Script web app.
 *
 * Unlike flagging and calendar sharing this does not use JSONP. A prompt is
 * several kilobytes and a save carries a password, neither of which belongs in
 * a URL. Apps Script's JSON responses are readable cross-origin when the
 * script answers normally, so reads are a plain GET and saves a POST whose
 * body is text/plain — a "simple" request, with no preflight the script could
 * not answer. When a save's response is lost anyway, the prompt is read back
 * to find out whether it landed.
 */

import { APPS_SCRIPT_ENDPOINT, appsScriptEnabled } from './apps-script';

export const recapPromptsEnabled = appsScriptEnabled;

export type StoredPrompt = { text: string; updated: string };

export type PromptsState = {
  editable: boolean;
  prompts: Record<number, StoredPrompt>;
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

export type SaveResult = { status: SaveStatus; prompt?: StoredPrompt | null };

const SAVE_ANSWERS: SaveStatus[] = [
  'saved',
  'conflict',
  'denied',
  'invalid',
  'limit',
  'closed',
  'unconfigured',
];

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/** Every edited prompt, or null when the endpoint cannot be reached. */
export async function loadPrompts(): Promise<PromptsState | null> {
  const timeout = withTimeout(20000);
  try {
    const response = await fetch(`${APPS_SCRIPT_ENDPOINT}?action=prompts`, {
      signal: timeout.signal,
      cache: 'no-store',
    });
    const data = await response.json();
    if (data?.status !== 'ok' || typeof data.prompts !== 'object') return null;
    return { editable: Boolean(data.editable), prompts: data.prompts ?? {} };
  } catch {
    return null;
  } finally {
    timeout.done();
  }
}

/**
 * Saves a day's prompt. `base` is the `updated` stamp the edit started from
 * ('' for the original); an empty `text` returns the day to the original.
 */
export async function savePrompt(
  day: number,
  text: string,
  password: string,
  base: string,
): Promise<SaveResult> {
  const timeout = withTimeout(30000);
  try {
    const response = await fetch(APPS_SCRIPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'prompt', day, text, password, base }),
      signal: timeout.signal,
    });
    const data = await response.json();
    const status = SAVE_ANSWERS.includes(data?.status) ? data.status : 'error';
    return { status, prompt: data?.prompt };
  } catch {
    // The write may have landed even though its answer did not.
    const state = await loadPrompts();
    const stored = state?.prompts[day];
    const landed = text.trim() === '' ? !stored : stored?.text === text.replace(/\r\n/g, '\n');
    return landed ? { status: 'saved', prompt: stored ?? null } : { status: 'error' };
  } finally {
    timeout.done();
  }
}
