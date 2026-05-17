import { ColorSystem } from './ColorSystem.js';

export class EffectBase {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.options = {
      color: '#4f9cf9',
      intensity: 0.8,
      darkMode: true,
      influenceRadius: 120,
      ...options,
    };
    this.mouse = { x: canvas.width / 2, y: canvas.height / 2, active: false };
    this.init();
  }

  // ── Accessors ──────────────────────────────────────────────────────────────
  get color()     { return this.options.color; }
  get intensity() { return this.options.intensity; }
  get darkMode()  { return this.options.darkMode !== false; }
  get W()         { return this.canvas.width; }
  get H()         { return this.canvas.height; }

  resolvedColor() { return ColorSystem.resolve(this.color, this.darkMode); }
  rgba(hex, a)    { return ColorSystem.rgba(hex, a); }

  setOptions(opts) {
    Object.assign(this.options, opts);
    this.onOptionsChange?.();
  }

  // ── Subclass interface ─────────────────────────────────────────────────────
  init()               {}
  update(mouse, _dt)   { if (mouse) this.mouse = mouse; }
  draw()               {}
  resize()             { this.init(); }
  onExplosion(_x, _y)  {}
  onImplosion(_x, _y)  {}
  destroy()            {}

  // ── Math helpers ──────────────────────────────────────────────────────────
  rand(a, b)         { return a + Math.random() * (b - a); }
  randInt(a, b)      { return Math.floor(this.rand(a, b + 1)); }
  lerp(a, b, t)      { return a + (b - a) * t; }
  clamp(v, lo, hi)   { return v < lo ? lo : v > hi ? hi : v; }
  dist(x1,y1,x2,y2)  { return Math.hypot(x2 - x1, y2 - y1); }
  smoothstep(t)      { return t * t * (3 - 2 * t); }

  /** Wrap-around canvas boundary */
  wrap(p) {
    const m = 20;
    if (p.x < -m) p.x = this.W + m;
    else if (p.x > this.W + m) p.x = -m;
    if (p.y < -m) p.y = this.H + m;
    else if (p.y > this.H + m) p.y = -m;
  }

  /** Cheap multi-octave noise using layered sines */
  noise2D(x, y, t = 0) {
    return (
      Math.sin(x * 0.008 + t * 0.4) * 0.4 +
      Math.cos(y * 0.011 - t * 0.6 + 1.7) * 0.3 +
      Math.sin((x + y) * 0.005 + t * 0.9 + 3.1) * 0.2 +
      Math.cos(x * 0.02 - y * 0.013 + t * 1.3) * 0.1
    );
  }
}
