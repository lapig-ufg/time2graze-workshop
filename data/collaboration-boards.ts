import type { BoardNote, NoteColor, WorkshopBoard } from '../tools/workshop-boards/types';

/** 17 September 2026. Transcribed content supplied by the organiser.
 * Coordinates follow the seven supplied board photographs.
 * Bracketed English annotations preserve uncertainty in the supplied transcript. */
const boards: WorkshopBoard[] = [];
function board(id: string, title: string) {
  const entry: WorkshopBoard = {id,title,facilitator:'',notes:[]};
  boards.push(entry);
  return (text: string, color: NoteColor, x: number, y: number, width: number, height: number, rotation=0, group?: string, label=false) => {
    const note: BoardNote={id:`${id}-${String(entry.notes.length+1).padStart(2,'0')}`,text,color,x,y,width,height,rotation,...(group?{group}:{}),...(label?{label:true}:{})};
    entry.notes.push(note);
  };
}

const ar=board('argentina','Argentina');
ar('STRENGHT\n• TRANSLATING SCIENTIFIC KNOWLEDGE INTO PRACTICAL RULES FOR DECISION MAKING\nARGENTINA','blue',.13,.29,.24,.10,3,'Strength');
ar('STRENGHT\n• GOOD UNDERSTANDING OF HOW PRODUCTION SYSTEMS OPERATE\nARGENTINA.','blue',.14,.425,.24,.10,2,'Strength');
ar('MISSING.\nIDENTIFY PARTNERS TO SCALE UP AND KEEP THE INITIATIVE ACTIVE.\nARGENTINA.','blue',.82,.325,.20,.09,2,'Missing');
ar('MISSING\n• ACCURATE NRT SANTIND [standing] BIOMASS (AMOUNT AND QUALITY) DATA.\n[Crossed-out term]\nARGENTINA.','blue',.82,.455,.20,.09,1,'Missing');

const ng=board('nigeria','Nigeria');
ng('Skills we have\n• GIS\n• Stakeholders Engagement\n• Policy\n• Networking\nAdedamola (Nigeria)','green',.145,.205,.20,.095,5,'Skills');
ng('What we are good at\n• Stakeholder Engagement:\n  1. Government\n  2. Academia\n  3. Communities.\nNigeria','blue',.135,.335,.19,.09,-1,'Strength');
ng('What we are good at\n• Influence policy at:\n  1. Government level.\n  2. Community level.\n• Effective communication\nNigeria','blue',.15,.445,.19,.09,-1,'Strength');
ng('• Protected Areas Management\n• Research.','blue',.15,.57,.19,.09,-4,'Strength');
ng('What I need help with\n1. Development of the DST\n2. Translation of Biomass data on the ground.\nNigeria','blue',.62,.22,.19,.095,2,'Needs');
ng('What We Need.\n• Domesticate DST\n[Pilot — crossed out]','green',.61,.36,.19,.09,1,'Needs');
ng('What we need\n• Historical data on grazing systems','blue',.615,.48,.19,.095,-2,'Needs');

const co=board('colombia','Colombia');
const coTexts=[
  'Colombia Strength\n• Relationship with private sector and access to field sites for piloting and testing with producers.',
  'Colombia. Strength\nTropical forage agronomy',
  'Colombia. Strength\nHuman centered design.',
  'Colombia. Strenght\n• Trade-off analyses of a technological intervention (economic and ecological)',
  'Colombia Strength.\nEnvironmental analyses (impacts of soil [Crossed-out term] health, for example)',
  'Colombia Strength\nSensitivity and respectful engagement with rural communities.',
  'INTEGRATION OF DIFFERENT DATA SOURCES\nStrength Colombia',
  'SOFTWARE DEVELOPMENT\nAI ENGINEERING\nStrength Colombia',
  'COMPILED HISTORICAL RESEARCH DATA\nStrength Colombia',
  'GEOSPATIAL PROCESSING\nStrength Colombia',
  'AI FOR EARTH OBSERVATION\nStrength Colombia',
  'RESEARCH IN LOW METHANE FORAGES\nStrength Colombia',
  'Weakness\n• Design of grazing management plans that are tailored to different value chains (Beef vs milk vs dual purpose)',
  'IMPROVE KNOWLEDGE ON GRAZING BEST PRACTICES',
  'How to improve communication and information delivery?\nMissing Colombia',
];
const coLayout=[
  [.12,.195,.20,.09,-8],[.13,.31,.20,.09,1],[.13,.41,.20,.09,0],
  [.13,.50,.20,.09,-2],[.14,.595,.20,.09,3],[.14,.685,.19,.085,0],
  [.55,.235,.20,.09,2],[.775,.215,.20,.09,2],[.54,.345,.20,.09,1],
  [.775,.325,.20,.09,2],[.53,.455,.20,.085,4],[.755,.435,.20,.085,1],
  [.64,.83,.19,.085,0],[.55,.94,.19,.08,3],[.75,.93,.19,.085,-1],
];
coTexts.forEach((text,i)=>{
  const [x,y,w,h,r]=coLayout[i];
  // Note 13 is headed Weakness and note 15 Missing; the blue note carries no heading.
  co(text,i===13?'blue':'salmon',x,y,w,h,r,i<12?'Strength':i===12?'Weakness':i===14?'Missing':undefined);
});

