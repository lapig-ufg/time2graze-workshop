/**
 * Guards split-session choices, on both sides of the wire.
 *
 * The script holds its own copy of the split sessions — a public endpoint has
 * to refuse anything that does not name a real activity, and the organiser
 * reads titles rather than ids — so the first job here is to fail the moment
 * that copy drifts from `data/agenda.ts`. The second is the row keying: one
 * row per person per session is what keeps a participant who changes their
 * mind from leaving two answers behind, and nothing on the page would show
 * that it had broken.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import { AGENDA, TRACK_CHOICE_CLOSES } from '../data/agenda.ts';
import { fixture as load } from './apps-script-fixture.mjs';

const SOURCE = readFileSync(new URL('../apps-script/tracks.gs', import.meta.url), 'utf8');

/** The script's own constants, which `const` keeps out of the vm's globals. */
const constants = runInNewContext(
  `${SOURCE}\n({ SPLIT_SESSIONS, CHOICE_CLOSES, CHOICE_HEADER, CHOICE_NAME_MAX });`,
  {},
);

/** The split sessions as the agenda has them. */
const splits = AGENDA.flatMap((day) => day.sessions).filter((s) => s.tracks?.length);

test('the workshop still has split sessions to choose between', () => {
  assert.ok(splits.length > 0);
});

test('the endpoint accepts exactly the split sessions the agenda publishes', () => {
  assert.deepEqual(
    Object.keys(constants.SPLIT_SESSIONS).sort(),
    splits.map((s) => s.id).sort(),
  );
});

test('every activity is offered under the title the programme shows', () => {
  for (const session of splits) {
    const tracks = constants.SPLIT_SESSIONS[session.id];
    assert.deepEqual(
      Object.keys(tracks).sort(),
      session.tracks.map((t) => t.id).sort(),
      `${session.id} offers different activities in the script`,
    );
    for (const track of session.tracks) {
      assert.equal(tracks[track.id], track.title, `${track.id} carries a stale title`);
    }
  }
});

test('the site stops offering the control on the day the script stops accepting it', () => {
  assert.equal(constants.CHOICE_CLOSES, TRACK_CHOICE_CLOSES);
  // Nothing is left to choose once the last split session has been held.
  const last = splits.map((s) => s.date).sort().at(-1);
  assert.ok(TRACK_CHOICE_CLOSES >= last);
});

/**
 * The script against fake Google services. Only what `recordChoice` touches is
 * implemented, and `rows` is the sheet — asserting on it is asserting on what
 * the organiser reads.
 */
function endpoint(today = '2026-09-14', rows = [[...constants.CHOICE_HEADER]]) {
  const props = new Map([['CHOICE_SHEET_ID', 'sheet']]);
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map((row) => [...row]) }),
    appendRow: (row) => rows.push([...row]),
    getRange: (row) => ({
      setValues: ([values]) => {
        rows[row - 1] = [...values];
      },
    }),
  };
  const context = createContext({
    console: { log() {} },
    CALENDAR_TIME_ZONE: 'America/Sao_Paulo',
    Utilities: {
      formatDate: (_date, _zone, format) =>
        format === 'yyyy-MM-dd' ? today : `${today} 09:12`,
    },
    SpreadsheetApp: { openById: () => ({ getSheets: () => [sheet] }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => props.get(key) ?? null,
        setProperty: (key, value) => props.set(key, value),
      }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  });
  runInContext(SOURCE, context);
  return {
    rows,
    props,
    choose: (params) => runInContext('recordChoice', context)(params),
  };
}

const CHOICE = {
  session: 'd1-split-inspection-gee',
  track: 'd1-gee-course',
  name: 'Ana Paula',
};

test('a choice reaches the sheet with the activity spelled out', () => {
  const app = endpoint();
  assert.equal(app.choose(CHOICE).status, 'recorded');
  assert.deepEqual(app.rows[1], [
    '2026-09-14 09:12',
    'd1',
    'd1-split-inspection-gee',
    'GEE / GEE App short course',
    'd1-gee-course',
    'Ana Paula',
  ]);
});

test('changing your mind rewrites your row rather than adding a second answer', () => {
  const app = endpoint();
  app.choose(CHOICE);
  const changed = app.choose({ ...CHOICE, track: 'd1-visual-inspection' });
  assert.equal(changed.status, 'changed');
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][4], 'd1-visual-inspection');
  assert.equal(app.rows[1][3], 'Visual Inspection Workshop');
});

