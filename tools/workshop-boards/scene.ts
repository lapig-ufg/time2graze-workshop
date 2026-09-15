import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WORKSHOP_BOARDS } from '../../data/workshop-boards';
import { BOARD_MARKS } from '../../data/workshop-board-marks';
import { boardTexture, contactShadow, noteTexture, paperGeometry, paperTexture, inkMaterial, COLORS } from './paper';
import type { BoardNote } from './types';

type Paper = {
  note: BoardNote; board: number; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  home: THREE.Vector3; rotation: number; shadow: THREE.Mesh;
  map: THREE.Texture;
  ink: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  resolution: number;
};
type Move = {start: number; from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; target: THREE.Vector3};

export class BoardScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, .02, 100);
  private controls: OrbitControls;
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
  private frame = 0;
  private lastFrame = 0;
  private endAt = 0;
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
    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
    floor.rotation.x = -Math.PI/2; floor.position.y = -.02; floor.receiveShadow = true; this.scene.add(floor);
    this.scene.fog = new THREE.Fog('#eeeee5', 24, 65);
    this.focusVeil.visible=false;this.focusShadow.visible=false;
    this.scene.add(this.focusVeil,this.focusShadow);
    WORKSHOP_BOARDS.forEach((board,index) => {
      const group = new THREE.Group();
      group.position.set((index - 1.5) * 3.85, 3.2, index === 0 || index === 3 ? -.1 : .15);
      group.rotation.y = [.055,.018,-.018,-.055][index];
      this.boards.push(group); this.scene.add(group);
      const oak = new THREE.MeshStandardMaterial({color:'#b9a07b',roughness:.94});
      const box = (w:number,h:number,d:number,x:number,y:number,z:number, material = oak) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
        mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
      };
      // A quiet wooden easel. The exhibition arrangement is virtual; the paper
      // and note layout is mapped from the actual sheets photographed on walls.
      box(.12,5.55,.14,0,-.36,-.19);
      const legL = box(.13,3.1,.16,-.73,-1.7,-.15); legL.rotation.z = -.14;
      const legR = box(.13,3.1,.16,.73,-1.7,-.15); legR.rotation.z = .14;
      const rear = box(.12,3.8,.14,0,-1.3,-.85); rear.rotation.x = -.34;
      box(2.5,.12,.37,0,-2.30,.0);
      box(3.05,4.55,.045,0,0,-.035,new THREE.MeshStandardMaterial({color:'#e3e1d5',roughness:1}));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3,4.5,1,1),new THREE.MeshStandardMaterial({color:'#fafaf3',roughness:1,side:THREE.DoubleSide}));
      const headingInk = new THREE.Mesh(sheet.geometry,inkMaterial(boardTexture(board)));
      headingInk.position.z=.001;sheet.add(headingInk);
      sheet.position.z = .002; sheet.receiveShadow = true; sheet.userData.board = index;
      group.add(sheet); this.hits.push(sheet);
      for (const [x,y,r] of [[-1.45,2.19,-.62],[1.45,2.19,.64],[-1.45,-2.19,.68],[1.45,-2.19,-.63]]) {
        const tape = new THREE.Mesh(paperGeometry(.13,.40),new THREE.MeshStandardMaterial({color:'#c69451',roughness:1,transparent:true,opacity:.88,side:THREE.DoubleSide}));
        tape.position.set(x,y,.018); tape.rotation.z = r; group.add(tape);
      }
      board.notes.forEach((note,i) => {
        const w = note.width * 3, h = note.height * 4.5;
        const map = noteTexture(note);
        const material = new THREE.MeshStandardMaterial({map:paperTexture(COLORS[note.color]),roughness:.94,side:THREE.DoubleSide});
        const mesh = new THREE.Mesh(paperGeometry(w,h,i+1), material);
        const ink = new THREE.Mesh(mesh.geometry,inkMaterial(map));
        ink.position.z=.001;mesh.add(ink);
        // Stack order preserves overlapping notes, especially on Outcomes.
        mesh.position.set((note.x-.5)*3,(.5-note.y)*4.5,.035+i*.0035);
        mesh.rotation.z = -note.rotation*Math.PI/180;
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData.board = index; mesh.userData.note = note.id;
        const shadow = contactShadow(w*1.16,h*1.18,.21);
        shadow.position.copy(mesh.position).add(new THREE.Vector3(.015,-.025,-.008));
        shadow.rotation.z = mesh.rotation.z;
        group.add(shadow,mesh); this.hits.push(mesh);
        this.papers.push({note,board:index,mesh,shadow,map,ink,resolution:512,home:mesh.position.clone(),rotation:mesh.rotation.z});
      });
      for (const [x,y,color] of BOARD_MARKS[index]) {
        const dot=new THREE.Mesh(new THREE.CircleGeometry(.016,16),new THREE.MeshStandardMaterial({color,roughness:1}));
        dot.position.set((x-.5)*3,(.5-y)*4.5,.245);group.add(dot);
      }
      const footShadow = contactShadow(3.2,2.1,.25);
      footShadow.rotation.x = -Math.PI/2;
      footShadow.position.set(group.position.x,.001,0); this.scene.add(footShadow);
    });
    this.controls = new OrbitControls(this.camera, element);
    this.controls.enableDamping = !this.reducedMotion.matches; this.controls.dampingFactor = .12;
    this.controls.minDistance = .25; this.controls.maxDistance = 35;
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
        } else if (hit) this.onPick(hit.userData.board as number, hit.userData.note as string | undefined);
      }
      if (!this.pointers.size) this.down = undefined;
    });
    element.addEventListener('pointercancel', event => {this.pointers.delete(event.pointerId);this.down=undefined;});
    element.addEventListener('pointermove', event => {
      if (!this.pointers.size) {
        const hit=this.intersect(event);
        element.style.cursor = hit ? 'pointer' : 'grab';
        const hovered=this.selected?undefined:this.papers.find(p=>p.note.id===hit?.userData.note);
        if(hovered!==this.hovered){this.hovered=hovered;this.invalidate();}
      }
    });
    element.addEventListener('pointerleave',()=>{this.hovered=undefined;this.invalidate();});
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  private intersect(event: PointerEvent) {
    const rect = this.host.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.ray.setFromCamera(this.pointer,this.camera);
    return this.ray.intersectObjects(this.hits,false)[0]?.object;
  }

  private resize() {
    const {width,height} = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height);
    if(!this.selected && this.savedView) {
      this.moving=undefined;this.camera.position.copy(this.savedView.position);this.controls.target.copy(this.savedView.target);this.controls.update();this.invalidate();return;
    }
    this.show(this.activeBoard,this.selected?.note.id,false);
  }

  private distance(width:number,height:number) {
    return Math.max(height, width/this.camera.aspect) / (2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))) * 1.22;
  }

  show(board:number|null, noteId?:string, animate=true) {
    const prior = this.selected;
    const next = this.papers.find(p=>p.note.id===noteId);
    this.hovered=undefined;
    // Only the active board gets sharper ink. Other boards release those maps.
    for(const p of this.papers) {
      const resolution=p.board===board?1024:512;
      if(p.resolution!==resolution) {
        const old=p.map;p.map=noteTexture(p.note,resolution);p.resolution=resolution;
        if(p!==prior)p.ink.material.map=p.map;
        old.dispose();
      }
    }
    if (prior !== next) {
      if(prior) prior.ink.material.map = prior.map;
      this.detailMap?.dispose(); this.detailMap = undefined;
      if(next) {
        // The selected paper expands to reading proportions, then returns to
        // its measured shape. Text is redrawn on that same curved 3D mesh.
        this.detailSize.set(1.1,THREE.MathUtils.clamp(next.note.text.length / 330, .75, 1.4));
        this.detailMap=noteTexture({...next.note,width:this.detailSize.x/3,height:this.detailSize.y/4.5},2048,true);
        next.ink.material.map=this.detailMap;
      }
    }
    if (!prior && next && this.activeBoard === board) this.savedView = {position:this.camera.position.clone(),target:this.controls.target.clone()};
    if (this.activeBoard !== board) this.savedView = undefined;
    this.activeBoard = board; this.selected = next;
    this.updateHighlights();
    let target: THREE.Vector3, position: THREE.Vector3;
    if (next) {
      const home = next.home.clone(); home.z += .72;
      target = this.boards[next.board].localToWorld(home);
      // The veil sits just behind the lifted note. The outer easels are turned
      // towards the centre, so a veil near the board surface tilts behind the
      // neighbouring board and leaves it unsoftened.
      this.focusVeil.position.copy(this.boards[next.board].localToWorld(next.home.clone().add(new THREE.Vector3(0,0,.60))));
      this.focusVeil.quaternion.copy(this.boards[next.board].quaternion);
      this.focusShadow.position.copy(this.boards[next.board].localToWorld(next.home.clone().add(new THREE.Vector3(.025,-.025,.66))));
      this.focusShadow.quaternion.copy(this.boards[next.board].quaternion);
      this.focusShadow.scale.set(this.detailSize.x*1.35,this.detailSize.y*1.35,1);
      const normal = new THREE.Vector3(0,0,1).applyQuaternion(this.boards[next.board].quaternion);
      position = target.clone().addScaledVector(normal,this.distance(this.detailSize.x,this.detailSize.y));
    } else if (prior && this.savedView) {
      target = this.savedView.target.clone(); position = this.savedView.position.clone();
    } else if (board !== null) {
      target = this.boards[board].position.clone();
      position = target.clone().add(new THREE.Vector3(.06,.04,this.distance(3.2,4.9)));
    } else {
      target = new THREE.Vector3(0,2.65,0);
      position = target.clone().add(new THREE.Vector3(.95,1.2,this.distance(15.4,6.6)));
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
    for (const p of this.papers) {
      const matches=p===this.selected || !q || p.note.text.toLocaleLowerCase().includes(q);
      p.mesh.material.color.set(matches?'#ffffff':'#88887e');
      p.mesh.material.emissive.set(q&&matches&&p!==this.selected?'#263a0c':'#000000');
      p.mesh.material.emissiveIntensity = .16;
    }
  }

  zoom(direction:number) {
    this.moving=undefined;
    const offset=this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*(direction > 0 ? .8 : 1.25),.25,35));
    this.camera.position.copy(this.controls.target).add(offset); this.controls.update();this.invalidate();
  }

  reset() {if(!this.selected)this.savedView=undefined;this.show(this.activeBoard,this.selected?.note.id);}

  pan(x:number,y:number) {this.controls.pan(x,y);this.controls.update();this.invalidate();}

  private invalidate(duration=500) {
    this.endAt=Math.max(this.endAt,performance.now()+duration);
    if (!this.frame) this.frame=requestAnimationFrame(this.render);
  }
  private render = (time:number) => {
    this.frame=0;
    const delta=Math.min((time-this.lastFrame)/1000,.05);this.lastFrame=time;
    this.controls.update();
    if (this.moving) {
      const t=Math.min((time-this.moving.start)/850,1), ease=1-Math.pow(1-t,4);
      this.camera.position.lerpVectors(this.moving.from,this.moving.to,ease);
      this.controls.target.lerpVectors(this.moving.fromTarget,this.moving.target,ease);
      this.camera.lookAt(this.controls.target);
      if(t===1) this.moving=undefined;
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
    if(time<this.endAt || this.moving) this.frame=requestAnimationFrame(this.render);
  };

  dispose() {
    cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.controls.dispose();
    this.scene.traverse(object=>{
      if(object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials=Array.isArray(object.material)?object.material:[object.material];
        for(const material of materials) {if('map' in material) (material.map as THREE.Texture|null)?.dispose();material.dispose();}
      }
    });
    this.renderer.dispose();this.renderer.domElement.remove();
  }
}