const zw=board('zimbabwe','Zimbabwe');
['TRAINING & CAPACITY BUILDING','COMMUNITY ENGAGEMENT','RANGELAND MODELLING','GIS CAPACITY','RANGELANDS MANAGEMENT','ECOLOGY','RESEARCH'].forEach((text,i)=>zw(text,'yellow',[.14,.14,.13,.15,.18,.185,.19][i],[.25,.39,.50,.61,.70,.795,.89][i],.19,.09,[0,5,5,7,3,0,-3][i],'Strength'));
zw('WHY\nLIMITED EXPERTISE','salmon',.425,.27,.19,.09,3,'Why');
zw('WEAK INSTITUTIONAL INSIGHTS','salmon',.435,.415,.19,.09,0,'Why');
zw('WEAK COLLABORATIVE FRAMEWORKS','salmon',.455,.54,.18,.09,4,'Why');
zw('HELP WITH\n• TOOL DVLPT.','salmon',.75,.285,.19,.09,2,'Help with');

const tz=board('tanzania','Tanzania');
tz('Strength\nDST:\n• Management\n• Trainings [Community Support — crossed out]\n• Citizen Science → Data collection → Decemination [dissemination]\n• Team Internal Capacity:\n  – Comms\n  – Advocacy\n  – Livestock Management (Partner / Practices)\n• Spatial Data.','blue',.17,.34,.28,.14,-1,'Strength');
tz("What we are missing (Need)\n[Data — crossed out] Utilization\n• Open data hub\n• Biomass Data\n• ML model with Data driven model with citizen science model\n• Pastoralist's modus operandi",'blue',.60,.335,.28,.13,-1,'Missing');
tz('What we are missing?\n• USSD (Unstructured Supplementary Service Data)\n• Mobile APP\n• SMS bulk System.\n• GPS tracking','blue',.595,.49,.28,.14,-2,'Missing');

const uy=board('uruguay','Uruguay');
uy('Strenght (UY)\n• Good understanding of biophysical function of animal production system','blue',.20,.30,.32,.14,1,'Strength');
uy('Strenght (UY)\n• I can give good talks to technicians and to farmers','blue',.205,.48,.32,.14,-2,'Strength');
uy('Strenght (UY)\n• Capable of identifying key drivers of impact, and design DST to manage them simply','blue',.215,.66,.32,.14,-3,'Strength');
uy('Missing\n• [Crossed-out term] Near-real time measurement of [crossed-out term] amount & quality of standing biomass','blue',.64,.305,.28,.13,2,'Missing');
uy('Missing\n• $ to fund a PhD student that will assess integrating satellite + models + field data to estimate biomass','blue',.64,.47,.28,.13,-1,'Missing');
uy('Missing\n• Knowledge to use chat bot [or chat box — uncertain reading]','blue',.65,.655,.28,.135,-3,'Missing');
uy('Missing\n• Capability to map & understand users','blue',.66,.825,.28,.13,-4,'Missing');

