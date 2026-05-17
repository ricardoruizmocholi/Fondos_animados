import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class MeshGradientEffect extends EffectBase {
  init() {
    const n = Math.round(4 + 4 * this.intensity);
    const baseColors = [0, 40, 120, 200, 280, 320, 60, 160].map(h =>
      ColorSystem.hslToHex(h, 70, 60)
    );
    this._orbs = Array.from({ length: n }, (_, i) => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.4, 0.4), vy: this.rand(-0.3, 0.3),
      color: baseColors[i % baseColors.length],
      r: this.rand(this.W * 0.3, this.W * 0.7),
      phase: this.rand(0, Math.PI * 2), dphase: this.rand(0.003, 0.008),
    }));
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const { x: mx, y: my, active } = this.mouse;
    for (const o of this._orbs) {
      o.phase += o.dphase * dt;
      o.vx += (Math.random() - 0.5) * 0.02 * dt;
      o.vy += (Math.random() - 0.5) * 0.02 * dt;
      o.vx *= Math.pow(0.99, dt); o.vy *= Math.pow(0.99, dt);
      if (active) {
        const d = Math.hypot(o.x - mx, o.y - my);
        if (d < 200) {
          o.vx += (mx - o.x) / d * 0.05 * dt;
          o.vy += (my - o.y) / d * 0.05 * dt;
        }
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.x < -o.r) o.x = this.W + o.r;
      else if (o.x > this.W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = this.H + o.r;
      else if (o.y > this.H + o.r) o.y = -o.r;
      // Hue shift over time
      const [h, s, l] = ColorSystem.hexToHsl(o.color);
      o.color = ColorSystem.hslToHex((h + 0.1 * dt) % 360, s, l);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = this.darkMode ? 'screen' : 'multiply';
    for (const o of this._orbs) {
      const pulsed = o.r * (1 + Math.sin(o.phase) * 0.15);
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, pulsed);
      g.addColorStop(0, ColorSystem.rgba(o.color, 0.55));
      g.addColorStop(0.5, ColorSystem.rgba(o.color, 0.18));
      g.addColorStop(1, ColorSystem.rgba(o.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(o.x - pulsed, o.y - pulsed, pulsed * 2, pulsed * 2);
    }
    ctx.restore();
  }
}
