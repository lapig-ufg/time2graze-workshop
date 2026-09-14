/**
 * The assistant's transport, and the rule that keeps its links honest.
 *
 * Two things answer a question here. The corpus search in
 * `lib/assistant-search.ts` always runs and never invents anything; the model
 * behind `ASSISTANT_ENDPOINT` runs when one is deployed, and is grounded in the
 * same corpus. If the endpoint is empty, or the worker refuses, the search is
 * what the reader gets — the panel is never simply broken.
 *
 * The model never supplies a URL. It names corpus ids, and this module
 * resolves them against the corpus the browser already loaded, so a link the
 * assistant offers is a link the site actually has. An id it invents resolves
 * to nothing and is dropped.
 */
import { withBasePath } from '@/lib/base-path';
import type { VenueId } from '@/data/venues';

/**
 * The deployed Cloudflare Worker — see `docs/assistant-setup.md`, whose last
 * step is setting this. Empty means no model: the panel still answers from the
 * corpus, and no key is spent. This is the kill switch, and it lives here for
 * the same reason the Apps Script URL lives in one place: two copies is one
 * copy that gets forgotten.
 */
export const ASSISTANT_ENDPOINT: string = 'https://time2graze-assistant.lapig-ufg.workers.dev';

export const assistantEnabled = ASSISTANT_ENDPOINT !== '';

export type CorpusEntry = {
  id: string;
  kind:
    | 'page'
    | 'day'
    | 'session'
    | 'material'
    | 'venue'
    | 'practical'
    | 'city'
    | 'guide'
    | 'recap'
    | 'presentation';
  title: string;
  text: string;
  /** Site-rooted, and already an anchor the page resolves on load. */
  href: string;
  /** The workshop day this belongs to, where it belongs to one. */
  day?: number;
  /** The site page and, where relevant, the day that holds this source. */
  location: string;
  /** Exact place inside a published material, such as a slide range. */
  source?: string;
  /**
   * Actions are data, not model-written URLs. The panel resolves each against
   * the same records that render the published page.
   */
  actions?: (
    | { type: 'uber'; venueId: VenueId; label: string }
    | { type: 'material'; href: string; label: string }
  )[];
  /**
   * Values a reader copies or reads aloud — a place's area, address, phone and
   * website — exactly as published. The panel sets them under an answer; the
   * worker never puts them in the prompt, so a model cannot misspell them.
   */
  details?: { label: string; value: string }[];
};

export type Corpus = {
  generated: string;
  workshop: string;
  timezone: string;
  entries: CorpusEntry[];
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

let pending: Promise<Corpus> | null = null;

/** Fetched once per page load. It is 30 kB, and every answer reads from it. */
export function loadCorpus(): Promise<Corpus> {
  pending ??= fetch(withBasePath('/assistant-corpus.json')).then((response) => {
    if (!response.ok) throw new Error(`corpus ${response.status}`);
    return response.json() as Promise<Corpus>;
  });
  return pending;
}

/**
 * Splits the trailing `SOURCES:` line off an answer and resolves the ids
 * against the corpus. Anything that does not name a real entry is discarded
 * rather than rendered as a dead link.
 */
export function splitSources(answer: string, corpus: Corpus) {
  const match = /\n?SOURCES:\s*(.*)\s*$/i.exec(answer);
  if (!match) return { text: answer.trim(), sources: [] as CorpusEntry[] };

  const ids = match[1]
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id && id !== 'none');
  const seen = new Set<string>();
  const sources = ids
    .map((id) => corpus.entries.find((entry) => entry.id === id))
    .filter((entry): entry is CorpusEntry => {
      if (!entry || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, 3);

  return { text: answer.slice(0, match.index).trim(), sources };
}

export type StreamResult = { ok: true } | { ok: false; reason: string };

/**
 * Streams an answer, calling `onText` with each fragment as it arrives.
 *
 * A reader waiting on a static site has no spinner they trust; watching the
 * answer appear is the difference between "thinking" and "broken". The worker
 * re-frames Ollama's NDJSON as Server-Sent Events, which is what this reads.
 */
export async function streamAnswer(
  messages: ChatMessage[],
  onText: (fragment: string) => void,
  signal: AbortSignal,
): Promise<StreamResult> {
  let response: Response;
  try {
    response = await fetch(ASSISTANT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (!response.ok || !response.body) {
    // The worker's own wording for a refusal it wants read — a daily cap or a
    // burst limit says something a generic failure cannot.
    const stated = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    return { ok: false, reason: stated ?? 'unavailable' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') return { ok: true };
      try {
        const { text } = JSON.parse(payload) as { text?: string };
        if (text) onText(text);
      } catch {
        // A frame that does not parse is a frame we skip, not a failed answer.
      }
    }
  }

  return { ok: true };
}
