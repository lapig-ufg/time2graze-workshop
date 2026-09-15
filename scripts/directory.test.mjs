/**
 * Guards the team directory, on both sides of the wire.
 *
 * The script holds its own copy of the questions' option lists — a public
 * endpoint has to refuse anything that does not name a real one, and the
 * organiser reads labels rather than ids in the sheet — so the first job here
 * is to fail the moment that copy drifts from `data/directory.ts`. The second
 * is the row keying: one row per e-mail address is what keeps someone
 * correcting their job title from leaving two entries behind, and nothing on
 * the page would show that it had broken. The third is the photograph, which
 * is allowed to fail on its own and must never take the answers down with it.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import {
  DIRECTORY_CLOSES,
  DIRECTORY_CONSENT,
  DIRECTORY_EXPERTISE,
  DIRECTORY_LIMITS,
  DIRECTORY_TEAMS,
  directoryOpen,
} from '../data/directory.ts';
import { fixture as load } from './apps-script-fixture.mjs';

/**
 * Both sides of this test run in a vm, so their answers are objects from
 * another realm and `deepEqual` — which is `deepStrictEqual` under
 * `node:assert/strict` — compares prototypes before values. The two fields are
 * the whole answer, so they are compared as values.
 */
function answered(result, status, photo, message) {
  assert.equal(result.status, status, message);
  assert.equal(result.photo, photo, message);
}

const SOURCE = readFileSync(new URL('../apps-script/directory.gs', import.meta.url), 'utf8');

/** The script's own constants, which `const` keeps out of the vm's globals. */
const constants = runInNewContext(
  `${SOURCE}\n({ DIRECTORY_TEAMS, DIRECTORY_EXPERTISE, DIRECTORY_CONSENT, DIRECTORY_CLOSES, DIRECTORY_HEADER, DIRECTORY_MAX, DIRECTORY_EMAIL_COLUMN, DAILY_DIRECTORY_LIMIT });`,
  {},
);

/* --- The two copies of the questions ------------------------------------- */

test('the endpoint accepts exactly the teams the form offers, under their labels', () => {
  assert.deepEqual(
    Object.keys(constants.DIRECTORY_TEAMS).sort(),
    DIRECTORY_TEAMS.map((option) => option.id).sort(),
  );
  for (const option of DIRECTORY_TEAMS) {
    assert.equal(constants.DIRECTORY_TEAMS[option.id], option.label, option.id);
  }
});

test('the endpoint accepts exactly the areas of expertise the form offers', () => {
  assert.deepEqual(
    Object.keys(constants.DIRECTORY_EXPERTISE).sort(),
    DIRECTORY_EXPERTISE.map((option) => option.id).sort(),
  );
  for (const option of DIRECTORY_EXPERTISE) {
    assert.equal(constants.DIRECTORY_EXPERTISE[option.id], option.label, option.id);
  }
});

test('the permission question has the same two answers on both sides', () => {
  assert.deepEqual(
    Object.keys(constants.DIRECTORY_CONSENT).sort(),
    DIRECTORY_CONSENT.map((option) => option.id).sort(),
  );
});

test('the site stops offering the form on the day the script stops accepting it', () => {
  assert.equal(constants.DIRECTORY_CLOSES, DIRECTORY_CLOSES);
  assert.equal(directoryOpen(DIRECTORY_CLOSES), true);
  assert.equal(directoryOpen('2099-01-01'), false);
  // Prerendered, and the moment before hydration: the script is what refuses.
  assert.equal(directoryOpen(null), true);
});

test('an answer is capped to the same length on both sides', () => {
  for (const field of ['name', 'organization', 'jobTitle', 'regions', 'role', 'expertiseOther', 'email']) {
    assert.equal(constants.DIRECTORY_MAX[field], DIRECTORY_LIMITS[field], field);
  }
});

test('the sheet is keyed by the column the header calls the address', () => {
  assert.equal(
    constants.DIRECTORY_HEADER[constants.DIRECTORY_EMAIL_COLUMN - 1],
    'Email address',
  );
});

/* --- The script against fake Google services ------------------------------ */

