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

test('Home mentions today’s summary only once the day’s schedule is over', () => {
  for (const day of days) {
    const band = next => {
      const { NowNext } = load('components/now-next.tsx', {
        '@/data/agenda': { AGENDA: days.map(d => ({ ...d, sessions: [{ id: `d${d.index}-s`, date: d.date, start: '08:00', end: '09:00' }] })) },
        '@/hooks/use-workshop-clock': { useWorkshopClock: () => ({ date: day.date, minutes: 1380 }) },
        '@/lib/now': { todayIndex: now.todayIndex, nextSessionId: () => next, stateOf: () => null },
        '@/components/recap': { usePublishedRecapDays: () => days.map(d => d.index) },
        '@/lib/recap': { recapForDay: () => null },
        '@/lib/schedule': { dayLabel: date => date, timeLabel: () => '', sessionTitle: s => s.id },
        '@/lib/materials': { publishedMaterials: () => [] },
        'next/link': { default: ({ href, children }) => jsx.jsx('a', { href, children }) },
      });
      const result = NowNext();
      return result ? renderToStaticMarkup(result) : '';
    };
    const evening = band(null);
    assert.match(evening, new RegExp(`href="/programme/#recap-day-${day.index}"`));
    assert.doesNotMatch(band(`d${day.index}-s`), /recap-day/);
  }
});

function renderSummary(state, loading = false) {
  const values = [state, loading];
  const { DayRecap } = load('components/recap.tsx', {
    react: { useState: () => [values.shift(), () => {}], useEffect: () => {} },
    'lucide-react': { ExternalLink: () => null },
    './recap-reader': { RecapReader: ({ html }) => jsx.jsx('div', { dangerouslySetInnerHTML: { __html: html } }) },
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
