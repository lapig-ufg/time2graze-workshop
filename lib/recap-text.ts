/**
 * Parses the corrected NotebookLM draft into the recap the site publishes.
 *
 * The draft comes out of the model in the shape the prompt asks for —
 * `## <title> [<session id>]`, then WHAT HAPPENED / DECISIONS / OPEN
 * QUESTIONS / ACTIONS — and the room corrects that text, not JSON. This
 * module is the conversion the organiser used to do by hand at midnight:
 * text in, `DayRecap` out, ids assigned under the rules of
 * `docs/daily-recap.md`.
 *
 * The id contract is the load-bearing part. Reader flags point at
 * `d<day>-r<serial>` hours later, against a text that may already have been
 * revised, so:
 *
 * - serials only ever grow and are never reused;
 * - a line that still reads the same as the published version keeps its id;
 * - a line that reads differently takes the next free serial (it is new
 *   content, and the old flag has been answered by the change);
 * - a serial whose line disappeared is never handed out again.
 */

import type { DayRecap, RecapItem, RecapSection } from '../data/types';
import { AGENDA } from '../data/agenda';

/** `## Some title [d1-field-protocol]` or `## Across the day [day]`. */
const HEADING = /^##\s+(.+?)\s+\[(.+)\]\s*$/;
/** `[Owner] Action text.` — the prompt asks for exactly this in ACTIONS. */
const OWNER = /^[[((](.+?)[\]))]\s*(.+)$/;
/** The four fields a draft can carry, keyed by the prompt's own headings. */
type Field = 'summary' | 'decisions' | 'questions' | 'actions';
const LABELS: Record<string, Field> = {
  'what happened': 'summary',
  decisions: 'decisions',
  'open questions': 'questions',
  actions: 'actions',
};

export type ParseResult =
  | { ok: true; recap: DayRecap; warnings: string[] }
  | { ok: false; error: string };

/** Every id in the agenda, and every id that means "the day as a whole". */
const SESSION_IDS = new Set<string>();
for (const day of AGENDA) {
  for (const session of day.sessions) {
    SESSION_IDS.add(session.id);
    for (const track of session.tracks ?? []) SESSION_IDS.add(track.id);
  }
}
/** The prompt puts the session id in brackets; `day` names no session. */
const DAY_IDS = new Set(['day', 'the day', 'across the day']);

function isBullet(line: string): boolean {
  return /^\s*[-*•]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^\s*[-*•]\s+/, '');
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function ownerOf(line: string): { owner?: string; text: string } | null {
  const match = OWNER.exec(line);
  if (!match) return null;
  const owner = clean(match[1]);
  // `[Owner not recorded]` is the prompt's way of saying there is no owner;
  // it is not a person and must not render as one.
  if (/^owner not recorded$/i.test(owner)) return { text: clean(match[2]) };
  return { owner: owner.slice(0, 80), text: clean(match[2]) };
}

function serialOf(id: string): number | null {
  const match = /^d[1-5]-r(\d{1,3})$/.exec(id);
  return match ? Number(match[1]) : null;
}

/**
 * Builds the recap from the corrected draft.
 *
 * `previous` is the currently published recap, when there is one: its ids
 * are preserved for lines that survive the revision.
 */
/**
 * Assigns the item ids for a day's recap under the rules of
 * `docs/daily-recap.md`: serials only grow, a line that still reads the same
 * as the published version keeps its id, and a serial is never reused.
 *
 * Both the text importer and the structured editor build their recap
 * through this one function, so a line's id means the same thing however
 * the recap was edited.
 */
export function idAssigner(day: number, previous?: DayRecap | null) {
  const map = new Map<string, string>();
  let highest = 0;
  for (const section of previous?.sections ?? []) {
    const items = [
      ...(section.summary ? [section.summary] : []),
      ...(section.decisions ?? []),
      ...(section.questions ?? []),
      ...(section.actions ?? []),
    ];
    for (const item of items) {
      const serial = serialOf(item.id);
      if (serial === null) continue;
      highest = Math.max(highest, serial);
      // First text wins: a duplicated published line keeps one id.
      if (!map.has(item.text)) map.set(item.text, item.id);
    }
  }

  let serial = highest;
  const nextId = (): string => {
    serial += 1;
    return `d${day}-r${serial}`;
  };
  return function idFor(content: string): string {
    const existing = map.get(content);
    if (existing) {
      // A reused id must not be handed to two lines in one save.
      map.delete(content);
      return existing;
    }
    return nextId();
  };
}

