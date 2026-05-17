import { EffectBase } from '../core/EffectBase.js';

export class StarfieldEffect extends EffectBase {
  init() {
    const n = Math.round(100 + 150 * this.intensity);
    this._stars = Array.from({ length: n }, () => this._mkStar());
    this._warp = 0;
    this._speed = 2;
  }

  _mkStar(born = false) {
    return {
      x: this.rand(-1, 1), y: this.rand(-1, 1),
      z: born ? this.rand(0.1, 1) : this.rand(0.01, 1),
      pz: 0,
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    if (this._warp > 0) { this._warp -= dt * 0.05; this._speed = 1 + this._warp * 20; }
    else { this._speed = this.lerp(this._speed, 2, 0.05); }
    for (const s of this._stars) {
      s.pz = s.z;
      s.z -= this._speed * 0.003 * dt;
      if (s.z <= 0) Object.assign(s, this._mkStar(true));
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const cx = this.W / 2, cy = this.H / 2;
    const fov = Math.min(this.W, this.H) * 0.7;
    ctx.save();
    for (const s of this._stars) {
      const sx = cx + (s.x / s.z) * fov, sy = cy + (s.y / s.z) * fov;
      const px = cx + (s.x / s.pz) * fov, py = cy + (s.y / s.pz) * fov;
      if (sx < 0 || sx > this.W || sy < 0 || sy > this.H) continue;
      const brightness = 1 - s.z;
      const r = brightness * 2.5;
      const alpha = this.clamp(brightness, 0.1, 1);
      if (this._warp > 0.1) {
        // Draw streak
        ctx.strokeStyle = this.rgba(col, alpha * 0.6);
        ctx.lineWidth = r * 0.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      } else {
        ctx.fillStyle = this.rgba(col, alpha);
        ctx.shadowColor = this.rgba(col, 0.5); ctx.shadowBlur = r * 2;
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(r, 0.5), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  onExplosion() { this._warp = 1; }
  onImplosion() { this._speed = 0.5; }
}
