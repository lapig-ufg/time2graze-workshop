/**
 * Rebuilds `public/files/tuesday-reflections/index.html` from the plain text of
 * the group's Word document (`Tuesday_refelctions.docx`, owned by
 * lindsey.sloat@wri.org and edited in the Google Docs editor during the
 * workshop).
 *
 * The site's normal live path is `apps-script/recap-docs.gs`, which exports a
 * *native* Google Doc every 60 seconds. That does not work for a .docx blob,
 * so this is the temporary stand-in: a scheduled session reads the file
 * through the Drive connector, writes the text to
 * `data/tuesday-reflections.txt`, runs this script and pushes if anything
 * changed. Everything a reader sees comes from that text, so nobody has to
 * re-judge the markup when a paragraph moves.
 *
 * The rules, in order of precedence per paragraph:
 *
 *   `# heading`            a section. The doc's own numbering is kept verbatim
 *                          — it has already fallen out of step with itself and
 *                          renumbering would silently disagree with the copy
 *                          the group is reading in Docs.
 *   `Label: sentence…`     a callout, for the short labelled asks the document
 *                          uses to mark work ("To do", "Need", "Question for
 *                          the African country teams"). Only a label of at
 *                          most eight words with a following sentence counts.
 *   `text:` then lines     the trailing-colon line introduces the paragraphs
 *                          after it, which become a list until the next
 *                          heading, callout or introduced group.
 *   anything else          a paragraph.
 *
 *   Usage: node scripts/tuesday-reflections.mjs [--check]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'data', 'tuesday-reflections.txt');
const TARGET = join(root, 'public', 'files', 'tuesday-reflections', 'index.html');

const escape = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** The document's own reference to the homepage survey, as a real link. */
const link = (html) =>
  html.replace(
    /you can find it on the website homepage/i,
    'you can find it on the <a href="../../">website homepage</a>',
  );

const CALLOUT = /^([A-Z][^.:?!]{0,80}):\s+(\S.*)$/;

function blocks(paragraphs) {
  const out = [];
  let list = null;

  const closeList = () => {
    if (list) out.push({ type: 'list', items: list });
    list = null;
  };

  for (const paragraph of paragraphs) {
    if (paragraph.startsWith('#')) {
      closeList();
      out.push({ type: 'heading', text: paragraph.replace(/^#+\s*/, '') });
      continue;
    }
    const callout = paragraph.match(CALLOUT);
    if (callout && callout[1].split(/\s+/).length <= 8) {
      closeList();
      out.push({ type: 'callout', label: callout[1], text: callout[2] });
      continue;
    }
    if (paragraph.endsWith(':')) {
      closeList();
      out.push({ type: 'intro', text: paragraph });
      list = [];
      continue;
    }
    if (list) {
      list.push(paragraph);
      continue;
    }
    out.push({ type: 'paragraph', text: paragraph });
  }
  closeList();
  return out;
}

function render(blockList) {
  const html = [];
  let open = false;

  for (const block of blockList) {
    if (block.type === 'heading') {
      if (open) html.push('    </section>');
      html.push('    <section>');
      html.push(`      <h2>${escape(block.text)}</h2>`);
      open = true;
      continue;
    }
    if (block.type === 'list') {
      html.push('      <ul>');
      for (const item of block.items) html.push(`        <li>${link(escape(item))}</li>`);
      html.push('      </ul>');
      continue;
    }
    const body = link(escape(block.text));
    if (block.type === 'callout') {
      html.push(
        `      <div class="note"><strong>${escape(block.label)}</strong>${body}</div>`,
      );
    } else {
      html.push(`      <p>${body}</p>`);
    }
  }
  if (open) html.push('    </section>');
  return html.join('\n');
}

const text = readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const paragraphs = text
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

/* The document's first line is its title and the second its standfirst; both
   are rendered by the page's own header, not repeated in the body. */
const title = paragraphs.shift() ?? 'Tuesday reflections';
const lede = paragraphs.shift() ?? '';
const body = render(blocks(paragraphs));

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f5f6f2">
  <meta name="description" content="${escape(lede)}">
  <title>${escape(title)} · Time2Graze</title>
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
  <style>
    @font-face{font-family:Manrope;src:url(../workshop-boards/assets/manrope.woff2) format("woff2");font-weight:200 800;font-display:swap}
    :root{--bg:#f5f6f2;--ink:#1d2420;--muted:#5b645e;--line:#dfe3dc;--accent:#2f6b3f}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Manrope,system-ui,sans-serif}
    .topbar{display:flex;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid var(--line);font-size:14px}
    .topbar a{color:var(--ink);text-decoration:none}
    .topbar a:hover{text-decoration:underline}
    main{max-width:720px;margin:0 auto;padding:40px 20px 80px}
    .eyebrow{color:var(--muted);font-size:14px;margin:0 0 6px}
    h1{font-size:clamp(30px,5vw,42px);line-height:1.15;margin:0 0 12px;font-weight:700}
    .lede{color:var(--muted);margin:0 0 36px}
    section{border-top:1px solid var(--line);padding:26px 0 8px}
    h2{font-size:21px;line-height:1.3;margin:0 0 12px;font-weight:700}
    p{margin:0 0 12px}
    ul{margin:0 0 14px;padding-left:22px}
    li{margin:0 0 6px}
    .note{border-left:3px solid var(--accent);padding:8px 14px;background:#fff;margin:14px 0}
    .note strong{display:block;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent)}
    .source{border-top:1px solid var(--line);margin-top:34px;padding-top:16px;color:var(--muted);font-size:14px}
    @media print{.topbar,.source{display:none}body{background:#fff}}
  </style>
</head>
<body>
  <header class="topbar">
    <a href="../../programme/#d3-checkin"><span aria-hidden="true">←</span> Programme</a>
    <a href="../../">Time2Graze Brazil Workshop</a>
  </header>
  <main>
    <p class="eyebrow">Day 3 check-in · 16 September 2026</p>
    <h1>${escape(title)}</h1>
    <p class="lede">${escape(lede)}</p>
${body}
    <p class="source">This page follows the group's working document. Edits made there appear here within a few minutes.</p>
  </main>
</body>
</html>
`;

if (process.argv.includes('--check')) {
  const current = readFileSync(TARGET, 'utf8');
  if (current !== page) {
    console.log('changed');
    process.exit(1);
  }
  console.log('unchanged');
} else {
  writeFileSync(TARGET, page);
  console.log(`wrote ${TARGET}`);
}
