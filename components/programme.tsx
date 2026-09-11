'use client';

import { Clock3 } from 'lucide-react';
import { AGENDA } from '@/data/agenda';
import type { Day, Session, Track } from '@/data/types';
import { useChoices } from '@/hooks/use-track-choice';
import { type Clock, nextSessionId, stateOf } from '@/lib/now';
import { choosingOpen, splitAnchor } from '@/lib/split-sessions';
import {
  axisBounds, axisTicks, dayLabel, durationOf, fromMinutes, isEvening,
  presenterLabel, timeLabel, toMinutes,
} from '@/lib/schedule';

type SessionMark = 'running' | 'next' | null;

/** "Now" while a session is running, "Next" for the one due after it. */
function Mark({ state }: { state: SessionMark }) {
  if (!state) return null;
  return (
    <span className={state === 'next' ? 'tl-mark tl-mark--next' : 'tl-mark'}>
      {state === 'next' ? 'Next' : 'Now'}
    </span>
  );
}

/** Minutes offset from the top of the axis, as a CSS custom property. */
function offset(session: Session, from: number) {
  return { '--start': toMinutes(session.start) - from } as React.CSSProperties;
}

/**
 * Where a block sits across the width of the axis.
 *
 * Most days are a single chain and every block takes the whole rail: `--col`
 * 0 of `--cols` 1. Two items that genuinely run at the same time are not a
 * split session — nobody chooses between them — so they cannot be tracks, and
 * drawn in one column they would be stacked on top of each other. Day 1 has
 * the case: the welcome coffee occupies the last twenty minutes of the UFG
 * tour. Overlapping items share the width for the length of the run they
 * belong to, which is how a week of calendars has always drawn them.
 */
type Lane = { col: number; cols: number };

function lanes(sessions: Session[]) {
  const placed = new Map<string, Lane>();
  const ordered = [...sessions].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start),
  );

  /* A run is a set of items chained by overlap: it stays open while the next
     item starts before the latest end reached so far, and every member of it
     is drawn at the same width, so the columns line up down the whole run. */
  let run: Session[] = [];
  let columnEnds: number[] = [];
  let runEnd = -1;

  const close = () => {
    for (const session of run) {
      placed.set(session.id, { ...placed.get(session.id)!, cols: columnEnds.length });
    }
    run = [];
    columnEnds = [];
    runEnd = -1;
  };

  for (const session of ordered) {
    const start = toMinutes(session.start);
    const end = start + (durationOf(session) ?? 0);
    if (run.length && start >= runEnd) close();

    let col = columnEnds.findIndex((free) => free <= start);
    if (col === -1) col = columnEnds.length;
    columnEnds[col] = end;

    placed.set(session.id, { col, cols: 1 });
    run.push(session);
    runEnd = Math.max(runEnd, end);
  }
  if (run.length) close();

  return placed;
}

function span(session: Session, from: number, lane: Lane | undefined) {
  return {
    '--start': toMinutes(session.start) - from,
    '--dur': durationOf(session) ?? 0,
    '--col': lane?.col ?? 0,
    '--cols': lane?.cols ?? 1,
  } as React.CSSProperties;
}

function PresenterLine(
  { item, compact = false }: { item: Session | Track; compact?: boolean },
) {
  const presenter = presenterLabel(item);
  if (!presenter) return null;

  return (
    <p className="tl-who">
      <span className="tl-meta-label">{compact ? 'By' : 'Presenter / institution'}</span>
      <span>{presenter}</span>
    </p>
  );
}

/**
 * "This hour is still waiting on you", on the session itself.
 *
 * A link, because a green chip that says `Choose one` and does nothing when
 * tapped is a broken promise. `silent` is the copy inside the proportional
 * grid: that diagram is `aria-hidden`, so the chip in it is for the mouse and
 * is kept out of the tab order — a focus stop nobody can see is worse than no
 * focus stop. The list's copy is a real link, and the desktop rule in
 * globals.css drops it there, where that list is clipped away and `SplitNotice`
 * is carrying the same link in plain view.
 */
function ChooseChip({ href, silent }: { href?: string; silent?: boolean }) {
  if (!href) return <span className="split-todo">Choose one</span>;
  return (
    <a className="split-todo" href={href} tabIndex={silent ? -1 : undefined}>
      Choose one
    </a>
  );
}

/**
 * One activity inside a split session. `chosen` is this browser's own answer
 * to it — the site never shows anyone else's, and never a count.
 */
function TrackCard({ track, chosen }: { track: Track; chosen: boolean }) {
  return (
    <div className="tl-track" data-chosen={chosen || undefined}>
      <p className="tl-track-title">{track.title}</p>
      <PresenterLine item={track} />
      {chosen && <p className="split-mark">Your choice</p>}
    </div>
  );
}

