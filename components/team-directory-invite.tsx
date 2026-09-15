'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { DIRECTORY_INTRO, DIRECTORY_TITLE, directoryOpen } from '@/data/directory';
import { useSentEntry } from '@/hooks/use-directory-entry';
import { useWorkshopClock } from '@/hooks/use-workshop-clock';
import { directoryEnabled } from '@/lib/directory';

/**
 * The home page's way into the team directory: its lede and one link.
 *
 * The form itself stays at `/team-directory/`, the address that was shared
 * while it was unlisted, so those links keep working. Ten questions on the
 * home page would add about three screens to a phone; a card costs one.
 * `#team-directory` is the anchor the assistant sends a reader to.
 */
export function TeamDirectoryInvite() {
  const clock = useWorkshopClock();
  const sent = useSentEntry();

  if (!directoryEnabled || !directoryOpen(clock?.date ?? null)) return null;

  return (
    <section
      className="team-directory section-pad"
      id="team-directory"
      aria-labelledby="team-directory-invite-title"
    >
      <div className="section-title">
        <p>Time2Graze</p>
        <h2 id="team-directory-invite-title">{DIRECTORY_TITLE}</h2>
      </div>

      <div className="td-card">
        <div className="td-head">
          <p className="td-intro">{DIRECTORY_INTRO}</p>
          {sent && (
            <p className="td-sent">
              <CheckCircle2 aria-hidden="true" />
              <span>
                Sent as <strong>{sent.email}</strong>.
              </span>
            </p>
          )}
          <Link className="td-toggle" href="/team-directory/">
            {sent ? 'Update your entry' : 'Add your entry'}
            {!sent && <span className="td-toggle-note">Ten questions</span>}
            <ArrowRight aria-hidden="true" className="td-toggle-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
