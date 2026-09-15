/**
 * Guards the assistant's corpus, which is the only thing standing between a
 * language model and the site's first rule.
 *
 * The model is given the corpus and forbidden everything outside it, so the
 * corpus is the whole safety argument: if a fact reaches it that no page
 * publishes, the assistant will state that fact confidently to someone
 * standing in an arrivals hall. These tests fail when that becomes possible.
 *
 * The second job is the links. The model never writes a URL — it names entry
 * ids, and the panel resolves them. An entry whose `href` points at nothing is
 * a button that lands the reader on an empty page.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { buildCorpus } from './assistant-corpus-fixture.mjs';

import { AGENDA } from '../data/agenda.ts';
import { VENUES } from '../data/venues.ts';
import { DESTINATIONS } from '../data/navigation.ts';

const corpus = buildCorpus();

const routes = new Set(DESTINATIONS.map((d) => d.href));
const sessionIds = new Set(
  AGENDA.flatMap((day) => day.sessions.map((s) => s.id)),
);
const dayAnchors = new Set(
  AGENDA.flatMap((day) => [`day-${day.index}`, `recap-day-${day.index}`]),
);

test('every entry carries an id, a link and something to read', () => {
  assert.ok(corpus.entries.length > 20);
  for (const entry of corpus.entries) {
    assert.ok(entry.id, `entry without an id: ${JSON.stringify(entry)}`);
    assert.ok(entry.text.length > 10, `${entry.id}: nothing to read`);
    assert.ok(entry.location, `${entry.id}: no visible source location`);
    assert.ok(
      entry.href.startsWith('/'),
      `${entry.id}: href is not site-rooted`,
    );
  }
});

test('Uber actions are explicit, safe actions on the places that offer them', () => {
  for (const [id, venue] of Object.entries(VENUES)) {
    const entry = corpus.entries.find((item) => item.id === `venue-${id}`);
    const action = entry?.actions?.find((item) => item.type === 'uber');
    if (venue.ride) {
      assert.ok(action, `${id}: its published Uber action is absent from Ask`);
      assert.match(entry.text, /Uber link/i, `${id}: the model cannot name the Uber action`);
    } else {
      assert.equal(action, undefined, `${id}: Ask offers an unauthorised Uber action`);
    }
  }
});

test('Module 1 enters as named slide ranges, not as presentation HTML', () => {
  const sections = corpus.entries.filter((entry) => entry.kind === 'presentation');
  assert.ok(sections.length >= 4, 'Module 1 has no searchable sections');
  for (const entry of sections) {
    assert.match(entry.source ?? '', /slides \d+(?:–\d+)?/);
    const action = entry.actions?.find((item) => item.type === 'material');
    assert.ok(action, `${entry.id}: no direct module action`);
    assert.match(action.href, /^\/files\/visual-inspection-module-1\/index\.html#s\d+$/);
    assert.doesNotMatch(entry.text, /data:image|<script|<style/i);
  }
});

test('ids are unique, because the panel resolves links by them', () => {
  const ids = corpus.entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

/**
 * Anchors rendered as plain ids by a page, rather than resolved by the
 * programme. A source button aimed at one lands on the card it names; if the
 * page stops rendering it, the button quietly drops the reader at the top.
 */
const pageSources = [
  'app/practical/page.tsx',
  'components/orientation.tsx',
  'components/friday-visit.tsx',
  'components/farm-map.tsx',
  'app/materials/page.tsx',
].map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

function pageRendersAnchor(anchor) {
  if (/^materials-day-\d+$/.test(anchor)) {
    return pageSources.some((source) => source.includes('id={`materials-day-${day.index}`}'));
  }
  return pageSources.some(
    (source) => source.includes(`id="${anchor}"`) || source.includes(`anchor="${anchor}"`),
  );
}

test('every link lands on a real route and a real anchor', () => {
  for (const entry of corpus.entries) {
    const [path, anchor] = entry.href.split('#');
    assert.ok(
      routes.has(path),
      `${entry.id}: ${path} is not one of the four destinations`,
    );
    if (anchor) {
      assert.ok(
        sessionIds.has(anchor) || dayAnchors.has(anchor) || pageRendersAnchor(anchor),
        `${entry.id}: #${anchor} names no session, day or page anchor`,
      );
    }
  }
});

test('every session in the programme is reachable', () => {
  const covered = new Set(
    corpus.entries.filter((e) => e.kind === 'session').map((e) => e.id),
  );
  for (const id of sessionIds) {
    assert.ok(
      covered.has(id),
      `${id} is on the programme but not in the corpus`,
    );
  }
});

