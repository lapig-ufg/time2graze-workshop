import { ArrowUpRight } from 'lucide-react';
import { GUIDE_SOURCE } from '@/data/city-guide';

const EMBED_URL = GUIDE_SOURCE.replace('/viewer?', '/embed?')
  + '&ll=-16.702111113637898%2C-49.26473563623048&z=13';

export function FreeTimeMap() {
  return (
    <div className="free-time-guide">
      <div className="guide-map-toolbar">
        <a href={GUIDE_SOURCE} target="_blank" rel="noreferrer">
          Open full map in Google Maps<ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <iframe
        className="guide-google-map"
        id="free-time-map"
        title="Goiânia places · GMH Workshop Brazil 2026 Google My Maps"
        src={EMBED_URL}
        width="100%"
        height="600"
        loading="lazy"
        allowFullScreen
      />
      <p className="city-source guide-credit">
        Map: <a href={GUIDE_SOURCE} target="_blank" rel="noreferrer">GMH Workshop – Brazil 2026 · Nathália Monteiro Teles</a>.
      </p>
    </div>
  );
}
