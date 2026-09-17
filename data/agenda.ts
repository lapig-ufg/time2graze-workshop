import type { Day } from './types';

/**
 * The five workshop days. All times are America/Sao_Paulo.
 *
 * Session ids are hand-written and must not change once anything links to
 * them. The twenty end times once inferred from the next programme item or
 * the rhythm of the day were approved as real by the organiser on
 * 5 September 2026; the Day 5 farm visit keeps its confirmed times while
 * which farm hosts it stays pending on the venue field.
 *
 * Day 2's second Open Agenda, Day 5's afternoon (City Tour and the Serra
 * Dourada lookout, in place of a farm visit duplicated from the morning) and
 * every Day 5 time were reconciled against the organiser's own agenda
 * spreadsheet on 9 September 2026.
 *
 * Reconciled again on 11 September 2026 against a newer copy of the same
 * spreadsheet: Day 1 gained the welcome coffee, Day 2's afternoon talk was
 * retitled and its second open hour became a talk of its own, Day 3's opening
 * changed subject and presenter, and the Day 5 farm was named. Everything
 * else matched line for line. Two spellings in the spreadsheet are corrected
 * here, as `Aligment` was before them: `lessos` and `campaings`.
 */
/**
 * Calendar publication state. `final` since 5 September 2026: the organiser
 * approved every interval. The calendar build rejects unresolved items, so a
 * new session without a confirmed end fails the build rather than shipping.
 */
export const CALENDAR_RELEASE: 'beta' | 'final' = 'final';

/**
 * Last day a split-session choice is accepted, in the workshop's timezone.
 * The two split sessions are Day 1 and Day 4; after Day 4 there is nothing
 * left to choose, and `CHOICE_CLOSES` in `apps-script/tracks.gs` refuses the
 * write on the same date. This constant only stops the site offering a
 * control the script would refuse.
 */
export const TRACK_CHOICE_CLOSES = '2026-09-17';

