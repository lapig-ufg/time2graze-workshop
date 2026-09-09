/** Participant-facing city context. Sources: research/geography.md. */
export const CITY_STORIES = {
  goiania: {
    title: 'Goiânia',
    subtitle: 'A young capital',
    workshopContext: 'Goiânia is your base during the workshop week. Outside the programme, its parks, cafés and cultural venues offer places to spend your free time.',
    paragraphs: [
      'Founded in 1933, Goiânia is a relatively young city. It was planned as the new capital of Goiás, more than two centuries after the origins of nearby Cidade de Goiás. The state government moved here in 1937.',
      'Architect Attílio Corrêa Lima designed the new city around a civic centre. Its planned avenues and Art Deco buildings belong to that twentieth-century beginning. The city was built near the older settlement of Campinas, now one of its neighbourhoods.',
    ],
    source: { label: 'City history · Goiânia City Hall', href: 'https://www.goiania.go.gov.br/sobre-goiania/historia-de-goiania/' },
  },
  goias: {
    title: 'Cidade de Goiás',
    subtitle: 'The former capital',
    paragraphs: [
      'Cidade de Goiás grew from the gold-mining settlement of Sant’Anna, founded in 1727. Later known as Vila Boa, it became the region’s administrative centre and remained the capital until the government moved to Goiânia in 1937.',
      'Its historic centre follows the Rio Vermelho between surrounding hills. Streets, houses, churches and public buildings developed with the terrain, using local materials and building traditions. UNESCO recognised this urban and architectural heritage in 2001.',
    ],
    details: [
      { title: 'The river and the town', text: 'The Rio Vermelho runs through the historic centre. The relationship between water, hills and buildings is central to the town’s World Heritage recognition.' },
      { title: 'Cora Coralina', text: 'The poet Cora Coralina (1889–1985) is part of the city’s literary history. Her former home is now a museum preserving her manuscripts, photographs and everyday objects.' },
      { title: 'Living heritage', text: 'The city’s heritage also includes poetry, music, food and popular celebrations. These traditions remain part of local life alongside its preserved architecture.' },
    ],
    sources: [
      { label: 'UNESCO World Heritage', href: 'https://whc.unesco.org/en/list/993/' },
      { label: 'Museu Casa de Cora Coralina', href: 'https://museucoracoralina.com.br/o-museu/' },
    ],
  },
} as const;

export const GUIDE_SOURCE = 'https://www.google.com/maps/d/viewer?mid=1wDascwQKCzMgoPfq7yvsy1KGaMoXnUc';
export const GUIDE_CATEGORIES = ['Food & coffee', 'Parks & culture', 'Shopping'] as const;
export type GuideCategory = typeof GUIDE_CATEGORIES[number];
export type GuidePlace = {
  id: string;
  name: string;
  category: GuideCategory;
  area: string;
  description: string;
  coords: { lat: number; lon: number };
  website: string;
};

/** Pins retained exactly from the organiser's reference My Maps export.
 * Descriptions checked against the linked first-party pages on 9 September 2026.
 * These are free-time options, not workshop venues or promised opening times.
 */
export const GUIDE_PLACES: GuidePlace[] = [
  { id: 'luiz-cafe', name: 'Luiz Café Concept', category: 'Food & coffee', area: 'Setor Oeste', description: 'Specialty coffee from the café’s own family-grown beans.', coords: { lat: -16.6883494, lon: -49.2634343 }, website: 'https://luizcafe.com.br/' },
  { id: 'la-farine', name: 'La Farine · Marista', category: 'Food & coffee', area: 'Setor Marista', description: 'Restaurant and café in the Marista neighbourhood.', coords: { lat: -16.7038444, lon: -49.2627303 }, website: 'https://linktr.ee/lafarine.go' },
  { id: 'flamboyant-park', name: 'Parque Flamboyant', category: 'Parks & culture', area: 'Jardim Goiás', description: 'An urban park with lakes, walking paths and a cycle path.', coords: { lat: -16.7032003, lon: -49.2388233 }, website: 'https://www.goiania.go.gov.br/goianiatur/turismo/roteiros-turisticos/' },
  { id: 'vaca-brava', name: 'Parque Vaca Brava', category: 'Parks & culture', area: 'Setor Bueno', description: 'A park with a lake and walking track, opposite Goiânia Shopping.', coords: { lat: -16.7096318, lon: -49.2705758 }, website: 'https://www.goiania.go.gov.br/goianiatur/turismo/roteiros-turisticos/' },
  { id: 'niemeyer', name: 'Centro Cultural Oscar Niemeyer', category: 'Parks & culture', area: 'South-east Goiânia', description: 'A cultural complex designed by Oscar Niemeyer, home to the Museum of Contemporary Art.', coords: { lat: -16.7113351, lon: -49.227805 }, website: 'https://goias.gov.br/cultura/museu-de-ar/' },
  { id: 'flamboyant-shopping', name: 'Flamboyant Shopping', category: 'Shopping', area: 'Jardim Goiás', description: 'Shopping, cafés and restaurants, including two food courts.', coords: { lat: -16.7102509, lon: -49.2370077 }, website: 'https://flamboyant.com.br/gastronomia/' },
  { id: 'goiania-shopping', name: 'Goiânia Shopping', category: 'Shopping', area: 'Setor Bueno', description: 'Shops, food and services opposite Parque Vaca Brava.', coords: { lat: -16.7083507, lon: -49.272809 }, website: 'https://goianiashop.com.br/sobre-o-shopping/' },
];
