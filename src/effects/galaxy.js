import { EffectBase } from '../core/EffectBase.js';

export class GalaxyEffect extends EffectBase {
  init() {
    const n = Math.round(200 + 400 * this.intensity);
    const arms = 4, maxR = Math.min(this.W, this.H) * 0.42;
    this._stars = [];
    for (let i = 0; i < n; i++) {
      const arm = i % arms;
      const t = Math.random();
      const r = t * maxR;
      const spread = this.rand(-0.4, 0.4) * (1 - t * 0.5);
      const baseAngle = (arm / arms) * Math.PI * 2 + r * 0.012;
      const angle = baseAngle + spread;
      this._stars.push({
        r, angle,
        x: Math.cos(angle) * r, y: Math.sin(angle) * r,
        size: this.rand(0.5, 2.5) * (1 - t * 0.6),
        brightness: this.rand(0.3, 1),
        orbitSpeed: (0.0003 + 0.0004 * (1 - t / maxR)) * (Math.random() > 0.5 ? 1 : 1),
      });
    }
    // Core glow
    this._core = { x: this.W / 2, y: this.H / 2 };
    this._tiltX = 0; this._tiltY = 0;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const { x: mx, y: my, active } = this.mouse;
    const ttx = active ? (mx / this.W - 0.5) * 0.3 : 0;
    const tty = active ? (my / this.H - 0.5) * 0.2 : 0;
    this._tiltX += (ttx - this._tiltX) * 0.03;
    this._tiltY += (tty - this._tiltY) * 0.03;
    for (const s of this._stars) {
      s.angle += s.orbitSpeed * dt;
      s.x = Math.cos(s.angle) * s.r;
      s.y = Math.sin(s.angle) * s.r;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const cx = this.W / 2, cy = this.H / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 + this._tiltX * 0.2, 1 - this._tiltY * 0.3);
    // Core
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
    cg.addColorStop(0, this.rgba(col, 0.6));
    cg.addColorStop(0.5, this.rgba(col, 0.1));
    cg.addColorStop(1, this.rgba(col, 0));
    ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fillStyle = cg; ctx.fill();
    // Stars
    ctx.shadowBlur = 3;
    for (const s of this._stars) {
      ctx.shadowColor = this.rgba(col, s.brightness * 0.6);
      ctx.fillStyle = this.rgba(col, s.brightness);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  onExplosion() {
    for (const s of this._stars) s.orbitSpeed *= 3;
    setTimeout(() => { for (const s of this._stars) s.orbitSpeed /= 3; }, 1500);
  }
}
