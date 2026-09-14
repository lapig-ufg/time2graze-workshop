/**
 * Guards the summaries-as-entries conversion the worker and the panel share.
 * Both derive ids from the same export, and a source the model cites only
 * resolves in the panel if they agree — so ids must be stable and plain.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../lib/recap-corpus.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(source, { exports, require: () => ({}) });
const { recapEntries, withRecaps } = exports;

const doc = (body) => `<html><head><style>.c1{font-weight:700}</style></head><body class="doc-content">${body}</body></html>`;
const day1 = doc(
  '<p><span>Day 1 summary &mdash; Monday 14 September 2026</span></p>' +
  '<h2><span>Visual Inspection Workshop &mdash; Ana Paula (LAPIG)</span></h2><h3>Main points</h3><p><span class="c1">Texture</span> is smooth or rough.</p>' +
  '<h2><span>GEE short course &mdash; Vin&iacute;cius (LAPIG)</span></h2><ul><li><span>Petabyte-scale</span></li><li>Pasto Legal<sup><a href="#cmnt1" id="cmnt_ref1">[a]</a></sup></li></ul>' +
  '<div><p><a href="#cmnt_ref1" id="cmnt1">[a]</a><span>A reviewer comment</span></p></div>',
);

test('a summary becomes one entry per top-level heading, without the title line or comments', () => {
  const entries = recapEntries({ docs: { 1: { url: 'u', html: day1 }, 2: { url: 'u', html: doc('<p>Day 2 summary — Tuesday</p><p></p>') }, 3: { url: 'u', html: null } } });
  assert.deepEqual(Array.from(entries, (e) => e.id), ['recap-d1-visual-inspection-workshop-ana-paula-lapig', 'recap-d1-gee-short-course-vinicius-lapig']);
  assert.equal(entries[1].title, 'Day 1 summary: GEE short course — Vinícius (LAPIG)');
  assert.equal(entries[0].text, 'Main points Texture is smooth or rough.');
  assert.equal(entries[1].text, '• Petabyte-scale • Pasto Legal');
  assert.equal(entries[0].href, '/programme/#recap-day-1');
  assert.equal(entries[0].day, 1);
});

test('text before any heading is the day entry, and repeated headings stay distinct', () => {
  const entries = recapEntries({ docs: { 4: { html: doc('<p>Intro line.</p><h2>Notes</h2><p>One.</p><h2>Notes</h2><p>Two.</p>') } } });
  assert.deepEqual(Array.from(entries, (e) => e.id), ['recap-d4', 'recap-d4-notes', 'recap-d4-notes-2']);
});

test('live summaries replace build-time recap entries for their day only', () => {
  const corpus = { entries: [{ id: 'recap-d1-r1', kind: 'recap', day: 1 }, { id: 'recap-d2-r1', kind: 'recap', day: 2 }, { id: 'day-1', kind: 'day', day: 1 }] };
  const merged = withRecaps(corpus, { docs: { 1: { html: day1 } } });
  assert.deepEqual(Array.from(merged.entries, (e) => e.id), ['recap-d2-r1', 'day-1', 'recap-d1-visual-inspection-workshop-ana-paula-lapig', 'recap-d1-gee-short-course-vinicius-lapig']);
  assert.equal(withRecaps(corpus, null), corpus);
});
