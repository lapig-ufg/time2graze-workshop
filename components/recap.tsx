'use client';

import { CheckCircle2, CircleAlert, Flag, LoaderCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { RECAP_FEEDBACK_CLOSES, RECAPS } from '@/data/recaps';
import type { Day, RecapItem, RecapSection } from '@/data/types';
import { rememberFlagged, useFlagged } from '@/hooks/use-flagged-lines';
import type { Clock } from '@/lib/now';
import {
  formatRecapStamp,
  sectionAnchor,
  sectionHeading,
} from '@/lib/recap';
import { parseRecapText, idAssigner } from '@/lib/recap-text';
import { sessionTitle } from '@/lib/schedule';
import {
  flagRecapItem,
  NAME_MAX,
  NOTE_MAX,
  recapFeedbackEnabled,
  type FlagStatus,
} from '@/lib/recap-feedback';
import {
  loadRecaps,
  recapLiveEnabled,
  saveRecap,
  type DayRecapShape,
  type RecapsState,
  type SaveStatus,
  type StoredRecap,
} from '@/lib/recap-live';

const MESSAGES: Record<FlagStatus | 'sending', string> = {
  sending: 'Sending…',
  received:
    'Thank you. This is with the organisers, and the summary is corrected from it.',
  invalid: 'Say what is wrong with this line before sending.',
  limit: 'Corrections have reached today’s limit. Tell an organiser directly.',
  closed: 'Corrections have closed for this workshop.',
  timeout: 'That took too long. Check your connection and try again.',
  error: 'That did not send. Try again, or tell an organiser directly.',
};

/**
 * One request per page, shared by every reader and every day: switching tabs
 * remounts the recap block, and should not fetch the same five recaps again
 * each time. `NowNext` reads the same cache through `liveRecapForDay`.
 */
let shared: Promise<RecapsState | null> | null = null;
export function recaps() {
  shared ??= recapLiveEnabled ? loadRecaps() : Promise.resolve(null);
  return shared;
}

/** Applies a successful save to the shared cache, without refetching. */
function mergeRecap(day: number, stored: StoredRecap | null) {
  if (!shared) return;
  void shared.then((state) => {
    if (!state) return;
    const recaps = { ...state.recaps };
    if (stored) recaps[day] = stored;
    else delete recaps[day];
    shared = Promise.resolve({ ...state, recaps });
  });
}

/** The live recap for a day, for readers outside this block (NowNext). */
export function useLiveRecap(dayIndex: number): StoredRecap | null {
  const [state, setState] = useState<RecapsState | null>(null);
  useEffect(() => {
    let live = true;
    void recaps().then((result) => {
      if (live) setState(result);
    });
    return () => {
      live = false;
    };
  }, []);
  return state?.recaps[dayIndex] ?? null;
}

const EDIT_MESSAGES: Record<SaveStatus | 'sending', string> = {
  sending: 'Publishing…',
  saved: 'Published. Everyone opening this page now sees this version.',
  conflict:
    'Someone else saved this summary while you were editing. Their version is loaded below; copy your changes into it and save again.',
  denied: 'Wrong password.',
  invalid:
    'Nothing to publish yet — choose a session and write at least one line, or paste the NotebookLM draft.',
  limit: 'Too many wrong passwords today. Editing is locked until tomorrow.',
  closed: 'Editing has closed for this workshop.',
  unconfigured: 'Editing is not switched on yet.',
  error: 'That did not publish. Check your connection and try again.',
};

const EDIT_PASSWORD_KEY = 't2g-recap-password';

/**
 * The password from the last successful save this session, offered back when
 * the editor opens again: an organiser on hotel wi-fi types it once.
 */
function storedPassword(): string {
  try {
    return sessionStorage.getItem(EDIT_PASSWORD_KEY) ?? '';
  } catch {
    return '';
  }
}

function rememberPassword(value: string) {
  try {
    sessionStorage.setItem(EDIT_PASSWORD_KEY, value);
  } catch {
    /* A browser that refuses storage asks again next time. */
  }
}

/** One line of the recap, and the way to say it is wrong. */
function Item({ item, canFlag }: { item: RecapItem; canFlag: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<FlagStatus | 'sending' | null>(null);
  const sent = useFlagged(item.id);
  const sending = state === 'sending';

  const textId = `recap-${item.id}`;
  const formId = `recap-form-${item.id}`;

  async function send(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || sent) return;
    setState('sending');
    const status = await flagRecapItem(item.id, note, name);
    setState(status);
    if (status === 'received') rememberFlagged(item.id);
  }

  /* The button says only "Flag": the line it sits on is what gives it meaning,
     so that line describes it rather than being repeated into a label a
     screen reader would then read out twice. */
  return (
    <div className="recap-item" data-flagged={sent || undefined}>
      <p className="recap-text" id={textId}>
        {item.owner && <b className="recap-owner">{item.owner}</b>}
        {item.text}
      </p>

      {canFlag && (
        <button
          type="button"
          className="recap-flag"
          aria-expanded={open}
          aria-controls={open ? formId : undefined}
          aria-describedby={textId}
          onClick={() => setOpen((was) => !was)}
        >
          <Flag aria-hidden="true" />
          {sent ? 'Flagged' : open ? 'Close' : 'Flag'}
        </button>
      )}

      {open && (
        <form
          className="recap-form"
          id={formId}
          onSubmit={send}
          aria-busy={sending}
        >
          <label htmlFor={`${formId}-note`}>What is wrong or missing?</label>
          <textarea
            id={`${formId}-note`}
            required
            rows={3}
            maxLength={NOTE_MAX}
            readOnly={sending || sent}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <label htmlFor={`${formId}-name`}>Your name (optional)</label>
          <input
            id={`${formId}-name`}
            type="text"
            maxLength={NAME_MAX}
            autoComplete="name"
            readOnly={sending || sent}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="recap-form-actions">
            <button type="submit" disabled={sending || sent}>
              {sending && (
                <LoaderCircle className="calendar-spinner" aria-hidden="true" />
              )}
              {sending ? 'Sending…' : sent ? 'Sent' : 'Send correction'}
            </button>
            <button type="button" onClick={() => setOpen(false)}>
              {sent ? 'Close' : 'Cancel'}
            </button>
          </div>
          <output
            className="recap-form-status"
            data-state={
              state === 'received'
                ? 'success'
                : state && !sending
                  ? 'error'
                  : undefined
            }
            aria-live="polite"
            aria-atomic="true"
          >
            {state && (
              <>
                {state === 'received' ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : sending ? (
                  <LoaderCircle className="calendar-spinner" aria-hidden="true" />
                ) : (
                  <CircleAlert aria-hidden="true" />
                )}
                <span>{MESSAGES[state]}</span>
              </>
            )}
          </output>
        </form>
      )}
    </div>
  );
}

function ItemList({
  label,
  items,
  canFlag,
}: {
  label: string;
  items?: RecapItem[];
  canFlag: boolean;
}) {
  if (!items?.length) return null;
  return (
    <div className="recap-list">
      <p className="recap-list-label">{label}</p>
      {items.map((item) => (
        <Item key={item.id} item={item} canFlag={canFlag} />
      ))}
    </div>
  );
}

function Section({
  section,
  canFlag,
}: {
  section: RecapSection;
  canFlag: boolean;
}) {
  const anchor = sectionAnchor(section);
  const heading = sectionHeading(section);

  return (
    <section className="recap-section">
      <h4>
        {anchor ? (
          <Link href={`/programme/#${anchor}`}>{heading}</Link>
        ) : (
          heading
        )}
      </h4>
      {section.summary && (
        <ItemList
          label="What happened"
          items={[section.summary]}
          canFlag={canFlag}
        />
      )}
      <ItemList label="Decisions" items={section.decisions} canFlag={canFlag} />
      <ItemList
        label="Open questions"
        items={section.questions}
        canFlag={canFlag}
      />
      <ItemList label="Actions" items={section.actions} canFlag={canFlag} />
    </section>
  );
}

/** One editable section: a session chosen from the day, or a titled block. */
type EditSection = {
  key: string;
  /** A session id from the day's agenda, or '' for a titled day-block. */
  sessionId: string;
  title: string;
  summary: string;
  decisions: { key: string; text: string }[];
  questions: { key: string; text: string }[];
  actions: { key: string; owner: string; text: string }[];
};

let sectionKey = 0;
const nextKey = () => `s${++sectionKey}`;
let lineKey = 0;
const nextLineKey = () => `l${++lineKey}`;

const emptySection = (): EditSection => ({
  key: nextKey(),
  sessionId: '',
  title: '',
  summary: '',
  decisions: [],
  questions: [],
  actions: [],
});

function sectionsOfRecap(recap: DayRecapShape | null): EditSection[] {
  if (!recap?.sections.length) return [emptySection()];
  return recap.sections.map((section) => ({
    key: nextKey(),
    sessionId: section.sessionId ?? '',
    title: section.title ?? '',
    summary: section.summary?.text ?? '',
    decisions: (section.decisions ?? []).map((i) => ({ key: nextLineKey(), text: i.text })),
    questions: (section.questions ?? []).map((i) => ({ key: nextLineKey(), text: i.text })),
    actions: (section.actions ?? []).map((i) => ({
      key: nextLineKey(),
      owner: i.owner ?? '',
      text: i.text,
    })),
  }));
}

/**
 * The organiser's editor: a form, not a markup language.
 *
 * Each session is a card; the session is chosen from the day's programme by
 * title (never typed as an id), the four fields are plain text areas with
 * add/remove, and the item ids — the contract the flag buttons depend on —
 * are assigned invisibly at save time. The corrected NotebookLM draft can
 * still be pasted in one box to fill the whole form, because the room
 * corrects prose; and JSON stays as the last resort for surgical fixes.
 */
function RecapEditor({
  day,
  stored,
  onDone,
}: {
  day: Day;
  stored: StoredRecap | null;
  onDone: (stored: StoredRecap | null) => void;
}) {
  const [sections, setSections] = useState<EditSection[]>(() =>
    sectionsOfRecap(stored?.recap ?? null),
  );
  const [password, setPassword] = useState(storedPassword);
  const [status, setStatus] = useState<SaveStatus | 'sending' | null>(null);
  const [corrections, setCorrections] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const sending = status === 'sending';

  // The day's technical and field sessions, in programme order, as the picker.
  const daySessions = day.sessions.filter(
    (s) => s.kind === 'technical' || s.kind === 'field',
  );

  function update(index: number, patch: Partial<EditSection>) {
    setSections((list) =>
      list.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  }

  function moveSection(index: number, by: -1 | 1) {
    setSections((list) => {
      const next = [...list];
      const target = index + by;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /** Builds the recap, assigning every id at the last moment. */
  function buildRecap(): DayRecapShape | null {
    const idFor = idAssigner(day.index, stored?.recap);
    const built: RecapSection[] = [];
    for (const section of sections) {
      if (!section.sessionId && !section.title.trim()) continue;
      const decisions = section.decisions.filter((d) => d.text.trim());
      const questions = section.questions.filter((q) => q.text.trim());
      const actions = section.actions.filter((a) => a.text.trim());
      if (!section.summary.trim() && !decisions.length && !questions.length && !actions.length) {
        continue;
      }
      const clean: RecapSection = section.sessionId
        ? { sessionId: section.sessionId }
        : { title: section.title.trim() };
      if (section.summary.trim())
        clean.summary = { id: idFor(section.summary.trim()), text: section.summary.trim() };
      if (decisions.length)
        clean.decisions = decisions.map((d) => ({ id: idFor(d.text.trim()), text: d.text.trim() }));
      if (questions.length)
        clean.questions = questions.map((q) => ({ id: idFor(q.text.trim()), text: q.text.trim() }));
      if (actions.length)
        clean.actions = actions.map((a) => {
          const item: RecapItem = { id: idFor(a.text.trim()), text: a.text.trim() };
          if (a.owner.trim()) item.owner = a.owner.trim();
          return item;
        });
      built.push(clean);
    }
    if (built.length === 0) return null;
    return { day: day.index, published: '', sections: built };
  }

  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const recap = buildRecap();
    if (!recap) {
      setStatus('invalid');
      return;
    }
    setStatus('sending');
    if (corrections.trim() && !Number.isNaN(Number(corrections))) {
      recap.corrections = Math.max(0, Math.min(999, Number(corrections)));
    }
    const result = await saveRecap(day.index, recap, password, stored?.updated ?? '');
    setStatus(result.status);
    if (result.status === 'saved') {
      rememberPassword(password);
      mergeRecap(day.index, result.recap ?? null);
      onDone(result.recap ?? null);
    } else if (result.status === 'conflict' && result.recap) {
      mergeRecap(day.index, result.recap);
      setSections(sectionsOfRecap(result.recap.recap));
    }
  }

  function applyImport() {
    const parsed = parseRecapText(day.index, importText, stored?.recap);
    if (!parsed.ok) {
      setImportError(parsed.error);
      return;
    }
    setImportError(null);
    setSections(sectionsOfRecap({ ...parsed.recap, day: day.index }));
    setImportOpen(false);
    setImportText('');
  }

  const itemCount = sections.reduce(
    (count, s) =>
      count +
      (s.summary.trim() ? 1 : 0) +
      s.decisions.filter((d) => d.text.trim()).length +
      s.questions.filter((q) => q.text.trim()).length +
      s.actions.filter((a) => a.text.trim()).length,
    0,
  );

  return (
    <form className="recap-form recap-edit-form" onSubmit={save} aria-busy={sending}>
      <div className="recap-edit-toolbar">
        <button type="button" className="recap-edit-mode" onClick={() => setImportOpen(!importOpen)}>
          {importOpen ? 'Close the paste box' : 'Paste the NotebookLM draft'}
        </button>
        <button type="button" className="recap-edit-mode" onClick={() => setJsonOpen(!jsonOpen)}>
          {jsonOpen ? 'Close JSON' : 'JSON'}
        </button>
        <output className="recap-edit-count">
          {sections.length} {sections.length === 1 ? 'section' : 'sections'} · {itemCount}{' '}
          {itemCount === 1 ? 'line' : 'lines'}
        </output>
      </div>

      {importOpen && (
        <div className="recap-edit-import">
          <label htmlFor={`recap-import-${day.index}`}>
            Paste the draft here and it fills the form below — one box per
            session, each line in its field.
          </label>
          <textarea
            id={`recap-import-${day.index}`}
            rows={10}
            spellCheck
            readOnly={sending}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
          {importError && <p className="recap-edit-warn">{importError}</p>}
          <div className="recap-form-actions">
            <button type="button" onClick={applyImport} disabled={sending || !importText.trim()}>
              Fill the form
            </button>
            <button type="button" onClick={() => setImportOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {jsonOpen && (
        <div className="recap-edit-import">
          <label htmlFor={`recap-json-${day.index}`}>
            The stored summary as JSON, for surgical fixes. This replaces the
            whole form.
          </label>
          <textarea
            id={`recap-json-${day.index}`}
            className="recap-edit-json"
            rows={14}
            spellCheck={false}
            readOnly={sending}
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            placeholder="Paste the JSON here…"
          />
          {jsonError && <p className="recap-edit-warn">{jsonError}</p>}
          <div className="recap-form-actions">
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                const current = buildRecap();
                setJsonText(current ? JSON.stringify({ sections: current.sections }, null, 2) : '');
              }}
            >
              Load the form as JSON
            </button>
            <button
              type="button"
              disabled={sending || !jsonText.trim()}
              onClick={() => {
                try {
                  const object = JSON.parse(jsonText);
                  if (typeof object !== 'object' || object === null || !Array.isArray(object.sections)) {
                    throw new Error('shape');
                  }
                  setSections(sectionsOfRecap({ day: day.index, published: '', sections: object.sections }));
                  setJsonError(null);
                  setJsonOpen(false);
                } catch {
                  setJsonError('That is not the expected JSON — it needs a "sections" list.');
                }
              }}
            >
              Apply to the form
            </button>
            <button type="button" onClick={() => setJsonOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {sections.map((section, index) => (
        <fieldset className="recap-edit-section" key={section.key}>
          <legend>Session {index + 1}</legend>
          <div className="recap-edit-section-head">
            <label htmlFor={`recap-session-${section.key}`}>Which session is this?</label>
            <select
              id={`recap-session-${section.key}`}
              value={section.sessionId || (section.title ? '__day' : '')}
              disabled={sending}
              onChange={(event) => {
                const value = event.target.value;
                update(index, value === '__day' ? { sessionId: '' } : { sessionId: value });
              }}
            >
              <option value="">Choose a session…</option>
              {daySessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {sessionTitle(session)}
                </option>
              ))}
              <option value="__day">Not one session — a block about the day</option>
            </select>
            {!section.sessionId && (
              <>
                <label htmlFor={`recap-title-${section.key}`}>Block title</label>
                <input
                  id={`recap-title-${section.key}`}
                  type="text"
                  placeholder="Across the day"
                  readOnly={sending}
                  value={section.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                />
              </>
            )}
            <div className="recap-edit-section-tools">
              <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0 || sending} aria-label="Move this section up">
                ↑
              </button>
              <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1 || sending} aria-label="Move this section down">
                ↓
              </button>
              <button
                type="button"
                disabled={sending || sections.length === 1}
                aria-label="Remove this section"
                onClick={() => setSections((list) => list.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          </div>

          <label htmlFor={`recap-summary-${section.key}`}>What happened</label>
          <textarea
            id={`recap-summary-${section.key}`}
            rows={3}
            readOnly={sending}
            value={section.summary}
            onChange={(event) => update(index, { summary: event.target.value })}
          />

          <p className="recap-edit-field-label">Decisions</p>
          {section.decisions.map((line, lineIndex) => (
            <div className="recap-edit-line" key={line.key}>
              <textarea
                rows={2}
                readOnly={sending}
                value={line.text}
                aria-label={`Decision ${lineIndex + 1}`}
                onChange={(event) =>
                  update(index, {
                    decisions: section.decisions.map((d, i) =>
                      i === lineIndex ? { ...d, text: event.target.value } : d,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Remove decision ${lineIndex + 1}`}
                disabled={sending}
                onClick={() =>
                  update(index, {
                    decisions: section.decisions.filter((_, i) => i !== lineIndex),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="recap-edit-add"
            disabled={sending}
            onClick={() => update(index, { decisions: [...section.decisions, { key: nextLineKey(), text: '' }] })}
          >
            + Add a decision
          </button>

          <p className="recap-edit-field-label">Open questions</p>
          {section.questions.map((line, lineIndex) => (
            <div className="recap-edit-line" key={line.key}>
              <textarea
                rows={2}
                readOnly={sending}
                value={line.text}
                aria-label={`Open question ${lineIndex + 1}`}
                onChange={(event) =>
                  update(index, {
                    questions: section.questions.map((q, i) =>
                      i === lineIndex ? { ...q, text: event.target.value } : q,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Remove open question ${lineIndex + 1}`}
                disabled={sending}
                onClick={() =>
                  update(index, {
                    questions: section.questions.filter((_, i) => i !== lineIndex),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="recap-edit-add"
            disabled={sending}
            onClick={() => update(index, { questions: [...section.questions, { key: nextLineKey(), text: '' }] })}
          >
            + Add an open question
          </button>

          <p className="recap-edit-field-label">Actions</p>
          {section.actions.map((line, lineIndex) => (
            <div className="recap-edit-line recap-edit-action" key={line.key}>
              <input
                type="text"
                placeholder="Owner (e.g. LAPIG)"
                readOnly={sending}
                value={line.owner}
                aria-label={`Owner of action ${lineIndex + 1}`}
                onChange={(event) =>
                  update(index, {
                    actions: section.actions.map((a, i) =>
                      i === lineIndex ? { ...a, owner: event.target.value } : a,
                    ),
                  })
                }
              />
              <textarea
                rows={2}
                placeholder="What they will do"
                readOnly={sending}
                value={line.text}
                aria-label={`Action ${lineIndex + 1}`}
                onChange={(event) =>
                  update(index, {
                    actions: section.actions.map((a, i) =>
                      i === lineIndex ? { ...a, text: event.target.value } : a,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Remove action ${lineIndex + 1}`}
                disabled={sending}
                onClick={() =>
                  update(index, {
                    actions: section.actions.filter((_, i) => i !== lineIndex),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="recap-edit-add"
            disabled={sending}
            onClick={() =>
              update(index, {
                actions: [...section.actions, { key: nextLineKey(), owner: '', text: '' }],
              })
            }
          >
            + Add an action
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        className="recap-edit-add recap-edit-add-section"
        disabled={sending}
        onClick={() => setSections((list) => [...list, emptySection()])}
      >
        + Add a session
      </button>

      <div className="recap-edit-grid">
        {stored && (
          <>
            <label htmlFor={`recap-edit-corrections-${day.index}`}>
              Reader corrections applied (optional)
            </label>
            <input
              id={`recap-edit-corrections-${day.index}`}
              type="number"
              min={0}
              max={999}
              placeholder="3"
              readOnly={sending}
              value={corrections}
              onChange={(event) => setCorrections(event.target.value)}
            />
          </>
        )}
        <label htmlFor={`recap-edit-password-${day.index}`}>Edit password</label>
        <input
          id={`recap-edit-password-${day.index}`}
          type="password"
          required
          autoComplete="current-password"
          readOnly={sending}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="recap-form-actions">
        <button type="submit" disabled={sending}>
          {sending && <LoaderCircle className="calendar-spinner" aria-hidden="true" />}
          {sending ? 'Publishing…' : 'Publish'}
        </button>
        <button type="button" onClick={() => onDone(stored)}>
          Cancel
        </button>
        {stored && (
          <button
            type="button"
            disabled={sending}
            onClick={async () => {
              if (sending) return;
              setStatus('sending');
              const result = await saveRecap(day.index, null, password, stored.updated);
              setStatus(result.status);
              if (result.status === 'saved') {
                rememberPassword(password);
                mergeRecap(day.index, null);
                onDone(null);
              }
            }}
          >
            Unpublish
          </button>
        )}
      </div>
      <output
        className="recap-form-status"
        data-state={
          status === 'saved'
            ? 'success'
            : status && !sending
              ? 'error'
              : undefined
        }
        aria-live="polite"
        aria-atomic="true"
      >
        {status && !sending && (
          <>
            {status === 'saved' ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <CircleAlert aria-hidden="true" />
            )}
            <span>{EDIT_MESSAGES[status]}</span>
          </>
        )}
      </output>
    </form>
  );
}

/**
 * The day's record, published the same evening and corrected afterwards from
 * what readers flag.
 *
 * The recap a reader sees is the live copy when one exists, and the
 * repository fallback when it does not — so a day with nothing published
 * still says "to be published", and the site never invents a summary for a
 * day it has not been given one for. Organisers publish and revise the live
 * copy from here, behind the edit password.
 */
export function DayRecap({ day, clock }: { day: Day; clock: Clock | null }) {
  const [live, setLive] = useState<RecapsState | null | 'loading'>(
    recapLiveEnabled ? 'loading' : null,
  );
  const [editing, setEditing] = useState(false);
  const [stored, setStored] = useState<StoredRecap | null>(null);

  useEffect(() => {
    if (!recapLiveEnabled) return;
    let active = true;
    void recaps().then((result) => {
      if (!active) return;
      setLive(result);
      setStored(result?.recaps[day.index] ?? null);
    });
    return () => {
      active = false;
    };
  }, [day.index]);

  const fallback = RECAPS[day.index] ?? null;
  const recap = stored?.recap ?? fallback;
  const canFlag =
    recapFeedbackEnabled &&
    recap !== null &&
    (clock === null || clock.date <= RECAP_FEEDBACK_CLOSES);
  const editable = Boolean(live !== 'loading' && live !== null && live.editable);
  const stampLine =
    live === 'loading'
      ? 'Checking for today’s summary…'
      : recap
        ? stored
          ? `${stored.recap.published !== stored.recap.revised ? 'Revised' : 'Published'} ${formatRecapStamp(stored.recap.revised ?? stored.recap.published)}`
          : `Published ${formatRecapStamp(recap.published)}`
        : 'To be published';

  return (
    <section className="recap" aria-labelledby={`recap-day-${day.index}`}>
      <div className="recap-head">
        <h3 id={`recap-day-${day.index}`}>Day {day.index} summary</h3>
        <p className="recap-stamp">
          {recap ? <span>{stampLine}</span> : <em>{stampLine}</em>}
        </p>
        {editable && (
          <button
            type="button"
            className="recap-edit-toggle"
            onClick={() => {
              setEditing((was) => !was);
            }}
          >
            <Pencil aria-hidden="true" />
            {editing ? 'Close editor' : stored ? 'Edit' : 'Publish'}
          </button>
        )}
      </div>

      {editing && (
        <RecapEditor
          day={day}
          stored={stored}
          onDone={(next) => {
            setStored(next);
            setEditing(false);
          }}
        />
      )}

      {recap ? (
        <>
          {canFlag && (
            <p className="recap-invite">
              Something wrong or missing? Flag the line and say why. The summary
              is corrected from what you send.
            </p>
          )}
          <div className="recap-sections">
            {recap.sections.map((section, index) => (
              <Section
                key={section.sessionId ?? `${day.index}-${index}`}
                section={section}
                canFlag={canFlag}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="recap-pending">
          Written up in the evening, from the day&rsquo;s notes and recordings.
        </p>
      )}
    </section>
  );
}