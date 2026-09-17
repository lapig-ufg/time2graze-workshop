import * as THREE from 'three';
import type { BoardNote, NoteColor, WorkshopBoard } from './types';

export const COLORS: Record<NoteColor, string> = {
  blue: '#aed7e4', yellow: '#f5d777', salmon: '#efb09b', pink: '#ee7fa0', green: '#c5de88',
};

function canvas(width: number, height: number) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const ctx = element.getContext('2d');
  if (!ctx) throw new Error('A drawing context is unavailable.');
  return { element, ctx };
}

/** Actual mesh curvature: the bottom corners lift from the adhesive edge. */
export function paperGeometry(w: number, h: number, seed = 1) {
  const geometry = new THREE.PlaneGeometry(w, h, 6, 8);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / w;
    const t = .5 - p.getY(i) / h;
    const curl = Math.pow(t, 3) * (.026 + Math.pow(x + .35, 2) * .052);
    p.setZ(i, curl + Math.sin(t * Math.PI) * .008 * Math.sin(seed));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function texture(element: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(element);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 2;
  return map;
}

/** Shared paper textures keep high-resolution ink from multiplying memory use. */
const papers = new Map<string, THREE.Texture>();
export function isPaperTexture(map: THREE.Texture) {
  return [...papers.values()].includes(map);
}
export function disposePaperTextures() {
  papers.forEach(map => map.dispose());
  papers.clear();
}
export function paperTexture(color: string) {
  const cached = papers.get(color);
  if (cached) return cached;
  const width = 128, height = 128;
  const {element, ctx} = canvas(width, height);
  ctx.fillStyle = color; ctx.fillRect(0, 0, width, height);
  // The adhesive band and paper grain are procedural; no photograph is used.
  ctx.fillStyle = '#ffffff12'; ctx.fillRect(0, 0, width, height * .12);
  let random = 13;
  for (let i = 0; i < 800; i++) {
    random = (random * 16807) % 2147483647;
    const x = random % width;
    random = (random * 16807) % 2147483647;
    ctx.fillStyle = i % 2 ? '#ffffff0b' : '#50381005';
    ctx.fillRect(x, random % height, .6, .6);
  }
  const map = texture(element);
  papers.set(color, map);
  return map;
}

/** Transparent ink follows the same curved mesh as the paper, but is unlit. */
export function inkMaterial(map: THREE.Texture) {
  return new THREE.MeshBasicMaterial({map, transparent:true, depthWrite:false,
    toneMapped:false, fog:false, side:THREE.FrontSide});
}

/** Writes a note's text into a width × height box at the current transform. */
function drawNoteText(ctx: CanvasRenderingContext2D, note: BoardNote, width: number, height: number, sizeRatio: number) {
  const padding = width * .0635;
  const maxSize = Math.max(1, Math.floor(width * sizeRatio));
  let low = 1, high = maxSize, size = 1;
  let lines: string[] = [];
  // Binary fitting avoids dozens of full text layouts when opening a long note.
  while (low <= high) {
    const candidate = Math.floor((low + high) / 2);
    ctx.font = `600 ${candidate}px Manrope, sans-serif`;
    const candidateLines = linesFor(ctx, note.text, width - padding * 2);
    if (candidateLines.length * candidate * 1.36 <= height - padding * 2) {
      size = candidate; lines = candidateLines; low = candidate + 1;
    } else high = candidate - 1;
  }
  ctx.font = `600 ${size}px Manrope, sans-serif`;
  ctx.fillStyle = '#142019'; ctx.textBaseline = 'top';
  const top = note.label ? padding : Math.max(padding, (height - lines.length * size * 1.36) * .4);
  lines.forEach((line, index) => ctx.fillText(line, padding, top + index * size * 1.36));
}

export function noteTexture(note: BoardNote, width = 512, detail = false) {
  const height = Math.round(width * (note.height * 4.5) / (note.width * 3));
  const {element, ctx} = canvas(width, height);
  drawNoteText(ctx, note, width, height, note.label ? .085 : detail ? (note.text.length < 100 ? .083 : .069) : .064);
  return texture(element);
}

/** Title, facilitator and Key Themes, drawn in a 1536 × 2304 sheet space. */
function drawHeading(ctx: CanvasRenderingContext2D, board: WorkshopBoard) {
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#142019';
  if (!board.facilitator) {
    // Country sheets carry nothing but the name, written large across the top;
    // at overview distance it is the only way to tell seven sheets apart.
    ctx.font = '600 190px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText(board.title, 768, 205, 1326);
    ctx.textAlign = 'left';
    return;
  }
  ctx.font = '600 105px "Cormorant Garamond", serif';
  ctx.fillText(board.title, 105, 160, 1326);
  ctx.font = '500 36px Manrope, sans-serif';
  ctx.fillStyle = '#374538'; ctx.fillText(board.facilitator, 110, 215);
  if (board.themes) {
    ctx.fillStyle = '#273b2c'; ctx.font = '600 34px Manrope, sans-serif';
    ctx.fillText('Key Themes', 100, 1885);
    ctx.font = '400 27px Manrope, sans-serif';
    board.themes.forEach((line, i) => ctx.fillText(`— ${line}`, 100, 1940 + i * 49));
  }
}

export function boardTexture(board: WorkshopBoard) {
  const {element, ctx} = canvas(1024, 1536);
  ctx.scale(2/3, 2/3);
  drawHeading(ctx, board);
  return texture(element);
}

/** The whole sheet — heading, every note and its marks — painted into one
 * texture. Boards seen from a distance cost one draw call and one map each,
 * instead of a mesh, a shadow and an ink map per note. */
export function overviewTexture(board: WorkshopBoard, marks: [x: number, y: number, color: string][]) {
  const width = 768, height = 1152, scale = width / 1536;
  const {element, ctx} = canvas(width, height);
  ctx.fillStyle = '#fafaf3'; ctx.fillRect(0, 0, width, height);
  ctx.scale(scale, scale);
  drawHeading(ctx, board);
  for (const note of board.notes) {
    const w = note.width * 1536, h = note.height * 2304;
    ctx.save();
    ctx.translate(note.x * 1536, note.y * 2304);
    ctx.rotate(note.rotation * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);
    // Shadow offsets are device pixels, unaffected by the canvas transform.
    ctx.shadowColor = 'rgba(36,40,27,.24)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2.5;
    ctx.fillStyle = COLORS[note.color]; ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff12'; ctx.fillRect(0, 0, w, h * .12);
    drawNoteText(ctx, note, w, h, note.label ? .085 : .064);
    ctx.restore();
  }
  for (const [x, y, color] of marks) {
    ctx.beginPath(); ctx.arc(x * 1536, y * 2304, 8, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  return texture(element);
}

export function contactShadow(width: number, height: number, opacity = .18) {
  const {element, ctx} = canvas(128, 128);
  const gradient = ctx.createRadialGradient(64,64,9,64,64,64);
  gradient.addColorStop(0, `rgba(36,40,27,${opacity})`);
  gradient.addColorStop(.55, `rgba(36,40,27,${opacity * .7})`);
  gradient.addColorStop(1, 'rgba(36,40,27,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,128,128);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({map:texture(element),transparent:true,depthWrite:false}));
}
