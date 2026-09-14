/**
 * The NotebookLM prompts that draft each day's recap, edited live.
 *
 * The site ships an original prompt per day (`data/recap-prompts.ts`). The
 * organisers edit it on `/programme/`, and the edited text is kept here, in
 * script properties, so a change reaches everyone without a commit.
 *
 * Reading is public: the prompts are shown on the site anyway. Writing needs
 * the password held in the script property PROMPT_EDIT_PASSWORD, which is set
 * by hand in the editor (Project Settings → Script properties) and never
 * written into this repository, which is public. With no password set,
 * editing is off.
 *
 * Writes arrive as a POST, so the password and the text travel in the body
 * rather than in a URL. Bounded like the other endpoints: a day has to be a
 * real day, the text is capped, wrong passwords are counted per day, and
 * editing closes after the workshop.
 */

const PROMPT_CLOSES = '2026-09-21';
const PROMPT_MAX = 20000;
/** Properties cap a value at 9 kB, so a long prompt is kept in pieces. */
const PROMPT_CHUNK = 2000;
const DAILY_PROMPT_FAILURES = 40;

function promptKey(day) {
  return `PROMPT_DAY_${day}`;
}

function promptDay(raw) {
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 5 ? day : null;
}

/** The stored prompt for a day, or null while the original is in use. */
function readPrompt(props, day) {
  const meta = props.getProperty(promptKey(day));
  if (!meta) return null;
  const { parts, updated } = JSON.parse(meta);
  let text = '';
  for (let i = 0; i < parts; i++) {
    text += props.getProperty(`${promptKey(day)}_${i}`) || '';
  }
  return { text, updated };
}

function writePrompt(props, day, text, updated) {
  const previous = props.getProperty(promptKey(day));
  const oldParts = previous ? JSON.parse(previous).parts : 0;
  const parts = Math.max(1, Math.ceil(text.length / PROMPT_CHUNK));
  const values = {};
  for (let i = 0; i < parts; i++) {
    values[`${promptKey(day)}_${i}`] = text.slice(
      i * PROMPT_CHUNK,
      (i + 1) * PROMPT_CHUNK,
    );
  }
  values[promptKey(day)] = JSON.stringify({ parts, updated });
  props.setProperties(values);
  for (let i = parts; i < oldParts; i++) {
    props.deleteProperty(`${promptKey(day)}_${i}`);
  }
}

/** GET `?action=prompts`: every edited prompt, keyed by day. */
function getPrompts() {
  const props = PropertiesService.getScriptProperties();
  const prompts = {};
  for (let day = 1; day <= 5; day++) {
    const stored = readPrompt(props, day);
    if (stored) prompts[day] = stored;
  }
  return {
    status: 'ok',
    editable:
      promptWindowOpen() && Boolean(props.getProperty('PROMPT_EDIT_PASSWORD')),
    prompts,
  };
}

/**
 * POST `{ action: 'prompt', day, text, password, base }`.
 *
 * `base` is the `updated` stamp the editor started from. If someone else has
 * saved since, the write is refused as `conflict` and the current text is
 * returned, so two organisers editing the same day never silently overwrite
 * each other. An empty `text` returns the day to its original prompt.
 *
 * Returns `saved`, `conflict`, `denied`, `invalid`, `limit`, `closed` or
 * `unconfigured`.
 */
function savePrompt(body) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('PROMPT_EDIT_PASSWORD');
  if (!expected) return { status: 'unconfigured' };
  if (!promptWindowOpen()) return { status: 'closed' };
  if (!withinPromptFailureLimit(props, false)) return { status: 'limit' };

  if (String(body.password || '') !== expected) {
    withinPromptFailureLimit(props, true);
    console.log('prompt edit refused: wrong password');
    return { status: 'denied' };
  }

  const day = promptDay(body.day);
  const text = String(body.text || '').replace(/\r\n/g, '\n');
  if (day === null || text.length > PROMPT_MAX) return { status: 'invalid' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { status: 'error' };
  try {
    const current = readPrompt(props, day);
    const base = String(body.base || '');
    if ((current ? current.updated : '') !== base) {
      return { status: 'conflict', prompt: current };
    }

    if (text.trim() === '') {
      props.deleteProperty(promptKey(day));
      console.log('prompt day %s reset to the original', day);
      return { status: 'saved', prompt: null };
    }

    const updated = Utilities.formatDate(
      new Date(),
      CALENDAR_TIME_ZONE,
      "yyyy-MM-dd'T'HH:mm:ss",
    );
    writePrompt(props, day, text, updated);
    console.log('prompt day %s saved (%s chars)', day, text.length);
    return { status: 'saved', prompt: { text, updated } };
  } finally {
    lock.releaseLock();
  }
}

function promptWindowOpen() {
  const today = Utilities.formatDate(
    new Date(),
    CALENDAR_TIME_ZONE,
    'yyyy-MM-dd',
  );
  return today <= PROMPT_CLOSES;
}

/**
 * Wrong passwords are counted per day. Past the cap, every write is refused
 * until tomorrow, right password included: guessing is the thing being
 * stopped, and the organisers can still edit in the repository.
 */
function withinPromptFailureLimit(props, record) {
  const today = new Date().toISOString().slice(0, 10);
  if (props.getProperty('PROMPT_FAIL_DAY') !== today) {
    props.setProperty('PROMPT_FAIL_DAY', today);
    props.setProperty('PROMPT_FAIL_COUNT', '0');
  }
  const count = Number(props.getProperty('PROMPT_FAIL_COUNT') || 0);
  if (record) props.setProperty('PROMPT_FAIL_COUNT', String(count + 1));
  return count < DAILY_PROMPT_FAILURES;
}
