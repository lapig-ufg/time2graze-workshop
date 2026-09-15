type FrameClock = {
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
  now: () => number;
};

/** One pending frame, including when controls emit change from inside a frame.
 * Idle, hidden and reading views spend no animation frames.
 */
export class DemandRenderer {
  private frame: number | null = null;
  private rendering = false;
  private paused = false;
  private disposed = false;
  private until = 0;
  private previous = 0;

  constructor(private draw: (time: number, delta: number) => boolean, private clock: FrameClock = {
    request: callback => requestAnimationFrame(callback),
    cancel: id => cancelAnimationFrame(id),
    now: () => performance.now(),
  }) {}

  request(duration = 0) {
    this.until = Math.max(this.until, this.clock.now() + duration);
    this.schedule();
  }

  private schedule() {
    if (this.disposed || this.paused || this.rendering || this.frame !== null) return;
    this.frame = this.clock.request(this.render);
  }

  private render = (time: number) => {
    this.frame = null;
    if (this.paused || this.disposed) return;
    const delta = this.previous ? Math.min((time - this.previous) / 1000, .05) : 1 / 60;
    this.previous = time;
    this.rendering = true;
    let moving = false;
    try { moving = this.draw(time, delta); }
    finally { this.rendering = false; }
    if (moving || time < this.until) this.schedule();
  };

  setPaused(paused: boolean) {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) {
      if (this.frame !== null) this.clock.cancel(this.frame);
      this.frame = null;
      this.previous = 0;
    } else this.request();
  }

  dispose() {
    this.disposed = true;
    if (this.frame !== null) this.clock.cancel(this.frame);
    this.frame = null;
  }
}

/** Bound the GPU framebuffer on high-DPI phones and large monitors. */
export function drawingRatio(width: number, height: number, deviceRatio: number) {
  return Math.min(Math.max(deviceRatio, 1), 1.5, Math.sqrt(1_250_000 / Math.max(width * height, 1)));
}
