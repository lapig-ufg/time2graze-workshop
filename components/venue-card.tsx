'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  BusFront,
  Car,
  Check,
  ChevronDown,
  Copy,
  MapPin,
  Phone,
} from 'lucide-react';
import { ACCOMMODATION_PLAN } from '@/data/practical';
import type { MapVenue } from '@/data/venues';
import { withBasePath } from '@/lib/base-path';
import {
  directionsLink,
  formatCoordinates,
  googleMapsLink,
  osmEmbedSrc,
  uberLink,
} from '@/lib/places';

/**
 * A place you can be routed to: the hotel and LAPIG. Cidade de Goiás is a
 * Friday coach trip, not a building you navigate to, and has its own block —
 * offering it directions and a copyable municipality centroid was the source
 * of the page's two competing accounts of the same place.
 *
 * `eyebrow` is passed in rather than derived, so the page keeps every place on
 * one axis: the hotel is your base, the others say when you go there.
 * Real anchors preserve the destination when sharing or reloading.
 */
export function VenueCard({
  venue,
  anchor,
  eyebrow,
  travel,
}: {
  venue: MapVenue;
  anchor: string;
  eyebrow: string;
  /** How you reach it, when the workshop organises the journey. */
  travel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'ready' | 'copied' | 'failed'>(
    'ready',
  );
  const hotel = venue.id === 'hotel';
  const copyValue = venue.address ?? formatCoordinates(venue.coords);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }
  return (
    <article
      className={`travel-place${hotel ? ' travel-hotel' : ''}`}
      id={anchor}
      aria-labelledby={`${anchor}-title`}
    >
      <div className="travel-place-summary">
        <p className="travel-eyebrow">
          <MapPin aria-hidden="true" />
          {eyebrow}
        </p>
        <h3 id={`${anchor}-title`}>{venue.name}</h3>
        <p className="travel-place-context">
          {hotel ? venue.arrivalNote : venue.locality}
        </p>
        {travel && (
          <a className="travel-getting-there" href="#transport">
            <BusFront aria-hidden="true" />
            {travel}
          </a>
        )}
        {venue.photo ? (
          <figure className="venue-photo">
            <Image
              src={withBasePath(venue.photo.src)}
              alt={venue.photo.alt}
              width={720}
              height={420}
              sizes="(max-width: 900px) 100vw, 40vw"
              loading="lazy"
            />
            <figcaption>
              {venue.photo.creditHref ? (
                <a
                  href={venue.photo.creditHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {venue.photo.credit}
                </a>
              ) : (
                venue.photo.credit
              )}
            </figcaption>
          </figure>
        ) : (
          <p>Photograph pending.</p>
        )}
      </div>
      <div className="travel-place-details">
        <div className="travel-place-actions">
          {venue.ride === true && (
            <a
              className="travel-uber"
              href={uberLink(
                venue.coords,
                venue.name,
                venue.address ?? venue.locality,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Car aria-hidden="true" />
              Open Uber to {venue.short}
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          <a
            href={
              venue.address
                ? directionsLink(venue.coords)
                : googleMapsLink(venue.coords)
            }
            target="_blank"
            rel="noreferrer"
          >
            <MapPin aria-hidden="true" />
            {venue.address ? 'Directions' : 'Open map'}
          </a>
          {venue.phone && (
            <a href={`tel:${venue.phone.replace(/[^+\d]/g, '')}`}>
              <Phone aria-hidden="true" />
              Call {venue.short}
            </a>
          )}
        </div>
        <div className="travel-address">
          <p>{copyValue}</p>
          <button type="button" onClick={copy}>
            {copyState === 'copied' ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copyState === 'copied'
              ? 'Copied'
              : venue.address
                ? 'Copy address'
                : 'Copy coordinates'}
          </button>
          <output
            className={
              copyState === 'failed' ? 'travel-copy-error' : 'visually-hidden'
            }
          >
            {copyState === 'failed'
              ? 'Could not copy. Select and copy the text above.'
              : copyState === 'copied'
                ? `${venue.address ? 'Address' : 'Coordinates'} copied`
                : ''}
          </output>
        </div>
        {hotel && (
          <dl className="hotel-stay">
            <div>
              <dt>Stay</dt>
              <dd>{ACCOMMODATION_PLAN.dates}</dd>
            </div>
            <div>
              <dt>Booking</dt>
              <dd>{ACCOMMODATION_PLAN.payment}</dd>
            </div>
          </dl>
        )}
        {venue.pending && <p className="travel-pending">{venue.pending}</p>}
        {!hotel && venue.arrivalNote && (
          <p className="travel-arrival-note">{venue.arrivalNote}</p>
        )}
        <details
          className="place-map"
          onToggle={(event) => setExpanded(event.currentTarget.open)}
        >
          <summary>
            View location map
            <ChevronDown aria-hidden="true" />
          </summary>
          {expanded && (
            <div className="place-map-content">
              <iframe
                title={`Map of ${venue.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={osmEmbedSrc(venue.coords, venue.mapSpan)}
              />
              <p className="map-credit">
                Map data ©{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenStreetMap contributors
                </a>
              </p>
            </div>
          )}
        </details>
        {venue.website && (
          <a
            className="travel-text-link place-website"
            href={venue.website}
            target="_blank"
            rel="noreferrer"
          >
            {venue.short} website
            <ArrowUpRight aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
