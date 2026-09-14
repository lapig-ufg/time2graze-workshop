import {
  ClipboardList,
  FileText,
  FolderOpen,
  Info,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { MaterialKind } from '@/data/types';
import {
  isPdf,
  materialAction,
  materialDetail,
  materialsByDay,
} from '@/lib/materials';
import { withBasePath } from '@/lib/base-path';
import { dayLabel } from '@/lib/schedule';

/** The file's own icon, not one for everything: the model already knows the kind. */
const KIND_ICON: Record<MaterialKind, LucideIcon> = {
  slides: Presentation,
  document: FileText,
  protocol: ClipboardList,
};

export const metadata: Metadata = {
  title: 'Materials · Time2Graze Brazil Workshop',
  description:
    'Presentations, documents and protocols for each day of the workshop.',
};

/** No state and no clock: this page is a read of the agenda, so it stays a
 *  server component and ships no JavaScript of its own. */
export default function MaterialsPage() {
  const groups = materialsByDay();
  const total = groups.reduce(
    (count, group) => count + group.entries.length,
    0,
  );
  const published = groups.reduce(
    (count, group) =>
      count + group.entries.filter((entry) => entry.material.href).length,
    0,
  );

  return (
    <section className="materials section-pad" id="materials">
      <div className="section-title split-title">
        <div>
          <h1>Materials</h1>
        </div>
        <span>
          {published} of {total} files published
        </span>
      </div>

      <div className="materials-notice">
        <Info aria-hidden="true" />
        <p>
          Presentations and documents will be published as they are supplied by
          session teams. Some may be restricted to participants.
        </p>
      </div>

      <nav className="page-index materials-index" aria-label="Materials by day">
        {groups.map(({ day }) => (
          <a key={day.index} href={`#materials-day-${day.index}`}>
            <span>{dayLabel(day.date).split(' · ')[0]}</span>
            <strong>{Number(day.date.slice(-2))}</strong>
          </a>
        ))}
      </nav>

      <div className="resource-groups">
        {groups.map(({ day, entries }) => (
          <section
            className="resource-group"
            key={day.date}
            aria-labelledby={`materials-day-${day.index}`}
          >
            <header>
              <span aria-hidden="true">
                {String(day.index).padStart(2, '0')}
              </span>
              <div>
                <p>{dayLabel(day.date)}</p>
                <h2 id={`materials-day-${day.index}`}>
                  Day {day.index} · {day.label}
                </h2>
                <small>
                  {entries.length} {entries.length === 1 ? 'file' : 'files'}{' '}
                  expected
                </small>
              </div>
            </header>
            <div>
              {entries.map((entry) => {
                const KindIcon = KIND_ICON[entry.material.kind];
                return (
                  <article
                    className="resource-item"
                    key={entry.id}
                    id={entry.id}
                  >
                    <KindIcon aria-hidden="true" />
                    <span>
                      <strong>{entry.context}</strong>
                      <small>{materialDetail(entry)}</small>
                      {entry.sessionId && (
                        <Link
                          className="resource-session"
                          href={`/programme/#${entry.sessionId}`}
                          aria-label={`View session: ${entry.context}`}
                        >
                          View session →
                        </Link>
                      )}
                    </span>
                    {entry.material.href ? (
                      <span className="resource-actions">
                        <a
                          className="resource-file"
                          href={withBasePath(entry.material.href)}
                          target={isPdf(entry.material) ? '_blank' : undefined}
                          rel={isPdf(entry.material) ? 'noopener' : undefined}
                        >
                          {materialAction(entry.material)}
                        </a>
                        {isPdf(entry.material) && (
                          <a
                            className="resource-file"
                            href={withBasePath(entry.material.href)}
                            download
                          >
                            Download PDF
                          </a>
                        )}
                      </span>
                    ) : (
                      <em>To be published</em>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="document-placeholders">
        <article>
          <span>PDF</span>
          <FileText aria-hidden="true" />
          <div>
            <strong>Full programme</strong>
            <small>Printable reference copy</small>
          </div>
          <em>Pending</em>
        </article>
        <article>
          <span>Folder</span>
          <FolderOpen aria-hidden="true" />
          <div>
            <strong>Shared workshop folder</strong>
            <small>Participant access</small>
          </div>
          <em>Pending</em>
        </article>
      </div>
    </section>
  );
}