test('the name is matched loosely, since it is retyped on a phone', () => {
  const app = endpoint();
  app.choose(CHOICE);
  assert.equal(app.choose({ ...CHOICE, name: '  ana   paula ' }).status, 'recorded');
  assert.equal(app.rows.length, 2);
});

test('two people choosing the same activity are two rows', () => {
  const app = endpoint();
  app.choose(CHOICE);
  app.choose({ ...CHOICE, name: 'Vinícius' });
  assert.equal(app.rows.length, 3);
});

test('a public endpoint refuses anything that names no real activity', () => {
  for (const params of [
    { ...CHOICE, track: 'd4-methane-data' },
    { ...CHOICE, session: 'd2-open-agenda' },
    { ...CHOICE, track: '' },
    { ...CHOICE, name: '   ' },
  ]) {
    const app = endpoint();
    assert.equal(app.choose(params).status, 'invalid');
    assert.equal(app.rows.length, 1);
  }
});

test('the name is capped before it is written, as it is on the way in', () => {
  const app = endpoint();
  app.choose({ ...CHOICE, name: 'z'.repeat(constants.CHOICE_NAME_MAX + 40) });
  assert.equal(app.rows[1][5].length, constants.CHOICE_NAME_MAX);
});

test('choosing closes for good rather than failing as malformed', () => {
  const app = endpoint('2026-09-18');
  assert.equal(app.choose(CHOICE).status, 'closed');
  assert.equal(app.rows.length, 1);
});

test('the last day of the window is still inside it', () => {
  const app = endpoint(constants.CHOICE_CLOSES);
  assert.equal(app.choose(CHOICE).status, 'recorded');
});

test('the daily cap answers limit rather than dropping the choice silently', () => {
  const app = endpoint();
  app.props.set('CHOICE_DAY', new Date().toISOString().slice(0, 10));
  app.props.set('CHOICE_COUNT', '300');
  assert.equal(app.choose(CHOICE).status, 'limit');
  assert.equal(app.rows.length, 1);
});

/* The browser side: what actually travels, and what comes back. */

const client = () => {
  const f = load('track-choice');
  return { ...f, choose: f.exports.chooseTrack, NAME_MAX: f.exports.CHOICE_NAME_MAX };
};

test('a choice carries the session, the activity and the name', async () => {
  const f = client();
  const result = f.choose('d1-split-inspection-gee', 'd1-gee-course', '  Ana Paula  ');
  assert.equal(f.params().get('action'), 'choose');
  assert.equal(f.params().get('session'), 'd1-split-inspection-gee');
  assert.equal(f.params().get('track'), 'd1-gee-course');
  assert.equal(f.params().get('name'), 'Ana Paula');
  f.reply('recorded');
  assert.equal(await result, 'recorded');
  assert.equal(f.scripts[0].removed, true);
  assert.equal(f.timers.size, 0);
});

test('the name is capped before it travels, since the request is a URL', async () => {
  const f = client();
  const result = f.choose('d1-split-inspection-gee', 'd1-gee-course', 'z'.repeat(200));
  assert.equal(f.params().get('name').length, f.NAME_MAX);
  f.reply('recorded');
  assert.equal(await result, 'recorded');
});

test('refusals stay distinct: a closed window is not a failure to report', async () => {
  for (const status of ['changed', 'invalid', 'limit', 'closed']) {
    const f = client();
    const result = f.choose('d1-split-inspection-gee', 'd1-gee-course', 'Ana');
    f.reply(status);
    assert.equal(await result, status);
  }
});

test('a lost or unrecognised response never reports the choice as recorded', async () => {
  for (const response of ['unexpected', null]) {
    const f = client();
    const result = f.choose('d1-split-inspection-gee', 'd1-gee-course', 'Ana');
    if (response) f.reply(response);
    else f.scripts[0].onerror();
    assert.equal(await result, 'error');
    assert.equal(f.scripts[0].removed, true);
  }
});

test('a slow response reports timeout, so nobody is told to answer twice', async () => {
  const f = client();
  const result = f.choose('d1-split-inspection-gee', 'd1-gee-course', 'Ana');
  [...f.timers.values()][0].fn();
  assert.equal(await result, 'timeout');
  assert.equal(f.scripts[0].removed, true);
});
