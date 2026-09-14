'use client';

import Link from 'next/link';
import { AGENDA } from '@/data/agenda';
import { useWorkshopClock } from '@/hooks/use-workshop-clock';
import { withBasePath } from '@/lib/base-path';
import { isPdf, materialAction, publishedMaterials } from '@/lib/materials';
import { nextSessionId, stateOf, todayIndex } from '@/lib/now';
import { recapForDay } from '@/lib/recap';
import { useLiveRecap } from '@/components/recap';
import { dayLabel, sessionTitle, timeLabel } from '@/lib/schedule';

/**
 * What is happening right now, on the home page, during the workshop week.
 *
 * It renders nothing outside those five days, and nothing once the day has run
 * out of items and has not been summarised: an empty band is honest, a stale
 * one is not. Only one session state can appear, since `nextSessionId` stands
 * down while a session is running.
 *
 * The recap line is the exception to the band emptying out. A day's summary
 * goes up in the evening, which is exactly when the schedule has stopped
 * having anything to say — without this the most useful thing on the site at
 * 21:00 would be the one thing the home page did not mention.
 */
export function NowNext() {
  const clock = useWorkshopClock();
  const today = todayIndex(AGENDA, clock);
  // The recap is published live on /programme/; the repository copy is the
  // fallback for a reader arriving before the fetch answers. The hook runs
  // before the early return: rules of hooks, and the fetch is shared anyway.
  const liveRecap = useLiveRecap(today ?? 0);
  if (!clock || today === null) return null;

  const day = AGENDA[today];
  const running = day.sessions.find((s) => stateOf(s, clock) === 'running');
  const nextId = nextSessionId(day, clock);
  const session = running ?? day.sessions.find((s) => s.id === nextId);
  const recap = liveRecap || recapForDay(day.index) !== null;
  // The deck for the hour in the room, one line per activity that has one.
  const files = session
    ? [session, ...(session.tracks ?? [])].flatMap((item) =>
        publishedMaterials(item).map((m) => ({ item, m })),
      )
    : [];
  if (!session && !recap) return null;

  return (
    <aside className="now-band" aria-label="Happening today">
      <p className="now-band-day">Day {day.index} · {dayLabel(day.date)}</p>
      {session && (
        <p className="now-band-item">
          <span className={running ? 'tl-mark' : 'tl-mark tl-mark--next'}>
            {running ? 'Now' : 'Next'}
          </span>
          <span className="now-band-time">{timeLabel(session)}</span>
          <Link href={`/programme/#${session.id}`}>{sessionTitle(session)}</Link>
        </p>
      )}
      {files.map(({ item, m }) => (
        <p className="now-band-item now-band-file" key={m.href}>
          <span className="tl-mark tl-mark--next">Material</span>
          <a
            href={withBasePath(m.href)}
            target={isPdf(m) ? '_blank' : undefined}
            rel={isPdf(m) ? 'noopener' : undefined}
          >
            {item.title} · {materialAction(m)}
          </a>
        </p>
      ))}
      {recap && (
        <p className="now-band-item now-band-recap">
          <span className="tl-mark tl-mark--next">Summary</span>
          <Link href={`/programme/#recap-day-${day.index}`}>
            Today&rsquo;s summary is published
          </Link>
        </p>
      )}
    </aside>
  );
}
