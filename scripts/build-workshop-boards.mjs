import { build } from 'esbuild';
import { readFile,writeFile,mkdir,cp,readdir,unlink } from 'node:fs/promises';
import { WORKSHOP_BOARDS } from '../data/workshop-boards.ts';

const source='tools/workshop-boards', output='public/files/workshop-boards';
const colors={blue:'#aed7e4',yellow:'#f5d777',salmon:'#efb09b',pink:'#ee7fa0',green:'#c5de88'};
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
await mkdir(output,{recursive:true});
// Remove only generated chunks inside this fixed artifact directory.
for (const file of await readdir(output)) if (/^scene-[\w-]+\.js(?:\.LEGAL\.txt)?$/.test(file)) await unlink(`${output}/${file}`);
await build({entryPoints:{app:`${source}/app.ts`},outdir:output,bundle:true,splitting:true,format:'esm',target:['es2020'],minify:true,legalComments:'external',chunkNames:'scene-[hash]'});
let html=await readFile(`${source}/index.html`,'utf8');
html=html.replace('<!--BOARD_NAV-->',WORKSHOP_BOARDS.map((board,i)=>`<button class="board-choice" data-board="${i}" aria-pressed="false"><span class="index">0${i+1}</span><span class="mini-board" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span><strong>${escape(board.title)}</strong><small>${board.notes.filter(n=>!n.label).length} contributions · ${escape(board.facilitator)}</small></span></button>`).join(''));
html=html.replace('<!--READING-->',WORKSHOP_BOARDS.map(board=>`<section data-board-id="${board.id}"><h2>${escape(board.title)}</h2><p class="facilitator">Facilitator: ${escape(board.facilitator)}</p><div class="reading-grid">${board.notes.filter(n=>!n.label).map((note,i)=>`<article id="read-${note.id}" style="--note-color:${colors[note.color]}"><h3>Contribution ${String(i+1).padStart(2,'0')}</h3>${note.group?`<p class="category">${escape(note.group)}</p>`:''}<p>${escape(note.text)}</p><a href="#note/${note.id}" data-note="${note.id}">View this note in 3D ↗</a></article>`).join('')}</div>${board.themes?`<div class="themes"><h3>Key Themes</h3><ul>${board.themes.map(t=>`<li>${escape(t)}</li>`).join('')}</ul></div>`:''}</section>`).join(''));
await writeFile(`${output}/index.html`,html);
await cp(`${source}/boards.css`,`${output}/boards.css`);
await cp(`${source}/assets`,`${output}/assets`,{recursive:true});
await cp('node_modules/three/LICENSE',`${output}/THREE-LICENSE.txt`);
const transcript=WORKSHOP_BOARDS.map(board=>`${board.title}\nFacilitator: ${board.facilitator}\n\n${board.notes.filter(n=>!n.label).map((note,i)=>`${i+1}. ${note.group?`[${note.group}]\n`:''}${note.text}`).join('\n\n')}${board.themes?`\n\nKey Themes\n${board.themes.join('\n')}`:''}`).join('\n\n--------------------\n\n');
await writeFile(`${output}/transcript.txt`,transcript);
console.log(`Workshop boards: ${WORKSHOP_BOARDS.length} boards, ${WORKSHOP_BOARDS.reduce((n,b)=>n+b.notes.filter(x=>!x.label).length,0)} contributions.`);
