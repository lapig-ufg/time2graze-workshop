import Image from 'next/image';
import { BusFront, ChevronDown, MapPin } from 'lucide-react';
import { CITY_STORIES } from '@/data/city-guide';
import { SHUTTLE_PLAN } from '@/data/practical';
import { VENUES } from '@/data/venues';
import { withBasePath } from '@/lib/base-path';
import { osmEmbedSrc } from '@/lib/places';
import { OptionalStory } from '@/components/optional-story';
import { FarmMap } from '@/components/farm-map';

const FRIDAY = SHUTTLE_PLAN[1];

/**
 * Cidade de Goiás, once. It used to appear twice on this page — as a venue
 * card offering directions to a municipality centroid, and again as a history
 * article carrying the same photograph — which read as two different places.
 *
 * It is one thing: the Friday destination. The journey is organised, so the
 * front of the block is what a participant needs on the coach; the rest of
 * the town's history sits one disclosure away, in the same block.
 * Text remains server-rendered; optional stories own their gallery interactions.
 */
export function FridayVisit() {
  const venue = VENUES.cidadeDeGoias;
  const town = CITY_STORIES.goias;
  const photo = venue.photo;
  const [lead] = town.paragraphs;

  return (
    <article
      className="travel-place friday-visit"
      id="cidade-de-goias"
      aria-labelledby="cidade-de-goias-title"
    >
      <div className="travel-place-summary">
        <p className="travel-eyebrow">
          <MapPin aria-hidden="true" />
          Friday 18 September
        </p>
        <h3 id="cidade-de-goias-title">{venue.name}</h3>
        <p className="travel-place-context">{venue.locality}</p>

        <figure className="city-photo">
          <Image
            src={withBasePath(photo.src)}
            alt={photo.alt}
            width={1200}
            height={795}
            sizes="(max-width: 900px) 100vw, 40vw"
            loading="lazy"
          />
          <figcaption>
            <a href={photo.creditHref} target="_blank" rel="noreferrer">
              {photo.credit}
            </a>
          </figcaption>
        </figure>
      </div>
      <div className="travel-place-details">
        <a className="travel-getting-there" href="#transport">
          <BusFront aria-hidden="true" />
          Workshop shuttle from Golden Lis · Friday {FRIDAY.time}
        </a>
        <div className="city-prose">
          <p>{lead}</p>
        </div>
        <p className="city-heritage">UNESCO World Heritage · 2001</p>

        <details className="place-map">
          <summary>View town map <ChevronDown aria-hidden="true" /></summary>
          <div className="place-map-content">
            <iframe title={`Map of ${venue.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={osmEmbedSrc(venue.coords, venue.mapSpan)} />
            <p className="map-credit">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
          </div>
        </details>
      </div>
      <FarmMap />
      <div className="friday-stories">
        <OptionalStory id="cidade-de-goias" headingLevel={4} />
        <OptionalStory id="fica" headingLevel={4} />
      </div>
    </article>
  );
}
