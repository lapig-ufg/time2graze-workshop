import { AGENDA } from './agenda';

/**
 * The map sheet of Fazenda Buriti Queimado, the Day 5 morning field visit.
 *
 * Supplied on 12 September 2026 as an A4 sheet at 300 dpi (7015 × 9933 px, a
 * 29.7 MB PNG). What ships is two WebP derivatives of that file:
 *
 * - the full sheet at half resolution, 3508 × 4967 — the paddock numbers and
 *   the legends stay sharp when zoomed on a phone, at a ninth of the weight;
 * - a 1000px preview for the page itself, which only has to be recognisable.
 *
 * The full file is also the material declared on `d5-farm-morning`, and its
 * address is read from there rather than written twice.
 *
 * Every line below is transcribed from the sheet. Nothing is added to it:
 * the paddock count, the farm's area and the reading of each map are not
 * stated on the sheet and are not stated here.
 */
const SESSION_ID = 'd5-farm-morning';

const session = AGENDA.flatMap((day) => day.sessions).find(
  (s) => s.id === SESSION_ID,
);
const sheet = session?.materials?.find((m) => m.href);
if (!session || !sheet?.href) {
  throw new Error(`${SESSION_ID} must declare the farm map sheet with an href`);
}

export const FARM_MAP = {
  sessionId: SESSION_ID,
  name: session.venueNote ?? 'Fazenda Buriti Queimado',
  session,
  full: {
    src: sheet.href,
    width: 3508,
    height: 4967,
    size: '3.2 MB',
    format: sheet.format ?? 'WebP',
  },
  preview: {
    src: '/images/farm/fazenda-buriti-queimado-preview.webp',
    width: 1000,
    height: 1416,
  },
  alt: 'Map sheet of Fazenda Buriti Queimado. A satellite image of the farm with its boundary in yellow and numbered paddocks in cyan, a locator map of Goiás state, and six smaller maps of the same area: land use and land cover, pasture vigour, pasture productivity, elevation, terrain slope and median vegetation height.',
  /** The main map, then the six panels in the order the sheet reads. */
  maps: [
    'Farm boundaries, paddocks and plots over a CBERS-4A image, 2 m, 20 May 2024',
    'Land use and land cover · MapBiomas Brazil 10 m, Collection 4, 2025',
    'Pasture vigour condition · 2025',
    'Pasture productivity · 2025, t DM/ha/year',
    'Elevation · m',
    'Terrain slope · degrees',
    'Median vegetation height · 2025, m',
  ],
  facts: [
    ['Prepared by', 'Vinícius V. Mesquita, PhD · LAPIG/UFG'],
    ['Date', '11 September 2026'],
    ['Projection', 'UTM zone 22S · SIRGAS 2000'],
    [
      'Data',
      'Copernicus, Global Pasture Watch, Google Earth Engine, IBGE, INPE, MapBiomas Brazil',
    ],
  ],
} as const;
