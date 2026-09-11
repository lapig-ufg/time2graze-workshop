export type Institution = {
  name: string;
  href: string;
  logo: string;
  /**
   * The mark's own dimensions, in its own file. Every asset is cropped to its
   * artwork, so these are ink and not canvas: they are what the home page
   * scales the marks by.
   */
  width: number;
  height: number;
};

/**
 * Only marks currently cleared for display belong here. Other candidate
 * assets remain in public/logos/institutions for research and must not be
 * restored to the page without institutional approval.
 */
export const DISPLAYED_INSTITUTIONS: Institution[] = [
  {
    name: 'Time2Graze',
    href: 'https://alliancebioversityciat.org/projects/time2graze',
    logo: '/logos/institutions/time2graze.png',
    width: 409,
    height: 236,
  },
  {
    name: 'Land & Carbon Lab',
    href: 'https://landcarbonlab.org/',
    logo: '/logos/institutions/land-carbon-lab.svg',
    width: 400,
    height: 176,
  },
  {
    name: 'OpenGeoHub',
    href: 'https://opengeohub.org/',
    logo: '/logos/institutions/opengeohub.svg',
    width: 542,
    height: 128,
  },
  {
    name: 'Federal University of Goiás',
    href: 'https://ufg.br/',
    logo: '/logos/institutions/ufg-color-horizontal.png',
    width: 652,
    height: 335,
  },
  {
    name: 'LAPIG',
    href: 'https://lapig.iesa.ufg.br/',
    logo: '/logos/institutions/lapig-en-color.png',
    width: 958,
    height: 407,
  },
  {
    name: 'FUNAPE',
    href: 'https://site.funape.org.br/',
    logo: '/logos/institutions/funape.png',
    width: 256,
    height: 71,
  },
];
