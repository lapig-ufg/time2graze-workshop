/**
 * The site's inference proxy.
 *
 * The site is a static export on GitHub Pages, so there is no server on the
 * origin and no place to keep a key. This worker is that place, and it is
 * deliberately the only one: the key never reaches a browser, and every
 * request that spends it passes the checks below first.
 *
 * It holds no copy of the workshop. The corpus is fetched from the published
 * site and cached, the same way the calendar sync treats the published .ics as
 * the single source of truth — changing the agenda and pushing the site is the
 * whole update procedure, and this worker is not redeployed for it.
 *
 * The daily summaries are the exception to "published with the site": they
 * are Google Docs edited during the week. They are read live from the Apps
 * Script endpoint and added to the corpus by `lib/recap-corpus.ts`, the
 * same module the panel uses, so the ids the model cites resolve there too.
 */

import { withRecaps } from '../../lib/recap-corpus.ts';

/** Ollama Cloud. Confirm the model tag against /api/tags before changing it. */
const OLLAMA_CHAT = 'https://ollama.com/api/chat';

/** What a single answer is allowed to cost, in every dimension. */
const LIMITS = {
  /** Turns of history accepted from the client, newest kept. */
  messages: 12,
  /** Characters in one question. A paragraph is plenty; a corpus is not. */
  question: 600,
  /** Tokens of answer. Long enough for a session listing, short enough to read. */
  answer: 700,
  /** Seconds a cached corpus is trusted before the site is asked again. */
  corpusTtl: 300,
  /** Seconds the summaries are trusted; the Apps Script caches its exports as long. */
  recapTtl: 60,
};

/**
 * The whole behavioural contract, and the reason this site can carry an
 * assistant at all.
 *
 * "Never invent a fact" is a site rule, and the reader is often standing in an
 * arrivals hall: a plausible guess is worse than a blank. So the model is
 * given the entire corpus and forbidden everything outside it, including
 * arithmetic on times it was not given.
 */
function systemPrompt(corpus) {
  return `You answer questions about the ${corpus.workshop}.

You have below the complete published content of the workshop website. It is
everything you know. Follow these rules exactly.

1. Answer ONLY from the entries below. If the answer is not there, say plainly
   that the site does not publish it yet and name the page that would carry it.
   Never guess an address, a time, a room, a price or a person's name.
2. Never state a detail as confirmed when its entry says it is pending, TBD,
   provisional or not published. Repeat that qualification in your answer.
3. All times are ${corpus.timezone}. Do not convert, add or subtract times.
   Quote the times exactly as the entries give them.
4. Answer in the language the reader used. The site itself is in English, so
   keep proper names, session titles and venue names in their published form.
5. Be brief: two or three sentences unless a list is genuinely asked for.
6. Do not describe the website's interface or explain how to use it.
7. Street addresses, neighbourhoods, postcodes, phone numbers and websites are
   deliberately left out of the entries. Never write any of them, not even
   from memory. When the reader needs one, name the place as its entry title
   gives it and say its exact details are listed with this answer, and name
   that place's entry id in SOURCES.
8. End every answer with a final line in exactly this form, naming the entry
   ids you used, most relevant first, at most three:
   SOURCES: id1, id2
   Use ids exactly as written in the entries. If nothing applied, write
   SOURCES: none
9. A presentation entry is the source for a question about that presentation's
   teaching content. Prefer it over a broader session description and cite it
   whenever it directly answers the question.
10. A recap entry is the organisers' summary of what a session presented,
   discussed and agreed. It is the source for questions about what happened
   or was decided; cite it for those. Report what it says, not more.

ENTRIES
${corpus.entries.map((e) => `[${e.id}] (${e.kind}) ${e.title} — ${e.text}`).join('\n')}`;
}

/** The published corpus, cached at the edge so a busy hour is one fetch. */
async function loadCorpus(env) {
  /* Only a good corpus is cached. `cacheTtl` alone caches every status for
     the same five minutes, so a 404 caught mid-deploy kept the assistant
     answering 503 long after the site had published the file. */
  const response = await fetch(env.CORPUS_URL, {
    cf: {
      cacheEverything: true,
      cacheTtlByStatus: { '200-299': LIMITS.corpusTtl, '400-599': 0 },
    },
  });
  if (!response.ok) throw new Error(`corpus ${response.status}`);
  const corpus = await response.json();
  if (!Array.isArray(corpus.entries) || corpus.entries.length === 0) {
    throw new Error('corpus is empty');
  }
  return corpus;
}

