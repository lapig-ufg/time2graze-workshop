import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AGENDA, CALENDAR_RELEASE } from '@/data/agenda';
import { PARTICIPANT_GROUP } from '@/data/contact';
import {
  DISPLAYED_INSTITUTIONS,
  type Institution,
  LAPIG_CHANNELS,
} from '@/data/institutions';
import { withBasePath } from '@/lib/base-path';
import { materialsByDay } from '@/lib/materials';
import { OptionalStory } from '@/components/optional-story';
import { StoryLink } from '@/components/story-link';
import { WhatsAppMark } from '@/components/whatsapp-mark';

const SCHEDULED_ITEMS = AGENDA.reduce(
  (total, day) => total + day.sessions.length,
  0,
);
const EXPECTED_FILES = materialsByDay().reduce(
  (total, group) => total + group.entries.length,
  0,
);

const DESTINATIONS = [
  {
    href: '/programme/',
    title: 'Programme',
    detail: `${AGENDA.length} days · ${SCHEDULED_ITEMS} scheduled items`,
    status: CALENDAR_RELEASE === 'final' ? 'Confirmed programme' : 'Draft programme',
    tone: 'neutral',
  },
  {
    href: '/practical/',
    title: 'Travel & stay',
    detail: 'Hotel, daily shuttle, maps and Uber',
    status: 'Arrival & daily transport',
    tone: 'neutral',
  },
  {
    href: '/materials/',
    title: 'Materials',
    detail: `${EXPECTED_FILES} expected files linked to sessions`,
    status: 'Files added as supplied',
    tone: 'neutral',
  },
] as const;

const MARK_AREA = 7200;
const MARK_MAX_HEIGHT = 64;

function markHeight({ width, height }: Institution) {
  return Math.min(
    MARK_MAX_HEIGHT,
    Math.round(Math.sqrt((MARK_AREA * height) / width)),
  );
}

function HeroMeta() {
  return (
    <div className="landscape-meta" aria-label="Event information">
      <span>
        <CalendarDays aria-hidden="true" />
        14–18 September 2026
      </span>
      <span>
        <MapPin aria-hidden="true" />
        Goiânia, Goiás · Brazil
      </span>
    </div>
  );
}

function Directory() {
  return (
    <nav className="home-directory" aria-label="Workshop information">
      {DESTINATIONS.map(({ href, title, detail, status, tone }, index) => (
        <Link key={href} href={href} data-status={tone}>
          <span className="home-directory-index">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <strong>{title}</strong>
            <small>{detail}</small>
            <em>{status}</em>
          </div>
          <ChevronRight aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}

/**
 * The participants' group, as a coda to the directory rather than a fourth
 * destination: the directory indexes the site, and this leaves it. It shares
 * the directory's frame — those cards' bottom rule is this strip's top rule —
 * so the two read as one block, and it carries the outward arrow the internal
 * cards never do.
 *
 * The whole strip is the link, as each directory card is, and the mark takes
 * the column the card indices use so the two text columns share one left edge.
 * The note says what tapping it does and who the group is open to; what the
 * group is *for* has not been stated by the organiser, and is not guessed at
 * here.
 *
 * A plain element, not an `aside`: one link is not a complementary region, and
 * an unnamed landmark beside the directory's `nav` would be one more thing for
 * a screen reader to announce and nothing more to find in it.
 */
function ParticipantGroup() {
  return (
    <div className="home-group">
      <a href={PARTICIPANT_GROUP.href} target="_blank" rel="noreferrer">
        <span className="home-group-mark">
          <WhatsAppMark />
        </span>
        <span className="home-group-text">
          <em>{PARTICIPANT_GROUP.eyebrow}</em>
          <strong>{PARTICIPANT_GROUP.title}</strong>
          <small>{PARTICIPANT_GROUP.note}</small>
        </span>
        <span className="home-group-action">
          {PARTICIPANT_GROUP.action} <ArrowUpRight aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}

function Institutions() {
  return (
    <section
      className="institutions section-pad"
      aria-labelledby="institutions-title"
    >
      <div className="section-title">
        <p>Institutions</p>
        <h2 id="institutions-title">Institutional affiliations</h2>
      </div>
      <div className="institution-list">
        {DISPLAYED_INSTITUTIONS.map((institution) => (
          <a
            className="institution-mark"
            href={institution.href}
            key={institution.name}
            target="_blank"
            rel="noreferrer"
            aria-label={`${institution.name} website`}
            style={
              {
                '--mark-h': `${markHeight(institution)}px`,
              } as CSSProperties
            }
          >
            <Image
              src={withBasePath(institution.logo)}
              alt={institution.name}
              width={institution.width}
              height={institution.height}
              loading="lazy"
            />
          </a>
        ))}
      </div>
      {/* The host laboratory's own channels, written out rather than drawn as
          brand glyphs. Two reasons: the workshop has no accounts of its own,
          and an unlabelled icon row would read as if it did; and lucide
          carries no brand marks, while Simple Icons has dropped LinkedIn's at
          the company's request — so a complete set does not exist to draw. */}
      <div className="institution-social">
        <span>LAPIG, the host laboratory</span>
        <p>
          {LAPIG_CHANNELS.map((channel) => (
            <a
              href={channel.href}
              key={channel.name}
              rel="noreferrer"
              target="_blank"
            >
              {channel.name}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </p>
      </div>
      <div className="institution-stories">
        <OptionalStory id="ufg" />
        <OptionalStory id="lapig" />
        <OptionalStory id="funape" />
      </div>
    </section>
  );
}

export function HomeLanding() {
  return (
    <>
      <section className="landscape-hero" aria-labelledby="landscape-title">
        <div className="landscape-photo">
          <Image
            src={withBasePath('/time2graze-hero.webp')}
            alt="Aerial view of green pastureland"
            width={1440}
            height={1080}
            priority
          />
          <p>Goiânia · Goiás · Brazil</p>
        </div>

        <div className="landscape-card">
          <p className="landscape-eyebrow">
            Time2Graze Project · Internal technical workshop
          </p>
          <h1 id="landscape-title">
            Time2Graze
            <br />
            <span>Brazil Workshop</span>
          </h1>
          <p className="landscape-intro">
            An internal workshop for partner teams working on data and decision
            support for grazing management in the Global South.
          </p>
          <HeroMeta />
          <Link className="landscape-action" href="/programme/">
            View programme <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div
          className="landscape-date"
          aria-label="14 to 18 September 2026"
        >
          <strong>14—18</strong>
          <span>
            September
            <br />
            2026
          </span>
        </div>
      </section>

      <Directory />

      <ParticipantGroup />

      <section className="overview section-pad" id="about">
        <div className="section-title">
          <p>Workshop overview</p>
          <h2>Purpose and format</h2>
        </div>
        <div className="overview-layout">
          <div className="objective-block">
            <h3>Objective</h3>
            <p>
              The primary objective of this workshop is to strengthen
              collaboration across our partner teams by integrating data
              development and decision support to advance our main goal of
              improving grazing management and decision-making in livestock
              systems in the Global South.
            </p>
          </div>
          <dl className="fact-list">
            <div>
              <dt>Format</dt>
              <dd>In-person technical workshop</dd>
            </div>
            <div>
              <dt>Participation</dt>
              <dd>Internal to the Time2Graze project</dd>
            </div>
            <div>
              <dt>Participants</dt>
              <dd>Representatives from each partner country</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>LAPIG · Federal University of Goiás
                <StoryLink className="story-inline-link" href="/#about-ufg">About UFG and LAPIG <ArrowRight aria-hidden="true" /></StoryLink>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Institutions />
    </>
  );
}
