import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function load(file, dependencies) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, { exports, require: name => name === 'react/jsx-runtime' ? jsx : dependencies[name] ?? {} });
  return exports;
}
const days = [1, 2, 3, 4, 5].map(index => ({ index, date: `2026-09-${13 + index}`, sessions: [] }));
const now = load('lib/now.ts', {});

test('Home checks the current document on all five workshop days', () => {
  for (const day of days) {
    let requested;
    const { NowNext } = load('components/now-next.tsx', {
      '@/data/agenda': { AGENDA: days },
      '@/hooks/use-workshop-clock': { useWorkshopClock: () => ({ date: day.date, minutes: 1380 }) },
      '@/lib/now': { todayIndex: now.todayIndex, nextSessionId: () => null },
      '@/components/recap': { useLiveRecap: index => { requested = index; return false; } },
      '@/lib/recap': { recapForDay: () => null },
    });
    NowNext();
    assert.equal(requested, day.index);
  }
});

function renderSummary(state, loading = false) {
  const values = [state, loading];
  const { DayRecap } = load('components/recap.tsx', {
    react: { useState: () => [values.shift(), () => {}], useEffect: () => {} },
    'lucide-react': { ExternalLink: () => null },
    '@/data/recaps': { RECAPS: {} },
    '@/lib/recap-document': { recapDocument: () => '' },
    '@/lib/recap-doc': { googleDocHtml: html => html === 'header-only' ? '' : html },
    '@/lib/recap-live': { recapLiveEnabled: true },
  });
  return renderToStaticMarkup(DayRecap({ day: days[0], clock: null }));
}
const stateWith = html => ({ docs: { 1: { url: 'https://docs.google.com/document/d/example/edit', html } }, recaps: {} });

test('unreadable Docs and failed connections show failure, not unpublished', () => {
  for (const state of [stateWith(null), null]) {
    const html = renderSummary(state);
    assert.match(html, /Could not load the summary/);
    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /To be published|has not been published/);
  }
});
test('a readable header-only Doc remains unpublished', () => {
  const html = renderSummary(stateWith('header-only'));
  assert.match(html, /To be published/);
  assert.doesNotMatch(html, /Could not load/);
});
test('readable summaries and loading state do not show failure', () => {
  assert.match(renderSummary(stateWith('<p>Accepted summary</p>')), /Accepted summary/);
  const html = renderSummary(null, true);
  assert.match(html, /Loading summary/);
  assert.doesNotMatch(html, /Could not load|To be published/);
});
