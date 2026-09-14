/**
 * Guards the text→recap conversion the live editor runs on `/programme/`.
 *
 * The organiser pastes the corrected NotebookLM draft; the ids this parser
 * assigns are what reader flags point at hours later. These are the mistakes
 * that would be invisible until a flag landed on the wrong line.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture as load } from './apps-script-fixture.mjs';

const parseRecapText = load('recap-text').exports.parseRecapText;

const DRAFT = `You are writing the internal record of Day 1…

## UFG Tour — Welcome at LAPIG [d1-ufg-tour]
WHAT HAPPENED: The laboratory presented its work on geotechnologies and the Time2Graze project. Only what bears on the project was recorded.
DECISIONS:
- The workshop uses the same notebook all week.
OPEN QUESTIONS:
- Which pastures are visited on Friday?
ACTIONS:
- [LAPIG] Circulate the field protocol.

## Field protocol [d1-field-protocol]
WHAT HAPPENED: The room agreed the variables and the plot design. The discussion separated what is common to all countries from what differs.
DECISIONS:
- Plot size is 50 x 50 m in every country.
OPEN QUESTIONS:
- Who supplies the spectrometer in Tanzania?
ACTIONS:
- [Owner not recorded] Send the equipment list.

## Across the day [day]
WHAT HAPPENED: A first day of introductions and agreements.
DECISIONS:
- English is the working language of the record.
`;

const DRAFT_TRACKS = `## Split session [d1-visual-inspection]
WHAT HAPPENED: The interpretation criteria were taught: colour, tone, texture, shape, context.
ACTIONS:
- [INIA] Share the practice examples.
`;

test('parses the NotebookLM shape into sections with ids', () => {
  const result = parseRecapText(1, DRAFT);
  assert.ok(result.ok, 'parses');
  assert.equal(result.recap.sections.length, 3);

  const [tour, protocol, across] = result.recap.sections;
  assert.equal(tour.sessionId, 'd1-ufg-tour');
  assert.equal(protocol.sessionId, 'd1-field-protocol');
  assert.equal(across.title, 'Across the day');

  assert.match(tour.summary.id, /^d1-r\d+$/);
  assert.equal(tour.summary.text, 'The laboratory presented its work on geotechnologies and the Time2Graze project. Only what bears on the project was recorded.');
  assert.equal(tour.decisions.length, 1);
  assert.equal(tour.actions[0].owner, 'LAPIG');

  // "[Owner not recorded]" must not render as an owner.
  assert.equal(protocol.actions[0].owner, undefined);
  assert.equal(protocol.actions[0].text, 'Send the equipment list.');
});

test('serials only grow and are unique within the day', () => {
  const result = parseRecapText(1, DRAFT);
  assert.ok(result.ok);
  const ids = result.recap.sections.flatMap((s) => [
    ...(s.summary ? [s.summary] : []),
    ...(s.decisions ?? []),
    ...(s.questions ?? []),
    ...(s.actions ?? []),
  ]).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  const serials = ids.map((id) => Number(id.match(/^d1-r(\d+)$/)[1]));
  // The parser runs inside the fixture's VM context, so its arrays carry a
  // different prototype than a main-context array and deepStrictEqual would
  // refuse them; compare the plain values instead.
  const sorted = [...serials].sort((a, b) => a - b).join(',');
  assert.equal(serials.join(','), sorted, 'serials grow in document order');
});

test('a revision keeps the id of every unchanged line', () => {
  const first = parseRecapText(1, DRAFT);
  assert.ok(first.ok);

  // Same draft with one decision reworded and one action removed.
  const revisedDraft = DRAFT.replace(
    '- Plot size is 50 x 50 m in every country.',
    '- Plot size is 50 x 50 m in every country, measured on the long side.',
  ).replace('- [LAPIG] Circulate the field protocol.\n', '');

  const second = parseRecapText(1, revisedDraft, first.recap);
  assert.ok(second.ok);

  const find = (recap, text) =>
    recap.sections.flatMap((s) => [
      ...(s.summary ? [s.summary] : []),
      ...(s.decisions ?? []),
      ...(s.questions ?? []),
      ...(s.actions ?? []),
    ]).find((i) => i.text === text);

  const before = find(first.recap, 'The workshop uses the same notebook all week.');
  const after = find(second.recap, 'The workshop uses the same notebook all week.');
  assert.equal(after.id, before.id, 'an unchanged line keeps its id');

  const reworded = find(second.recap, 'Plot size is 50 x 50 m in every country, measured on the long side.');
  const oldSerial = Number(find(first.recap, 'Plot size is 50 x 50 m in every country.').id.match(/r(\d+)/)[1]);
  assert.ok(
    Number(reworded.id.match(/r(\d+)/)[1]) > oldSerial,
    'a reworded line takes a fresh serial, never the old one',
  );

  const gone = find(second.recap, 'Circulate the field protocol.');
  assert.equal(gone, undefined, 'a deleted line disappears');
});

test('a serial is never reused after its line disappears', () => {
  const first = parseRecapText(1, DRAFT);
  assert.ok(first.ok);
  const circulate = first.recap.sections[0].actions[0];
  const circulateSerial = Number(circulate.id.match(/r(\d+)/)[1]);

  // Remove that action, add a different one.
  const revisedDraft = DRAFT.replace(
    '- [LAPIG] Circulate the field protocol.',
    '- [LAPIG] Publish the slides.',
  );
  const second = parseRecapText(1, revisedDraft, first.recap);
  assert.ok(second.ok);
  const slides = second.recap.sections[0].actions[0];
  assert.equal(slides.text, 'Publish the slides.');
  assert.ok(
    Number(slides.id.match(/r(\d+)/)[1]) > circulateSerial,
    'the new action takes a fresh serial, not the retired one',
  );
});

test('wrapped prose folds into the previous bullet', () => {
  const draft = `## UFG Tour — Welcome at LAPIG [d1-ufg-tour]
WHAT HAPPENED: The laboratory presented its work.
DECISIONS:
- The workshop uses the same notebook all week,
  including the country presentations.
`;
  const result = parseRecapText(1, draft);
  assert.ok(result.ok);
  assert.equal(
    result.recap.sections[0].decisions[0].text,
    'The workshop uses the same notebook all week, including the country presentations.',
  );
});

test('an unknown session id warns and falls back to a titled block', () => {
  const draft = `## Something [d9-not-a-session]
WHAT HAPPENED: Text.
`;
  const result = parseRecapText(1, draft);
  assert.ok(result.ok);
  assert.equal(result.recap.sections[0].sessionId, undefined);
  assert.equal(result.recap.sections[0].title, 'Something');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /names no session/);
});

test('an action without an owner warns but still publishes', () => {
  const draft = `## UFG Tour — Welcome at LAPIG [d1-ufg-tour]
WHAT HAPPENED: The laboratory presented its work.
ACTIONS:
- Send the equipment list.
`;
  const result = parseRecapText(1, draft);
  assert.ok(result.ok);
  assert.equal(result.recap.sections[0].actions[0].text, 'Send the equipment list.');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /no \[owner\] prefix/);
});

test('text with no heading is refused, not guessed', () => {
  const result = parseRecapText(1, 'Just a paragraph about the day.');
  assert.ok(!result.ok);
});

test('a track id is a valid section', () => {
  const result = parseRecapText(1, DRAFT_TRACKS);
  assert.ok(result.ok);
  assert.equal(result.recap.sections[0].sessionId, 'd1-visual-inspection');
});