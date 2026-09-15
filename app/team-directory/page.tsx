import type { Metadata } from 'next';
import { TeamDirectory } from '@/components/team-directory';

/**
 * Unlisted on purpose: shared as a link, not reached from the navigation, the
 * home page or the assistant. See `components/team-directory.tsx`.
 */
export const metadata: Metadata = {
  title: 'Team directory · Time2Graze Brazil Workshop',
  description: 'The Time2Graze team directory form.',
  robots: { index: false, follow: false },
};

export default function TeamDirectoryPage() {
  return <TeamDirectory />;
}