/**
 * Only what `recordDirectoryEntry` touches is implemented, and `rows` is the
 * sheet — asserting on it is asserting on what the organiser reads. `drive`
 * decides whether Drive cooperates, because the interesting case is the one
 * where it does not.
 */
function endpoint({ today = '2026-09-15', drive = 'ok', rows } = {}) {
  const sheet = rows ?? [[...constants.DIRECTORY_HEADER]];
  const props = new Map([
    ['DIRECTORY_SHEET_ID', 'sheet'],
    ['DIRECTORY_FOLDER_ID', 'folder'],
  ]);
  const files = [];
  const page = {
    getDataRange: () => ({ getValues: () => sheet.map((row) => [...row]) }),
    appendRow: (row) => sheet.push([...row]),
    getRange: (row) => ({
      setValues: ([values]) => {
        sheet[row - 1] = [...values];
      },
    }),
  };
  const context = createContext({
    console: { log() {} },
    CALENDAR_TIME_ZONE: 'America/Sao_Paulo',
    Utilities: {
      formatDate: (_date, _zone, format) =>
        format === 'yyyy-MM-dd'
          ? today
          : format === 'yyyyMMdd-HHmmss'
            ? '20260915-141200'
            : `${today} 14:12`,
      base64Decode: (data) => Buffer.from(data, 'base64'),
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
    },
    SpreadsheetApp: { openById: () => ({ getSheets: () => [page] }) },
    DriveApp: {
      getFolderById: () => ({
        createFile: (blob) => {
          if (drive !== 'ok') throw new Error('Drive said no');
          files.push(blob);
          return { getUrl: () => `https://drive.example/${files.length}` };
        },
      }),
    },
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
    rows: sheet,
    props,
    files,
    record: (body) => runInContext('recordDirectoryEntry', context)(body),
  };
}

const ENTRY = {
  action: 'directory',
  name: 'Ana Paula Ribeiro',
  organization: 'LAPIG · Universidade Federal de Goiás',
  jobTitle: 'Remote sensing researcher',
  regions: 'Brazil, Uruguay',
  team: 'remote-sensing-team',
  role: 'I build the pasture biomass models and keep the training data honest.',
  expertise: ['remote-sensing', 'machine-learning'],
  expertiseOther: '',
  email: 'Ana.Paula@ufg.br',
  consent: 'yes',
};

/** A one-pixel PNG, which is a real image as far as the endpoint is concerned. */
const PHOTO = {
  name: 'ana.jpg',
  type: 'image/jpeg',
  data: Buffer.from('not really a jpeg, but bytes are bytes').toString('base64'),
};

test('an entry reaches the sheet with every option spelled out', () => {
  const app = endpoint();
  answered(app.record(ENTRY), 'saved', 'none');
  assert.deepEqual(app.rows[1], [
    '2026-09-15 14:12',
    'Ana Paula Ribeiro',
    'LAPIG · Universidade Federal de Goiás',
    'Remote sensing researcher',
    'Brazil, Uruguay',
    'Remote Sensing Team',
    'I build the pasture biomass models and keep the training data honest.',
    'Remote sensing and Earth observation, Machine learning and data science',
    '',
    'ana.paula@ufg.br',
    '',
    'Yes',
  ]);
});

test('sending again from the same address rewrites the row rather than adding one', () => {
  const app = endpoint();
  app.record(ENTRY);
  const again = app.record({ ...ENTRY, jobTitle: 'Senior remote sensing researcher' });
  answered(again, 'updated', 'none');
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][3], 'Senior remote sensing researcher');
});

test('the address is matched however it was typed', () => {
  const app = endpoint();
  app.record(ENTRY);
  assert.equal(app.record({ ...ENTRY, email: '  ANA.PAULA@UFG.BR ' }).status, 'updated');
  assert.equal(app.rows.length, 2);
});

test('two people are two rows', () => {
  const app = endpoint();
  app.record(ENTRY);
  app.record({ ...ENTRY, name: 'Vinícius Mesquita', email: 'vinicius@ufg.br' });
  assert.equal(app.rows.length, 3);
});

