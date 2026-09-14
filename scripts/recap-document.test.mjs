import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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

const docs = readFileSync(new URL('../apps-script/recap-docs.gs', import.meta.url), 'utf8');
function docsServer(answer) {
  const store = {};
  const fetched = [];
  const context = {
    console: { log() {} },
    CacheService: { getScriptCache: () => ({
      getAll: (keys) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]])),
      put: (k, v) => { store[k] = v; },
    }) },
    UrlFetchApp: { fetchAll: (requests) => requests.map((r) => { fetched.push(r.url); return answer(r.url); }) },
  };
  const read = runInNewContext(docs + '\nreadRecapDocs;', context);
  return { read, fetched };
}
const response = (code, body) => ({ getResponseCode: () => code, getContentText: () => body });
test('each day reads its Google Doc once a minute, and an unshared doc reads as unavailable', () => {
  const exported = '<html><head><style>.c1{font-weight:700}</style></head><body class="doc-content"><p><span class="c1">Decision</span></p></body></html>';
  const { read, fetched } = docsServer((url) => url.includes('10YecIt3') ? response(200, exported) : response(302, ''));
  const first = read();
  assert.equal(first[1].html, exported);
  assert.match(first[1].url, /^https:\/\/docs\.google\.com\/document\/d\/10YecIt3.*\/edit$/);
  assert.equal(first[2].html, null);
  assert.equal(fetched.length, 5);
  read();
  assert.equal(fetched.length, 5, 'a second poll inside the cache window fetches nothing');
});
