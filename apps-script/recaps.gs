/**
 * The daily recaps, published and edited live.
 *
 * The recap for a day is drafted in NotebookLM (from `data/recap-prompts.ts`,
 * which never renders on the site), reviewed by the organisers, and published
 * here — on the same evening, straight from `/programme/`, with a password.
 * Revisions after the first are made the same way, including the corrections
 * applied from reader flags. Nothing about a recap needs a commit any more;
 * `data/recaps.ts` stays as the empty fallback and the record of the contract.
 *
 * Reading is public: the recaps are shown on the site anyway. Writing needs
 * the password held in the script property RECAP_EDIT_PASSWORD, set by hand
 * in the editor (Project Settings → Script properties) and never written into
 * this repository, which is public. With no password set, editing is off.
 *
 * Writes arrive as a POST, so the password and the recap travel in the body
 * rather than in a URL. Bounded like the other endpoints: a day has to be a
 * real day, the JSON is capped, wrong passwords are counted per day, and
 * editing closes with the corrections after the workshop.
 *
 * The first save for a day records `published`; every later save records
 * `revised`. The two are what the site renders as stamps, and `published` is
 * never rewritten.
 */

const RECAP_CLOSES = '2026-09-21';
const RECAP_MAX = 60000;
/** Properties cap a value at 9 kB, so a recap is kept in pieces. */
const RECAP_CHUNK = 2000;
const DAILY_RECAP_FAILURES = 40;

function recapKey(day) {
  return `RECAP_DAY_${day}`;
}

function recapDay(raw) {
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 5 ? day : null;
}

/** The stored recap for a day, or null while the repository version is in use. */
function readRecap(props, day) {
  const meta = props.getProperty(recapKey(day));
  if (!meta) return null;
  const { parts, updated } = JSON.parse(meta);
  let text = '';
  for (let i = 0; i < parts; i++) {
    text += props.getProperty(`${recapKey(day)}_${i}`) || '';
  }
  try {
    return { recap: JSON.parse(text), updated };
  } catch {
    return null;
  }
}

function writeRecap(props, day, recap, updated) {
  const previous = props.getProperty(recapKey(day));
  const oldParts = previous ? JSON.parse(previous).parts : 0;
  const text = JSON.stringify(recap);
  const parts = Math.max(1, Math.ceil(text.length / RECAP_CHUNK));
  const values = {};
  for (let i = 0; i < parts; i++) {
    values[`${recapKey(day)}_${i}`] = text.slice(
      i * RECAP_CHUNK,
      (i + 1) * RECAP_CHUNK,
    );
  }
  values[recapKey(day)] = JSON.stringify({ parts, updated });
  props.setProperties(values);
  for (let i = parts; i < oldParts; i++) {
    props.deleteProperty(`${recapKey(day)}_${i}`);
  }
}

/** GET `?action=recaps`: every published recap, keyed by day. */
function getRecaps() {
  const props = PropertiesService.getScriptProperties();
  const recaps = {};
  for (let day = 1; day <= 5; day++) {
    const stored = readRecap(props, day);
    if (stored) recaps[day] = stored;
  }
  return {
    status: 'ok',
    editable:
      recapWindowOpen() && Boolean(props.getProperty('RECAP_EDIT_PASSWORD')),
    recaps,
  };
}

/**
 * POST `{ action: 'recap', day, recap, password, base }`.
 *
 * `base` is the `updated` stamp the editor started from ('' when publishing
 * over nothing). If someone else has saved since, the write is refused as
 * `conflict` and the current recap is returned, so two organisers editing
 * the same day never silently overwrite each other.
 *
 * The first save for a day stamps `published`; later saves stamp `revised`
 * and keep the original `published`. An empty `recap` takes the day back to
 * the repository fallback (nothing published).
 *
 * Returns `saved`, `conflict`, `denied`, `invalid`, `limit`, `closed` or
 * `unconfigured`.
 */
