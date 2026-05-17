import { EffectBase } from '../core/EffectBase.js';

export class NetworkEffect extends EffectBase {
  init() {
    const n = Math.round(40 + 60 * this.intensity);
    this._p = Array.from({ length: n }, () => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.8, 0.8), vy: this.rand(-0.8, 0.8),
      r: this.rand(2, 4),
    }));
    this._thresh = 150 * this.intensity + 80;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const { x: mx, y: my, active } = this.mouse;
    this._thresh = 150 * this.intensity + 80;
    for (const p of this._p) {
      p.vx += (Math.random() - 0.5) * 0.05 * dt;
      p.vy += (Math.random() - 0.5) * 0.05 * dt;
      if (active) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < 120 && d > 1) {
          p.vx += (mx - p.x) / d * 0.04 * dt;
          p.vy += (my - p.y) / d * 0.04 * dt;
        }
      }
      p.vx *= Math.pow(0.97, dt); p.vy *= Math.pow(0.97, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      this.wrap(p);
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const t = this._thresh;
    ctx.save();
    // Lines
    ctx.lineWidth = 1;
    for (let i = 0; i < this._p.length; i++) {
      for (let j = i + 1; j < this._p.length; j++) {
        const dx = this._p[i].x - this._p[j].x, dy = this._p[i].y - this._p[j].y;
        const d = Math.hypot(dx, dy);
        if (d < t) {
          ctx.strokeStyle = this.rgba(col, (1 - d / t) * 0.5);
          ctx.beginPath(); ctx.moveTo(this._p[i].x, this._p[i].y);
          ctx.lineTo(this._p[j].x, this._p[j].y); ctx.stroke();
        }
      }
    }
    // Dots
    ctx.shadowBlur = 6;
    for (const p of this._p) {
      ctx.shadowColor = this.rgba(col, 0.6);
      ctx.fillStyle = this.rgba(col, 0.85);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _push(x, y, s) {
    for (const p of this._p) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) { p.vx += dx/d*6*s; p.vy += dy/d*6*s; }
    }
  }
  onExplosion(x, y) { this._push(x, y, 1); }
  onImplosion(x, y) { this._push(x, y, -1); }
}
