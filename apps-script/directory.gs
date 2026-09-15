/**
 * The Time2Graze team directory.
 *
 * The project is assembling an internal directory of who is involved and what
 * each person works on. A participant answers the form on the workshop site
 * and this keeps **one row per e-mail address** in a private spreadsheet, so
 * someone who comes back to correct their job title rewrites their row instead
 * of leaving the organiser two entries to reconcile. The address is the key
 * because it is the one answer the form validates as unique to a person.
 *
 * Nothing written here is ever read back by the site: a participant sees their
 * own submission from their own browser and never anyone else's. The endpoint
 * is public and anonymous, like calendar sharing, recap flagging and the
 * split-session choices, so it is bounded on the same three sides: every
 * choice has to name a real option, the volume is capped per day, and the
 * whole thing closes on a stated date.
 *
 * The photograph is the one part allowed to fail on its own. It arrives as
 * base64 in the same POST, and Drive can refuse it for reasons that have
 * nothing to do with the person filling in the form — so the row is written
 * first and the file attempted afterwards. A participant whose photograph
 * could not be stored is told exactly that, with their answers already safe,
 * rather than being asked to fill the form in again.
 */

const DIRECTORY_SHEET_NAME = 'Time2Graze team directory';
const DIRECTORY_PHOTO_FOLDER = 'Time2Graze team directory photos';
const DIRECTORY_HEADER = [
  'Received (Goiânia)',
  'Full name',
  'Organization',
  'Job title',
  'Countries or regions',
  'Time2Graze team',
  'Role on Time2Graze',
  'Areas of expertise',
  'Other expertise',
  'Email address',
  'Profile photo',
  'Directory permission',
];
/** Column of the address the sheet is keyed by, 1-based, as the sheet counts. */
const DIRECTORY_EMAIL_COLUMN = 10;

/** Last day an entry is accepted, in the workshop's timezone. */
const DIRECTORY_CLOSES = '2026-10-31';
const DAILY_DIRECTORY_LIMIT = 200;

/** Mirrors `DIRECTORY_LIMITS` in data/directory.ts. */
const DIRECTORY_MAX = {
  name: 120,
  organization: 120,
  jobTitle: 120,
  regions: 200,
  role: 1200,
  expertiseOther: 120,
  email: 120,
};

/**
 * The options the form offers, by id and under the label the organiser reads
 * in the sheet. A public endpoint stores labels rather than ids for the same
 * reason tracks.gs does: the sheet is the directory's working copy, and an id
 * is not what anyone wants to read in it.
 */
const DIRECTORY_TEAMS = {
  'remote-sensing-team': 'Remote Sensing Team',
  'decision-support-team': 'Decision Support Team',
  'both-or-neither': 'Both or neither',
};

const DIRECTORY_EXPERTISE = {
  'remote-sensing': 'Remote sensing and Earth observation',
  'machine-learning': 'Machine learning and data science',
  'livestock-systems': 'Livestock systems',
  methane: 'Methane emissions',
  'decision-support-tools': 'Decision-support tools',
  'engagement-training': 'User engagement and training',
  'policy-programmes': 'Policy and program applications',
  'monitoring-evaluation': 'Monitoring, evaluation and learning',
  coordination: 'Project coordination',
  communications: 'Communications',
  other: 'Other',
};

const DIRECTORY_CONSENT = { yes: 'Yes', no: 'No' };

/** Base64 of a resized portrait is a few hundred kB; this is the outer wall. */
const DIRECTORY_PHOTO_MAX_CHARS = 9000000;

/**
 * Records one directory entry. Returns `saved`, `updated`, `invalid`, `limit`,
 * `closed` or `error`, and alongside it what became of the photograph:
 * `stored`, `failed` or `none`.
 *
 * `updated` is distinct from `saved` so the site can tell a participant their
 * earlier answers have been replaced rather than added to — the whole point of
 * keying the sheet by address.
 */
