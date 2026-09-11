/**
 * Guards the answers a reader gets when no model is reachable.
 *
 * This is the path that ships with `ASSISTANT_ENDPOINT` empty and the path a
 * refused or unavailable worker falls back to, so it is not a nicety: it is
 * what the panel does most of the time. The cases below are the questions the
 * corpus is actually for — a place, a time, a day, and a question the site
 * cannot answer, which must come back empty rather than approximately.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCorpus } from './assistant-corpus-fixture.mjs';

import { search } from '../lib/assistant-search.ts';

const corpus = buildCorpus();

const top = (question) => search(corpus, question)[0]?.entry;
const ids = (question) => search(corpus, question).map((m) => m.entry.id);

test('a place is found by name', () => {
  assert.equal(top('Where is the hotel?')?.id, 'venue-hotel');
  assert.equal(top('Golden Lis')?.id, 'venue-hotel');
});

/** The reason the bridge table exists: most participants are not English-first. */
test('the same question answers in Portuguese and Spanish', () => {
  assert.equal(top('Onde fica o hotel?')?.id, 'venue-hotel');
  assert.equal(top('¿Dónde está el alojamiento?')?.id, 'stay-accommodation');
  assert.equal(top('A que horas sai o ônibus?')?.id, 'stay-shuttle');
});

/**
 * Five days each hold a session called "Lunch". Without the day filter this
 * returned all five, which answers nothing.
 */
test('a question naming a day is answered from that day only', () => {
  for (const asked of ['When is lunch on day 3?', 'almoço no dia 3']) {
    const found = ids(asked);
    assert.ok(found.includes('d3-lunch'), `${asked}: missed Day 3 lunch`);
    for (const id of found) {
      assert.ok(
        !/^d[1245]-/.test(id),
        `${asked}: returned ${id} from another day`,
      );
    }
  }
});

test('a weekday names the same day as its number', () => {
  assert.deepEqual(
    ids('what happens on Wednesday'),
    ids('what happens on day 3'),
  );
  assert.equal(top('o que acontece na quarta-feira')?.day, 3);
});

/** A rare word in a sentence of common ones still has to win. */
test('one distinctive word carries a question full of filler', () => {
  assert.equal(top('¿Cómo llego desde el aeropuerto?')?.id, 'venue-hotel');
  assert.match(top('is there anything about methane at all')?.id, /methane/);
});

/**
 * The panel says "the site does not publish that" only because this comes
 * back empty. An approximate answer here becomes a confident wrong one there.
 */
test('a question the site cannot answer returns nothing', () => {
  assert.deepEqual(search(corpus, 'what is the wifi password'), []);
  assert.deepEqual(search(corpus, 'how much does a visa cost'), []);
  assert.deepEqual(search(corpus, ''), []);
});

/** A track is chosen and attended, but anchored by the session holding it. */
test('a split-session activity is findable, under its session anchor', () => {
  const gee = top('who runs the GEE course?');
  assert.equal(gee.id, 'd1-gee-course');
  assert.match(gee.text, /Vinícius/);
  assert.equal(gee.href, '/programme/#d1-split-inspection-gee');
});

test('a session result carries the anchor that opens its day', () => {
  const lunch = search(corpus, 'lunch on day 3')[0].entry;
  assert.equal(lunch.href, '/programme/#d3-lunch');
});
