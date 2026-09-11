'use client';

import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import type { Day, Session } from '@/data/types';
import { rememberChoice, useChoices } from '@/hooks/use-track-choice';
import type { Clock } from '@/lib/now';
import { presenterLabel, timeLabel } from '@/lib/schedule';
import { choosingOpen, splitAnchor, splitSessions } from '@/lib/split-sessions';
import {
  CHOICE_NAME_MAX,
  chooseTrack,
  type ChoiceStatus,
} from '@/lib/track-choice';

const MESSAGES: Record<ChoiceStatus | 'sending', string> = {
  sending: 'Sending…',
  recorded: 'Recorded with the organisers.',
  changed: 'Changed. The organisers hold this one instead.',
  invalid: 'Pick one activity and give the name you registered under.',
  limit: 'Choices have reached today’s limit. Tell an organiser directly.',
  closed: 'Choosing has closed for this workshop.',
  timeout: 'That took too long. Check your connection and try again.',
  error: 'That did not send. Try again, or tell an organiser directly.',
};

/**
 * The day's split sessions that still have something to say: one still open to
 * an answer, or one this browser has already answered. A session that is
 * neither — it started, or choosing closed, and nothing was picked — is past
 * asking about, and a day left with none says nothing at all.
 */
function answerable(day: Day, clock: Clock | null, picks: Record<string, string>) {
  return splitSessions(day)
    .map((session) => ({ session, editable: choosingOpen(session, clock) }))
    .filter(({ session, editable }) => editable || picks[session.id]);
}

/**
 * One split session, and the answer to it. A choice already sent is shown as
 * a statement rather than a form: the common case is a reader coming back to
 * check what they picked, not to change it.
 */
