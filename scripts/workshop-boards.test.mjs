import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { WORKSHOP_BOARDS } from '../data/workshop-boards.ts';
import { AGENDA } from '../data/agenda.ts';

test('all supplied contributions retain unique, shareable ids and usable positions',()=>{
  assert.deepEqual(WORKSHOP_BOARDS.map(b=>b.notes.filter(n=>!n.label).length),[20,16,18,17]);
  const notes=WORKSHOP_BOARDS.flatMap(b=>b.notes);
  assert.equal(new Set(notes.map(n=>n.id)).size,77);
  for(const n of notes) {
    assert.ok(n.text.trim().length>0,n.id);
    assert.ok(n.x>=0&&n.x<=1&&n.y>=0&&n.y<=1,n.id);
    assert.ok(n.width>0&&n.height>0,n.id);
  }
  assert.equal(WORKSHOP_BOARDS[0].themes.length,4);
});

test('multiline contributions and all six Outcomes categories survive transcription',()=>{
  const long=WORKSHOP_BOARDS[0].notes.find(n=>n.id==='success-02');
  assert.ok(long.text.includes('Having a tool that help Nigeria measure standing biomass'));
  assert.ok(long.text.endsWith('indicated by the adoption of the tool.'));
  assert.ok(WORKSHOP_BOARDS[1].notes.find(n=>n.id==='barriers-08').text.includes('4. Conflicts with other projects e.g. Carbon credits'));
  assert.deepEqual(WORKSHOP_BOARDS[3].notes.filter(n=>n.label).map(n=>n.text),['Confidence in satellite data','Stakeholder ID','Tools','MISC','Collaboration','Team roles & expectations, linkages']);
});

test('the built tool has the full reading fallback and is linked from the correct session',async()=>{
  const material=AGENDA.flatMap(d=>d.sessions).find(s=>s.id==='d2-priorities-barriers').materials.find(m=>m.format==='3D');
  assert.equal(material.href,'/files/workshop-boards/');
  const html=await readFile(`public${material.href}index.html`,'utf8');
  assert.equal((html.match(/<article /g)||[]).length,71);
  for(const note of WORKSHOP_BOARDS.flatMap(b=>b.notes).filter(n=>!n.label)) assert.ok(html.includes(`id="read-${note.id}"`));
  assert.ok(html.includes('href="../../materials/#materials-day-2"'));
  assert.ok(html.includes('href="../../programme/#d2-priorities-barriers"'));
  assert.ok((await stat(`public${material.href}app.js`)).size>0);
  assert.ok(!html.includes('<img'));
});