const br=board('brazil-rs','Brazil / RS Team');
br('We Can HELP','green',.10,.14,.18,.075,-2,undefined,true);
br('We MISS','green',.83,.14,.20,.08,0,undefined,true);
br('LEANDRO\n• I good in:\n  – Organize different types of Data\n  – Process Satellite data\n  – Develop AI / webmaps Applications','green',.10,.235,.18,.075,-2,'We can help');
br('Emily @ WWF-US\nStrength\n• decision support tools & modelling\n• climate change account. & estimation','pink',.335,.30,.19,.085,-2,'We can help');
br('Vinicius LAPIG/UFG - 2. STRENGTHS\n• Remote Sensing and GIS Analyses\n• Google Earth Engine training and Apps\n• Impact Photography for storytelling (wildlife and landscapes)\n• Land use and land cover mapping of large areas (cloud computing)\n• Field Work planning','salmon',.045,.38,.115,.145,0,'We can help');
br('Research assistant and field lead in Brazil\n• I know how to communicate with farmers\n• Have connections with farmer and local agencies (extension)\n• Experience with institutional articulation and organizing events and capacity building\nNathalia','salmon',.20,.35,.18,.09,-1,'We can help');
br('We can contribute with translating technical RS information / data into practical / useful state / information\nRenata','yellow',.215,.45,.18,.09,-2,'We can help');
br('I Can offer: Connection to (Some) other (Mostly global) Maps + Monitoring products.\n– Lindsey','yellow',.125,.535,.18,.085,-2,'We can help');
br("I'm good at talking to people and try to find ways to collaborate;\nI'm good at translating technical knowledge / data into understandable / effective terms.\nRenata",'yellow',.32,.535,.18,.09,-1,'We can help');
br('• Research & Development of high-resolution Earth Observation data and remotesensing techniques.\n• Production of GPP → Biomass datasets.\nSerban','green',.105,.675,.18,.075,1,'We can help');
br("I'M GOOD AT CONNECT PEOPLE\nI'm a project coordinator, so I CAN UNDERSTAND THE NEEDS of projects and connect THE DOTS, AVOIDING WAST OF TIME AND RESOURCES.\nI HAVE A NETWORK OF RELEVANT STAKEHOLDERS that can be testers AND provide PILOT AREAS. (FOR LATAM)\nMaiara",'salmon',.315,.70,.19,.185,2,'We can help');
br('I am skilled in:\n• working with geospatial data and remote sensing\n• estimating Methane emissions using various methods\n• working with various meteorological datasets\nHumberto','salmon',.13,.81,.18,.085,1,'We can help');
br('Bottlenecks (possible):\nNRT data might require country-wise calibration based on in-situ observations which is a [not a / non- — uncertain reading] trivial task and not easy to find for everywhere.\nSerban','green',.84,.25,.20,.075,-2,'We miss');
br('LEANDRO\n• I need help with:\n  – access field data\n  – connect with users and forms [farms/farmers — uncertain reading], pastoralists for feedback','green',.84,.35,.20,.085,-2,'We miss');
br("I NEED A PLATFORM WHERE THE END USER CAN OBTAIN INFO FOR A POLYGON / LIST OF POLYGONS AND GENERATE A REPORT.\nINFO: Pasture Degradation + OTHER LAYERS THAT WRI ALREADY WORK / MAKE SERVING AS 'PHOTOGRAPHY' AND MONITORING SYSTEM.\nMAIARA",'salmon',.625,.45,.19,.085,3,'We miss');
br('I miss more systematic country to country discussion;\nI miss a clear understanding of each geography / respective realities;\nso in fact, I miss the opportunity to visit each country and learn from the local realities / invite me!','yellow',.855,.455,.20,.10,-1,'We miss');
br('Come to me with ideas for joint fundraising for other parts of this project.\n– Lindsey','yellow',.735,.56,.20,.09,-4,'We miss');
br('Need: Concrete User Stories to feature in a Time2Graze Webinar.\n– Lindsey','yellow',.795,.74,.20,.10,1,'We miss');
br('We need ground data or contact with those (institutions, universities) that detain ground data and local knowledge.','salmon',.585,.655,.19,.095,2,'We miss');
br('Vinicius LAPIG/UFG - MISSING:\n• Ground data for model calibration\n• Ground Photos for mapping validation and improvement','salmon',.925,.595,.13,.16,-2,'We miss');

export const WORKSHOP_BOARDS = boards;
export const BOARD_MARKS: [number,number,string][][] = boards.map(()=>[]);
