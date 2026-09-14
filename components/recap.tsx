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
    'This summary is not valid JSON of the expected shape — check the text and try again.',
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

function jsonOfRecap(recap: DayRecapShape): string {
  const { day, ...rest } = recap;
  void day;
  return JSON.stringify(rest, null, 2);
}

/**
 * The organiser's editor. A JSON textarea rather than a form per line: the
 * draft comes out of NotebookLM shaped like `data/recaps.ts`, and on the
 * evening of a long day a paste-adjust-save beats re-typing thirty lines.
 * The ids (`d2-r4`) are the contract the flag button depends on, so the
 * editor says so in its own label.
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
  const initial = stored?.recap ?? {
    day: day.index,
    published: '',
    sections: [],
  };
  const [draft, setDraft] = useState(jsonOfRecap(initial));
  const [password, setPassword] = useState(storedPassword);
  const [status, setStatus] = useState<SaveStatus | 'sending' | null>(null);
  const sending = status === 'sending';

  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setStatus('sending');

    let recap: DayRecapShape | null = null;
    try {
      const parsed = JSON.parse(draft);
      if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.sections)) {
        throw new Error('shape');
      }
      recap = { ...parsed, day: day.index };
    } catch {
      setStatus('invalid');
      return;
    }

    const result = await saveRecap(
      day.index,
      recap,
      password,
      stored?.updated ?? '',
    );
    setStatus(result.status);
    if (result.status === 'saved') {
      rememberPassword(password);
      mergeRecap(day.index, result.recap ?? null);
      onDone(result.recap ?? null);
    } else if (result.status === 'conflict' && result.recap) {
      mergeRecap(day.index, result.recap);
      onDone(result.recap);
      setDraft(jsonOfRecap(result.recap.recap));
    }
  }

  return (
    <form className="recap-form recap-edit-form" onSubmit={save} aria-busy={sending}>
      <label htmlFor={`recap-edit-${day.index}`}>
        Day {day.index} summary — JSON (sections, items with ids{' '}
        <code>d{day.index}-r1, d{day.index}-r2…</code>, never reuse a number)
      </label>
      <textarea
        id={`recap-edit-${day.index}`}
        className="recap-edit-json"
        rows={22}
        spellCheck={false}
        readOnly={sending}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
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
              const result = await saveRecap(
                day.index,
                null,
                password,
                stored.updated,
              );
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