/**
 * The live summaries, or null. A failure here must not take the assistant
 * down: it answers from the published corpus and the log says why.
 */
async function loadRecaps(env) {
  if (!env.RECAPS_URL) return null;
  try {
    const response = await fetch(env.RECAPS_URL, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { '200-299': LIMITS.recapTtl, '300-599': 0 },
      },
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const data = await response.json();
    if (data?.status !== 'ok') throw new Error('not ok');
    return data;
  } catch (error) {
    console.log(`assistant: summaries unavailable — ${error.message}`);
    return null;
  }
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * CORS is the first gate, and the cheapest. It stops a browser on another
 * site from spending the key; it does not stop a script, which is what the
 * rate limit and the daily cap are for.
 */
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = allowedOrigins(env);
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function refuse(status, reason, headers) {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * A soft daily cap on answers, in the spirit of DAILY_SHARE_LIMIT in the Apps
 * Script: a public endpoint on a site nobody is watching should not be able to
 * spend an unbounded amount. Absent KV, the burst limiter is the only guard
 * and this says so in the log rather than failing closed.
 */
async function withinDailyCap(env) {
  const cap = Number(env.DAILY_LIMIT ?? 0);
  if (!cap || !env.ASSISTANT_KV) {
    if (cap && !env.ASSISTANT_KV)
      console.log('assistant: DAILY_LIMIT set with no KV bound');
    return true;
  }

  const key = `answers-${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await env.ASSISTANT_KV.get(key)) ?? 0);
  if (used >= cap) return false;
  // Two answers racing can share a count. A soft cap tolerates that; a write
  // per request is what the free tier does not.
  await env.ASSISTANT_KV.put(key, String(used + 1), { expirationTtl: 172_800 });
  return true;
}

/** Ollama streams NDJSON; the browser reads SSE. This is the whole difference. */
function toEventStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        let parsed;
        try {
          parsed = JSON.parse(line);
        } catch {
          continue; // A partial line is not an error; it is the next chunk.
        }
        const text = parsed.message?.content;
        if (text) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
          );
        }
        if (parsed.done) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        }
      }
    },
  });
}

const worker = {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return cors
        ? new Response(null, { status: 204, headers: cors })
        : refuse(403, 'origin not allowed');
    }
    if (request.method !== 'POST') return refuse(405, 'POST only');
    if (!cors) return refuse(403, 'origin not allowed');

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (env.ASSISTANT_LIMIT) {
      const { success } = await env.ASSISTANT_LIMIT.limit({ key: ip });
      if (!success)
        return refuse(429, 'too many questions in a short time', cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return refuse(400, 'expected JSON', cors);
    }

    const history = Array.isArray(body.messages) ? body.messages : [];
    const messages = history
      .slice(-LIMITS.messages)
      .filter(
        (m) =>
          (m?.role === 'user' || m?.role === 'assistant') &&
          typeof m.content === 'string',
      )
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, LIMITS.question),
      }));

    if (!messages.length || messages.at(-1).role !== 'user') {
      return refuse(400, 'expected a question', cors);
    }

    if (!(await withinDailyCap(env))) {
      return refuse(
        429,
        'the assistant has answered its limit for today',
        cors,
      );
    }

    let corpus;
    try {
      const [published, recaps] = await Promise.all([loadCorpus(env), loadRecaps(env)]);
      corpus = withRecaps(published, recaps);
    } catch (error) {
      console.log(`assistant: corpus unavailable — ${error.message}`);
      return refuse(503, 'the workshop content could not be loaded', cors);
    }

    const upstream = await fetch(OLLAMA_CHAT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OLLAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt(corpus) },
          ...messages,
        ],
        stream: true,
        think: false,
        options: { temperature: 0.2, num_predict: LIMITS.answer },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      // The upstream body can carry account details; it goes to the log, not
      // to the page.
      console.log(
        `assistant: upstream ${upstream.status} — ${await upstream.text().catch(() => '')}`,
      );
      return refuse(502, 'the assistant is unavailable', cors);
    }

    return new Response(upstream.body.pipeThrough(toEventStream()), {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  },
};

export default worker;
