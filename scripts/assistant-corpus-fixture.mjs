/**
 * A corpus built for one test file, in its own file.
 *
 * The test files run in parallel and used to build the published corpus at the
 * same path at the same time; one of them then read a half-written file and
 * failed with no obvious cause. Each caller gets its own destination.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function buildCorpus() {
  const path = join(
    mkdtempSync(join(tmpdir(), 'corpus-')),
    'assistant-corpus.json',
  );
  execFileSync('node', ['scripts/build-assistant-corpus.mjs', path], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });
  return JSON.parse(readFileSync(path, 'utf8'));
}
