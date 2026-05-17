import { EffectBase } from '../core/EffectBase.js';

export class ShadowsEffect extends EffectBase {
  init() {
    const n = Math.round(5 + 100 * Math.pow(this.intensity, 2.2));
    this._b = Array.from({ length: n }, () => this._mkBlob());
  }

  _mkBlob() {
    return {
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      vx: this.rand(-0.4, 0.4), vy: this.rand(-0.4, 0.4),
      rx: this.rand(40, 100), ry: this.rand(30, 80),
      angle: this.rand(0, Math.PI * 2),
      dangle: this.rand(-0.005, 0.005),
      op: this.rand(0.25, 0.55),
      fadeStart: null, fadeOp: 0,
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const n = Math.round(5 + 100 * Math.pow(this.intensity, 2.2));
    const now = performance.now();
    for (let i = this._b.length - 1; i >= 0; i--) {
      const b = this._b[i];
      if (b.fadeStart !== null) {
        const p = Math.min((now - b.fadeStart) / 400, 1);
        b.op = b.fadeOp * (1 - p);
        if (p >= 1) { const nb = this._mkBlob(); nb.x = -100; this._b[i] = nb; continue; }
      }
    }
    while (this._b.length < n) this._b.push(this._mkBlob());
    const ir = this.options.influenceRadius * 1.5;
    const { x: mx, y: my, active } = this.mouse;
    for (const b of this._b) {
      if (b.fadeStart !== null) continue;
      b.vx += (Math.random() - 0.5) * 0.03 * dt;
      b.vy += (Math.random() - 0.5) * 0.03 * dt;
      b.angle += b.dangle * dt;
      if (active) {
        const d = this.dist(b.x, b.y, mx, my);
        if (d < ir && d > 1) {
          const f = ((ir - d) / ir) * 0.06 * this.intensity * dt;
          b.vx -= (mx - b.x) / d * f;
          b.vy -= (my - b.y) / d * f;
        }
      }
      b.vx *= Math.pow(0.97, dt); b.vy *= Math.pow(0.97, dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      const m = 120;
      if (b.x < -m) b.x = this.W + m; else if (b.x > this.W + m) b.x = -m;
      if (b.y < -m) b.y = this.H + m; else if (b.y > this.H + m) b.y = -m;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = this.darkMode ? 'screen' : 'source-over';
    for (const b of this._b) {
      if (b.op <= 0) continue;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.angle); ctx.scale(b.rx / 60, b.ry / 60);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
      g.addColorStop(0, this.rgba(col, b.op * 0.12));
      g.addColorStop(0.6, this.rgba(col, b.op * 0.06));
      g.addColorStop(1, this.rgba(col, 0));
      ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.shadowBlur = 30; ctx.shadowColor = this.rgba(col, b.op * 0.4);
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, b.op * 0.07); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }
    ctx.restore();
    if (this.mouse.active) {
      const { x, y } = this.mouse;
      const hc = this.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.09)';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 40);
      g.addColorStop(0, hc); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }
  }

  onExplosion(x, y) {
    let hit = null, hd = Infinity;
    for (const b of this._b) {
      if (b.fadeStart !== null) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < Math.max(b.rx, b.ry) * 0.85 && d < hd) { hit = b; hd = d; }
    }
    if (hit) { hit.fadeStart = performance.now(); hit.fadeOp = hit.op; }
    else this._push(x, y, 1);
  }
  onImplosion(x, y) { this._push(x, y, -1); }
  _push(x, y, s) {
    for (const b of this._b) {
      if (b.fadeStart !== null) continue;
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
      if (d < 250 && d > 1) { const f = (250 - d) / 250 * 7 * s; b.vx += dx/d*f; b.vy += dy/d*f; }
    }
  }
}
