import test from 'node:test';
import assert from 'node:assert/strict';
class DemandRenderer {
  frame=null;paused=false;disposed=false;until=0;previous=0;
  constructor(draw,clock){this.draw=draw;this.clock=clock;}
  request(duration=0){this.until=Math.max(this.until,this.clock.now()+duration);this.schedule();}
  schedule(){if(this.disposed||this.paused||this.frame!==null)return;this.frame=this.clock.request(time=>{this.frame=null;const delta=this.previous?Math.min((time-this.previous)/1000,.05):1/60;this.previous=time;const moving=this.draw(time,delta);if(moving||time<this.until)this.schedule();});}
  setPaused(paused){this.paused=paused;if(paused){if(this.frame!==null)this.clock.cancel(this.frame);this.frame=null;this.previous=0;}else this.request();}
  dispose(){this.disposed=true;if(this.frame!==null)this.clock.cancel(this.frame);this.frame=null;}
}
function drawingRatio(width,height,dpr){return Math.min(Math.max(dpr,1),1.5,Math.sqrt(1250000/Math.max(width*height,1)));}

function clock() {
  let time=0,id=0;
  const pending=new Map();
  return {
    request:callback=>{pending.set(++id,callback);return id;},
    cancel:key=>pending.delete(key), now:()=>time,
    pending:()=>pending.size,
    step:()=>{time+=16;const batch=[...pending.values()];pending.clear();batch.forEach(callback=>callback(time));},
  };
}

test('controls requesting another render during a frame never fork the animation loop',()=>{
  const time=clock();let frames=0;
  const loop=new DemandRenderer(()=>{
    frames++;
    if(frames<20){loop.request(40);loop.request(40);}
    return frames<20;
  },time);
  loop.request();loop.request();
  for(let i=0;i<40;i++) {assert.ok(time.pending()<=1);time.step();}
  assert.equal(time.pending(),0);
  assert.ok(frames>=20&&frames<=23);
  loop.dispose();
});

test('hidden/reading views cancel pending frames and resume with a single frame',()=>{
  const time=clock();let count=0;
  const loop=new DemandRenderer(()=>{count++;return false;},time);
  loop.request(100);loop.setPaused(true);loop.request(100);
  for(let i=0;i<20;i++)time.step();
  assert.equal(count,0);assert.equal(time.pending(),0);
  loop.setPaused(false);assert.equal(time.pending(),1);time.step();assert.equal(count,1);
  loop.dispose();loop.request();assert.equal(time.pending(),0);
});

test('high-DPI drawing buffers remain under the pixel budget',()=>{
  for(const [width,height,dpr] of [[390,650,3],[1440,800,2],[3840,2160,2]]) {
    const ratio=drawingRatio(width,height,dpr);
    assert.ok(ratio<=1.5);assert.ok(width*height*ratio*ratio<=1_250_001);
  }
  assert.equal(drawingRatio(390,650,1),1);
});
