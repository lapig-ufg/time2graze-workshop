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
 * It closes the block the hero opens — destinations, the participants' group,
 * then this — and precedes the overview, so it sits on the paper those share
 * rather than on the overview's tint. It is the one panel there in forest with
 * the lime rule, the pairing the hero's date and the "now" band use, because it
 * is the one thing on the page that asks the reader for something.
 *
 * The form itself stays at `/team-directory/`, the address that was shared
 * while it was unlisted, so those links keep working. Ten questions on the
 * home page would add about three screens to a phone; a panel costs one.
 * `#team-directory` is the anchor the assistant sends a reader to.
 */
export function TeamDirectoryInvite() {
  const clock = useWorkshopClock();
  const sent = useSentEntry();

  if (!directoryEnabled || !directoryOpen(clock?.date ?? null)) return null;

  return (
    <section
      className="td-invite"
      id="team-directory"
      aria-labelledby="team-directory-invite-title"
    >
      <div className="tdi-panel">
        <div className="tdi-text">
          <p className="tdi-eyebrow">Time2Graze project</p>
          <h2 id="team-directory-invite-title">{DIRECTORY_TITLE}</h2>
          <p className="tdi-intro">{DIRECTORY_INTRO}</p>
        </div>
        <div className="tdi-aside">
          {sent && (
            <p className="tdi-sent">
              <CheckCircle2 aria-hidden="true" />
              <span>
                Sent as <strong>{sent.email}</strong>
              </span>
            </p>
          )}
          <Link className="tdi-action" href="/team-directory/">
            {sent ? 'Update your entry' : 'Add your entry'}
            <ArrowRight aria-hidden="true" />
          </Link>
          {!sent && (
            <p className="tdi-note">Ten questions · one entry per e-mail address</p>
          )}
        </div>
      </div>
    </section>
  );
}
