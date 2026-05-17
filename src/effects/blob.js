import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class BlobEffect extends EffectBase {
  init() {
    const n = Math.round(3 + 5 * this.intensity);
    this._blobs = Array.from({ length: n }, (_, i) => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.5, 0.5), vy: this.rand(-0.5, 0.5),
      r: this.rand(this.W * 0.12, this.W * 0.28),
      hueOffset: (i / n) * 360,
      phase: this.rand(0, Math.PI * 2), dphase: this.rand(0.005, 0.015),
    }));
    this._t = 0;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.01 * dt;
    const [baseH, s] = ColorSystem.hexToHsl(this.color);
    const { x: mx, y: my, active } = this.mouse;
    for (const b of this._blobs) {
      b.phase += b.dphase * dt;
      b.vx += (Math.random() - 0.5) * 0.02 * dt;
      b.vy += (Math.random() - 0.5) * 0.02 * dt;
      b.vx *= Math.pow(0.98, dt); b.vy *= Math.pow(0.98, dt);
      if (active) {
        const d = Math.hypot(b.x - mx, b.y - my);
        if (d < 300) {
          b.vx += (mx - b.x) / d * 0.08 * dt;
          b.vy += (my - b.y) / d * 0.08 * dt;
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      // Bounce
      if (b.x < b.r * 0.3 || b.x > this.W - b.r * 0.3) b.vx *= -0.8;
      if (b.y < b.r * 0.3 || b.y > this.H - b.r * 0.3) b.vy *= -0.8;
      b.x = this.clamp(b.x, 0, this.W);
      b.y = this.clamp(b.y, 0, this.H);
      b.hue = (baseH + b.hueOffset + this._t * 20) % 360;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.filter = 'blur(30px)';
    ctx.globalCompositeOperation = this.darkMode ? 'screen' : 'multiply';
    for (const b of this._blobs) {
      const pulsed = b.r * (1 + Math.sin(b.phase) * 0.15);
      const hex = ColorSystem.hslToHex(b.hue, 75, this.darkMode ? 55 : 45);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, pulsed);
      g.addColorStop(0, ColorSystem.rgba(hex, 0.8));
      g.addColorStop(0.5, ColorSystem.rgba(hex, 0.4));
      g.addColorStop(1, ColorSystem.rgba(hex, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, pulsed, 0, Math.PI * 2); ctx.fill();
    }
    ctx.filter = 'none'; ctx.restore();
  }

  onExplosion(x, y) {
    for (const b of this._blobs) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < 300) { b.vx += (b.x-x)/d*5; b.vy += (b.y-y)/d*5; }
    }
  }
}