export function parseRecapText(
  day: number,
  text: string,
  previous?: DayRecap | null,
): ParseResult {
  const warnings: string[] = [];
  const sections: RecapSection[] = [];

  // Ids from the published version, so a surviving line keeps its id and a
  // serial is never reused.
  const idFor = idAssigner(day, previous);

  let section: RecapSection | null = null;
  let label: Field | null = null;

  function push(item: RecapItem) {
    if (!section || !label) return;
    if (label === 'summary') section.summary = item;
    else {
      section[label] = [...(section[label] ?? []), item];
    }
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = HEADING.exec(line);
    if (heading) {
      const title = clean(heading[1]);
      let sessionId = heading[2];
      if (!SESSION_IDS.has(sessionId)) {
        if (DAY_IDS.has(sessionId.toLowerCase())) {
          section = { title: title || 'Across the day' };
          sessionId = '';
        } else {
          warnings.push(
            `"${sessionId}" names no session in the agenda; check the id in this heading.`,
          );
          section = { title: title || sessionId };
          sessionId = '';
        }
      } else {
        section = { sessionId };
      }
      // Split-session blocks name a track in the prompt, so each parallel
      // activity is its own section; two blocks can share one session only
      // when the room asked for them separately, which the id handles.
      sections.push(section);
      label = null;
      continue;
    }

    const lower = line.replace(/[*_`]/g, '').toLowerCase();
    const colon = lower.indexOf(':');
    const head = colon === -1 ? lower : lower.slice(0, colon);
    const inline = colon === -1 ? '' : line.slice(line.indexOf(':') + 1).trim();
    const matched = LABELS[head];
    if (matched) {
      label = matched;
      // `WHAT HAPPENED: text on the same line` carries its content with it.
      if (inline) {
        const content = clean(inline.replace(/[*_`]/g, ''));
        if (content) push({ id: idFor(content), text: content });
      }
      continue;
    }
    if (line.startsWith('#') || section === null) {
      if (section !== null) {
        warnings.push(
          `A line before any WHAT HAPPENED heading was dropped: "${line.slice(0, 60)}"`,
        );
      } else if (!line.startsWith('#')) {
        warnings.push(
          `A line before any session heading was dropped: "${line.slice(0, 60)}"`,
        );
      }
      continue;
    }

    if (!isBullet(raw) && label === 'summary' && section.summary) {
      // WHAT HAPPENED is a paragraph: a continuation line folds into it.
      section.summary.text = clean(`${section.summary.text} ${line}`);
      continue;
    }

    if (!isBullet(raw) && label && label !== 'summary') {
      // Wrapped prose under a bullet list: fold it into the previous item.
      const items = section[label];
      if (Array.isArray(items) && items.length > 0) {
        const last = items[items.length - 1];
        last.text = clean(`${last.text} ${line}`);
        continue;
      }
    }

    const content = clean(stripBullet(raw));
    if (!content) continue;
    if (label === 'actions') {
      const owner = ownerOf(stripBullet(raw));
      if (owner) {
        push({ id: idFor(owner.text), text: owner.text, ...(owner.owner ? { owner: owner.owner } : {}) });
        continue;
      }
      warnings.push(
        `An action has no [owner] prefix: "${content.slice(0, 60)}" — the prompt asks for "[LAPIG] Circulate…".`,
      );
      push({ id: idFor(content), text: content });
      continue;
    }
    push({ id: idFor(content), text: content });
  }

  if (sections.length === 0) {
    return { ok: false, error: 'No "## <title> [<session id>]" heading found in the text.' };
  }

  // Drop sections where nothing was written under any label.
  const filled = sections.filter(
    (s) => s.summary || s.decisions?.length || s.questions?.length || s.actions?.length,
  );
  if (filled.length === 0) {
    return { ok: false, error: 'Nothing was found under any WHAT HAPPENED / DECISIONS / OPEN QUESTIONS / ACTIONS heading.' };
  }
  for (const [i, s] of filled.entries()) {
    if (!s.summary && (s.decisions?.length || s.questions?.length || s.actions?.length)) {
      warnings.push(`Section ${i + 1} has lines but no WHAT HAPPENED paragraph.`);
    }
  }

  return {
    ok: true,
    recap: { published: '', sections: filled },
    warnings,
  };
}