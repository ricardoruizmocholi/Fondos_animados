import { EffectBase } from '../core/EffectBase.js';

export class RainEffect extends EffectBase {
  init() {
    const n = Math.round(60 + 140 * this.intensity);
    this._drops = Array.from({ length: n }, () => this._mkDrop(true));
    this._ripples = [];
    this._splashes = [];
    this._wind = 0; this._t = 0;
  }

  _mkDrop(init = false) {
    const speed = this.rand(8, 18) * this.intensity;
    return {
      x: this.rand(-20, this.W + 20),
      y: init ? this.rand(-this.H, 0) : this.rand(-60, -5),
      speed,
      len: speed * 0.9,
      vx: this._wind + this.rand(-0.3, 0.3),
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    this._wind = Math.sin(this._t * 0.15) * 1.2 * this.intensity;

    for (let i = this._drops.length - 1; i >= 0; i--) {
      const d = this._drops[i];
      d.vx = this._wind;
      d.x += d.vx * dt;
      d.y += d.speed * dt;
      if (d.y > this.H) {
        this._ripples.push({ x: d.x, y: this.H - 2, r: 0, maxR: this.rand(10, 22), op: 0.6 });
        for (let s = 0; s < 3; s++) this._splashes.push({
          x: d.x, y: this.H - 2,
          vx: this.rand(-2.5, 2.5), vy: this.rand(-4, -1.5),
          life: 1,
        });
        Object.assign(d, this._mkDrop());
      }
    }
    for (const r of this._ripples) { r.r += 1.5 * dt; r.op -= 0.02 * dt; }
    this._ripples = this._ripples.filter(r => r.op > 0 && r.r < r.maxR);
    for (const s of this._splashes) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.3 * dt; s.life -= 0.06 * dt; }
    this._splashes = this._splashes.filter(s => s.life > 0);
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    // Drops
    ctx.strokeStyle = this.rgba(col, 0.55);
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const d of this._drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * 0.5, d.y - d.len);
      ctx.stroke();
    }
    // Ripples
    for (const r of this._ripples) {
      ctx.strokeStyle = this.rgba(col, r.op * 0.5);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Splashes
    ctx.fillStyle = this.rgba(col, 0.5);
    for (const s of this._splashes) {
      ctx.globalAlpha = s.life * 0.6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  onExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
      this._ripples.push({ x, y, r: 0, maxR: this.rand(20, 60), op: 0.7 });
    }
  }
}