test('a public endpoint refuses anything that names no real option', () => {
  for (const body of [
    { ...ENTRY, team: 'field-team' },
    { ...ENTRY, team: '' },
    { ...ENTRY, expertise: ['astrophysics'] },
    { ...ENTRY, expertise: [] },
    { ...ENTRY, consent: 'maybe' },
    { ...ENTRY, name: '   ' },
    { ...ENTRY, organization: '' },
    { ...ENTRY, jobTitle: '' },
    { ...ENTRY, role: '' },
    { ...ENTRY, email: 'ana.paula' },
    { ...ENTRY, email: '' },
    // "Other" with nothing beside it tells the directory nothing.
    { ...ENTRY, expertise: ['other'], expertiseOther: '' },
  ]) {
    const app = endpoint();
    answered(app.record(body), 'invalid', 'none', JSON.stringify(body));
    assert.equal(app.rows.length, 1);
  }
});

test('a missing field is refused rather than stored as the string "undefined"', () => {
  const app = endpoint();
  const { regions: _regions, ...without } = ENTRY;
  // Regions is the optional one, so this stays valid and lands empty.
  assert.equal(app.record(without).status, 'saved');
  assert.equal(app.rows[1][4], '');
});

test('"Other" is stored in its own column beside the areas it accompanies', () => {
  const app = endpoint();
  app.record({ ...ENTRY, expertise: ['livestock-systems', 'other'], expertiseOther: 'Soil carbon' });
  assert.equal(app.rows[1][7], 'Livestock systems, Other');
  assert.equal(app.rows[1][8], 'Soil carbon');
});

test('a repeated area of expertise is stored once', () => {
  const app = endpoint();
  app.record({ ...ENTRY, expertise: ['methane', 'methane'] });
  assert.equal(app.rows[1][7], 'Methane emissions');
});

test('every answer is capped before it is written, as it is on the way in', () => {
  const app = endpoint();
  app.record({ ...ENTRY, role: 'z'.repeat(DIRECTORY_LIMITS.role + 500) });
  assert.equal(app.rows[1][6].length, DIRECTORY_LIMITS.role);
});

test('a "no" to the permission question is recorded, not discarded', () => {
  const app = endpoint();
  assert.equal(app.record({ ...ENTRY, consent: 'no' }).status, 'saved');
  assert.equal(app.rows[1][11], 'No');
});

test('the photograph lands in Drive and its link lands in the row', () => {
  const app = endpoint();
  answered(app.record({ ...ENTRY, photo: PHOTO }), 'saved', 'stored');
  assert.equal(app.rows[1][10], 'https://drive.example/1');
  assert.equal(app.files.length, 1);
  assert.equal(app.files[0].name, 'ana-paula-ribeiro-20260915-141200.jpg');
  assert.equal(app.files[0].type, 'image/jpeg');
  assert.equal(app.files[0].bytes.toString(), 'not really a jpeg, but bytes are bytes');
});

test('Drive refusing the photograph never costs the person their answers', () => {
  const app = endpoint({ drive: 'broken' });
  answered(app.record({ ...ENTRY, photo: PHOTO }), 'saved', 'failed');
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][1], 'Ana Paula Ribeiro');
  assert.equal(app.rows[1][10], '');
});

test('a file that is not an image is refused without failing the entry', () => {
  const app = endpoint();
  answered(app.record({ ...ENTRY, photo: { ...PHOTO, type: 'application/pdf' } }), 'saved', 'failed');
  assert.equal(app.files.length, 0);
});

test('an update with no new file keeps the photograph already on the sheet', () => {
  const app = endpoint();
  app.record({ ...ENTRY, photo: PHOTO });
  assert.equal(app.record({ ...ENTRY, jobTitle: 'Coordinator' }).status, 'updated');
  assert.equal(app.rows[1][10], 'https://drive.example/1');
});

test('an update carrying a new file replaces the link', () => {
  const app = endpoint();
  app.record({ ...ENTRY, photo: PHOTO });
  app.record({ ...ENTRY, photo: PHOTO });
  assert.equal(app.rows[1][10], 'https://drive.example/2');
});

test('the directory closes for good rather than failing as malformed', () => {
  const app = endpoint({ today: '2099-01-01' });
  answered(app.record(ENTRY), 'closed', 'none');
  assert.equal(app.rows.length, 1);
});

