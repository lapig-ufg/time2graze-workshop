/**
 * The daily summaries as assistant entries.
 *
 * The summaries live in Google Docs and change during the week, so they
 * cannot be part of `public/assistant-corpus.json`, which is built once per
 * deploy. Both the worker and the panel therefore read the same Apps Script
 * response (`?action=recaps`) and turn it into entries with this one module.
 * The model cites entry ids and the panel resolves them against its own
 * copy, so the two must derive identical ids from identical text. Sharing
 * the code is what guarantees that.
 *
 * It runs in a Cloudflare Worker as well as the browser, so the HTML is
 * reduced with string handling rather than `DOMParser`.
 *
 * A summary becomes one entry per top-level heading, the session the
 * organisers wrote it under, plus one entry for any text before the first
 * heading. The whole text goes in: the organisers chose to give the model
 * the complete summaries rather than retrieved fragments.
 */

import type { CorpusEntry } from './assistant';

type RecapDocs = Record<string, { url?: string; html?: string | null } | undefined>;

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  hellip: '…', bull: '•', middot: '·', times: '×', deg: '°', sup2: '²',
};

const ACCENTS: Record<string, string> = {
  acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧', ring: '̊',
};

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    const named = ENTITIES[name.toLowerCase()];
    if (named) return named;
    // Accented letters — &iacute;, &atilde;, &ccedil; — from the letter and its mark.
    const accent = /^([a-z])(acute|grave|circ|tilde|uml|cedil|ring)$/i.exec(name);
    return accent ? (accent[1] + ACCENTS[accent[2].toLowerCase()]).normalize('NFC') : whole;
  });
}

/** One block of export HTML as a single line of reading text. */
function plain(html: string): string {
  return decode(
    html
      .replace(/<li[^>]*>/gi, ' • ')
      .replace(/<\/(p|h[1-6]|li|div|tr)>|<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
    .replace(/-$/, '');
}

/** The entries for one day's exported doc; none while it holds no summary. */
export function recapDocEntries(day: number, exported: string): CorpusEntry[] {
  const body = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(exported)?.[1] ?? exported)
    // Comment and footnote markers, and the comment and footnote blocks.
    .replace(/<sup>\s*<a[^>]*href="#(cmnt|ftnt)[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/sup>/gi, '')
    .replace(/<div[^>]*>\s*<p[^>]*>\s*<a[^>]*id="(cmnt|ftnt)\d+"[\s\S]*?<\/div>/gi, '')
    // The doc's first line names the day for its editors; it is not content.
    .replace(/^\s*<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/i, (block, _tag: string, inner: string) =>
      /^Day\s+\d\s+summary\b/i.test(plain(inner)) ? '' : block);

  const levels = Array.from(body.matchAll(/<h([1-6])[\s>]/gi), (m) => Number(m[1]));
  const top = levels.length ? Math.min(...levels) : 0;

  const parts: { heading: string; html: string }[] = [{ heading: '', html: '' }];
  if (top) {
    const split = new RegExp(`(<h${top}[^>]*>[\\s\\S]*?<\\/h${top}>)`, 'gi');
    for (const piece of body.split(split)) {
      if (new RegExp(`^<h${top}[\\s>]`, 'i').test(piece)) parts.push({ heading: plain(piece), html: '' });
      else parts[parts.length - 1].html += piece;
    }
  } else {
    parts[0].html = body;
  }

  const entries: CorpusEntry[] = [];
  const used = new Set<string>();
  for (const [index, part] of parts.entries()) {
    const text = plain(part.html);
    if (!text) continue;

    let id = part.heading ? `recap-d${day}-${slug(part.heading) || index}` : `recap-d${day}`;
    for (let n = 2; used.has(id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`;
    used.add(id);

    entries.push({
      id,
      kind: 'recap',
      title: part.heading ? `Day ${day} summary: ${part.heading}` : `Day ${day} summary`,
      text,
      href: `/programme/#recap-day-${day}`,
      day,
      location: `Programme · Day ${day}`,
    });
  }
  return entries;
}

/** Every summary entry in an Apps Script `?action=recaps` response. */
export function recapEntries(response: { docs?: RecapDocs } | null | undefined): CorpusEntry[] {
  const docs = response?.docs ?? {};
  return Object.keys(docs)
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 5)
    .sort((a, b) => a - b)
    .flatMap((day) => {
      const html = docs[day]?.html;
      return typeof html === 'string' ? recapDocEntries(day, html) : [];
    });
}

/**
 * The published corpus with the live summaries added. Build-time recap
 * entries give way to the live ones for any day that has a summary doc.
 */
export function withRecaps<T extends { entries: CorpusEntry[] }>(corpus: T, response: { docs?: RecapDocs } | null | undefined): T {
  const live = recapEntries(response);
  if (!live.length) return corpus;
  const days = new Set(live.map((entry) => entry.day));
  return {
    ...corpus,
    entries: [...corpus.entries.filter((entry) => !(entry.kind === 'recap' && days.has(entry.day))), ...live],
  };
}
