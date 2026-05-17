// FIXME: Uses pixel-level brute-force at 1/6 resolution. Fortune's algorithm
// would give O(n log n) performance for full-resolution rendering.
import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class VoronoiEffect extends EffectBase {
  init() {
    const n = Math.round(8 + 14 * this.intensity);
    const [baseH] = ColorSystem.hexToHsl(this.color);
    this._seeds = Array.from({ length: n }, (_, i) => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.6, 0.6), vy: this.rand(-0.4, 0.4),
      color: ColorSystem.hslToHex((baseH + (i / n) * 200) % 360, 70, this.darkMode ? 45 : 55),
    }));
    this._scale = 6;
    this._offscreen = document.createElement('canvas');
    this._offCtx = this._offscreen.getContext('2d');
    this._resize();
    this._dirty = true;
  }

  _resize() {
    this._offscreen.width  = Math.ceil(this.W / this._scale);
    this._offscreen.height = Math.ceil(this.H / this._scale);
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const { x: mx, y: my, active } = this.mouse;
    for (const s of this._seeds) {
      s.vx += (Math.random() - 0.5) * 0.03 * dt;
      s.vy += (Math.random() - 0.5) * 0.03 * dt;
      s.vx *= Math.pow(0.98, dt); s.vy *= Math.pow(0.98, dt);
      if (active) {
        const d = Math.hypot(s.x - mx, s.y - my);
        if (d < 200) { s.vx += (mx-s.x)/d*0.08*dt; s.vy += (my-s.y)/d*0.08*dt; }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 0 || s.x > this.W) s.vx *= -1;
      if (s.y < 0 || s.y > this.H) s.vy *= -1;
      s.x = this.clamp(s.x, 0, this.W); s.y = this.clamp(s.y, 0, this.H);
    }
    this._dirty = true;
  }

  draw() {
    if (this._dirty) {
      this._renderVoronoi();
      this._dirty = false;
    }
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this._offscreen, 0, 0, this._offscreen.width, this._offscreen.height, 0, 0, this.W, this.H);
    this.ctx.restore();
    // Draw seeds
    for (const s of this._seeds) {
      this.ctx.beginPath(); this.ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)'; this.ctx.fill();
    }
  }

  _renderVoronoi() {
    const W = this._offscreen.width, H = this._offscreen.height;
    const img = this._offCtx.createImageData(W, H);
    const sc = this._scale;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wx = x * sc, wy = y * sc;
        let best = 0, bestD = Infinity;
        for (let i = 0; i < this._seeds.length; i++) {
          const d = Math.hypot(this._seeds[i].x - wx, this._seeds[i].y - wy);
          if (d < bestD) { bestD = d; best = i; }
        }
        const [r, g, b] = ColorSystem.hexToRgb(this._seeds[best].color);
        const idx = (y * W + x) * 4;
        img.data[idx] = r; img.data[idx+1] = g; img.data[idx+2] = b; img.data[idx+3] = 200;
      }
    }
    this._offCtx.putImageData(img, 0, 0);
  }

  resize() { this._resize(); this._dirty = true; }
  destroy() { this._offscreen = null; }
  onExplosion(x, y) {
    for (const s of this._seeds) { s.vx += (s.x-x)/100*3; s.vy += (s.y-y)/100*3; }
  }
}