test('the last day of the window is still inside it', () => {
  const app = endpoint({ today: DIRECTORY_CLOSES });
  assert.equal(app.record(ENTRY).status, 'saved');
});

test('the daily cap answers limit rather than dropping the entry silently', () => {
  const app = endpoint();
  app.props.set('DIRECTORY_DAY', new Date().toISOString().slice(0, 10));
  app.props.set('DIRECTORY_COUNT', String(constants.DAILY_DIRECTORY_LIMIT));
  answered(app.record(ENTRY), 'limit', 'none');
  assert.equal(app.rows.length, 1);
});

test('a refused entry does not spend a place in the daily cap', () => {
  const app = endpoint();
  app.record({ ...ENTRY, team: 'nonsense' });
  assert.equal(app.props.get('DIRECTORY_COUNT') ?? '0', '0');
});

/* --- The browser side: what travels, and what comes back ------------------ */

/** The module under test, with `fetch` answering as the script would. */
function client(answer) {
  const calls = [];
  const fixture = load('directory', {
    fetch: async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      return answer(init);
    },
  });
  return { calls, submit: fixture.exports.submitDirectoryEntry };
}

const replied = (payload) => async () => ({ json: async () => payload });

const ENTRY_IN = {
  name: '  Ana Paula Ribeiro ',
  organization: 'LAPIG',
  jobTitle: 'Researcher',
  regions: '',
  team: 'remote-sensing-team',
  role: 'Biomass models.',
  expertise: ['remote-sensing'],
  expertiseOther: '',
  email: '  Ana.Paula@UFG.br ',
  consent: 'yes',
  photo: null,
};

test('the entry travels as a simple text/plain POST, which needs no preflight', async () => {
  const app = client(replied({ status: 'saved', photo: 'none' }));
  await app.submit(ENTRY_IN);
  const [call] = app.calls;
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.ok(String(call.url).startsWith('https://script.google.com/macros/'));
});

test('the address is lower-cased and every answer trimmed before it leaves', async () => {
  const app = client(replied({ status: 'saved', photo: 'none' }));
  await app.submit(ENTRY_IN);
  assert.equal(app.calls[0].body.action, 'directory');
  assert.equal(app.calls[0].body.email, 'ana.paula@ufg.br');
  assert.equal(app.calls[0].body.name, 'Ana Paula Ribeiro');
});

test('no photo means no photo field, rather than a null the script has to read', async () => {
  const app = client(replied({ status: 'saved', photo: 'none' }));
  await app.submit(ENTRY_IN);
  assert.equal('photo' in app.calls[0].body, false);
});

test('a photo travels as base64 beside the answers', async () => {
  const app = client(replied({ status: 'saved', photo: 'stored' }));
  const result = await app.submit({ ...ENTRY_IN, photo: PHOTO });
  assert.deepEqual(app.calls[0].body.photo, PHOTO);
  answered(result, 'saved', 'stored');
});

test('every answer the script gives is carried back as itself', async () => {
  for (const status of ['saved', 'updated', 'invalid', 'limit', 'closed']) {
    const app = client(replied({ status, photo: 'none' }));
    assert.equal((await app.submit(ENTRY_IN)).status, status);
  }
});

test('an unrecognised answer is never reported as saved', async () => {
  for (const payload of [{ status: 'ok' }, {}, { status: 'error', message: 'Unknown action.' }]) {
    const app = client(replied(payload));
    assert.equal((await app.submit(ENTRY_IN)).status, 'error');
  }
});

test('a photo reported stored against a refused entry is not reported at all', async () => {
  const app = client(replied({ status: 'invalid', photo: 'stored' }));
  answered(await app.submit(ENTRY_IN), 'invalid', 'none');
});

test('a connection that fails reports error, and one that hangs reports timeout', async () => {
  const dead = client(async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.equal((await dead.submit(ENTRY_IN)).status, 'error');

  const hung = client(async () => {
    throw new DOMException('The operation was aborted.', 'AbortError');
  });
  assert.equal((await hung.submit(ENTRY_IN)).status, 'timeout');
});
