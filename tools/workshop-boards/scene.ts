import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WORKSHOP_BOARDS, BOARD_MARKS } from './collection';
import { boardTexture, contactShadow, noteTexture, overviewTexture, paperGeometry, paperTexture, inkMaterial, isPaperTexture, disposePaperTextures, COLORS } from './paper';
import { DemandRenderer, drawingRatio } from './render-loop';
import type { BoardNote } from './types';

type Paper = {
  note: BoardNote; board: number; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  home: THREE.Vector3; rotation: number; shadow: THREE.Mesh;
  map: THREE.Texture;
  ink: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};
type Built = {board: number; group: THREE.Group; papers: Paper[]; hits: THREE.Object3D[]; done: boolean; steps: Generator<void, void>};
type Move = {start: number; from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; target: THREE.Vector3};

export class BoardScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, .02, 100);
  private controls: OrbitControls;
  /** One easel per board, always in the room: the four stay side by side. */
  private stands: THREE.Group[] = [];
  /** Each board painted into a single texture, shown whenever it is not mounted. */
  private sheets: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[] = [];
  /** The notes of the one board mounted in full, keyed by board index. */
  private boards: THREE.Group[] = [];
  private papers: Paper[] = [];
  private hits: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private moving?: Move;
  private selected?: Paper;
  private hovered?: Paper;
  private focusVeil = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.MeshBasicMaterial({color:'#f5f6f2',transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:false}));
  private focusShadow = contactShadow(1,1,.2);
  private detailMap?: THREE.Texture;
  private detailSize = new THREE.Vector2(1.1,1.1);
  private activeBoard: number | null = null;
  private shown = false;
  /** A board being built during a flight, committed when the camera arrives. */
  private building?: Built;
  private renderLoop: DemandRenderer;
  private paused = false;
  private down?: {x: number; y: number; id: number};
  private pointers = new Set<number>();
  private multiTouch = false;
  private resizeObserver: ResizeObserver;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private savedView?: {position: THREE.Vector3; target: THREE.Vector3};
  private query = '';
  private onPick: (board: number, note?: string) => void;

  constructor(private host: HTMLElement, onPick: (board: number, note?: string) => void, onFailure: () => void) {
    this.onPick = onPick;
    this.renderLoop = new DemandRenderer(this.render);
    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
    this.renderer.setClearColor('#eeeee5');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    const element = this.renderer.domElement;
    element.setAttribute('aria-hidden', 'true');
    element.addEventListener('webglcontextlost', event => {event.preventDefault(); onFailure();});
    host.append(element);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b4b39d', 1.2));
    const sun = new THREE.DirectionalLight('#fff7e9', 1.65);
    sun.position.set(-5, 10, 9);
    sun.castShadow = false;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#e8efff', .35); fill.position.set(8,4,3); this.scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshBasicMaterial({color:'#eeeee5'}));
    floor.rotation.x = -Math.PI/2; floor.position.y = -.02; this.scene.add(floor);
    this.scene.fog = new THREE.Fog('#eeeee5', 24, 65);
    this.focusVeil.visible=false;this.focusShadow.visible=false;
    this.scene.add(this.focusVeil,this.focusShadow);
    this.buildStands();
    this.controls = new OrbitControls(this.camera, element);
    this.controls.enableDamping = !this.reducedMotion.matches; this.controls.dampingFactor = .12;
    this.controls.minDistance = .25; this.controls.maxDistance = Math.max(35,WORKSHOP_BOARDS.length*12);
    this.controls.minPolarAngle = .65; this.controls.maxPolarAngle = Math.PI * .57;
    this.controls.minAzimuthAngle = -.6; this.controls.maxAzimuthAngle = .6;
    this.controls.rotateSpeed = .45; this.controls.zoomSpeed = .8;
    this.controls.addEventListener('change', () => this.invalidate());
    this.controls.addEventListener('start', () => { this.moving = undefined; this.invalidate(1000); });
    element.addEventListener('pointerdown', event => {
      this.pointers.add(event.pointerId);
      if (this.pointers.size === 1) {this.multiTouch = false; this.down = {x:event.clientX,y:event.clientY,id:event.pointerId};}
      else this.multiTouch = true;
    });
    element.addEventListener('pointerup', event => {
      this.pointers.delete(event.pointerId);
      if (!this.multiTouch && this.down?.id === event.pointerId && Math.hypot(event.clientX-this.down.x,event.clientY-this.down.y)<6) {
        const hit = this.intersect(event);
        if (this.selected) {
          if (hit?.userData.note !== this.selected.note.id) this.onPick(this.selected.board);
        } else if (hit) {
          // From the overview a click chooses the board, never a note on it.
          this.onPick(hit.userData.board as number, this.activeBoard === null ? undefined : hit.userData.note as string | undefined);
        }
      }
      if (!this.pointers.size) this.down = undefined;
    });
    element.addEventListener('pointercancel', event => {this.pointers.delete(event.pointerId);this.down=undefined;});
    element.addEventListener('pointermove', event => {
      if (!this.pointers.size) {
        const hit=this.intersect(event);
        element.style.cursor = hit ? 'pointer' : 'grab';
        const hovered=this.selected||this.activeBoard===null?undefined:this.papers.find(p=>p.note.id===hit?.userData.note);
        if(hovered!==this.hovered){this.hovered=hovered;this.invalidate();}
      }
    });
    element.addEventListener('pointerleave',()=>{this.hovered=undefined;this.invalidate();});
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.resize();
  }

  /** The room: four easels, their tape and the painted sheets. Everything that
   * never moves is merged across the four easels, one mesh per material, so
   * the whole room costs eight draw calls whatever board is open. */
  private buildStands() {
    const sheetGeometry = new THREE.PlaneGeometry(3,4.5,1,1);
    const foot = contactShadow(3.2,2.1,.25);
    const parts = {oak:[] as THREE.BufferGeometry[], backing:[] as THREE.BufferGeometry[], tape:[] as THREE.BufferGeometry[], foot:[] as THREE.BufferGeometry[]};
    const place = new THREE.Object3D();
    WORKSHOP_BOARDS.forEach((board,index) => {
      const stand = new THREE.Group();
      const offset=index-(WORKSHOP_BOARDS.length-1)/2;
      stand.position.set(offset * 3.85, 3.2, index === 0 || index === WORKSHOP_BOARDS.length-1 ? -.1 : .15);
      stand.rotation.y = WORKSHOP_BOARDS.length===4 ? [.055,.018,-.018,-.055][index] : -offset*.025;
      stand.updateMatrix();
      this.stands.push(stand); this.scene.add(stand);
      const add = (list:THREE.BufferGeometry[], geometry:THREE.BufferGeometry, x:number, y:number, z:number, rx=0, rz=0) => {
        place.position.set(x,y,z); place.rotation.set(rx,0,rz); place.updateMatrix();
        list.push(geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(stand.matrix,place.matrix)));
      };
      // A quiet wooden easel. The exhibition arrangement is virtual; the paper
      // and note layout is mapped from the actual sheets photographed on walls.
      add(parts.oak,new THREE.BoxGeometry(.12,5.55,.14),0,-.36,-.19);
      add(parts.oak,new THREE.BoxGeometry(.13,3.1,.16),-.73,-1.7,-.15,0,-.14);
      add(parts.oak,new THREE.BoxGeometry(.13,3.1,.16),.73,-1.7,-.15,0,.14);
      add(parts.oak,new THREE.BoxGeometry(.12,3.8,.14),0,-1.3,-.85,-.34);
      add(parts.oak,new THREE.BoxGeometry(2.5,.12,.37),0,-2.30,0);
      add(parts.backing,new THREE.BoxGeometry(3.05,4.55,.045),0,0,-.035);
      for (const [x,y,r] of [[-1.45,2.19,-.62],[1.45,2.19,.64],[-1.45,-2.19,.68],[1.45,-2.19,-.63]]) add(parts.tape,paperGeometry(.13,.40),x,y,.018,0,r);
      add(parts.foot,foot.geometry.clone(),0,-3.199,0,-Math.PI/2);
      const sheet = new THREE.Mesh(sheetGeometry, new THREE.MeshStandardMaterial({map:overviewTexture(board,BOARD_MARKS[index]),roughness:1}));
      sheet.position.z = .002; sheet.userData.board = index;
      stand.add(sheet); this.sheets.push(sheet);
    });
    const merged = (list:THREE.BufferGeometry[], material:THREE.Material) => {
      const mesh = new THREE.Mesh(mergeGeometries(list), material);
      list.forEach(geometry=>geometry.dispose());
      this.scene.add(mesh);
    };
    merged(parts.oak,new THREE.MeshStandardMaterial({color:'#b9a07b',roughness:.94}));
    merged(parts.backing,new THREE.MeshStandardMaterial({color:'#e3e1d5',roughness:1}));
    merged(parts.tape,new THREE.MeshStandardMaterial({color:'#c69451',roughness:1,transparent:true,opacity:.88,side:THREE.DoubleSide}));
    merged(parts.foot,foot.material);
    foot.geometry.dispose();
  }

  /** Builds one board's real, selectable notes a step at a time. Nothing is
   * shown until it is committed; each step also uploads what it created, so
   * the cost can be spread across the frames of a camera flight. */
  private *buildBoard(built: Built): Generator<void, void> {
    const index = built.board, board = WORKSHOP_BOARDS[index];
    const upload = (map: THREE.Texture) => this.renderer.initTexture(map);
    const sheet = new THREE.Mesh(this.sheets[index].geometry,new THREE.MeshStandardMaterial({color:'#fafaf3',roughness:1,side:THREE.DoubleSide}));
    const heading = boardTexture(board); upload(heading);
    const headingInk = new THREE.Mesh(sheet.geometry,inkMaterial(heading));
    headingInk.position.z=.001;sheet.add(headingInk);
    sheet.position.z = .002; sheet.userData.board = index;
    built.group.add(sheet); built.hits.push(sheet);
    yield;
    for (const [i,note] of board.notes.entries()) {
      const w = note.width * 3, h = note.height * 4.5;
      const map = noteTexture(note); upload(map);
      const paper = paperTexture(COLORS[note.color]); upload(paper);
      const material = new THREE.MeshStandardMaterial({map:paper,roughness:.94,side:THREE.DoubleSide});
      const mesh = new THREE.Mesh(paperGeometry(w,h,i+1), material);
      const ink = new THREE.Mesh(mesh.geometry,inkMaterial(map));
      ink.position.z=.001;mesh.add(ink);
      // Stack order preserves overlapping notes, especially on Outcomes.
      mesh.position.set((note.x-.5)*3,(.5-note.y)*4.5,.035+i*.0035);
      mesh.rotation.z = -note.rotation*Math.PI/180;
      mesh.userData.board = index; mesh.userData.note = note.id;
      const shadow = contactShadow(w*1.16,h*1.18,.21); upload(shadow.material.map!);
      shadow.position.copy(mesh.position).add(new THREE.Vector3(.015,-.025,-.008));
      shadow.rotation.z = mesh.rotation.z;
      built.group.add(shadow,mesh); built.hits.push(mesh);
      built.papers.push({note,board:index,mesh,shadow,map,ink,home:mesh.position.clone(),rotation:mesh.rotation.z});
      yield;
    }
    // All circular marks on a board share one draw call.
    const marks = BOARD_MARKS[index];
    const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(.016,12), new THREE.MeshBasicMaterial({toneMapped:false}), marks.length);
    marks.forEach(([x,y,color],i) => {
      dots.setMatrixAt(i,new THREE.Matrix4().makeTranslation((x-.5)*3,(.5-y)*4.5,.245));
      dots.setColorAt(i,new THREE.Color(color));
    });
    dots.instanceMatrix.needsUpdate = true;
    built.group.add(dots);
    built.done = true;
  }

  /** Start building a board, or keep the build already under way for it. */
  private startBuild(index: number) {
    if (this.building?.board === index) return;
    this.cancelBuild();
    const built: Built = {board:index, group:new THREE.Group(), papers:[], hits:[], done:false, steps:undefined!};
    built.steps = this.buildBoard(built);
    this.building = built;
  }

  /** Advance the build for up to budget milliseconds; Infinity finishes it. */
  private stepBuild(budget: number) {
    const build = this.building;
    if (!build) return;
    const until = performance.now() + budget;
    while (!build.done && performance.now() < until) build.steps.next();
  }

  private cancelBuild() {
    if (!this.building) return;
    this.building.steps.return();
    this.disposeBoard(this.building.group, this.building.board, this.building.papers);
    this.building = undefined;
  }

  /** Swap the painted sheet for the finished board, releasing the previous one. */
  private commitBuild() {
    const build = this.building!;
    this.building = undefined;
    this.unmountBoard();
    this.boards[build.board] = build.group;
    this.papers = build.papers; this.hits = build.hits;
    this.stands[build.board].add(build.group);
    this.sheets[build.board].visible = false;
    this.scene.updateMatrixWorld();
    this.updateHighlights();
  }

  /** Build and show a board at once, for a note link or a move without flight. */
  private mountBoard(index: number) {
    this.startBuild(index);
    this.stepBuild(Infinity);
    this.commitBuild();
  }

  private disposeBoard(group: THREE.Group, index: number, papers: Paper[], extra?: THREE.Texture) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const maps = new Set<THREE.Texture>(papers.map(p=>p.map));
    if (extra) maps.add(extra);
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object instanceof THREE.InstancedMesh) object.dispose();
      // The sheet geometry belongs to the stand and outlives the notes.
      if (object.geometry !== this.sheets[index].geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)?object.material:[object.material]) {
        materials.add(material);
        if ('map' in material && material.map) maps.add(material.map as THREE.Texture);
      }
    });
    group.removeFromParent();
    geometries.forEach(geometry=>geometry.dispose());
    materials.forEach(material=>material.dispose());
    maps.forEach(map=>{if(!isPaperTexture(map))map.dispose();});
  }

  /** Destroy the mounted notes rather than keeping four boards in GPU memory. */
  private unmountBoard() {
    this.boards.forEach((group,index) => {
      this.disposeBoard(group,index,this.papers,this.detailMap);
      this.sheets[index].visible = true;
    });
    this.detailMap=undefined;this.selected=undefined;this.hovered=undefined;
    this.boards=[];this.papers=[];this.hits=[];this.savedView=undefined;
  }

  private visibilityChanged = () => this.renderLoop.setPaused(this.paused || document.hidden);
  setPaused(paused: boolean) {this.paused=paused;this.visibilityChanged();}

  private intersect(event: PointerEvent) {
    const rect = this.host.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.ray.setFromCamera(this.pointer,this.camera);
    return this.ray.intersectObjects([...this.sheets.filter(sheet=>sheet.visible),...this.hits],false)[0]?.object;
  }

  private resize() {
    const {width,height} = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(drawingRatio(width,height,devicePixelRatio));
    this.renderer.setSize(width,height);
    if (!this.shown) return;
    if(!this.selected && this.savedView) {
      this.moving=undefined;this.camera.position.copy(this.savedView.position);this.controls.target.copy(this.savedView.target);this.controls.update();this.invalidate();return;
    }
    this.show(this.activeBoard,this.selected?.note.id,false);
  }

  private distance(width:number,height:number) {
    return Math.max(height, width/this.camera.aspect) / (2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))) * 1.22;
  }

  show(board:number|null, noteId?:string, animate=true) {
    // The overview keeps whichever board is mounted, so returning to it is free.
    if (board !== null && !this.boards[board]) {
      // Building a board takes a noticeable moment. On a flight its painted sheet
      // looks the same from the path, so the notes are built a few milliseconds
      // per frame on the way and swapped in when the camera arrives.
      if (animate && !noteId && !this.reducedMotion.matches) this.startBuild(board);
      else this.mountBoard(board);
    } else this.cancelBuild();
    this.shown = true;
    const prior = this.selected;
    const next = board === null ? undefined : this.papers.find(p=>p.note.id===noteId);
    this.hovered=undefined;
    if (prior !== next) {
      if(prior) prior.ink.material.map = prior.map;
      this.detailMap?.dispose(); this.detailMap = undefined;
      if(next) {
        // The selected paper expands to reading proportions, then returns to
        // its measured shape. Text is redrawn on that same curved 3D mesh.
        this.detailSize.set(1.1,THREE.MathUtils.clamp(next.note.text.length / 330, .75, 1.4));
        this.detailMap=noteTexture({...next.note,width:this.detailSize.x/3,height:this.detailSize.y/4.5},1024,true);
        next.ink.material.map=this.detailMap;
      }
    }
    if (!prior && next && this.activeBoard === board) this.savedView = {position:this.camera.position.clone(),target:this.controls.target.clone()};
    if (this.activeBoard !== board) this.savedView = undefined;
    this.activeBoard = board; this.selected = next;
    this.updateHighlights();
    let target: THREE.Vector3, position: THREE.Vector3;
    if (next) {
      const stand = this.stands[next.board];
      const home = next.home.clone(); home.z += .72;
      target = stand.localToWorld(home);
      // The veil sits just behind the lifted note. The outer easels are turned
      // towards the centre — by up to .075 rad with seven boards — so a veil
      // nearer the board surface tilts behind the neighbouring board and
      // leaves its notes unsoftened.
      this.focusVeil.position.copy(stand.localToWorld(next.home.clone().add(new THREE.Vector3(0,0,.68))));
      this.focusVeil.quaternion.copy(stand.quaternion);
      this.focusShadow.position.copy(stand.localToWorld(next.home.clone().add(new THREE.Vector3(.025,-.025,.70))));
      this.focusShadow.quaternion.copy(stand.quaternion);
      this.focusShadow.scale.set(this.detailSize.x*1.35,this.detailSize.y*1.35,1);
      const normal = new THREE.Vector3(0,0,1).applyQuaternion(stand.quaternion);
      position = target.clone().addScaledVector(normal,this.distance(this.detailSize.x,this.detailSize.y));
    } else if (prior && this.savedView) {
      target = this.savedView.target.clone(); position = this.savedView.position.clone();
    } else if (board !== null) {
      target = this.stands[board].position.clone();
      position = target.clone().add(new THREE.Vector3(.06,.04,this.distance(3.2,4.9)));
    } else {
      target = new THREE.Vector3(0,2.65,0);
      position = target.clone().add(new THREE.Vector3(.95,1.2,this.distance(WORKSHOP_BOARDS.length*3.85,6.6)));
    }
    // When close to a board, dragging pans its surface. Overview allows orbit.
    this.controls.mouseButtons.LEFT = board===null ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    this.controls.touches.ONE = board===null ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
    this.controls.cursor.copy(target); this.controls.maxTargetRadius = board===null ? 10 : next ? 1.5 : 4;
    if (animate && !this.reducedMotion.matches) {
      this.moving = {start:performance.now(),from:this.camera.position.clone(),to:position,fromTarget:this.controls.target.clone(),target};
    } else {
      this.moving = undefined; this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();
      this.focusVeil.material.opacity = next ? .76 : 0;
      this.papers.forEach(p=>{p.mesh.position.copy(p.home);p.mesh.position.z += p === next ? .72 : 0;p.mesh.rotation.z=p===next?0:p.rotation;p.mesh.scale.set(p===next?this.detailSize.x/(p.note.width*3):1,p===next?this.detailSize.y/(p.note.height*4.5):1,1);});
    }
    this.invalidate(1200);
  }

  highlight(query:string) {
    this.query=query.trim().toLocaleLowerCase();
    this.updateHighlights();
    this.invalidate();
  }

  private updateHighlights() {
    const q=this.query;
    // A painted board cannot dim single notes, so a board with no match dims
    // whole, and the mounted board follows the same rule to look the same.
    const boardMatches=WORKSHOP_BOARDS.map(board=>!q||board.notes.some(n=>!n.label&&n.text.toLocaleLowerCase().includes(q)));
    for (const p of this.papers) {
      const matches=p===this.selected || !q || p.note.text.toLocaleLowerCase().includes(q);
      p.mesh.material.color.set(matches?'#ffffff':boardMatches[p.board]?'#88887e':'#a3a39a');
      p.mesh.material.emissive.set(q&&matches&&p!==this.selected?'#263a0c':'#000000');
      p.mesh.material.emissiveIntensity = .16;
    }
    this.sheets.forEach((sheet,index)=>sheet.material.color.set(boardMatches[index]?'#ffffff':'#a3a39a'));
    this.boards.forEach((group,index)=>((group.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(boardMatches[index]?'#fafaf3':'#a0a093'));
  }

  zoom(direction:number) {
    this.moving=undefined;
    const offset=this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*(direction > 0 ? .8 : 1.25),.25,this.controls.maxDistance));
    this.camera.position.copy(this.controls.target).add(offset); this.controls.update();this.invalidate();
  }

  reset() {if(!this.selected)this.savedView=undefined;this.show(this.activeBoard,this.selected?.note.id);}

  pan(x:number,y:number) {this.controls.pan(x,y);this.controls.update();this.invalidate();}

  private invalidate(duration=500) {
    this.renderLoop.request(duration);
  }
  private render = (time:number, delta:number) => {
    this.controls.update();
    if (this.moving) {
      const t=Math.min((time-this.moving.start)/850,1), ease=1-Math.pow(1-t,4);
      this.camera.position.lerpVectors(this.moving.from,this.moving.to,ease);
      this.controls.target.lerpVectors(this.moving.fromTarget,this.moving.target,ease);
      this.camera.lookAt(this.controls.target);
      if(t===1) this.moving=undefined;
    }
    if (this.building) {
      // Arrived, or the reader took over the camera: finish the board now.
      this.stepBuild(this.moving ? 4 : Infinity);
      if (!this.moving) this.commitBuild();
    }
    for (const p of this.papers) {
      const selected=p===this.selected;
      const lift = selected ? .72 : p===this.hovered&&!this.reducedMotion.matches ? .025 : 0;
      p.mesh.position.z=THREE.MathUtils.damp(p.mesh.position.z,p.home.z+lift,10,delta);
      p.mesh.rotation.z=THREE.MathUtils.damp(p.mesh.rotation.z,selected?0:p.rotation,10,delta);
      p.mesh.scale.x=THREE.MathUtils.damp(p.mesh.scale.x,selected?this.detailSize.x/(p.note.width*3):1,10,delta);
      p.mesh.scale.y=THREE.MathUtils.damp(p.mesh.scale.y,selected?this.detailSize.y/(p.note.height*4.5):1,10,delta);
      p.shadow.visible=!selected;
    }
    this.focusVeil.material.opacity=THREE.MathUtils.damp(this.focusVeil.material.opacity,this.selected ? .76 : 0,10,delta);
    this.focusVeil.visible=this.focusVeil.material.opacity>.001;
    this.focusShadow.visible=Boolean(this.selected);
    this.renderer.render(this.scene,this.camera);
    return Boolean(this.moving || this.building);
  };

  dispose() {
    this.renderLoop.dispose();this.resizeObserver.disconnect();this.controls.dispose();
    this.cancelBuild();
    document.removeEventListener('visibilitychange',this.visibilityChanged);
    this.unmountBoard();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.scene.traverse(object=>{
      if(object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material]) materials.add(material);
      }
    });
    geometries.forEach(geometry=>geometry.dispose());
    materials.forEach(material=>{if('map' in material&&material.map&&!isPaperTexture(material.map as THREE.Texture))(material.map as THREE.Texture).dispose();material.dispose();});
    disposePaperTextures();
    this.renderer.dispose();this.renderer.domElement.remove();
  }
}
