/**
 * Split-session choices.
 *
 * Two sessions run two activities at the same hour — Day 1 at 10:00 and Day 4
 * at 14:00 — and the rooms have to be sized before the day starts. A
 * participant picks one on the site and sends their name; this keeps **one row
 * per person per session** in a private spreadsheet, so someone who changes
 * their mind rewrites their row instead of leaving the organiser two answers
 * to reconcile.
 *
 * Nothing written here is ever read back by the site: a reader sees their own
 * choice from their own browser, never anyone else's and never a count. The
 * endpoint is public and anonymous, like calendar sharing and recap flagging,
 * so it is bounded on three sides: the session and the activity have to name
 * real ones, the volume is capped per day, and it closes after the last split
 * session has been held.
 */

const CHOICE_SHEET_NAME = 'Time2Graze split-session choices';
const CHOICE_HEADER = [
  'Recorded (Goiânia)',
  'Day',
  'Session',
  'Activity',
  'Activity id',
  'Name',
];
/** Last day a choice is accepted, in the workshop's timezone. */
const CHOICE_CLOSES = '2026-09-17';
const DAILY_CHOICE_LIMIT = 300;
const CHOICE_NAME_MAX = 60;

/**
 * The split sessions, mirroring `data/agenda.ts`. A choice has to name one of
 * these pairs, and the titles are here so the organiser reads a sheet of
 * activities rather than a sheet of ids. `scripts/track-choice.test.mjs` fails
 * the moment this drifts from the agenda.
 */
const SPLIT_SESSIONS = {
  'd1-split-inspection-gee': {
    'd1-visual-inspection': 'Visual Inspection Workshop',
    'd1-gee-course': 'GEE / GEE App short course',
  },
};

/**
 * Records one choice. Returns `recorded`, `changed`, `invalid`, `limit` or
 * `closed`.
 *
 * `changed` is distinct from `recorded` so the site can tell a participant
 * their earlier answer has been replaced rather than added to — the whole
 * point of keying the sheet by name.
 */
function recordChoice(params) {
  const session = String(params.session || '').trim();
  const track = String(params.track || '').trim();
  const name = String(params.name || '').trim().slice(0, CHOICE_NAME_MAX);

  if (!choiceWindowOpen()) return { status: 'closed' };

  const tracks = SPLIT_SESSIONS[session];
  if (!tracks || !tracks[track] || name.length === 0) {
    return { status: 'invalid' };
  }
  if (!withinDailyChoiceLimit()) return { status: 'limit' };

  // One row per person is a read-then-write, so two people answering in the
  // same second must not interleave. Ten seconds is far longer than the work.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: 'error' };
  try {
    return writeChoice(session, track, tracks[track], name);
  } finally {
    lock.releaseLock();
  }
}

/** The row itself. Called under the script lock. */
function writeChoice(session, track, title, name) {
  const sheet = getChoiceSheet();
  const row = [
    Utilities.formatDate(new Date(), CALENDAR_TIME_ZONE, 'yyyy-MM-dd HH:mm'),
    session.slice(0, session.indexOf('-')),
    session,
    title,
    track,
    name,
  ];

  const existing = findChoiceRow(sheet, session, name);
  if (existing) {
    const changed = existing.track !== track;
    sheet.getRange(existing.row, 1, 1, CHOICE_HEADER.length).setValues([row]);
    console.log(
      'split choice %s: %s -> %s (%s)',
      changed ? 'changed' : 'repeated',
      session,
      track,
      name,
    );
    return { status: changed ? 'changed' : 'recorded' };
  }

  sheet.appendRow(row);
  console.log('split choice recorded: %s -> %s (%s)', session, track, name);
  return { status: 'recorded' };
}

/**
 * This person's existing answer to this session, if there is one. The name is
 * the key — matched case- and space-insensitively, because a participant
 * typing it a second time on a phone will not reproduce it exactly.
 */
function findChoiceRow(sheet, session, name) {
  const rows = sheet.getDataRange().getValues();
  const key = normaliseChoiceName(name);
  for (let i = 1; i < rows.length; i++) {
    if (
      String(rows[i][2]).trim() === session &&
      normaliseChoiceName(String(rows[i][5])) === key
    ) {
      return { row: i + 1, track: String(rows[i][4]).trim() };
    }
  }
  return null;
}

function normaliseChoiceName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** True until the end of CHOICE_CLOSES, read in the workshop's timezone. */
function choiceWindowOpen() {
  const today = Utilities.formatDate(
    new Date(),
    CALENDAR_TIME_ZONE,
    'yyyy-MM-dd',
  );
  return today <= CHOICE_CLOSES;
}

/**
 * The choices sheet, created once and then remembered. Private to the account
 * running the script: a participant saying where they will be is telling the
 * organiser, not publishing an attendance list.
 */
function getChoiceSheet() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('CHOICE_SHEET_ID');
  if (stored) return SpreadsheetApp.openById(stored).getSheets()[0];

  const spreadsheet = SpreadsheetApp.create(CHOICE_SHEET_NAME);
  const sheet = spreadsheet.getSheets()[0];
  sheet.appendRow(CHOICE_HEADER);
  sheet.getRange(1, 1, 1, CHOICE_HEADER.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(4, 320);
  props.setProperty('CHOICE_SHEET_ID', spreadsheet.getId());
  console.log('split-session choices sheet: %s', spreadsheet.getUrl());
  return sheet;
}

/** A soft cap so a public endpoint cannot be used to fill the sheet. */
function withinDailyChoiceLimit() {
  const props = PropertiesService.getScriptProperties();
  const today = new Date().toISOString().slice(0, 10);
  if (props.getProperty('CHOICE_DAY') !== today) {
    props.setProperty('CHOICE_DAY', today);
    props.setProperty('CHOICE_COUNT', '0');
  }
  const count = Number(props.getProperty('CHOICE_COUNT') || 0);
  if (count >= DAILY_CHOICE_LIMIT) return false;
  props.setProperty('CHOICE_COUNT', String(count + 1));
  return true;
}

/** Run from the editor when you want the sheet's address. */
function choiceSheetUrl() {
  const url = getChoiceSheet().getParent().getUrl();
  console.log(url);
  return url;
}

/**
 * Run from the editor the evening before a split session: how many people
 * each activity is expecting, and who has not answered at all is the
 * difference between this and the room.
 */
function choiceTally() {
  const rows = getChoiceSheet().getDataRange().getValues();
  const counts = {};
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][2]) + ' / ' + String(rows[i][3]);
    counts[key] = (counts[key] || 0) + 1;
  }
  for (const key in counts) console.log('%s: %s', key, counts[key]);
  return counts;
}
