'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTabKeys } from '@/hooks/use-tab-keys';
import { withBasePath } from '@/lib/base-path';

export type BoardCollection = {
  id: string;
  title: string;
  day: number;
  dayLabel: string;
  session: { id: string; title: string; presenter?: string };
  href: string;
  preview?: string;
  boards: { id: string; title: string; contributions: number; facilitator: string }[];
};

/**
 * The boards card on the home page, one tab per session that produced boards.
 *
 * Both panels are rendered and stacked in one grid cell, the inactive one only
 * made invisible, so the card keeps the height of the taller collection and
 * switching does not move the overview below it. On a phone the list runs to
 * one column and that reserve would leave a gap, so there the inactive panel
 * is simply not displayed. Opens on the most recent session.
 */
export function RecordBoards({ collections }: { collections: BoardCollection[] }) {
  const [active, setActive] = useState(collections.length - 1);
  // Fade only a card the reader switched to, never the one the page opens on.
  const [switched, setSwitched] = useState(false);
  const select = (index: number) => {
    setActive(index);
    setSwitched(true);
  };
  const onKeys = useTabKeys(collections.length, active, select);

  return (
    <div className="record-boards-tabs" data-switched={switched || undefined}>
      {collections.length > 1 && (
        // Focus lives on the tabs themselves (roving tabindex), as on /programme/.
        // oxlint-disable-next-line jsx-a11y/interactive-supports-focus
        <div
          className="record-boards-tablist"
          role="tablist"
          aria-label="Workshop boards by session"
          onKeyDown={onKeys}
        >
          {collections.map((collection, index) => (
            <button
              key={collection.id}
              type="button"
              role="tab"
              id={`record-boards-tab-${collection.id}`}
              aria-selected={active === index}
              aria-controls={`record-boards-panel-${collection.id}`}
              tabIndex={active === index ? 0 : -1}
              onClick={() => select(index)}
            >
              <span>Day {collection.day}</span>
              <strong>{collection.title}</strong>
            </button>
          ))}
        </div>
      )}

      <div className="record-boards-stack">
        {collections.map((collection, index) => (
          <article
            key={collection.id}
            className="record-boards"
            id={`record-boards-panel-${collection.id}`}
            role={collections.length > 1 ? 'tabpanel' : undefined}
            aria-labelledby={`record-boards-title-${collection.id}`}
            data-active={active === index}
            inert={active !== index}
          >
            {collection.preview && (
              <a
                className="record-boards-image"
                href={withBasePath(collection.href)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <Image
                  src={withBasePath(collection.preview)}
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
                Day {collection.day} · {collection.dayLabel}
              </p>
              <h3 id={`record-boards-title-${collection.id}`}>{collection.title}</h3>
              <p className="record-boards-session">
                {collection.session.title}
                {collection.session.presenter && (
                  <small> · {collection.session.presenter}</small>
                )}
              </p>
              <ol className="record-boards-list" data-many={collection.boards.length > 4}>
                {collection.boards.map((board) => (
                  <li key={board.id}>
                    <strong>{board.title}</strong>
                    <small>
                      {board.contributions} contributions
                      {board.facilitator && ` · ${board.facilitator}`}
                    </small>
                  </li>
                ))}
              </ol>
              <div className="record-boards-actions">
                <a className="record-boards-open" href={withBasePath(collection.href)}>
                  Open 3D boards <ArrowRight aria-hidden="true" />
                </a>
                <a href={withBasePath(`${collection.href}#reading`)}>
                  Reading view <ArrowUpRight aria-hidden="true" />
                </a>
                <Link href={`/programme/#${collection.session.id}`}>View session</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
