import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class HolographicEffect extends EffectBase {
  init() {
    this._t = 0;
    this._hueOffset = 0;
    this._shimmerLines = Array.from({ length: 12 }, (_, i) => ({
      y: (i / 12) * this.H,
      speed: this.rand(0.3, 1.2) * (i % 2 === 0 ? 1 : -1),
      width: this.rand(1, 4),
    }));
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.01 * dt;
    const { x, active } = this.mouse;
    this._hueOffset = active ? (x / this.W) * 180 : this._t * 20;
    for (const l of this._shimmerLines) {
      l.y += l.speed * dt;
      if (l.y < -2) l.y = this.H + 2;
      if (l.y > this.H + 2) l.y = -2;
    }
  }

  draw() {
    const ctx = this.ctx;
    const [baseH] = ColorSystem.hexToHsl(this.color);
    ctx.save();

    // Iridescent gradient background
    const steps = 8;
    const stripW = this.W / steps;
    for (let i = 0; i < steps; i++) {
      const x = i * stripW;
      const hue = (baseH + this._hueOffset + (i / steps) * 120 + this._t * 15) % 360;
      const g = ctx.createLinearGradient(x, 0, x + stripW, this.H);
      g.addColorStop(0, ColorSystem.hslToHex((hue) % 360, 80, this.darkMode ? 12 : 88));
      g.addColorStop(0.5, ColorSystem.hslToHex((hue + 30) % 360, 90, this.darkMode ? 18 : 82));
      g.addColorStop(1, ColorSystem.hslToHex((hue + 60) % 360, 80, this.darkMode ? 12 : 88));
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, stripW + 1, this.H);
    }

    // Diagonal iridescent sheen
    const diag = ctx.createLinearGradient(0, 0, this.W, this.H);
    diag.addColorStop(0, 'rgba(255,255,255,0)');
    diag.addColorStop(0.3 + Math.sin(this._t) * 0.1, `rgba(255,255,255,${0.12 * this.intensity})`);
    diag.addColorStop(0.5, 'rgba(255,255,255,0)');
    diag.addColorStop(0.7 + Math.cos(this._t * 0.7) * 0.1, `rgba(255,255,255,${0.08 * this.intensity})`);
    diag.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = diag; ctx.fillRect(0, 0, this.W, this.H);

    // Shimmer lines
    for (const l of this._shimmerLines) {
      const shimAlpha = (0.06 + Math.sin(this._t * 2 + l.y * 0.01) * 0.04) * this.intensity;
      ctx.fillStyle = `rgba(255,255,255,${shimAlpha})`;
      ctx.fillRect(0, l.y, this.W, l.width);
    }
    ctx.restore();
  }

  onExplosion() { this._hueOffset += 90; }
}
