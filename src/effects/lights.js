import { EffectBase } from '../core/EffectBase.js';

export class LightsEffect extends EffectBase {
  init() {
    const n = Math.round(10 + 350 * Math.pow(this.intensity, 2.2));
    this._p = Array.from({ length: n }, () => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.7, 0.7), vy: this.rand(-0.7, 0.7),
      r: this.rand(1.5, 4.5), op: this.rand(0.4, 1),
    }));
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const n = Math.round(10 + 350 * Math.pow(this.intensity, 2.2));
    while (this._p.length < n) this._p.push({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.7, 0.7), vy: this.rand(-0.7, 0.7),
      r: this.rand(1.5, 4.5), op: this.rand(0.4, 1),
    });
    this._p.length = n;
    const { x: mx, y: my, active } = this.mouse;
    const ir = this.options.influenceRadius;
    for (const p of this._p) {
      p.vx += (Math.random() - 0.5) * 0.06 * dt;
      p.vy += (Math.random() - 0.5) * 0.06 * dt;
      if (active) {
        const d = this.dist(p.x, p.y, mx, my);
        if (d < ir && d > 1) {
          const f = ((ir - d) / ir) * 0.05 * this.intensity * dt;
          p.vx += (mx - p.x) / d * f;
          p.vy += (my - p.y) / d * f;
        }
      }
      const damp = Math.pow(0.965, dt);
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt; p.y += p.vy * dt;
      this.wrap(p);
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    for (const p of this._p) {
      ctx.shadowBlur = p.r * 7;
      ctx.shadowColor = this.rgba(col, 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, p.op);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _push(x, y, s) {
    for (const p of this._p) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d < 220 && d > 1) {
        const f = ((220 - d) / 220) * 9 * s;
        p.vx += dx / d * f; p.vy += dy / d * f;
      }
    }
  }
  onExplosion(x, y) { this._push(x, y, 1); }
  onImplosion(x, y) { this._push(x, y, -1); }
}
