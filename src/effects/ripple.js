import { EffectBase } from '../core/EffectBase.js';

const GW = 100, GH = 62;

export class RippleEffect extends EffectBase {
  init() {
    this._h  = new Float32Array(GW * GH);
    this._v  = new Float32Array(GW * GH);
    this._t  = 0;
    this._nextAuto = 60;
  }

  _idx(x, y) { return y * GW + x; }

  _disturb(gx, gy, str, r = 4) {
    gx = Math.round(gx); gy = Math.round(gy);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = gx + dx, y = gy + dy;
      if (x >= 1 && x < GW-1 && y >= 1 && y < GH-1 && Math.hypot(dx, dy) <= r)
        this._h[this._idx(x, y)] += str * (1 - Math.hypot(dx, dy) / (r+1));
    }
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += dt;
    this._nextAuto -= dt;
    if (this._nextAuto <= 0) {
      this._disturb(this.rand(5, GW-5), this.rand(5, GH-5), 1.5 * this.intensity, 3);
      this._nextAuto = this.rand(40, 90);
    }
    if (mouse?.active) {
      const gx = (this.mouse.x / this.W) * GW;
      const gy = (this.mouse.y / this.H) * GH;
      this._disturb(gx, gy, 0.3 * this.intensity, 2);
    }
    // Wave equation
    const K = 0.18, damp = 0.993;
    for (let y = 1; y < GH-1; y++) for (let x = 1; x < GW-1; x++) {
      const i = this._idx(x, y);
      const avg = (this._h[this._idx(x-1,y)] + this._h[this._idx(x+1,y)] +
                   this._h[this._idx(x,y-1)] + this._h[this._idx(x,y+1)]) * 0.25;
      this._v[i] += (avg - this._h[i]) * K;
      this._v[i] *= damp;
      this._h[i] += this._v[i] * dt;
      this._h[i] = this.clamp(this._h[i], -2, 2);
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const cw = this.W / GW, ch = this.H / GH;
    const ds = ch * 0.6;
    ctx.save();
    ctx.lineWidth = 1;
    // Horizontal lines displaced by height
    for (let y = 0; y < GH; y++) {
      ctx.beginPath();
      for (let x = 0; x < GW; x++) {
        const h = this._h[this._idx(x, y)];
        const px = x * cw, py = y * ch + h * ds;
        x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      const mid = this._h[this._idx(Math.floor(GW/2), y)];
      ctx.strokeStyle = this.rgba(col, this.clamp(0.18 + mid * 0.25, 0.04, 0.55));
      ctx.stroke();
    }
    // Vertical lines
    ctx.lineWidth = 0.6;
    for (let x = 0; x < GW; x++) {
      ctx.beginPath();
      for (let y = 0; y < GH; y++) {
        const h = this._h[this._idx(x, y)];
        const px = x * cw + h * ds * 0.4, py = y * ch;
        y === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = this.rgba(col, 0.07);
      ctx.stroke();
    }
    ctx.restore();
  }

  onExplosion(x, y) {
    this._disturb((x/this.W)*GW, (y/this.H)*GH, 2.5 * this.intensity, 6);
  }
  onImplosion(x, y) {
    this._disturb((x/this.W)*GW, (y/this.H)*GH, -2.5 * this.intensity, 6);
  }
}