/**
 * The venues carry the site's most dangerous facts. `address` is absent until
 * a venue or host has confirmed it, and the corpus has to say so rather than
 * leave the model to fill a gap it can see.
 */
test('a venue with no confirmed address says so, and none is invented', () => {
  for (const [id, venue] of Object.entries(VENUES)) {
    const entry = corpus.entries.find((e) => e.id === `venue-${id}`);
    assert.ok(entry, `${id} is missing from the corpus`);
    if (venue.address) {
      assert.ok(
        entry.details?.some((d) => d.label === 'Address' && d.value === venue.address),
        `${id}: the confirmed address is not in its details verbatim`,
      );
    } else {
      assert.match(entry.text, /No confirmed postal address/);
      assert.ok(!entry.details?.some((d) => d.label === 'Address'));
    }
  }
});

/**
 * The worker sends `text` to the model and never `details`. On 11 September
 * 2026 the model, copying the hotel's address out of the text, wrote "Santa
 * Genoveza" twice. Anything a reader copies or reads aloud stays out of reach.
 */
test('no address, area, phone or website reaches the text the model reads', () => {
  const guarded = Object.values(VENUES).flatMap((venue) =>
    [venue.address, venue.locality, venue.phone, venue.website].filter(Boolean),
  );
  for (const entry of corpus.entries) {
    for (const value of guarded) {
      assert.ok(!entry.text.includes(value), `${entry.id} carries "${value}" in its text`);
    }
    assert.doesNotMatch(entry.text, /https?:\/\//, `${entry.id} carries a URL in its text`);
  }
});

test('an unconfirmed session is marked unconfirmed', () => {
  for (const day of AGENDA) {
    for (const session of day.sessions) {
      if (session.status !== 'tbd') continue;
      const entry = corpus.entries.find((e) => e.id === session.id);
      assert.match(
        entry.text,
        /not confirmed yet/i,
        `${session.id} loses its TBD`,
      );
    }
  }
});

test('a provisional end time keeps its qualification', () => {
  for (const day of AGENDA) {
    for (const session of day.sessions) {
      if (session.endStatus !== 'provisional') continue;
      const entry = corpus.entries.find((e) => e.id === session.id);
      assert.match(
        entry.text,
        /provisional/i,
        `${session.id} loses its provisional end`,
      );
    }
  }
});

/**
 * `data/geography.ts` holds kilobytes of SVG path strings for the maps. They
 * are useless to a model and would dominate every request the worker makes.
 */
test('no map geometry reached the corpus', () => {
  const json = JSON.stringify(corpus);
  assert.doesNotMatch(
    json,
    /[ML]\d+ \d+L\d+ \d+/,
    'an SVG path string is in the corpus',
  );
  assert.ok(json.length < 120_000, `corpus is ${json.length} bytes`);
});

/**
 * The site says nothing about venues on the programme or in the calendar —
 * daily movement is the shuttle, and Travel & stay holds the places. An
 * assistant naming a room for a session would be the only surface on the site
 * doing it.
 */
test('a session entry does not name a venue the programme keeps silent', () => {
  for (const entry of corpus.entries.filter((e) => e.kind === 'session')) {
    for (const venue of Object.values(VENUES)) {
      if (venue.address) {
        assert.ok(
          !entry.text.includes(venue.address),
          `${entry.id} names an address`,
        );
      }
    }
  }
});

/** The panel and the worker both read these; a rename in one is a silent break. */
test('the worker still reads the corpus the builder writes', () => {
  const worker = readFileSync(
    new URL('../worker/src/index.js', import.meta.url),
    'utf8',
  );
  for (const field of ['entries', 'workshop', 'timezone']) {
    assert.ok(
      worker.includes(`corpus.${field}`),
      `the worker never reads corpus.${field}`,
    );
  }
  assert.ok(corpus.workshop && corpus.timezone && corpus.generated);
});

/** The instruction the whole grounding argument rests on. */
test('the worker still forbids answering outside the corpus', () => {
  const worker = readFileSync(
    new URL('../worker/src/index.js', import.meta.url),
    'utf8',
  );
  assert.match(worker, /Answer ONLY from the entries below/);
  assert.match(worker, /SOURCES:/);
  assert.match(worker, /Never write any of them, not even\s+from memory/);
  assert.doesNotMatch(worker, /\.details/, 'the worker must never send details to the model');
});

/**
 * A decimal degree is nothing to read back to a reader, and nothing a model
 * should be tempted to calculate a distance from. The map draws the pins.
 */
test('no raw coordinates reached the corpus', () => {
  for (const entry of corpus.entries) {
    assert.doesNotMatch(
      entry.text,
      /-\d{2}\.\d{4,}/,
      `${entry.id} carries a coordinate`,
    );
  }
});
