import type { Metadata } from 'next';
import { TeamDirectory } from '@/components/team-directory';

/**
 * The form's own address. Linked from the home page's card and reached by the
 * assistant through it; not in the navigation, which is four destinations.
 */
export const metadata: Metadata = {
  title: 'Team directory · Time2Graze Brazil Workshop',
  description: 'The Time2Graze team directory form.',
};

export default function TeamDirectoryPage() {
  return <TeamDirectory />;
}
