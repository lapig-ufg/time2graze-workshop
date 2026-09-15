/**
 * Runs a `lib/` module that talks to the Apps Script endpoint against a fake
 * document, so the transport can be tested without a browser.
 *
 * The modules are a small graph now that the transport is shared, so this
 * loads their dependencies too rather than one file in isolation: a fixture
 * that stubbed `lib/apps-script.ts` would stop testing the part that builds
 * the request. `data/` is resolved as well, because a module's own limits and
 * option lists are part of what travels.
 *
 * Two transports live here because two exist. JSONP — a script tag, read back
 * through `reply` — is what the three single-field writes use. `fetch` is what
 * the directory entry uses, being a paragraph and a photograph; pass an
 * implementation in and it is what the module under test will call.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

function transpile(path) {
  return ts.transpileModule(
    readFileSync(new URL(`../${path}.ts`, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
}

/** `./apps-script` from `lib/directory` is `lib/apps-script`; `../data/x`, `data/x`. */
function resolve(from, specifier) {
  const base = from.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '.') continue;
    else if (part === '..') base.pop();
    else base.push(part);
  }
  return base.join('/');
}

export function fixture(entry, options = {}) {
  const timers = new Map();
  const scripts = [];
  const window = {
    setTimeout(fn, ms) { const id = timers.size + 1; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const sandbox = {
    window,
    URL,
    URLSearchParams,
    // Bare timers, for a module that does not reach through `window`.
    setTimeout: (fn, ms) => window.setTimeout(fn, ms),
    clearTimeout: (id) => window.clearTimeout(id),
    AbortController,
    DOMException,
    fetch: options.fetch,
    document: {
      createElement: () => ({ remove() { this.removed = true; } }),
      head: { appendChild: (script) => scripts.push(script) },
    },
  };
  const context = createContext(sandbox);

  const loaded = new Map();
  function require(from) {
    return (specifier) => {
      const path = resolve(from, specifier);
      const cached = loaded.get(path);
      if (cached) return cached;

      const exports = {};
      loaded.set(path, exports);
      const factory = runInContext(
        `(function (exports, require, module) {\n${transpile(path)}\n})`,
        context,
      );
      factory(exports, require(path), { exports });
      return exports;
    };
  }

  const reply = (status, index = 0) => {
    const callback = new URL(scripts[index].src).searchParams.get('callback');
    window[callback](status === null ? undefined : { status });
    return callback;
  };
  const params = (index = 0) => new URL(scripts[index].src).searchParams;

  return {
    exports: require('lib/_entry')(`./${entry}`),
    sandbox,
    scripts,
    timers,
    window,
    reply,
    params,
  };
}
