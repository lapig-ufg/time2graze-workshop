# Turning the assistant's model on

The question panel ships **working**, with no key and no account: it answers
from the site's own published lines. This document is the separate, optional
step that puts a language model on top of it.

This is the only document that step needs. Nothing here is urgent — the panel
is useful before any of it is done, and the site is never broken by leaving it
undone.

Why the model needs an account at all: the site is a static export on GitHub
Pages, so there is no server on the origin and nowhere to keep an API key.
Anything shipped to the browser is public. `worker/` is a Cloudflare Worker
and the only place the key exists — see [`worker/README.md`](../worker/README.md)
for what it does and what guards it.

---

## What you need

- The site merged and deployed (step 1 below), because the worker reads the
  corpus from the published site.
- An **Ollama Cloud** account, for the API key.
- A **Cloudflare** account. The free plan is enough.

About an hour, most of it waiting for a deploy.

---

## 1. Merge and deploy the site first

The order matters. `CORPUS_URL` in `worker/wrangler.toml` points at
`assistant-corpus.json` on the live site, and the worker fetches it on every
answer. Deploy the worker first and it has nothing to read: every request
answers `503`.

Merge the branch to `main`, let Pages finish, then confirm the corpus is
actually there:

```bash
curl -s https://lapig-ufg.github.io/time2graze-workshop/assistant-corpus.json | head -c 200
```

You should see `{"generated": …, "workshop": "Time2Graze Brazil Workshop …`.
If you get HTML or a 404, the deploy has not finished or `prebuild` did not
run — check the Actions tab before going further.

**You can stop here.** The panel answers from the corpus, in English,
Portuguese and Spanish, at no cost.

## 2. Get the Ollama key, and confirm the model

Create an account at [ollama.com](https://ollama.com), then create an API key
in the account settings.

Confirm which GLM your key can actually reach. The catalogue moves — `glm-4.6`
and `glm-4.7` have already been retired:

```bash
curl -H "Authorization: Bearer YOUR_KEY" https://ollama.com/api/tags
```

If `glm-5.2` is not in that list, put whichever tag is into `OLLAMA_MODEL` in
`worker/wrangler.toml`.

## 3. Deploy the worker

From the `worker/` directory, on your own machine — `wrangler login` opens a
browser and authenticates as you:

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create ASSISTANT_KV
```

That last command prints an id. Paste it into the `[[kv_namespaces]]` block at
the bottom of `wrangler.toml` and uncomment the three lines:

```toml
[[kv_namespaces]]
binding = "ASSISTANT_KV"
id = "the-id-it-printed"
```

**Do not skip the namespace.** Without it the worker still runs, but
`DAILY_LIMIT` cannot be enforced and the per-IP burst limit is the only guard
left. The daily cap is the one that bounds the bill.

Then the key and the deploy:

```bash
npx wrangler secret put OLLAMA_API_KEY
npx wrangler deploy
```

The key goes in at that prompt and nowhere else. It must never be written into
`wrangler.toml`, which is in the repository.

`wrangler deploy` prints the worker's URL. Keep it for the next step.

## 4. Check the worker before touching the site

Two commands. The first should stream an answer back as
`text/event-stream`, in `data: {"text": …}` frames:

```bash
curl -i -X POST https://YOUR-WORKER.workers.dev \
  -H "Origin: https://lapig-ufg.github.io" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Where is the hotel?"}]}'
```

The second is the same request **without** the `Origin` header, and it must be
refused with `403`:

```bash
curl -i -X POST https://YOUR-WORKER.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Where is the hotel?"}]}'
```

If the first returns `503`, the corpus is not reachable — go back to step 1.
If it returns `502`, the upstream refused: run `npx wrangler tail` and ask
again, since the real reason is logged there rather than returned to the page.
That is deliberate — an upstream error body can carry account details.

## 5. Point the site at it

One line, in [`lib/assistant.ts`](../lib/assistant.ts):

```ts
export const ASSISTANT_ENDPOINT: string = 'https://YOUR-WORKER.workers.dev';
```

Commit and push. When Pages has redeployed, the panel answers with the model,
cites the entries it used, and falls back to the corpus search whenever the
worker refuses or is unreachable.

---

## Turning it off

Set `ASSISTANT_ENDPOINT` back to `''` and push. The model stops being called,
the panel keeps answering from the site's own lines, and no key is spent. This
needs no Cloudflare access, which is the point — it is the switch to reach for
first if anything goes wrong during the workshop.

To stop the worker itself as well: `npx wrangler delete` from `worker/`.

## Afterwards

- **A programme change needs nothing here.** The worker holds no copy of the
  workshop; it reads the published corpus and caches it for five minutes.
  Editing `data/agenda.ts` and pushing the site is the whole update.
- **Redeploy the worker only** when its logic, its model or its limits change.
- **Watch what it costs** for the first day or two on the Ollama dashboard.
  `DAILY_LIMIT` is 400 answers across everyone; the burst limit is 8 per IP per
  minute. Both are in `worker/wrangler.toml`.
- **`npx wrangler tail`** streams the worker's log, which is where refusals and
  upstream errors go.
