import { EffectBase } from '../core/EffectBase.js';

const CELL = 55;

export class LinesEffect extends EffectBase {
  init() {
    this._segs = [];
    const cols = Math.ceil(this.W / CELL) + 1, rows = Math.ceil(this.H / CELL) + 1;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this._segs.push({
          x: (c + 0.5) * CELL + this.rand(-8, 8),
          y: (r + 0.5) * CELL + this.rand(-8, 8),
          angle: this.rand(0, Math.PI * 2),
          target: this.rand(0, Math.PI * 2),
          len: this.rand(20, 50),
          speed: this.rand(0.008, 0.02),
        });
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    const { x: mx, y: my, active } = this.mouse;
    const ir = this.options.influenceRadius * 1.5;
    for (const s of this._segs) {
      const d = Math.hypot(mx - s.x, my - s.y);
      if (active && d < ir) {
        s.target = Math.atan2(my - s.y, mx - s.x);
        s.speed = 0.06 * (1 - d / ir) * this.intensity + 0.01;
      } else {
        s.target += this.rand(-0.02, 0.02) * dt;
      }
      let diff = s.target - s.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      s.angle += diff * s.speed * dt * 3;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (const s of this._segs) {
      const hl = s.len / 2, cos = Math.cos(s.angle), sin = Math.sin(s.angle);
      const x1 = s.x - cos * hl, y1 = s.y - sin * hl;
      const x2 = s.x + cos * hl, y2 = s.y + sin * hl;
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, this.rgba(col, 0.08));
      g.addColorStop(0.5, this.rgba(col, 0.75));
      g.addColorStop(1, this.rgba(col, 0.08));
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = g; ctx.stroke();
    }
    ctx.restore();
  }

  _burst(x, y, s) {
    for (const seg of this._segs) {
      const d = Math.hypot(seg.x - x, seg.y - y);
      if (d < 200) {
        seg.target = s === 1
          ? Math.atan2(seg.y - y, seg.x - x)
          : Math.atan2(y - seg.y, x - seg.x);
        seg.speed = 0.15;
      }
    }
  }
  onExplosion(x, y) { this._burst(x, y, 1); }
  onImplosion(x, y) { this._burst(x, y, -1); }
}