/**
 * A session with a display interval, drawn to scale. Provisional ends are
 * visibly marked and do not count as confirmed operational times.
 */
function Block(
  { session, from, lane, state, clock, splitHref }: {
    session: Session;
    from: number;
    /** Which column of a run of overlapping items this one takes. */
    lane: Lane | undefined;
    state: SessionMark;
    clock: Clock | null;
    /** Where the chooser for this day lives. */
    splitHref: string;
  },
) {
  /* Under 45 minutes there is no room to stack time, title and metadata, so the
     block lays them out on one row instead of clipping them. */
  const compact = (durationOf(session) ?? 0) <= 45;
  const { picks } = useChoices();
  const undecided = !picks[session.id] && choosingOpen(session, clock);

  return (
    <article
      className="tl-block"
      data-session={session.id}
      data-kind={session.kind}
      data-compact={compact || undefined}
      data-state={state ?? undefined}
      style={span(session, from, lane)}
    >
      <p className="tl-time">{timeLabel(session)}</p>

      <div className="tl-block-body">
        {session.tracks ? (
          <>
            <p className="tl-split-label">
              Split session
              {undecided && <ChooseChip href={splitHref} silent />}
              <Mark state={state} />
            </p>
            <div className="tl-tracks">
              {session.tracks.map((t) => (
                <TrackCard key={t.id} track={t} chosen={picks[session.id] === t.id} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="tl-title">
              {session.title}
              <Mark state={state} />
            </h3>
            <PresenterLine item={session} compact={compact} />
          </>
        )}

        <p className="tl-block-meta">
          {session.venueNote && (
            <span className="tl-note">
              <span className="tl-meta-label">Note</span>
              <span>{session.venueNote}</span>
            </span>
          )}
          {session.status === 'tbd' && <em className="tl-tbd">To be confirmed</em>}
          {session.endStatus === 'provisional' && <em className="tl-estimated">End time to confirm</em>}
        </p>
      </div>
    </article>
  );
}

/**
 * A session with a start and no recorded end. Drawn as a mark on the axis and
 * given no height, so the page never implies a duration nobody has set.
 */
function Point(
  { session, from, state }: { session: Session; from: number; state: SessionMark },
) {
  const presenter = presenterLabel(session);

  return (
    <div
      className="tl-point"
      data-session={session.id}
      data-kind={session.kind}
      data-state={state ?? undefined}
      style={offset(session, from)}
    >
      <span className="tl-dot" aria-hidden="true" />
      <p className="tl-time">{session.start}</p>
      <div className="tl-point-copy">
        <p className="tl-point-title">
          {session.title}
          <Mark state={state} />
        </p>
        <p className="tl-point-meta">
          {presenter && (
            <span className="tl-who">
              <span className="tl-meta-label">Presenter / institution</span>
              <span>{presenter}</span>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** The proportional grid. Large screens only — see the list below. */
function Timeline({ day, clock }: { day: Day; clock: Clock | null }) {
  const { from, to } = axisBounds(day);
  const daytime = day.sessions.filter((s) => !isEvening(s));
  const columns = lanes(daytime.filter((s) => s.end));
  const ticks = axisTicks(day);
  const height = { '--span': to - from } as React.CSSProperties;
  const nextId = nextSessionId(day, clock);
  const mark = (s: Session): SessionMark =>
    stateOf(s, clock) ?? (s.id === nextId ? 'next' : null);

  // The now line only exists while the day is running and inside the axis.
  const isToday = clock !== null && clock.date === day.date;
  const onAxis = isToday && clock.minutes >= from && clock.minutes <= to;

  return (
    <div className="timeline" style={height} aria-hidden="true">
      <div className="tl-axis">
        {ticks.map((t) => (
          <span
            key={t.minutes}
            className="tl-tick"
            data-hour={t.onTheHour || undefined}
            style={{ '--start': t.minutes - from } as React.CSSProperties}
          >
            {t.onTheHour ? t.label : ''}
          </span>
        ))}
      </div>

      <div className="tl-body">
        {ticks.map((t) => (
          <i
            key={t.minutes}
            className="tl-rule"
            data-hour={t.onTheHour || undefined}
            style={{ '--start': t.minutes - from } as React.CSSProperties}
          />
        ))}
        {onAxis && (
          <div className="tl-now" style={{ '--start': clock.minutes - from } as React.CSSProperties}>
            <span className="tl-now-label">{fromMinutes(clock.minutes)}</span>
          </div>
        )}
        {daytime.map((s) =>
          s.end
            ? (
              <Block
                key={s.id}
                session={s}
                from={from}
                lane={columns.get(s.id)}
                state={mark(s)}
                clock={clock}
                splitHref={`#${splitAnchor(day)}`}
              />
            )
            : <Point key={s.id} session={s} from={from} state={mark(s)} />
        )}
      </div>
    </div>
  );
}

/**
 * The chronological list. It carries the same information without the
 * proportional axis, and is what small screens and print use — forcing the
 * diagram into 375px would turn the signature into an obstacle.
 */
function List(
  { sessions, anchors = true, marks, clock = null, splitHref }: {
    sessions: Session[];
    anchors?: boolean;
    marks?: (s: Session) => SessionMark;
    clock?: Clock | null;
    /** Absent on paper, where a link to a form is nothing to press. */
    splitHref?: string;
  },
) {
  const { picks } = useChoices();

  return (
    <ol className="session-list">
      {sessions.map((session) => {
        return (
          <li className="session" key={session.id} data-session={anchors ? session.id : undefined}>
            <p className="session-time">
              <Clock3 aria-hidden="true" />
              <span>{timeLabel(session)}</span>
            </p>

            <div className="session-body" data-state={marks?.(session) ?? undefined}>
              {session.tracks ? (
                <>
                  <p className="tl-split-label">
                    Split session
                    {!picks[session.id] && choosingOpen(session, clock) && (
                      <ChooseChip href={splitHref} />
                    )}
                  </p>
                  <ul className="session-tracks">
                    {session.tracks.map((t) => (
                      <li key={t.id} data-chosen={picks[session.id] === t.id || undefined}>
                        <strong>{t.title}</strong>
                        <PresenterLine item={t} />
                        {t.description && (
                          <p className="track-detail">{t.description}</p>
                        )}
                        {picks[session.id] === t.id && (
                          <em className="split-mark">Your choice</em>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h3>{session.title}</h3>
                  <PresenterLine item={session} />
                </>
              )}

              <p className="session-meta">
                {session.venueNote && (
                  <span className="tl-note">
                    <span className="tl-meta-label">Note</span>
                    <span>{session.venueNote}</span>
                  </span>
                )}
                {session.status === 'tbd' && <em className="tl-tbd">To be confirmed</em>}
                {session.endStatus === 'provisional' && <em className="tl-estimated">End time to confirm</em>}
                <Mark state={marks?.(session) ?? null} />
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Programme({ day, clock }: { day: Day; clock: Clock | null }) {
  const evening = day.sessions.filter(isEvening);
  const nextId = nextSessionId(day, clock);
  const marks = (s: Session): SessionMark =>
    stateOf(s, clock) ?? (s.id === nextId ? 'next' : null);

  return (
    <div className="programme">
      <Timeline day={day} clock={clock} />

      {evening.length > 0 && (
        <section className="tl-evening" aria-hidden="true">
          <h3 className="tl-evening-title">Evening</h3>
          <div className="tl-evening-items">
            {evening.map((s) => (
              <article
                className="tl-evening-card"
                key={s.id}
                data-session={s.id}
                data-kind={s.kind}
                data-state={marks(s) ?? undefined}
              >
                <p className="tl-time">{timeLabel(s)}</p>
                <div className="tl-evening-body">
                  <h3 className="tl-title">
                    {s.title}
                    <Mark state={marks(s)} />
                  </h3>
                  <PresenterLine item={s} />
                  <p className="tl-block-meta">
                    {s.venueNote && (
                      <span className="tl-note">
                        <span className="tl-meta-label">Note</span>
                        <span>{s.venueNote}</span>
                      </span>
                    )}
                    {s.status === 'tbd' && <em className="tl-tbd">To be confirmed</em>}
                    {s.endStatus === 'provisional' && <em className="tl-estimated">End time to confirm</em>}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* The same day as a list: the only version small screens and print show,
          and the one assistive technology reads. */}
      <List
        sessions={day.sessions}
        marks={marks}
        clock={clock}
        splitHref={`#${splitAnchor(day)}`}
      />
    </div>
  );
}

/**
 * Every day, in order, for paper. The interactive panel holds one day at a
 * time, so printing it would silently produce a single day — this block is
 * what the print stylesheet shows instead.
 */
export function ProgrammeForPrint() {
  return (
    <div className="print-programme" aria-hidden="true">
      {AGENDA.map((day) => (
        <section className="print-day" key={day.date}>
          <h2 className="print-day-title">
            Day {day.index} — {dayLabel(day.date)} — {day.label}
          </h2>
          <List sessions={day.sessions} anchors={false} />
        </section>
      ))}
    </div>
  );
}