function saveRecap(body) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('RECAP_EDIT_PASSWORD');
  if (!expected) return { status: 'unconfigured' };
  if (!recapWindowOpen()) return { status: 'closed' };
  if (!withinRecapFailureLimit(props, false)) return { status: 'limit' };

  if (String(body.password || '') !== expected) {
    withinRecapFailureLimit(props, true);
    console.log('recap save refused: wrong password');
    return { status: 'denied' };
  }

  const day = recapDay(body.day);
  const now = Utilities.formatDate(
    new Date(),
    CALENDAR_TIME_ZONE,
    "yyyy-MM-dd'T'HH:mm:ss",
  );

  // An empty payload unpublishes the day; validate the shape otherwise.
  let recap = null;
  if (body.recap && typeof body.recap === 'object') {
    recap = sanitizeRecap(body.recap);
    if (!recap || JSON.stringify(recap).length > RECAP_MAX) {
      return { status: 'invalid' };
    }
  }
  if (day === null) return { status: 'invalid' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: 'error' };
  try {
    const current = readRecap(props, day);
    const base = String(body.base || '');
    if ((current ? current.updated : '') !== base) {
      return { status: 'conflict', recap: current };
    }

    if (!recap) {
      props.deleteProperty(recapKey(day));
      console.log('recap day %s unpublished', day);
      return { status: 'saved', recap: null };
    }

    // `published` is set once and never rewritten; later saves are revisions.
    const previousRecap = current ? current.recap : null;
    recap.published = previousRecap ? previousRecap.published : now;
    recap.revised = previousRecap ? now : undefined;

    writeRecap(props, day, recap, now);
    console.log('recap day %s saved (%s sections)', day, recap.sections.length);
    return { status: 'saved', recap: { recap, updated: now } };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Accepts only the fields the site renders, so a hand-written payload cannot
 * smuggle arbitrary JSON into the properties store. Item ids keep the
 * `d<day>-r<serial>` contract the flags endpoint checks; a recap whose lines
 * carry no ids would break the whole flagging mechanism, so ids are required.
 */
function sanitizeRecap(raw) {
  if (typeof raw !== 'object' || raw === null) return null;
  if (typeof raw.sections !== 'object' || !Array.isArray(raw.sections)) {
    return null;
  }

  const day = recapDay(raw.day);
  if (day === null) return null;

  const sections = [];
  for (const section of raw.sections.slice(0, 40)) {
    if (typeof section !== 'object' || section === null) return null;
    const hasSession = typeof section.sessionId === 'string';
    const hasTitle = typeof section.title === 'string';
    if (hasSession === hasTitle) return null;

    const clean = {};
    if (hasSession) clean.sessionId = section.sessionId.slice(0, 80);
    if (hasTitle) clean.title = section.title.slice(0, 120);
    clean.summary = sanitizeItem(section.summary, day);
    clean.decisions = sanitizeItems(section.decisions, day);
    clean.questions = sanitizeItems(section.questions, day);
    clean.actions = sanitizeItems(section.actions, day);
    sections.push(clean);
  }

  return {
    day,
    published: '',
    revised: undefined,
    corrections: Number.isInteger(raw.corrections)
      ? Math.max(0, Math.min(999, raw.corrections))
      : undefined,
    sections,
  };
}

function sanitizeItem(raw, day) {
  if (typeof raw !== 'object' || raw === null) return undefined;
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string') return null;
  if (!raw.id.startsWith(`d${day}-r`)) return null;
  const item = { id: raw.id.slice(0, 12), text: raw.text.slice(0, 2000) };
  if (typeof raw.owner === 'string' && raw.owner.trim()) {
    item.owner = raw.owner.slice(0, 80);
  }
  return item;
}

function sanitizeItems(raw, day) {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((item) => sanitizeItem(item, day))
    .filter((item) => item !== undefined)
    .slice(0, 40);
}

function recapWindowOpen() {
  const today = Utilities.formatDate(
    new Date(),
    CALENDAR_TIME_ZONE,
    'yyyy-MM-dd',
  );
  return today <= RECAP_CLOSES;
}

/**
 * Wrong passwords are counted per day. Past the cap, every write is refused
 * until tomorrow, right password included: guessing is the thing being
 * stopped, and the organisers can still publish from the repository.
 */
function withinRecapFailureLimit(props, record) {
  const today = new Date().toISOString().slice(0, 10);
  if (props.getProperty('RECAP_FAIL_DAY') !== today) {
    props.setProperty('RECAP_FAIL_DAY', today);
    props.setProperty('RECAP_FAIL_COUNT', '0');
  }
  const count = Number(props.getProperty('RECAP_FAIL_COUNT') || 0);
  if (record) props.setProperty('RECAP_FAIL_COUNT', String(count + 1));
  return count < DAILY_RECAP_FAILURES;
}

/** Run from the editor to read one day back as formatted JSON. */
function recapPrint(day) {
  const stored = readRecap(PropertiesService.getScriptProperties(), day);
  console.log(stored ? JSON.stringify(stored, null, 2) : 'not published');
  return stored;
}