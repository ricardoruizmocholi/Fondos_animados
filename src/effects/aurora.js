import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class AuroraEffect extends EffectBase {
  init() {
    this._t = 0;
    this._bands = [
      { hue: 160, sat: 80, vert: 0.25, amp: 0.12, freq: 0.7 },
      { hue: 200, sat: 90, vert: 0.40, amp: 0.08, freq: 0.5 },
      { hue: 280, sat: 85, vert: 0.55, amp: 0.14, freq: 0.9 },
      { hue: 140, sat: 75, vert: 0.70, amp: 0.10, freq: 0.6 },
      { hue: 320, sat: 80, vert: 0.35, amp: 0.09, freq: 1.1 },
    ];
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.008 * dt * this.intensity;
    const { x: mx, active } = this.mouse;
    const hueShift = active ? (mx / this.W - 0.5) * 40 : 0;
    for (const b of this._bands) {
      b.hue = (b.hue + hueShift * 0.002 * dt + 360) % 360;
    }
  }

  draw() {
    const ctx = this.ctx;
    const t = this._t;
    ctx.save();
    ctx.globalCompositeOperation = this.darkMode ? 'screen' : 'multiply';
    for (const b of this._bands) {
      const cy = b.vert * this.H;
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * this.W;
        const waveY = cy + Math.sin(i * 0.15 + t * b.freq) * b.amp * this.H
                         + Math.cos(i * 0.07 + t * b.freq * 0.7 + 1.3) * b.amp * this.H * 0.5;
        const bandH = this.H * (0.08 + b.amp * Math.abs(Math.sin(t * 0.3 + i * 0.05)));
        const g = ctx.createLinearGradient(x, waveY - bandH, x, waveY + bandH * 0.5);
        const hex = ColorSystem.hslToHex(b.hue, b.sat, 55);
        g.addColorStop(0, ColorSystem.rgba(hex, 0));
        g.addColorStop(0.4, ColorSystem.rgba(hex, 0.18 * this.intensity));
        g.addColorStop(0.6, ColorSystem.rgba(hex, 0.12 * this.intensity));
        g.addColorStop(1, ColorSystem.rgba(hex, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - 2, waveY - bandH, 4, bandH * 1.5);
      }
    }
    ctx.restore();
  }

  onExplosion(x, y) {
    this._t += 2;
    for (const b of this._bands) b.hue = (b.hue + 60) % 360;
  }
}
