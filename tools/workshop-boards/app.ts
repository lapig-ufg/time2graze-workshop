import { WORKSHOP_BOARDS } from '../../data/workshop-boards';
import type { BoardScene } from './scene';

const get = <T extends HTMLElement = HTMLElement>(id:string) => {
  const element=document.getElementById(id);
  if(!element) throw new Error(`Missing control: ${id}`);
  return element as T;
};
const workspace=get('workspace'), reading=get('reading'), nav=get('board-nav');
const toggle=get<HTMLButtonElement>('reading-toggle');
const search=get<HTMLInputElement>('search');
const feedback=get('feedback');
let scene:BoardScene|undefined;
let board:number|null=null;
let noteId:string|undefined;
let readingMode=false;
let failed=false;
let ready=false;

function announce(text:string) {get('selection-announcement').textContent=text;}
function hash(boardIndex:number|null,note?:string) {
  return note ? `#note/${note}` : boardIndex===null ? '#all' : `#board/${WORKSHOP_BOARDS[boardIndex].id}`;
}
function select(index:number|null,note?:string,push=true) {
  board=index;noteId=note;
  if(push) history.pushState(null,'',hash(index,note));
  scene?.show(board,noteId);
  const current=board===null?undefined:WORKSHOP_BOARDS[board];
  const selected=current?.notes.find(n=>n.id===noteId);
  get('location-name').textContent=current?.title??'';
  get('location-separator').hidden=!current;
  get('note-bar').hidden=!selected;
  workspace.dataset.note=String(Boolean(selected));
  document.body.classList.toggle('has-note',Boolean(selected));
  get('reset').textContent=selected?'Fit note':'Reset view';
  get('reset').setAttribute('aria-label',selected?'Fit note in view':'Reset view');
  get('share').textContent='Copy link';
  nav.querySelectorAll<HTMLButtonElement>('button[data-board]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.board)===board)));
  if(current&&selected) {
    const notes=current.notes.filter(n=>!n.label);
    get('note-position').textContent=selected.label?'Group heading':`${notes.findIndex(n=>n.id===noteId)+1} / ${notes.length}`;
    announce(`${current.title}. ${selected.text}`);
  } else announce(current?`${current.title}. Facilitator: ${current.facilitator}. ${current.notes.filter(n=>!n.label).length} contributions.`:'All four workshop boards.');
  get('gesture-hint').innerText=current?'Drag to move · Scroll or pinch to zoom · Select a note':'Drag to look around · Select a board to explore';
  if(readingMode) {
    reading.querySelectorAll<HTMLElement>(':scope > section').forEach(section=>section.hidden=Boolean(current)&&section.dataset.boardId!==current?.id);
    if(selected) document.getElementById(`read-${selected.id}`)?.scrollIntoView({block:'center'});
  }
}
function resolveHash() {
  const value=location.hash.slice(1);
  if(value.startsWith('note/')) {
    const id=value.slice(5),index=WORKSHOP_BOARDS.findIndex(b=>b.notes.some(n=>n.id===id));
    if(index>=0) {select(index,id,false);return;}
  } else if(value.startsWith('board/')) {
    const index=WORKSHOP_BOARDS.findIndex(b=>b.id===value.slice(6));
    if(index>=0) {select(index,undefined,false);return;}
  } else if(value==='all'||!value) {
    // Phones open on the first board; the overview is too small to choose from there.
    select(!value&&innerWidth<600?0:null,undefined,false);return;
  } else if(value==='reading') {
    setReading(true);return;
  }
  feedback.textContent='This board or note link was not found. All contributions are available below.';
  select(null,undefined,false);
}
function setReading(value:boolean) {
  readingMode=value;
  document.body.classList.toggle('is-reading',value);
  document.body.classList.toggle('has-note',Boolean(noteId)&&!value);
  workspace.hidden=value;
  reading.hidden=!value;
  scene?.setPaused(value);
  toggle.textContent=value?'3D view':'Reading view';
  toggle.setAttribute('aria-pressed',String(value));
  reading.querySelectorAll<HTMLElement>(':scope > section').forEach(section=>section.hidden=false);
  if(value) {
    reading.focus({preventScroll:true});
    if(noteId) document.getElementById(`read-${noteId}`)?.scrollIntoView({block:'center'});
  }
}
function closeNote() {
  select(board);
  get('scene').focus({preventScroll:true});
}
function step(direction:number) {
  if(noteId&&board!==null) {
    const notes=WORKSHOP_BOARDS[board].notes.filter(n=>!n.label);
    const index=notes.findIndex(n=>n.id===noteId);
    select(board,notes[(index+direction+notes.length)%notes.length].id);
  } else select(((board??(direction>0?-1:0))+direction+4)%4);
}

toggle.addEventListener('click',()=>setReading(!readingMode));
get('overview').addEventListener('click',()=>select(null));
get('close-note').addEventListener('click',closeNote);
get('previous-note').addEventListener('click',()=>step(-1));
get('next-note').addEventListener('click',()=>step(1));
get('zoom-in').addEventListener('click',()=>scene?.zoom(1));
get('zoom-out').addEventListener('click',()=>scene?.zoom(-1));
get('reset').addEventListener('click',()=>scene?.reset());
get('fullscreen').hidden=!document.fullscreenEnabled;
get('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement) await document.exitFullscreen();else await workspace.requestFullscreen();}
  catch{feedback.textContent='Fullscreen is unavailable in this browser.';}
});
document.addEventListener('fullscreenchange',()=>get('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
nav.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-board]');
  if(button) select(Number(button.dataset.board));
});
reading.addEventListener('click',event=>{
  const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-note]');
  if(!link||failed||!ready) return;
  event.preventDefault();setReading(false);
  const index=WORKSHOP_BOARDS.findIndex(b=>b.notes.some(n=>n.id===link.dataset.note));
  select(index,link.dataset.note);
  get('scene').focus({preventScroll:true});
});
get('share').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(location.href);get('share').textContent='Link copied';feedback.textContent='Link copied.';}
  catch {feedback.replaceChildren();const label=document.createElement('label');label.textContent='Copy this link: ';const input=document.createElement('input');input.value=location.href;input.readOnly=true;input.setAttribute('aria-label','Link to this note');label.append(input);feedback.append(label);input.select();}
});
search.addEventListener('input',()=>{
  const query=search.value.trim().toLocaleLowerCase();
  scene?.highlight(query);
  get('search-results').hidden=!query;
  const items=get('search-items');items.replaceChildren();
  if(!query) return;
  let count=0;
  WORKSHOP_BOARDS.forEach((b,index)=>b.notes.filter(n=>!n.label&&n.text.toLocaleLowerCase().includes(query)).forEach(note=>{
    count++;
    const button=document.createElement('button'),small=document.createElement('small'),text=document.createElement('span');
    small.textContent=b.title;text.textContent=note.text.length>130?`${note.text.slice(0,130)}…`:note.text;
    button.append(small,text);
    button.addEventListener('click',()=>{select(index,note.id);get('search-results').hidden=true;get('scene').focus({preventScroll:true});});
    items.append(button);
  }));
  get('search-count').textContent=`${count} ${count===1?'contribution':'contributions'} found`;
});
search.addEventListener('focus',()=>{if(search.value.trim())get('search-results').hidden=false;});
document.addEventListener('pointerdown',event=>{if(!(event.target as HTMLElement).closest('.search-wrap'))get('search-results').hidden=true;});
document.addEventListener('keydown',event=>{
  const target=event.target as HTMLElement;
  if(event.key==='Escape'&&!get('search-results').hidden) {get('search-results').hidden=true;search.focus();return;}
  if(target.matches('input,textarea')||target.isContentEditable||readingMode) return;
  if(event.key==='Escape') {if(noteId)closeNote();else select(null);}
  else if(event.key==='ArrowRight'||event.key==='ArrowLeft') {event.preventDefault();step(event.key==='ArrowRight'?1:-1);}
  else if(event.key==='+'||event.key==='=')scene?.zoom(1);
  else if(event.key==='-')scene?.zoom(-1);
  else if(event.key==='ArrowUp'||event.key==='ArrowDown') {event.preventDefault();scene?.pan(0,event.key==='ArrowUp'?60:-60);}
});
window.addEventListener('popstate',resolveHash);
window.addEventListener('hashchange',resolveHash);
document.querySelector('.skip')?.addEventListener('click',()=>setReading(true));
function failure() {
  failed=true;ready=false;
  scene?.dispose();scene=undefined;
  setReading(true);toggle.hidden=true;nav.hidden=true;
  feedback.textContent='3D is unavailable in this browser. All 71 contributions are available in the reading view.';
  reading.querySelectorAll<HTMLAnchorElement>('a[data-note]').forEach(link=>link.hidden=true);
}
async function start() {
  workspace.hidden=false;reading.hidden=true;nav.hidden=false;toggle.hidden=false;
  try {
    await Promise.all([document.fonts.load('600 20px Manrope'),document.fonts.load('600 20px "Cormorant Garamond"')]);
    const {BoardScene:Scene}=await import('./scene');
    scene=new Scene(get('scene'),(index,id)=>select(index,id),failure);
    scene.setPaused(readingMode);
    ready=true;document.body.classList.add('scene-ready');get('loading').hidden=true;resolveHash();
  } catch(error) {console.error('Workshop boards could not start.',error);failure();}
}
void start();
