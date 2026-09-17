import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WORKSHOP_BOARDS } from '../data/collaboration-boards.ts';
import { AGENDA } from '../data/agenda.ts';

test('seven country boards preserve 65 contributions without duplicating the Nigeria close-up',()=>{
  assert.deepEqual(WORKSHOP_BOARDS.map(b=>[b.id,b.notes.filter(n=>!n.label).length]),[
    ['argentina',4],['nigeria',7],['colombia',15],['zimbabwe',11],['tanzania',3],['uruguay',7],['brazil-rs',18],
  ]);
  const notes=WORKSHOP_BOARDS.flatMap(b=>b.notes);
  assert.equal(new Set(notes.map(n=>n.id)).size,67);
  for(const note of notes) {
    assert.ok(note.text.trim(),note.id);
    assert.ok([note.x,note.y,note.width,note.height,note.rotation].every(Number.isFinite),note.id);
    assert.ok(note.x>=0&&note.x<=1&&note.y>=0&&note.y<=1,note.id);
  }
  assert.equal(WORKSHOP_BOARDS[2].notes.filter(n=>n.color==='blue').length,1);
  assert.match(WORKSHOP_BOARDS[5].notes[5].text,/uncertain reading/);
});

test('new session has its own artifact, complete reading fallback and relative navigation',async()=>{
  const session=AGENDA.flatMap(d=>d.sessions).find(s=>s.id==='d4-collaboration-map');
  const material=session.materials.find(m=>m.format==='3D');
  assert.equal(material.href,'/files/collaboration-boards/');
  assert.ok(session.materials.some(m=>m.format==='Google Slides'));
  const html=await readFile(`public${material.href}index.html`,'utf8');
  assert.equal((html.match(/<article /g)||[]).length,65);
  assert.equal((html.match(/class="board-choice"/g)||[]).length,7);
  assert.ok(html.includes('href="../../programme/#d4-collaboration-map"'));
  assert.ok(html.includes('href="../../materials/#materials-day-4"'));
  assert.ok(!html.includes('Facilitator:'));
  assert.ok(!html.includes('{{'));
  for(const note of WORKSHOP_BOARDS.flatMap(b=>b.notes).filter(n=>!n.label)) assert.ok(html.includes(`id="read-${note.id}"`));
});