function recordDirectoryEntry(body) {
  if (!directoryWindowOpen()) return { status: 'closed', photo: 'none' };

  const entry = readDirectoryEntry(body);
  if (!entry) return { status: 'invalid', photo: 'none' };
  if (!withinDailyDirectoryLimit()) return { status: 'limit', photo: 'none' };

  // One row per address is a read-then-write, so two people answering in the
  // same second must not interleave. Sixty seconds covers the photo upload.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return { status: 'error', photo: 'none' };
  try {
    return writeDirectoryEntry(entry, body.photo);
  } finally {
    lock.releaseLock();
  }
}

/**
 * The answers, checked and normalised, or null if any required one is missing
 * or names something the form does not offer.
 */
function readDirectoryEntry(body) {
  const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

  const entry = {
    name: text(body.name, DIRECTORY_MAX.name),
    organization: text(body.organization, DIRECTORY_MAX.organization),
    jobTitle: text(body.jobTitle, DIRECTORY_MAX.jobTitle),
    regions: text(body.regions, DIRECTORY_MAX.regions),
    team: text(body.team, 60),
    role: text(body.role, DIRECTORY_MAX.role),
    expertiseOther: text(body.expertiseOther, DIRECTORY_MAX.expertiseOther),
    email: text(body.email, DIRECTORY_MAX.email).toLowerCase(),
    consent: text(body.consent, 10).toLowerCase(),
  };

  if (!entry.name || !entry.organization || !entry.jobTitle || !entry.role) {
    return null;
  }
  if (!DIRECTORY_TEAMS[entry.team]) return null;
  if (!DIRECTORY_CONSENT[entry.consent]) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return null;

  const picked = Array.isArray(body.expertise) ? body.expertise : [];
  const expertise = [];
  for (let i = 0; i < picked.length; i++) {
    const id = String(picked[i]).trim();
    // An unknown id is a malformed request, not a new area of expertise: the
    // sheet's columns are only comparable while every row names the same list.
    if (!DIRECTORY_EXPERTISE[id]) return null;
    if (expertise.indexOf(id) === -1) expertise.push(id);
  }
  if (!expertise.length) return null;
  // "Other" with nothing beside it tells the directory nothing.
  if (expertise.indexOf('other') !== -1 && !entry.expertiseOther) return null;

  entry.expertise = expertise;
  return entry;
}

/** The row itself, and then the photograph. Called under the script lock. */
function writeDirectoryEntry(entry, photo) {
  const sheet = getDirectorySheet();
  const existing = findDirectoryRow(sheet, entry.email);
  const row = [
    Utilities.formatDate(new Date(), CALENDAR_TIME_ZONE, 'yyyy-MM-dd HH:mm'),
    entry.name,
    entry.organization,
    entry.jobTitle,
    entry.regions,
    DIRECTORY_TEAMS[entry.team],
    entry.role,
    entry.expertise.map(function (id) { return DIRECTORY_EXPERTISE[id]; }).join(', '),
    entry.expertiseOther,
    entry.email,
    // Kept from the previous answer when this update carries no new file: a
    // person correcting their job title has not withdrawn their photograph.
    existing ? existing.photo : '',
    DIRECTORY_CONSENT[entry.consent],
  ];

  let stored = 'none';
  if (photo) {
    const url = storeDirectoryPhoto(entry, photo);
    if (url) {
      row[10] = url;
      stored = 'stored';
    } else {
      stored = 'failed';
    }
  }

  if (existing) {
    sheet.getRange(existing.row, 1, 1, DIRECTORY_HEADER.length).setValues([row]);
    console.log('directory entry updated: %s', entry.email);
    return { status: 'updated', photo: stored };
  }

  sheet.appendRow(row);
  console.log('directory entry saved: %s', entry.email);
  return { status: 'saved', photo: stored };
}

/** This address's existing row, if it has one. */
function findDirectoryRow(sheet, email) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][DIRECTORY_EMAIL_COLUMN - 1]).trim().toLowerCase() === email) {
      return { row: i + 1, photo: String(rows[i][10] || '') };
    }
  }
  return null;
}

