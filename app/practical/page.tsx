import Link from 'next/link';
import { ArrowUpRight, BusFront } from 'lucide-react';
import { FridayVisit } from '@/components/friday-visit';
import { Orientation } from '@/components/orientation';
import { VenueCard } from '@/components/venue-card';
import { SHUTTLE_PLAN } from '@/data/practical';
import { MAP_VENUES } from '@/data/venues';

const WEEKDAYS = SHUTTLE_PLAN[0];

/**
 * Two parts, because the page answers two questions asked at different
 * moments: what happens to me this week, and what is there to do in the
 * evening. Mixing them is what made the old single stack read as confused.
 *
 * `#stay`, `#transport`, `#maps` and `#map-panel` are load-bearing: they were
 * shared before the page was rebuilt and still have to resolve.
 */
export default function PracticalPage() {
  const hotel = MAP_VENUES.find((venue) => venue.id === 'hotel')!;
  const lapig = MAP_VENUES.find((venue) => venue.id === 'lapig')!;

  return (
    <section className="travel-page section-pad" id="practical">
      <header className="travel-heading">
        <h1>Travel &amp; stay</h1>
        <p>Goiânia, Brazil · 14–18 September 2026</p>
      </header>
      <nav className="page-index travel-index" aria-label="Travel information">
        <a href="#hotel">Hotel</a>
        <a href="#transport">Shuttle</a>
        <a href="#maps">Locations</a>
        <a href="#orientation">Free time</a>
      </nav>

      <section className="travel-part" aria-labelledby="week-title">
        <h2 className="travel-part-title" id="week-title">
          Your week
        </h2>
        <p className="travel-part-lead">
          Where you stay, how you travel each day, and the two places the
          workshop takes you.
        </p>

        <div className="travel-arrival">
          <div id="stay">
            <VenueCard venue={hotel} anchor="hotel" eyebrow="Your hotel" />
          </div>
          <section
            className="shuttle-card"
            id="transport"
            aria-labelledby="shuttle-title"
          >
            <div className="shuttle-overview">
              <p className="travel-eyebrow">
                <BusFront aria-hidden="true" />
                Daily transport
              </p>
              <h3 id="shuttle-title">Workshop shuttle</h3>
              <p>
                Take the workshop shuttle from Golden Lis each day. Transport to
                the activities and back is organised.
              </p>
            </div>
            <div className="shuttle-schedule">
              <dl className="shuttle-times">
                {SHUTTLE_PLAN.map((item) => (
                  <div key={item.days}>
                    <dt>{item.days}</dt>
                    <dd>
                      <strong>{item.time}</strong>
                      <span>{item.detail}</span>
                      {item.provisional && (
                        <em className="shuttle-provisional">
                          Departure time to confirm
                        </em>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link className="travel-text-link" href="/programme/">
                View daily programme <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>

        <div id="maps">
          <div id="map-panel" className="travel-places">
            <VenueCard
              venue={lapig}
              anchor="lapig"
              eyebrow="Monday–Thursday"
              travel={`Workshop shuttle from Golden Lis · ${WEEKDAYS.days} ${WEEKDAYS.time}`}
            />
            <FridayVisit />
          </div>
        </div>
      </section>

      <Orientation />
    </section>
  );
}
