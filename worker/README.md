# The assistant's inference proxy

**To deploy this, follow [`docs/assistant-setup.md`](../docs/assistant-setup.md)
— that is the procedure, and it is the only document the work needs.** This
file is what the worker is and why it is shaped this way.

## Why it exists

The site is a static export on GitHub Pages. There is no server on the origin,
so there is nowhere on it to keep an API key — anything shipped to the browser
is public, and a key in the bundle is a key a scraper drains overnight. This
worker is the only place the key exists.

## Why it is thin

It holds no copy of the workshop. It fetches `assistant-corpus.json` from the
published site and caches it for five minutes, so **changing the agenda and
pushing the site is the whole update procedure** — this worker is not
redeployed for a programme change. Redeploy it only when the endpoint logic,
the model or the limits change.

`OLLAMA_MODEL` is `glm-5.2`. Confirm any change against
`GET https://ollama.com/api/tags` with the key: `glm-4.6` and `glm-4.7` have
already been retired, and a model tag the account cannot reach fails every
request with a `502` whose real cause is only in the log.

## What guards the key

Four things, in the order a request meets them:

1. **Origin allowlist** (`ALLOWED_ORIGINS`). Stops a browser on another site.
   It does not stop a script, which can send any `Origin` header it likes.
2. **Burst limit**, 8 questions per IP per minute, via the rate limiting
   binding. No external resource, no setup.
3. **Daily cap** (`DAILY_LIMIT`), counted in KV across everyone, in the spirit
   of `DAILY_SHARE_LIMIT` in the Apps Script. This is the one that bounds the
   bill. It is soft: two answers racing can share a count. It needs the KV
   namespace bound, and the worker logs it if that is missing.
4. **Per-answer caps**, in `LIMITS` in `src/index.js` — history length,
   question length and `num_predict`. A single request cannot ask for a large
   completion.

The upstream error body can carry account details, so it goes to
`npx wrangler tail`, never to the page.

## The kill switch is not here

Set `ASSISTANT_ENDPOINT` to `''` in `lib/assistant.ts` and push the site: the
model stops being called and the corpus search keeps answering. It needs no
Cloudflare access, which is why it is the first thing to reach for.
