import { EffectBase } from '../core/EffectBase.js';

function noise(x, y, t) {
  return Math.sin(x * 0.008 + t * 0.4) * 0.45 +
         Math.cos(y * 0.011 - t * 0.6 + 1.7) * 0.30 +
         Math.sin((x + y) * 0.005 + t * 0.9 + 3.1) * 0.15 +
         Math.cos(x * 0.02 - y * 0.013 + t * 1.3 + 0.8) * 0.10;
}

export class SmokeEffect extends EffectBase {
  init() {
    this._t = 0;
    const n = Math.round(55 * this.intensity);
    this._puffs = Array.from({ length: n }, () => {
      const p = this._mk();
      p.y = this.rand(0, this.H);
      return p;
    });
  }

  _mk() {
    return {
      x: this.rand(0, this.W), y: this.H + this.rand(0, 60),
      vx: this.rand(-0.3, 0.3), vy: this.rand(-0.8, -0.3),
      size: this.rand(20, 50), gr: this.rand(0.15, 0.4),
      op: this.rand(0.06, 0.16), fr: this.rand(0.001, 0.003),
      phase: this.rand(0, 100),
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    const n = Math.round(55 * this.intensity);
    while (this._puffs.length < n) this._puffs.push(this._mk());
    const { x: mx, y: my, active } = this.mouse;
    for (let i = this._puffs.length - 1; i >= 0; i--) {
      const p = this._puffs[i];
      p.vx += noise(p.x + p.phase, p.y, this._t) * 0.08 * dt;
      p.vy -= 0.012 * dt;
      if (active) {
        const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 1) {
          const f = ((140 - d) / 140) * 0.25 * this.intensity * dt;
          p.vx += dx / d * f; p.vy += dy / d * f * 0.5;
        }
      }
      p.vx *= Math.pow(0.97, dt); p.vy *= Math.pow(0.99, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.size += p.gr * dt; p.op -= p.fr * dt;
      if (p.x < -p.size) p.x = this.W + p.size;
      else if (p.x > this.W + p.size) p.x = -p.size;
      if (p.op <= 0 || p.y < -p.size) this._puffs[i] = this._mk();
    }
    if (this._puffs.length > n) this._puffs.length = n;
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of this._puffs) {
      const drawCircle = (r, a) => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, this.rgba(col, a));
        g.addColorStop(0.4, this.rgba(col, a * 0.5));
        g.addColorStop(1, this.rgba(col, 0));
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      };
      drawCircle(p.size, this.clamp(p.op, 0, 0.3));
      drawCircle(p.size * 0.3, this.clamp(p.op * 1.5, 0, 0.4));
    }
    ctx.restore();
  }

  _disturb(x, y, s) {
    for (const p of this._puffs) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) { p.vx += dx / d * 3 * s; p.vy += dy / d * 3 * s; }
    }
  }
  onExplosion(x, y) { this._disturb(x, y, 1); }
  onImplosion(x, y) { this._disturb(x, y, -1); }
}
