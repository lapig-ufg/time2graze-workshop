'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ScrollText } from 'lucide-react';
import { AGENDA } from '@/data/agenda';
import { usePublishedRecapDays } from '@/components/recap';
import { dayLabel } from '@/lib/schedule';

/**
 * The five days and whether each has a summary, for the home page's record.
 *
 * A reader on Tuesday looking for Monday's summary should not have to know
 * that it lives under Day 1 on the programme. Only a published day is a link;
 * the others say what the programme would say. While the endpoint has not
 * answered, no status is shown rather than a guess.
 */
export function RecapDayList() {
  const published = usePublishedRecapDays();
  return (
    <ol className="record-days">
      {AGENDA.map((day) => {
        const ready = published?.includes(day.index) ?? false;
        const body = (
          <>
            <span className="record-day-index">Day {day.index}</span>
            <span className="record-day-name">
              <strong>{dayLabel(day.date)}</strong>
              <small>{day.label}</small>
            </span>
            <span className="record-day-status">
              {published === null ? '' : ready ? (
                <>
                  Read summary <ArrowRight aria-hidden="true" />
                </>
              ) : (
                'To be published'
              )}
            </span>
          </>
        );
        return (
          <li key={day.date} data-ready={ready || undefined}>
            {ready ? (
              <Link href={`/programme/#recap-day-${day.index}`}>{body}</Link>
            ) : (
              <div>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The published summaries as links in the programme's tool row. The link
 * switches day in place: when the hash already names that summary, following
 * it again would fire no hashchange and do nothing.
 */
export function RecapJumpLinks({ onOpen }: { onOpen: (day: number) => void }) {
  const published = usePublishedRecapDays();
  if (!published?.length) return null;
  const open = (event: MouseEvent, day: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(day);
  };
  return (
    <span className="programme-recaps">
      <span className="programme-recaps-label">
        <ScrollText aria-hidden="true" />
        Daily summaries
      </span>
      {published.map((day) => (
        <a
          key={day}
          href={`#recap-day-${day}`}
          aria-label={`Day ${day} summary`}
          onClick={(event) => open(event, day)}
        >
          Day {day}
        </a>
      ))}
    </span>
  );
}
