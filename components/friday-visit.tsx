import Image from 'next/image';
import { BusFront, ChevronDown, MapPin } from 'lucide-react';
import { CITY_STORIES } from '@/data/city-guide';
import { SHUTTLE_PLAN } from '@/data/practical';
import { VENUES } from '@/data/venues';
import { withBasePath } from '@/lib/base-path';
import { osmEmbedSrc } from '@/lib/places';

const FRIDAY = SHUTTLE_PLAN[1];

/**
 * Cidade de Goiás, once. It used to appear twice on this page — as a venue
 * card offering directions to a municipality centroid, and again as a history
 * article carrying the same photograph — which read as two different places.
 *
 * It is one thing: the Friday destination. The journey is organised, so the
 * front of the block is what a participant needs on the coach; the rest of
 * the town's history sits one disclosure away, in the same block.
 * A server component: the disclosure is native, so this ships no JavaScript.
 */
export function FridayVisit() {
  const venue = VENUES.cidadeDeGoias;
  const town = CITY_STORIES.goias;
  const photo = venue.photo;
  const [lead, ...rest] = town.paragraphs;

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

        <details className="place-map friday-more">
          <summary>
            More about Cidade de Goiás
            <ChevronDown aria-hidden="true" />
          </summary>
          <div className="place-map-content">
            <div className="city-prose">
              {rest.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="friday-details">
              {town.details.map((detail) => (
                <section key={detail.title}>
                  <h4>{detail.title}</h4>
                  <p>{detail.text}</p>
                </section>
              ))}
            </div>
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
            <div className="city-sources">
              {town.sources.map((source) => (
                <a
                  className="city-source"
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}
