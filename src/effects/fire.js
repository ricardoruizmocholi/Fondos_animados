// FIXME: Classic cellular-automata fire. The color palette is generated from
// the user's base color; a future version could support custom multi-stop palettes.
import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class FireEffect extends EffectBase {
  init() {
    this._sc = 3; // pixel scale
    this._fw = Math.ceil(this.W / this._sc);
    this._fh = Math.ceil(this.H / this._sc) + 2;
    this._heat = new Uint8Array(this._fw * this._fh);
    this._offscreen = document.createElement('canvas');
    this._offCtx = this._offscreen.getContext('2d');
    this._offscreen.width = this._fw;
    this._offscreen.height = this._fh;
    this._buildPalette();
  }

  _buildPalette() {
    const [h, s] = ColorSystem.hexToHsl(this.color);
    this._palette = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      let r, g, b;
      if (i < 64) {
        r = 0; g = 0; b = 0;
      } else if (i < 128) {
        const t = (i - 64) / 64;
        const px = ColorSystem.hslToHex(h, s, t * 25);
        [r, g, b] = ColorSystem.hexToRgb(px);
      } else if (i < 192) {
        const t = (i - 128) / 64;
        const px = ColorSystem.hslToHex((h + 20) % 360, s, 25 + t * 30);
        [r, g, b] = ColorSystem.hexToRgb(px);
      } else {
        const t = (i - 192) / 64;
        const px = ColorSystem.hslToHex((h + 40) % 360, Math.max(s - 20, 30), 55 + t * 40);
        [r, g, b] = ColorSystem.hexToRgb(px);
      }
      this._palette[i * 3] = r;
      this._palette[i * 3 + 1] = g;
      this._palette[i * 3 + 2] = b;
    }
  }

  onOptionsChange() { this._buildPalette(); }

  update(mouse, dt = 1) {
    super.update(mouse);
    const W = this._fw, H = this._fh;
    const heat = this._heat;
    const power = Math.round(180 + 75 * this.intensity);

    // Stoke the bottom rows
    for (let x = 0; x < W; x++) {
      heat[(H - 1) * W + x] = power + Math.random() * (255 - power);
      heat[(H - 2) * W + x] = power + Math.random() * (255 - power);
    }

    // Mouse cursor adds heat
    if (this.mouse.active) {
      const gx = Math.floor(this.mouse.x / this._sc);
      const gy = Math.floor(this.mouse.y / this._sc);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const nx = gx + dx, ny = gy + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H)
          heat[ny * W + nx] = Math.min(255, heat[ny * W + nx] + 60);
      }
    }

    // Propagate upward (classic fire algorithm)
    const iters = Math.ceil(dt);
    for (let iter = 0; iter < iters; iter++) {
      for (let y = 0; y < H - 1; y++) {
        for (let x = 0; x < W; x++) {
          const decay = Math.floor(Math.random() * 3);
          const below = heat[(y + 1) * W + x];
          const bleft = heat[(y + 1) * W + Math.max(x - 1, 0)];
          const bright = heat[(y + 1) * W + Math.min(x + 1, W - 1)];
          heat[y * W + x] = Math.max(0, Math.floor((below + bleft + bright) / 3) - decay);
        }
      }
    }
  }

  draw() {
    const W = this._fw, H = this._fh;
    const img = this._offCtx.createImageData(W, H);
    const d = img.data;
    for (let i = 0; i < W * H; i++) {
      const v = this._heat[i];
      const pi = v * 3;
      d[i * 4]     = this._palette[pi];
      d[i * 4 + 1] = this._palette[pi + 1];
      d[i * 4 + 2] = this._palette[pi + 2];
      d[i * 4 + 3] = v > 10 ? 255 : v * 25;
    }
    this._offCtx.putImageData(img, 0, 0);
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this._offscreen, 0, 0, W, H, 0, 0, this.W, this.H);
    this.ctx.restore();
  }

  resize() {
    this._fw = Math.ceil(this.W / this._sc);
    this._fh = Math.ceil(this.H / this._sc) + 2;
    this._heat = new Uint8Array(this._fw * this._fh);
    this._offscreen.width = this._fw;
    this._offscreen.height = this._fh;
  }
  destroy() { this._offscreen = null; }
  onExplosion(x, y) {
    const gx = Math.floor(x / this._sc), gy = Math.floor(y / this._sc);
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      const nx = gx+dx, ny = gy+dy;
      if (nx>=0&&nx<this._fw&&ny>=0&&ny<this._fh)
        this._heat[ny*this._fw+nx] = 255;
    }
  }
}
