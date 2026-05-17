// FIXME: Uses layered-sine noise (not full Perlin) and simplified contour extraction.
// Full implementation would use proper Perlin/simplex noise + marching squares.
import { EffectBase } from '../core/EffectBase.js';

export class TopologyEffect extends EffectBase {
  init() {
    this._t = 0;
    this._step = Math.round(12 + 8 * (1 - this.intensity));
    this._levels = 8;
  }

  _field(x, y, t) {
    return Math.sin(x * 0.006 + t * 0.3) * 0.4 +
           Math.cos(y * 0.007 - t * 0.2 + 1.2) * 0.35 +
           Math.sin((x + y) * 0.004 + t * 0.5) * 0.15 +
           Math.cos(Math.hypot(x - this.W/2, y - this.H/2) * 0.005 - t * 0.4) * 0.1;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.012 * dt * this.intensity;
    if (this.mouse.active) {
      this._mx = this.mouse.x; this._my = this.mouse.y;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const step = this._step, t = this._t;
    const cols = Math.ceil(this.W / step) + 1;
    const rows = Math.ceil(this.H / step) + 1;

    // Sample field
    const field = [];
    for (let r = 0; r < rows; r++) {
      field[r] = [];
      for (let c = 0; c < cols; c++) {
        field[r][c] = this._field(c * step, r * step, t);
      }
    }

    ctx.save();
    ctx.lineWidth = 1;
    for (let lv = 0; lv < this._levels; lv++) {
      const threshold = -0.8 + (lv / this._levels) * 1.6;
      const alpha = (0.12 + (lv / this._levels) * 0.25) * this.intensity;
      ctx.strokeStyle = this.rgba(col, alpha);
      ctx.beginPath();
      // Simple contour: walk each row and find crossings
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v00 = field[r][c], v10 = field[r][c+1];
          const v01 = field[r+1][c], v11 = field[r+1][c+1];
          const x0 = c * step, y0 = r * step;
          // Top edge crossing
          if ((v00 < threshold) !== (v10 < threshold)) {
            const tx = x0 + step * (threshold - v00) / (v10 - v00);
            ctx.moveTo(tx, y0);
            // Find exit edge (left/right/bottom)
            if ((v01 < threshold) !== (v11 < threshold)) {
              const bx = x0 + step * (threshold - v01) / (v11 - v01);
              ctx.lineTo(bx, y0 + step);
            } else {
              ctx.lineTo(x0, y0 + step * (threshold - v00) / (v01 - v00 || 0.0001));
            }
          }
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  onExplosion() { this._t += 2; }
}
