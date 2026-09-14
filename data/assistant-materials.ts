/**
 * Searchable text for a supplied presentation.
 *
 * The deck is a self-contained HTML file, so its styles, scripts and embedded
 * images are deliberately not part of the assistant corpus. These entries are
 * a bounded transcription of the teaching content a reader can see in Module
 * 1; `slides` names the exact slides that support each entry.
 */
export type AssistantMaterialSection = {
  id: string;
  title: string;
  slides: string;
  text: string;
};

export const VISUAL_INSPECTION_MODULE = {
  title: 'Module 1 · Mapping with the Eye',
  href: '/files/visual-inspection-module-1/index.html',
  sections: [
    {
      id: 'visual-inspection-course-structure',
      title: 'Course structure',
      slides: '2',
      text:
        'Module 1 moves through four stages: how satellite images are formed; what to observe in an image; how to identify and compare land-cover classes; and practice with real examples.',
    },
    {
      id: 'visual-inspection-foundations',
      title: 'Light, cameras and satellite images',
      slides: '3–10',
      text:
        'The module starts with how energy becomes an image. Different wavelengths are perceived as colours; cameras record red, green and blue, while satellites also record wavelengths people cannot see in pixels and spectral bands. Objects absorb and reflect solar energy differently, creating spectral signatures. True-colour composites resemble human vision; false-colour composites can make vegetation or deforestation easier to distinguish.',
    },
    {
      id: 'visual-inspection-elements',
      title: 'The seven elements of visual interpretation',
      slides: '11–20',
      text:
        'Visual interpretation uses colour, tone, texture, shape, spatial context, spectral indices and temporal patterns together. Tone is the amount of white or black mixed into a colour. Texture considers smooth or rough surface height differences and homogeneous or heterogeneous tone variation. Well-defined shapes can indicate human alteration, while natural areas tend toward organic shapes. Context can confirm a hypothesis or overturn it: similar exposed-looking patches may be clouds when the wider image is considered.',
    },
    {
      id: 'visual-inspection-vegetation-change',
      title: 'NDVI, degradation and change over time',
      slides: '21–24',
      text:
        'NDVI is presented as a way to assess vegetation health, distinguish vegetation types and reveal seasonality. Deciduous vegetation loses leaves in the dry season while evergreen vegetation does not. The module shows spectral behaviour changing as a leaf degrades, NDVI revealing deforestation and regeneration over time, and an abrupt NDVI drop after a fire followed by recovery over the next days.',
    },
    {
      id: 'visual-inspection-class-examples',
      title: 'Land-cover class examples',
      slides: '25–42',
      text:
        'The final examples compare forest, water, savanna, grassland, crops, silviculture, mining, rice, urban areas and natural or cultivated pasture. They combine image appearance with spectral and temporal evidence: water has NDVI below zero; rice can show small plots, moisture colouring and irrigation channels; silviculture may show plot boundaries, rough homogeneous texture and an NDVI cycle of planting, maturity and harvest.',
    },
  ] satisfies AssistantMaterialSection[],
};
