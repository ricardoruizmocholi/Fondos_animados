import { EffectBase } from '../core/EffectBase.js';

const SHAPES = ['rect', 'circle', 'triangle'];
const PALETTE = ['#f94144','#f3722c','#f8961e','#f9c74f','#90be6d','#43aa8b','#577590','#a855f7','#ec4899'];

export class ConfettiEffect extends EffectBase {
  init() {
    const n = Math.round(40 + 100 * this.intensity);
    this._pieces = Array.from({ length: n }, () => this._mk(true));
    this._wind = 0; this._t = 0;
  }

  _mk(init = false) {
    return {
      x: this.rand(0, this.W),
      y: init ? this.rand(-this.H, 0) : this.rand(-60, -10),
      vx: this.rand(-1.5, 1.5), vy: this.rand(2, 6),
      rot: this.rand(0, Math.PI * 2), drot: this.rand(-0.1, 0.1),
      w: this.rand(6, 14), h: this.rand(4, 10),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      wobble: this.rand(0, Math.PI * 2), wfreq: this.rand(0.02, 0.06),
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    this._wind = Math.sin(this._t * 0.3) * 0.5;
    for (const p of this._pieces) {
      p.wobble += p.wfreq * dt;
      p.vx = this._wind + Math.sin(p.wobble) * 0.8;
      p.vy += 0.1 * dt;
      p.vy = Math.min(p.vy, 8);
      p.rot += p.drot * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > this.H + 20) Object.assign(p, this._mk());
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    for (const p of this._pieces) {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'circle') {
        ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.h); ctx.lineTo(p.w / 2, p.h / 2); ctx.lineTo(-p.w / 2, p.h / 2);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  onExplosion(x, y) {
    for (const p of this._pieces) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < 150) { p.vx += (p.x - x) / d * 8; p.vy -= 5; }
    }
  }
}
