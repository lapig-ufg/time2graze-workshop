import { cleanDocument } from './recap-document';

/**
 * A Google Docs HTML export, reduced to the summary's own rich text.
 *
 * Docs exports carry their formatting as generated classes (`.c3 {
 * font-weight: 700 }`) and every link through a `google.com/url` redirect.
 * Both are resolved here — bold, italic and underline become tags, links
 * point at their real target — and the result goes through the same
 * sanitizer as every summary, which drops the classes, spans and layout.
 *
 * The first line of each doc names the day ("Day 1 summary — …") for the
 * people editing it; the site already heads the block with that, so a first
 * line of that shape is left out. A doc holding nothing else is unpublished.
 *
 * Browser only: it needs `DOMParser`.
 */
export function googleDocHtml(exported: string): string {
  const parsed = new DOMParser().parseFromString(exported, 'text/html');
  const body = parsed.body;

  const styles = new Map<string, string>();
  for (const style of Array.from(parsed.querySelectorAll('style'))) {
    for (const [, name, rules] of (style.textContent ?? '').matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
      styles.set(name, (styles.get(name) ?? '') + ';' + rules);
    }
  }
  // Class rules apply in stylesheet order, then the inline style, as in CSS.
  const style = (el: Element) =>
    Array.from(styles).filter(([name]) => el.classList.contains(name)).map(([, rules]) => rules).join(';') +
    ';' + (el.getAttribute('style') ?? '');

  // Comments and footnotes: their anchors and the blocks they point to.
  body.querySelectorAll('a[href^="#cmnt"], a[href^="#ftnt"]').forEach((a) => (a.closest('sup') ?? a).remove());
  body.querySelectorAll('a[id^="cmnt"], a[id^="ftnt"]').forEach((a) => a.closest('div, p')?.remove());

  for (const span of Array.from(body.querySelectorAll('span'))) {
    const css = style(span);
    let inner: Node[] = Array.from(span.childNodes);
    // Later declarations win, as in CSS: `font-weight:700;…;font-weight:400` is not bold.
    const last = (property: string) => Array.from(css.matchAll(new RegExp(`(?:^|;)\\s*${property}\\s*:([^;]*)`, 'g'))).pop()?.[1].trim() ?? '';
    const inHeading = span.closest('h1, h2, h3, h4, h5, h6') !== null;
    for (const [on, tag] of [
      [!inHeading && /^(700|800|900|bold)$/.test(last('font-weight')), 'strong'],
      [last('font-style') === 'italic', 'em'],
      // A link's underline is the link's, and the site draws that itself.
      [/underline/.test(last('text-decoration')) && !span.querySelector('a'), 'u'],
    ] as const) {
      if (!on) continue;
      const wrap = parsed.createElement(tag);
      wrap.append(...inner);
      inner = [wrap];
    }
    span.replaceWith(...inner);
  }

  for (const link of Array.from(body.querySelectorAll('a[href]'))) {
    const href = link.getAttribute('href') ?? '';
    try {
      const url = new URL(href);
      if (url.hostname === 'www.google.com' && url.pathname === '/url' && url.searchParams.get('q')) {
        link.setAttribute('href', url.searchParams.get('q')!);
      }
    } catch {
      // A relative or malformed href is left for the sanitizer.
    }
  }

  const blocks = Array.from(body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));
  for (const block of blocks) {
    if (!block.textContent?.trim()) block.remove();
  }
  const first = body.querySelector('p, h1, h2, h3, h4, h5, h6');
  if (first && /^\s*Day\s+\d\s+summary\b/i.test(first.textContent ?? '')) first.remove();
  body.querySelectorAll('ul, ol').forEach((list) => {
    if (!list.querySelector('li')) list.remove();
  });

  if (!body.textContent?.trim()) return '';
  return cleanDocument(body.innerHTML);
}

export type RecapTopic = { key: string; title: string; html: string };

/** Split only on the document's highest heading level; never infer sessions. */
export function googleDocTopics(exported: string): { introduction: string; topics: RecapTopic[] } {
  const parsed = new DOMParser().parseFromString(exported, 'text/html');
  const body = parsed.body;
  const first = body.querySelector('p, h1, h2, h3, h4, h5, h6');
  if (first && /^\s*Day\s+\d\s+summary\b/i.test(first.textContent ?? '')) first.remove();
  const headings = Array.from(body.children).filter(el => /^H[1-6]$/.test(el.tagName) && el.textContent?.trim());
  if (!headings.length) return { introduction: googleDocHtml(exported), topics: [] };
  const level = Math.min(...headings.map(el => Number(el.tagName.slice(1))));
  const head = parsed.head.innerHTML;
  const convert = (content: string) => googleDocHtml(`<html><head>${head}</head><body>${content}</body></html>`);
  const topics: RecapTopic[] = [];
  const counts = new Map<string, number>();
  let intro = '';
  let content = '';
  let current: RecapTopic | null = null;
  function finish() {
    if (current) current.html = convert(content).replace(/<(\/?)h4(?=[\s>])/g, '<$1h5');
    else intro = convert(content);
    content = '';
  }
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === 1 && (node as Element).tagName === `H${level}` && node.textContent?.trim()) {
      finish();
      const el = node as Element;
      const title = el.textContent!.trim();
      const occurrence = (counts.get(title) ?? 0) + 1;
      counts.set(title, occurrence);
      current = { key: el.id || `${title}:${occurrence}`, title, html: '' };
      topics.push(current);
    } else {
      const container = parsed.createElement('div');
      container.append(node.cloneNode(true));
      content += container.innerHTML;
    }
  }
  finish();
  return { introduction: intro, topics };
}
