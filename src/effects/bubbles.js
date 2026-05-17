import { EffectBase } from '../core/EffectBase.js';

export class BubblesEffect extends EffectBase {
  init() {
    const n = Math.round(15 + 35 * this.intensity);
    this._b = Array.from({ length: n }, () => this._mk(true));
    this._pops = [];
    this._t = 0;
  }

  _mk(init = false) {
    return {
      x: this.rand(0, this.W),
      y: init ? this.rand(0, this.H) : this.H + this.rand(20, 60),
      r: this.rand(15, 50),
      vy: this.rand(-0.6, -0.2),
      wobble: this.rand(0, Math.PI * 2),
      wfreq: this.rand(0.02, 0.05),
      wamp: this.rand(0.5, 2),
      op: this.rand(0.3, 0.6),
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    for (const p of this._pops) {
      p.r += 3 * dt; p.op -= 0.04 * dt;
      p.particles?.forEach(pp => { pp.x += pp.vx*dt; pp.y += pp.vy*dt; pp.op -= 0.05*dt; });
    }
    this._pops = this._pops.filter(p => p.op > 0);
    for (let i = this._b.length - 1; i >= 0; i--) {
      const b = this._b[i];
      b.wobble += b.wfreq * dt;
      b.x += Math.sin(b.wobble) * b.wamp * dt;
      b.y += b.vy * dt;
      if (b.y < -b.r) Object.assign(b, this._mk());
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    for (const b of this._b) {
      ctx.globalAlpha = b.op;
      ctx.strokeStyle = this.rgba(col, 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      const g = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.1,
                                          b.x, b.y, b.r);
      g.addColorStop(0, this.rgba(col, 0.15));
      g.addColorStop(0.5, this.rgba(col, 0.05));
      g.addColorStop(1, this.rgba(col, 0.02));
      ctx.fillStyle = g; ctx.fill();
      // Specular
      ctx.globalAlpha = b.op * 0.6;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(b.x - b.r*0.35, b.y - b.r*0.35, b.r*0.18, b.r*0.1, -0.5, 0, Math.PI*2); ctx.fill();
    }
    // Pop rings
    for (const p of this._pops) {
      ctx.globalAlpha = p.op;
      ctx.strokeStyle = this.rgba(col, p.op);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }

  onExplosion(x, y) {
    let hit = -1, hd = Infinity;
    this._b.forEach((b, i) => { const d = Math.hypot(b.x-x, b.y-y); if (d < b.r && d < hd) { hit = i; hd = d; } });
    if (hit >= 0) {
      const b = this._b[hit];
      this._pops.push({ x: b.x, y: b.y, r: b.r, op: 0.6 });
      Object.assign(b, this._mk());
    }
  }
}