function SessionChoice({
  session,
  sent,
  remembered,
  editable,
}: {
  session: Session;
  /** The track id already recorded from this browser, if any. */
  sent: string | undefined;
  /** The name the last choice went out under. */
  remembered: string;
  editable: boolean;
}) {
  /* Null until this reader touches the control, so the stored answer — which
     exists only after hydration — is what the fields show until then. */
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ChoiceStatus | 'sending' | null>(null);

  const tracks = session.tracks ?? [];
  const selected = picked ?? sent ?? '';
  const name = typed ?? remembered;
  const sending = state === 'sending';
  const chosen = tracks.find((t) => t.id === sent);

  async function send(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setState('sending');
    const status = await chooseTrack(session.id, selected, name);
    setState(status);
    if (status === 'recorded' || status === 'changed') {
      rememberChoice(session.id, selected, name);
      setEditing(false);
    }
  }

  const formId = `split-form-${session.id}`;

  return (
    <div className="split-session" data-answered={chosen ? '' : undefined}>
      <p className="split-when">
        <span className="tl-meta-label">Split session</span>
        <span>{timeLabel(session)}</span>
      </p>

      {chosen && !editing ? (
        <div className="split-answer">
          <p className="split-answer-title">
            <CheckCircle2 aria-hidden="true" />
            <span>
              You are down for <strong>{chosen.title}</strong>
            </span>
          </p>
          {editable && (
            <button type="button" onClick={() => setEditing(true)}>
              Change
            </button>
          )}
        </div>
      ) : (
        <form className="split-form" id={formId} onSubmit={send} aria-busy={sending}>
          <fieldset>
            <legend>Which one will you join?</legend>
            {tracks.map((track) => {
              const presenter = presenterLabel(track);
              return (
                /* The abstract sits outside the label, and folded: a label is
                   the control's *name*, and a hundred and thirty words of it
                   is not a name anyone can listen to twice — and two of them
                   open put the form's own controls a screen and a half below
                   the question. The programme list above carries both in full
                   on a phone; this is the same text at the moment of deciding,
                   a tap away. */
                <div className="split-choice-option" key={track.id}>
                  <label className="split-option">
                    <input
                      type="radio"
                      name={`split-${session.id}`}
                      value={track.id}
                      required
                      checked={selected === track.id}
                      disabled={sending}
                      onChange={() => {
                        setPicked(track.id);
                        setState(null);
                      }}
                    />
                    <span>
                      <strong>{track.title}</strong>
                      {presenter && <small>{presenter}</small>}
                    </span>
                  </label>
                  {track.description && (
                    <details className="split-option-detail">
                      {/* Two summaries reading alike are one row in a screen
                          reader's list of controls, so each names its own. */}
                      <summary>
                        What this covers
                        <span className="visually-hidden"> — {track.title}</span>
                      </summary>
                      <p>{track.description}</p>
                    </details>
                  )}
                </div>
              );
            })}
          </fieldset>

          <label className="split-name" htmlFor={`${formId}-name`}>
            Your name
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            required
            maxLength={CHOICE_NAME_MAX}
            autoComplete="name"
            readOnly={sending}
            value={name}
            onChange={(event) => {
              setTyped(event.target.value);
              setState(null);
            }}
            aria-invalid={state === 'invalid' || undefined}
          />

          <div className="split-actions">
            <button type="submit" disabled={sending}>
              {sending && <LoaderCircle className="calendar-spinner" aria-hidden="true" />}
              {sending ? 'Sending…' : chosen ? 'Save change' : 'Send choice'}
            </button>
            {chosen && (
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>

          <output
            className="split-status"
            data-state={
              state === 'recorded' || state === 'changed'
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
                {state === 'recorded' || state === 'changed' ? (
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

/**
 * The day's split sessions, and where a participant says which half they will
 * be in. Two activities run at the same hour and the rooms are sized from
 * these answers, so the name is required — a count alone does not tell an
 * organiser who has still not said.
 *
 * It sits outside `.agenda-panel` for the same reason the recap does: that
 * panel is a two-column grid, and a third child would land under the day
 * summary rather than beside it.
 */
export function SplitChoice({ day, clock }: { day: Day; clock: Clock | null }) {
  const { name, picks } = useChoices();
  const splits = answerable(day, clock, picks);

  if (splits.length === 0) return null;

  return (
    <section
      className="split-choice"
      id={splitAnchor(day)}
      aria-labelledby={`split-day-${day.index}-title`}
    >
      <div className="split-choice-head">
        <h3 id={`split-day-${day.index}-title`}>
          Day {day.index} ·{' '}
          {splits.length === 1 ? 'split session' : 'split sessions'}
        </h3>
        <p>
          Two activities run at the same hour. The rooms are sized from who says
          they are coming.
        </p>
      </div>
      {splits.map(({ session, editable }) => (
        <SessionChoice
          key={session.id}
          session={session}
          sent={picks[session.id]}
          remembered={name}
          editable={editable}
        />
      ))}
    </section>
  );
}

/**
 * The line that says a decision is waiting, above the programme rather than
 * under it.
 *
 * Without it the chooser was a block at the foot of the page that nothing
 * pointed at: a reader looking at the 10:00 slot had no reason to believe an
 * answer was expected of them, let alone that the page could take one. This
 * is the one interactive pointer — the grid cannot hold it, being aria-hidden,
 * and its accessible counterpart is clipped away on desktop — so it carries
 * the time, the state and the link, and it is the same link on every width.
 */
export function SplitNotice({ day, clock }: { day: Day; clock: Clock | null }) {
  const { picks } = useChoices();
  const splits = answerable(day, clock, picks);

  if (splits.length === 0) return null;

  return (
    <aside className="split-notice">
      {splits.map(({ session, editable }) => {
        const chosen = session.tracks?.find((t) => t.id === picks[session.id]);
        return (
          <p key={session.id}>
            <span className="split-notice-when">
              Split session · {timeLabel(session)}
            </span>
            <span className="split-notice-state">
              {chosen ? (
                <>
                  You are in <strong>{chosen.title}</strong>.
                </>
              ) : (
                'Two activities run at the same hour, and you have not said which one you will join.'
              )}
            </span>
            {editable && (
              /* Only an unanswered session pulses. A "Change" that beats at
                 someone who has already told us where they will be is a nag. */
              <a href={`#${splitAnchor(day)}`} data-todo={chosen ? undefined : ''}>
                {chosen ? 'Change' : 'Choose one'}
              </a>
            )}
          </p>
        );
      })}
    </aside>
  );
}