export const AGENDA: Day[] = [
  {
    index: 1,
    date: '2026-09-14',
    label: 'Welcome',
    sessions: [
      {
        id: 'd1-ufg-tour',
        date: '2026-09-14',
        start: '08:30',
        end: '10:00',
        title: 'UFG Tour — Welcome at LAPIG',
        venueId: 'lapig',
        kind: 'technical',
      },
      /**
       * Inside the tour's window, not after it: the organiser's agenda gives
       * the tour 08:30–10:00 and this 09:40–10:00, so the coffee closes the
       * tour rather than following it. Both are kept as written — the grid
       * draws overlapping items side by side, which is what they are.
       */
      {
        id: 'd1-welcome-coffee',
        date: '2026-09-14',
        start: '09:40',
        end: '10:00',
        title: 'Welcome Coffee',
        venueId: 'lapig',
        kind: 'break',
      },
      {
        id: 'd1-split-inspection-gee',
        date: '2026-09-14',
        start: '10:00',
        end: '12:00',
        title: 'Split Session',
        venueId: 'lapig',
        kind: 'technical',
        tracks: [
          {
            id: 'd1-visual-inspection',
            title: 'Visual Inspection Workshop',
            description:
              'The Visual Inspection Workshop provides theoretical and practical training in the interpretation of remote sensing imagery for land cover mapping and monitoring. The course introduces key remote sensing concepts, including the interaction of electromagnetic energy with the Earth’s surface, the spectral behavior of vegetation and other land cover types, the use of spectral indices such as NDVI, and the analysis of image time series. Based on these concepts, participants develop skills to recognize patterns and distinguish natural and anthropogenic classes using seven key elements of visual interpretation: color, tone, texture, shape, spatial context, spectral indices, and temporal patterns. These elements are applied in an integrated way to the analysis of different landscapes, helping participants develop a systematic and technical approach to satellite image interpretation and produce more consistent information for environmental monitoring and land cover mapping.',
            speakers: [{ name: 'Ana Paula', org: 'LAPIG' }],
            /* Ana Paula's deck, supplied 14 September 2026 as a self-contained
               HTML page; its images were converted to WebP alongside it. */
            materials: [
              {
                kind: 'slides',
                title: 'Module 1 · Mapping with the Eye',
                href: '/files/visual-inspection-module-1/index.html',
                format: 'HTML',
              },
            ],
          },
          {
            id: 'd1-gee-course',
            title: 'GEE / GEE App short course',
            description:
              'The GEE App / GEE short course introduces participants to the interactive Earth Engine Apps and spatial datasets developed within the Time2Graze initiative (in synergy with the Global Pasture Watch framework). The session focuses on practical navigation and usage of dedicated web applications of Global Pasture Watch and Time2Graze. Participants will get an overview of the metrics and pasture data hosted in these tools, understanding how to visualize, interpret, and inspect high-resolution grassland dynamics directly from the browser. Finally, the course demonstrates how to access, query, and load the underlying Time2Graze data layers directly within the Google Earth Engine Code Editor, enabling attendees to seamlessly plug these collections into their own scripts and workflows.',
            speakers: [{ name: 'Vinícius', org: 'LAPIG' }],
            /* Supplied 14 September 2026 as a Google Slides link, not a file:
               it opens in Google's viewer and depends on that deck's sharing. */
            materials: [
              {
                kind: 'slides',
                href: 'https://docs.google.com/presentation/d/1xu0INje-lxsp1bSnOhQSYPGIXDlhV2dTg4SOOFrCJTM/edit',
                format: 'Google Slides',
              },
            ],
          },
        ],
      },
      {
        id: 'd1-lunch',
        date: '2026-09-14',
        start: '12:00',
        end: '14:00',
        title: 'Lunch',
        venueId: null,
        kind: 'meal',
      },
      {
        id: 'd1-field-protocol',
        date: '2026-09-14',
        start: '14:00',
        end: '15:30',
        title: 'Interactive Session: Field Protocol Alignment',
        speakers: [{ name: 'Nathália', org: 'LAPIG' }],
        venueId: 'lapig',
        kind: 'technical',
        /* Nathália's deck, supplied 14 September 2026 as a 48-page PDF; page 26
           (a presenter comment) is left out, and each
           page rendered to WebP and shown one per screen, fitted whole. */
        materials: [
          {
            kind: 'slides',
            title: 'Field Protocol Alignment',
            href: '/files/field-protocol-alignment/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/field-protocol-alignment/deck.pdf',
          },
          /* Teles et al. (2025), Land Degradation & Development 36:6539–6548,
             doi:10.1002/ldr.70089 — open access under CC BY, so it is hosted
             here as published. Supplied 14 September 2026. */
          {
            kind: 'document',
            title:
              'Pasture Degradation Estimates Through Field Data in the State of Goiás, Brazil (Teles et al., 2025)',
            href: '/files/field-protocol-alignment/teles-2025-pasture-degradation-goias.pdf',
            format: 'PDF',
          },
        ],
      },
      {
        id: 'd1-coffee',
        date: '2026-09-14',
        start: '15:30',
        end: '16:00',
        title: 'Coffee Break',
        venueId: 'lapig',
        kind: 'break',
      },
      {
        id: 'd1-field-visit',
        date: '2026-09-14',
        start: '16:00',
        end: '18:00',
        title: 'Field Visit — T2G Biomass Experimental Area',
        venueId: null,
        kind: 'field',
      },
      {
        id: 'd1-welcome-dinner',
        date: '2026-09-14',
        start: '18:00',
        end: '22:00',
        title: 'Welcome Dinner',
        venueId: null,
        venueNote: 'Pizza',
        kind: 'social',
      },
    ],
  },
  {
    index: 2,
    date: '2026-09-15',
    label: 'Retreat',
    sessions: [
      {
        id: 'd2-checkin',
        date: '2026-09-15',
        start: '08:30',
        end: '09:00',
        title: 'Brief check-in',
        venueId: null,
        kind: 'technical',
      },
      {
        id: 'd2-overview-toc',
        date: '2026-09-15',
        start: '09:00',
        end: '09:30',
        title: 'Project Overview & Theory of Change',
        speakers: [{ name: 'Santiago', org: 'GMH' }],
        venueId: null,
        kind: 'technical',
        /* Santiago's deck, supplied 15 September 2026 as a 22-slide PowerPoint;
           converted to PDF and rendered page by page to WebP, as the others
           were. The file's own two hidden slides stay hidden: the export
           carries the 20 the presenter shows. */
        materials: [
          {
            kind: 'slides',
            href: '/files/time2graze-vision/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/time2graze-vision/deck.pdf',
          },
        ],
      },
      {
        id: 'd2-priorities-barriers',
        date: '2026-09-15',
        start: '09:30',
        end: '11:00',
        title: 'Interactive Session: Priorities, Barriers, and Partner Needs',
        speakers: [{ name: 'Lindsey', org: 'WRI' }],
        venueId: null,
        kind: 'technical',
        /* Lindsey's deck, supplied 15 September 2026 as a PowerPoint held in
           Drive; converted and rendered like the others. */
        materials: [
          {
            kind: 'slides',
            href: '/files/priorities-barriers/index.html',
            format: 'HTML',
            pdfCopy: '/files/priorities-barriers/deck.pdf',
          },
          {
            kind: 'document',
            title: 'Workshop boards · 71 contributions',
            href: '/files/workshop-boards/',
            format: '3D',
            /* A render of the room's overview, cropped from the tool itself. */
            preview: '/images/workshop-boards/overview.webp',
          },
        ],
      },
      /**
       * The id still says open-agenda, as the afternoon one does: this hour
       * was one until Emily's talk filled it on 15 September 2026, and an id
       * is the address a shared link and a recap point at. The slot did not
       * move; only what happens in it.
       */
      {
        id: 'd2-open-agenda',
        date: '2026-09-15',
        start: '11:00',
        end: '12:00',
        title: 'Decision Support Tools',
        speakers: [{ name: 'Emily', org: 'WWF' }],
        venueId: null,
        kind: 'technical',
        materials: [
          {
            kind: 'slides',
            href: '/files/decision-support-tools/index.html',
            format: 'HTML',
            pdfCopy: '/files/decision-support-tools/deck.pdf',
          },
        ],
      },
      {
        id: 'd2-lunch',
        date: '2026-09-15',
        start: '12:00',
        end: '14:00',
        title: 'Lunch',
        venueId: null,
        kind: 'meal',
      },
      {
        id: 'd2-biomass-methodology',
        date: '2026-09-15',
        start: '14:00',
        end: '15:30',
        title:
          'Remote sensing overview and grassland biomass monitoring: State of the art and future applications',
        speakers: [{ name: 'Leandro', org: 'OGH' }],
        venueId: null,
        kind: 'technical',
        /* Leandro's deck, still being edited on 15 September 2026, so the
           site links the presentation itself rather than serving a copy:
           a copy taken today is a version of the talk that no longer
           exists, and nobody can correct the one already downloaded.
           Swap it for a rendered deck once the organiser says it is
           final. Whether it opens for a participant depends on that
           deck's own sharing, not on this site. */
        materials: [
          {
            kind: 'slides',
            href: 'https://docs.google.com/presentation/d/1Clyc1WjzC9ig2TuMB-K7yKjQF37-L8DJrF3dX3r_x6w/preview',
            format: 'Google Slides',
          },
          /* Leandro's inventory of biomass studies and data, requested on
             16 September 2026. A link, not a copy: he is still editing it.
             Shared "Anyone with the link → Viewer", checked the same day; if
             that ever becomes Editor, this link must come off the site. */
          {
            kind: 'document',
            title: 'Grassland biomass inventory: data, studies and LUE factor',
            href: 'https://docs.google.com/spreadsheets/d/1C2FSyCCmjtCMBgA-ikM16VVCcDSgfjrLz91bOGB_EXk/edit',
            format: 'Google Sheets',
          },
        ],
      },
      {
        id: 'd2-coffee',
        date: '2026-09-15',
        start: '15:30',
        end: '16:00',
        title: 'Coffee Break',
        venueId: null,
        kind: 'break',
      },
      {
        id: 'd2-pasto-legal',
        date: '2026-09-15',
        start: '16:00',
        end: '17:00',
        title: 'Pasto Legal',
        speakers: [
          { name: 'Leandro', org: 'OGH' },
          { name: 'Tiago', org: 'LAPIG' },
        ],
        venueId: null,
        kind: 'technical',
        /* Leandro's deck, still being edited on 15 September 2026, so the
           site links the presentation itself rather than serving a copy:
           a copy taken today is a version of the talk that no longer
           exists, and nobody can correct the one already downloaded.
           Swap it for a rendered deck once the organiser says it is
           final. Whether it opens for a participant depends on that
           deck's own sharing, not on this site. */
        materials: [
          {
            kind: 'slides',
            href: 'https://docs.google.com/presentation/d/1ODx-eduta8mzqfMLkMk-muaOio1T3lC80OIX2ppw0Fs/preview',
            format: 'Google Slides',
          },
        ],
      },
      {
        id: 'd2-daily-summary',
        date: '2026-09-15',
        start: '17:00',
        end: '18:00',
        title: 'Daily Summary',
        venueId: null,
        kind: 'technical',
      },
      {
        id: 'd2-dinner',
        date: '2026-09-15',
        start: '19:00',
        end: '21:00',
        title: 'Dinner',
        venueId: 'hotel',
        kind: 'meal',
      },
    ],
  },
  {
    index: 3,
    date: '2026-09-16',
    label: 'Retreat',
    sessions: [
      {
        id: 'd3-checkin',
        date: '2026-09-16',
        start: '08:30',
        end: '09:00',
        title: 'Brief check-in',
        venueId: null,
        kind: 'technical',
        materials: [
          {
            kind: 'document',
            title: 'Tuesday reflections',
            href: '/files/tuesday-reflections/',
            format: 'HTML',
          },
        ],
      },
      /* Took the 09:00 slot Laerte's talk left on 16 September 2026. */
      {
        id: 'd3-mattermost',
        date: '2026-09-16',
        start: '09:00',
        end: '09:45',
        title: 'Mattermost',
        speakers: [{ name: 'Leandro', org: 'OGH' }],
        venueId: null,
        kind: 'technical',
      },
      {
        id: 'd3-country-uruguay',
        date: '2026-09-16',
        start: '09:45',
        end: '10:30',
        title: 'Country Presentation: Uruguay',
        speakers: [{ name: 'INIA' }],
        venueId: null,
        kind: 'technical',
        /* Fernando Lattanzi's "DSS 3R web" deck, supplied 16 September 2026 as
           a 46-slide PowerPoint; rendered page by page to WebP, as the others
           were. */
        materials: [
          {
            kind: 'slides',
            href: '/files/dss-3r-web/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/dss-3r-web/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-country-argentina',
        date: '2026-09-16',
        start: '10:30',
        end: '11:15',
        title: 'Country Presentation: Argentina',
        speakers: [{ name: 'UIB - INTA & UNMdP' }],
        venueId: null,
        kind: 'technical',
        /* Germán Berone's deck, supplied 16 September 2026 as a 16-slide
           PowerPoint; the one hidden slide stays hidden, so 15 are published. */
        materials: [
          {
            kind: 'slides',
            href: '/files/country-argentina/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/country-argentina/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-country-colombia',
        date: '2026-09-16',
        start: '11:15',
        end: '12:30',
        title: 'Country Presentation: Colombia',
        speakers: [{ name: 'CIAT' }],
        venueId: null,
        kind: 'technical',
        /* "Time2Graze: Decision Support System Advances for Colombia and
           Brazil" (Alliance of Bioversity International and CIAT), supplied
           16 September 2026 as a 20-slide PowerPoint. */
        materials: [
          {
            kind: 'slides',
            href: '/files/dss-colombia-brazil/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/dss-colombia-brazil/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-lunch',
        date: '2026-09-16',
        start: '12:30',
        end: '14:00',
        title: 'Lunch',
        venueId: null,
        kind: 'meal',
      },
      {
        id: 'd3-country-nigeria',
        date: '2026-09-16',
        start: '14:00',
        end: '14:45',
        title: 'Country Presentation: Nigeria',
        venueId: null,
        kind: 'technical',
        /* Stella Egbe's deck (Nigerian Conservation Foundation), supplied
           16 September 2026 as a 34-slide PowerPoint. */
        materials: [
          {
            kind: 'slides',
            href: '/files/country-nigeria/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/country-nigeria/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-country-zimbabwe',
        date: '2026-09-16',
        start: '14:45',
        end: '15:30',
        title: 'Country Presentation: Zimbabwe',
        venueId: null,
        kind: 'technical',
        /* WWF-Zimbabwe's deck, supplied 16 September 2026 as a 21-slide
           PowerPoint. */
        materials: [
          {
            kind: 'slides',
            href: '/files/country-zimbabwe/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/country-zimbabwe/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-country-tanzania',
        date: '2026-09-16',
        start: '15:30',
        end: '16:15',
        title: 'Country Presentation: Tanzania',
        venueId: null,
        kind: 'technical',
        /* WWF-Tanzania's "Towards Rangeland Decision Support Tool", supplied
           16 September 2026 as a 13-slide PowerPoint in Drive (100 MB, mostly
           full-size photographs); served as a rendered copy, not the link. */
        materials: [
          {
            kind: 'slides',
            href: '/files/country-tanzania/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/country-tanzania/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-coffee',
        date: '2026-09-16',
        start: '16:15',
        end: '17:00',
        title: 'Coffee Break',
        venueId: null,
        kind: 'break',
      },
      /**
       * The id still says state-of-the-art: an id is the address a shared link
       * and a recap point at. Nathália's biomass talk was dropped on
       * 15 September 2026 and Laerte's moved here from Day 2, 16:45; on
       * 16 September 2026 it moved again, from 09:00 to 17:00 the same day.
       */
      {
        id: 'd3-state-of-the-art',
        date: '2026-09-16',
        start: '17:00',
        end: '17:45',
        title: 'A few lessons from recent field campaigns in Brazil',
        speakers: [{ name: 'Laerte', org: 'LAPIG' }],
        venueId: null,
        kind: 'technical',
        /* Laerte's deck, supplied 15 September 2026 as Google Slides; exported
           to PDF and rendered page by page to WebP, as Nathália's Field
           Protocol deck was, so the site serves it without depending on that
           deck's sharing. */
        materials: [
          {
            kind: 'slides',
            href: '/files/field-lessons-brazil/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/field-lessons-brazil/deck.pdf',
          },
        ],
      },
      {
        id: 'd3-daily-summary',
        date: '2026-09-16',
        start: '17:45',
        end: '18:15',
        title: 'Daily Summary',
        venueId: null,
        kind: 'technical',
      },
      {
        id: 'd3-dinner',
        date: '2026-09-16',
        start: '19:00',
        end: '21:00',
        title: 'Dinner',
        venueId: 'hotel',
        kind: 'meal',
      },
    ],
  },
  {
    index: 4,
    date: '2026-09-17',
    label: 'Retreat',
    sessions: [
      {
        id: 'd4-checkin',
        date: '2026-09-17',
        start: '08:30',
        end: '09:00',
        title: 'Brief check-in',
        venueId: null,
        kind: 'technical',
      },
      /* Taken off Day 3 on 16 September 2026 and held here on 17 September.
         The id keeps its d3 prefix: it is the address shared links point at. */
      {
        id: 'd3-country-uganda',
        date: '2026-09-17',
        start: '09:00',
        end: '10:00',
        title: 'Country Presentation: Uganda',
        venueId: null,
        kind: 'technical',
        materials: [{ kind: 'slides' }],
      },
      {
        id: 'd4-collaboration-map',
        date: '2026-09-17',
        start: '10:00',
        end: '12:00',
        title: 'Interactive workshop: Building a collaboration map and country uptake journey',
        speakers: [{ name: 'Beatriz', org: 'OGH' }],
        venueId: null,
        kind: 'technical',
        /* Beatriz's deck, supplied 17 September 2026 as Google Slides while
           she was still editing it during the session, so the site links the
           presentation rather than serving a copy. /preview, not /edit: the
           deck is shared "Anyone with the link → Commenter", and this site
           should not invite readers into it. */
        materials: [
          {
            kind: 'slides',
            href: 'https://docs.google.com/presentation/d/1iftFMGiPI1Uqf-Pq1ycbpJkqvbqafaOFVLDJWsxGj3Y/preview',
            format: 'Google Slides',
          },
        ],
      },
      {
        id: 'd4-lunch',
        date: '2026-09-17',
        start: '12:00',
        end: '14:00',
        title: 'Lunch',
        venueId: null,
        kind: 'meal',
      },
      /* A split session until 17 September 2026, when it became two plenary
         sessions in sequence. The former track ids are kept as session ids. */
      {
        id: 'd4-methane-data',
        date: '2026-09-17',
        start: '14:00',
        end: '15:00',
        title: 'Livestock Methane Emission Data',
        speakers: [{ name: 'Humberto', org: 'LAPIG' }],
        venueId: null,
        kind: 'technical',
        /* Humberto's deck, supplied 17 September 2026 as a PDF; rendered page
           by page to WebP, like the other decks. */
        materials: [
          {
            kind: 'slides',
            href: '/files/livestock-methane/index.html',
            format: 'HTML',
            /* The same pages as one PDF: offline, and a fallback if the
               viewer fails a reader. */
            pdfCopy: '/files/livestock-methane/deck.pdf',
          },
        ],
      },
      {
        id: 'd4-dst-data-production',
        date: '2026-09-17',
        start: '15:00',
        end: '15:30',
        title: 'Challenges and Synergies of AI-Based Back-Ends and DST',
        speakers: [{ name: 'Leandro', org: 'OGH' }],
        venueId: null,
        kind: 'technical',
        materials: [{ kind: 'slides' }],
      },
      {
        id: 'd4-coffee',
        date: '2026-09-17',
        start: '15:30',
        end: '16:00',
        title: 'Coffee Break',
        venueId: null,
        kind: 'break',
      },
      {
        id: 'd4-roadmap',
        date: '2026-09-17',
        start: '16:00',
        end: '17:30',
        title: "Building Together the Roadmap for the Project's Next Steps",
        speakers: [
          { name: 'Santiago', org: 'GMH' },
          { name: 'Lindsey', org: 'WRI' },
        ],
        venueId: null,
        kind: 'technical',
        materials: [{ kind: 'slides' }],
      },
      {
        id: 'd4-wrap-up',
        date: '2026-09-17',
        start: '17:30',
        end: '18:00',
        title: 'Wrap-up: Summary of Key Takeaways',
        speakers: [{ name: 'Laerte', org: 'LAPIG' }],
        venueId: null,
        kind: 'technical',
        materials: [{ kind: 'slides' }],
      },
      {
        id: 'd4-closing-reception',
        date: '2026-09-17',
        start: '18:30',
        end: '21:30',
        title: 'Closing Reception',
        venueId: null,
        kind: 'social',
      },
    ],
  },
  {
    index: 5,
    date: '2026-09-18',
    label: 'Field',
    materials: [{ kind: 'document', title: 'Field visit information sheet' }],
    sessions: [
      {
        id: 'd5-trip-out',
        date: '2026-09-18',
        start: '06:00',
        end: '09:30',
        title: 'Trip to Cidade de Goiás',
        venueId: 'cidadeDeGoias',
        kind: 'transport',
      },
      {
        id: 'd5-farm-morning',
        date: '2026-09-18',
        start: '09:30',
        end: '12:00',
        title: 'Field Visit: Grazing Livestock Farm',
        venueId: null,
        /* Named by the organiser on 11 September 2026. It is not a registry
           venue — no sourced pin, and nobody navigates there alone — so it
           rides the agenda line as the organiser writes it. */
        venueNote: 'Fazenda Buriti Queimado',
        kind: 'field',
        /* LAPIG's map sheet of the farm, supplied 12 September 2026.
           `data/field-visit.ts` reads this href for Travel & stay. */
        materials: [
          {
            kind: 'document',
            title: 'Farm map sheet',
            href: '/files/fazenda-buriti-queimado-map.webp',
            format: 'WebP',
          },
        ],
      },
      {
        id: 'd5-lunch',
        date: '2026-09-18',
        start: '12:30',
        end: '14:30',
        title: 'Lunch',
        venueId: 'cidadeDeGoias',
        kind: 'meal',
      },
      {
        id: 'd5-city-tour',
        date: '2026-09-18',
        start: '14:30',
        end: '16:30',
        title: 'City Tour',
        venueId: 'cidadeDeGoias',
        kind: 'social',
      },
      {
        id: 'd5-serra-dourada',
        date: '2026-09-18',
        start: '16:30',
        end: '17:00',
        title: 'Serra Dourada Lookout',
        venueId: null,
        kind: 'social',
      },
      {
        id: 'd5-trip-back',
        date: '2026-09-18',
        start: '17:00',
        end: '19:00',
        title: 'Return trip to Goiânia',
        venueId: null,
        kind: 'transport',
      },
      {
        id: 'd5-dinner',
        date: '2026-09-18',
        start: '19:00',
        end: '21:00',
        title: 'Dinner',
        venueId: 'hotel',
        kind: 'meal',
      },
    ],
  },
];
