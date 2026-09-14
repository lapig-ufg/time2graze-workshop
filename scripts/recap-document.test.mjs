import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const server = readFileSync(new URL('../apps-script/recaps.gs', import.meta.url), 'utf8');
const sanitize = runInNewContext(server + '\nsanitizeRecap;');
test('a daily document round-trips without a session or silent truncation', () => {
  const document = '<h4>Daily summary</h4><p>' + 'Long summary. '.repeat(400) + '</p>';
  const result = sanitize({ day: 1, document, sections: [] });
  assert.equal(result.document, document);
  assert.equal(result.sections.length, 0);
  assert.equal(sanitize({ day: 1, document: 'x'.repeat(50001), sections: [] }), null);
  assert.equal(sanitize({ day: 6, document, sections: [] }), null);
});
test('legacy section summaries are still accepted', () => {
  assert.equal(sanitize({ day: 1, sections: [{ title: 'Overview', summary: { id: 'd1-r1', text: 'Existing text' } }] }).sections[0].summary.text, 'Existing text');
});

const source = ts.transpileModule(readFileSync(new URL('../lib/recap-live.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function client(readback) {
  const exports = {};
  runInNewContext(source, {
    exports, require: () => ({ APPS_SCRIPT_ENDPOINT: 'https://example.invalid', appsScriptEnabled: true }),
    AbortController, setTimeout, clearTimeout,
    fetch: async (_url, options) => {
      if (options.method === 'POST') throw new Error('response lost');
      if (readback === null) throw new Error('offline');
      return { json: async () => ({ status: 'ok', editable: true, recaps: readback }) };
    },
  });
  return exports;
}
const document = '<p>New summary</p>';
const recap = { day: 1, published: '', document, sections: [] };
test('a lost response confirms only the matching saved document', async () => {
  const changed = { recap, updated: 'new' };
  assert.equal((await client({ 1: changed }).saveRecap(1, recap, 'test', 'old')).status, 'saved');
  assert.equal((await client({ 1: { recap: { ...recap, document: '<p>Other text</p>' }, updated: 'new' } }).saveRecap(1, recap, 'test', 'old')).status, 'error');
  assert.equal((await client({ 1: { recap, updated: 'old' } }).saveRecap(1, recap, 'test', 'old')).status, 'error');
  assert.equal((await client(null).saveRecap(1, null, 'test', 'old')).status, 'error');
});
