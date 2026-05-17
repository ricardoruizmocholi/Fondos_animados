// FIXME: pixel-level rendering uses scaled ImageData for performance (1/4 resolution).
// Full-resolution version would require WebGL for 60fps on large canvases.
import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class PlasmaEffect extends EffectBase {
  init() {
    this._t = 0;
    this._scale = 4; // render at 1/4 resolution
    this._offscreen = document.createElement('canvas');
    this._offCtx = this._offscreen.getContext('2d');
    this._updateSize();
    const [h] = ColorSystem.hexToHsl(this.color);
    this._baseHue = h;
  }

  _updateSize() {
    this._offscreen.width  = Math.ceil(this.W / this._scale);
    this._offscreen.height = Math.ceil(this.H / this._scale);
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    const [h] = ColorSystem.hexToHsl(this.color);
    this._baseHue = h;
  }

  draw() {
    const ctx = this._offCtx;
    const W = this._offscreen.width, H = this._offscreen.height;
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const t = this._t, bh = this._baseHue;
    const mx = this.mouse.active ? this.mouse.x / this._scale : W / 2;
    const my = this.mouse.active ? this.mouse.y / this._scale : H / 2;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = Math.sin(x * 0.08 + t) +
                  Math.sin(y * 0.08 + t * 0.9) +
                  Math.sin((x + y) * 0.05 + t * 1.1) +
                  Math.sin(Math.hypot(x - mx, y - my) * 0.1 - t * 1.5);
        const norm = (v + 4) / 8;
        const hue = (bh + norm * 120) % 360;
        const sat = 80 + norm * 20;
        const lit = this.darkMode ? 30 + norm * 40 : 20 + norm * 30;
        const hex = ColorSystem.hslToHex(hue, sat, lit);
        const [r, g, b] = ColorSystem.hexToRgb(hex);
        const i = (y * W + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this._offscreen, 0, 0, W, H, 0, 0, this.W, this.H);
    this.ctx.restore();
  }

  resize() { this._updateSize(); }
  destroy() { this._offscreen = null; }
  onExplosion() { this._t += Math.PI; }
}