/**
 * The photograph, in a folder of its own beside the sheet. Returns the file's
 * URL, or null when Drive would not take it — which never fails the entry.
 */
function storeDirectoryPhoto(entry, photo) {
  try {
    const type = String(photo.type || '');
    const data = String(photo.data || '');
    if (type.indexOf('image/') !== 0) return null;
    if (!data || data.length > DIRECTORY_PHOTO_MAX_CHARS) return null;

    const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const stamp = Utilities.formatDate(new Date(), CALENDAR_TIME_ZONE, 'yyyyMMdd-HHmmss');
    const name = directorySlug(entry.name) + '-' + stamp + '.' + extension;

    const blob = Utilities.newBlob(Utilities.base64Decode(data), type, name);
    const file = getDirectoryPhotoFolder().createFile(blob);
    console.log('directory photo stored: %s', file.getUrl());
    return file.getUrl();
  } catch (err) {
    // The answers matter more than the picture. Logged, reported to the
    // participant, and the organiser asks them for it directly.
    console.log('directory photo failed for %s: %s', entry.email, String(err));
    return null;
  }
}

function directorySlug(name) {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'entry';
}

/** True until the end of DIRECTORY_CLOSES, read in the workshop's timezone. */
function directoryWindowOpen() {
  const today = Utilities.formatDate(new Date(), CALENDAR_TIME_ZONE, 'yyyy-MM-dd');
  return today <= DIRECTORY_CLOSES;
}

/**
 * The directory sheet, created once and then remembered. Private to the
 * account running the script: people are handing over a photograph and a work
 * address for an internal directory, not publishing a profile.
 */
function getDirectorySheet() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('DIRECTORY_SHEET_ID');
  if (stored) return SpreadsheetApp.openById(stored).getSheets()[0];

  const spreadsheet = SpreadsheetApp.create(DIRECTORY_SHEET_NAME);
  const sheet = spreadsheet.getSheets()[0];
  sheet.appendRow(DIRECTORY_HEADER);
  sheet.getRange(1, 1, 1, DIRECTORY_HEADER.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(7, 460);
  sheet.setColumnWidth(8, 320);
  props.setProperty('DIRECTORY_SHEET_ID', spreadsheet.getId());
  console.log('team directory sheet: %s', spreadsheet.getUrl());
  return sheet;
}

/** The photographs' folder, created once and then remembered. */
function getDirectoryPhotoFolder() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('DIRECTORY_FOLDER_ID');
  if (stored) return DriveApp.getFolderById(stored);

  const folder = DriveApp.createFolder(DIRECTORY_PHOTO_FOLDER);
  props.setProperty('DIRECTORY_FOLDER_ID', folder.getId());
  console.log('team directory photos: %s', folder.getUrl());
  return folder;
}

/** A soft cap so a public endpoint cannot be used to fill the sheet. */
function withinDailyDirectoryLimit() {
  const props = PropertiesService.getScriptProperties();
  const today = new Date().toISOString().slice(0, 10);
  if (props.getProperty('DIRECTORY_DAY') !== today) {
    props.setProperty('DIRECTORY_DAY', today);
    props.setProperty('DIRECTORY_COUNT', '0');
  }
  const count = Number(props.getProperty('DIRECTORY_COUNT') || 0);
  if (count >= DAILY_DIRECTORY_LIMIT) return false;
  props.setProperty('DIRECTORY_COUNT', String(count + 1));
  return true;
}

/**
 * Run once from the editor after deploying: creates the sheet and the photo
 * folder so the first participant to answer is not also the first to find out
 * whether Drive will cooperate, and prints where both of them are.
 */
function directorySetup() {
  const sheet = getDirectorySheet().getParent().getUrl();
  const folder = getDirectoryPhotoFolder().getUrl();
  console.log('Team directory ready. Sheet: %s Photos: %s', sheet, folder);
  return { sheet: sheet, folder: folder };
}

/** Run from the editor when you want the sheet's address. */
function directorySheetUrl() {
  const url = getDirectorySheet().getParent().getUrl();
  console.log(url);
  return url;
}
