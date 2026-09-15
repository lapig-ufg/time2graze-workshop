// One-time import aid. The resulting typed data is reviewed and maintained by hand.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { placements } from './layout.ts';

const source = (await readFile(process.argv[2], 'utf8')).replace(/\r\n/g, '\n');
const sections = source.split(/^# \d\. /m).slice(1);
const ids = ['success', 'barriers', 'questions', 'outcomes'];
const facilitators = ['Bea', 'Leandro', 'Nathalia', 'Emily'];
const boards = sections.map((section, boardIndex) => {
  const id = ids[boardIndex];
  const title = section.split(' (')[0];
  const notes = [];
  let group;
  let current;
  let themes;
  for (const line of section.split('\n').slice(1)) {
    if (line.startsWith('### ')) {
      group = line.slice(4).trim();
      current = undefined;
      if (group.startsWith('Texto Manuscrito')) themes = [];
    } else if (line.startsWith('* **[')) {
      const match = line.match(/^\* \*\*\[([^\]]+)\]\*\*\s*(.*)$/);
      if (!match) throw new Error(line);
      const color = /Azul/.test(match[1]) ? 'blue' : /Amarelo/.test(match[1]) ? 'yellow' : /Verde/.test(match[1]) ? 'green' : /Rosa|Magenta/.test(match[1]) ? 'pink' : 'salmon';
      const p = placements[boardIndex][notes.length];
      if (!p) throw new Error(`Missing position ${id} ${notes.length}`);
      current = { id: `${id}-${String(notes.length + 1).padStart(2, '0')}`, text: match[2].trim(), color, x: p[0], y: p[1], width: p[2], height: p[3], rotation: p[4], ...(boardIndex === 3 ? {group} : {}) };
      notes.push(current);
    } else if (line.startsWith('  ') && current) {
      current.text += `${current.text ? '\n' : ''}${line.trim().replace(/^\* /, '• ')}`;
    } else if (themes && line.startsWith('* ')) {
      themes.push(line.slice(2).trim());
    }
  }
  if (notes.length !== placements[boardIndex].length) throw new Error(`Position count differs: ${id}`);
  for (const note of notes) note.text = note.text.replace(/\*\(([^)]+)\)\*/g, '($1)').replace('Anotação: ', '');
  return {id, title, facilitator: facilitators[boardIndex], notes, ...(themes ? {themes} : {})};
});
// Six category slips are visible in the Outcomes photograph. The seventh green
// slip (Know people/groups...) is a contribution, already in the transcript.
const labels = [
  ['confidence', 'Confidence in satellite data', .10,.145,.20,.095,-8],
  ['stakeholders', 'Stakeholder ID', .86,.10,.20,.095,5],
  ['tools', 'Tools', .43,.33,.20,.095,3],
  ['misc', 'MISC', .845,.44,.20,.095,-3],
  ['collaboration', 'Collaboration', .105,.535,.20,.085,-1],
  ['roles', 'Team roles & expectations, linkages', .61,.71,.185,.085,0],
];
boards[3].notes.unshift(...labels.map(([id,text,x,y,width,height,rotation]) => ({id:`outcomes-label-${id}`,text,color:'green',x,y,width,height,rotation,label:true})));
await mkdir('research/workshop-boards', { recursive: true });
await writeFile('research/workshop-boards/transcription.md', source);
await writeFile('data/workshop-boards.ts', `import type { WorkshopBoard } from '../tools/workshop-boards/types';\n\n/** User transcription, 15 September 2026. Positions mapped from the supplied\n * overview photographs. Preserve ids when correcting a contribution. */\nexport const WORKSHOP_BOARDS: WorkshopBoard[] = ${JSON.stringify(boards,null,2)};\n`);
console.log(boards.map(b => `${b.title}: ${b.notes.filter(n=>!n.label).length} contributions`).join('\n'));
