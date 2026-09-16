import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AGENDA } from '@/data/agenda';
import { WORKSHOP_BOARDS } from '@/data/workshop-boards';
import { RecapDayList } from '@/components/recap-index';
import { withBasePath } from '@/lib/base-path';
import { dayLabel, presenterLabel } from '@/lib/schedule';

/** The session holding the boards, read from the agenda like every material. */
const BOARDS = AGENDA.flatMap((day) =>
  day.sessions.flatMap((session) =>
    (session.materials ?? [])
      .filter((material) => material.format === '3D' && material.href)
      .map((material) => ({ day, session, material })),
  ),
)[0];

const CONTRIBUTIONS = (board: (typeof WORKSHOP_BOARDS)[number]) =>
  board.notes.filter((note) => !note.label).length;

/**
 * What the workshop has produced so far: the daily summaries and the boards.
 *
 * Both used to be reachable only from inside the programme — a summary under
 * its day's tab, the boards as one link among a session's files. This band
 * gives them a place on the home page, after the block the hero opens and
 * before the overview, because during the week and after it they are what a
 * returning reader comes for. It is an index, not a destination: every link
 * leads to the programme or to the boards themselves.
 */
export function WorkshopRecord() {
  return (
    <section
      className="record section-pad"
      id="workshop-record"
      aria-labelledby="workshop-record-title"
    >
      <div className="section-title">
        <p>Workshop record</p>
        <h2 id="workshop-record-title">Summaries and boards</h2>
      </div>

      <div className="record-layout">
        <div className="record-summaries">
          <h3>Daily summaries</h3>
          <RecapDayList />
        </div>

        {BOARDS && (
          <article className="record-boards" aria-labelledby="record-boards-title">
            {BOARDS.material.preview && (
              <a
                className="record-boards-image"
                href={withBasePath(BOARDS.material.href!)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <Image
                  src={withBasePath(BOARDS.material.preview)}
                  alt=""
                  width={1600}
                  height={750}
                  sizes="(max-width: 960px) 100vw, 56vw"
                />
                <span>3D</span>
              </a>
            )}
            <div className="record-boards-body">
              <p className="record-boards-eyebrow">
                Day {BOARDS.day.index} · {dayLabel(BOARDS.day.date)}
              </p>
              <h3 id="record-boards-title">Workshop boards</h3>
              <p className="record-boards-session">
                {BOARDS.session.title}
                {presenterLabel(BOARDS.session) && (
                  <small> · {presenterLabel(BOARDS.session)}</small>
                )}
              </p>
              <ol className="record-boards-list">
                {WORKSHOP_BOARDS.map((board) => (
                  <li key={board.id}>
                    <strong>{board.title}</strong>
                    <small>
                      {CONTRIBUTIONS(board)} contributions · {board.facilitator}
                    </small>
                  </li>
                ))}
              </ol>
              <div className="record-boards-actions">
                <a
                  className="record-boards-open"
                  href={withBasePath(BOARDS.material.href!)}
                >
                  Open 3D boards <ArrowRight aria-hidden="true" />
                </a>
                <a href={withBasePath(`${BOARDS.material.href}#reading`)}>
                  Reading view <ArrowUpRight aria-hidden="true" />
                </a>
                <Link href={`/programme/#${BOARDS.session.id}`}>
                  View session
                </Link>
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
