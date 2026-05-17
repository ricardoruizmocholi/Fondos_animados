import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class TrianglesEffect extends EffectBase {
  init() {
    this._tris = [];
    this._buildTris();
    this._t = 0;
  }

  _buildTris() {
    this._tris = [];
    const cellW = Math.round(40 + 30 * (1 - this.intensity));
    const cols = Math.ceil(this.W / cellW) + 1;
    const rows = Math.ceil(this.H / cellW) + 1;
    const [baseH, , baseLit] = ColorSystem.hexToHsl(this.color);
    // Two triangles per grid cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW, y = r * cellW;
        const jitter = () => this.rand(-cellW * 0.15, cellW * 0.15);
        const pts = [
          [x + jitter(), y + jitter()],
          [x + cellW + jitter(), y + jitter()],
          [x + jitter(), y + cellW + jitter()],
          [x + cellW + jitter(), y + cellW + jitter()],
        ];
        const phase = this.rand(0, Math.PI * 2);
        const hue = (baseH + this.rand(-30, 30)) % 360;
        this._tris.push({ pts: [pts[0], pts[1], pts[2]], phase, speed: this.rand(0.01, 0.04), hue });
        this._tris.push({ pts: [pts[1], pts[3], pts[2]], phase: phase + Math.PI, speed: this.rand(0.01, 0.04), hue: (hue + 15) % 360 });
      }
    }
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    for (const tri of this._tris) tri.phase += tri.speed * dt;
  }

  draw() {
    const ctx = this.ctx;
    const [, baseSat] = ColorSystem.hexToHsl(this.color);
    const { x: mx, y: my, active } = this.mouse;
    ctx.save();
    for (const tri of this._tris) {
      const cx = (tri.pts[0][0] + tri.pts[1][0] + tri.pts[2][0]) / 3;
      const cy = (tri.pts[0][1] + tri.pts[1][1] + tri.pts[2][1]) / 3;
      let boost = 1;
      if (active) {
        const d = Math.hypot(cx - mx, cy - my);
        boost = d < 150 ? 1 + (1 - d / 150) * 0.8 : 1;
      }
      const b = (Math.sin(tri.phase) * 0.5 + 0.5) * boost;
      const alpha = (0.08 + b * 0.35) * this.intensity;
      const lit = this.darkMode ? 20 + b * 45 : 75 - b * 35;
      ctx.fillStyle = ColorSystem.hslToHex(tri.hue, baseSat, lit);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ColorSystem.rgba(ColorSystem.hslToHex(tri.hue, 60, this.darkMode ? 70 : 30), 0.15 + b * 0.2);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(tri.pts[0][0], tri.pts[0][1]);
      ctx.lineTo(tri.pts[1][0], tri.pts[1][1]);
      ctx.lineTo(tri.pts[2][0], tri.pts[2][1]);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  onExplosion(x, y) {
    for (const tri of this._tris) {
      const cx = (tri.pts[0][0]+tri.pts[1][0]+tri.pts[2][0])/3;
      const cy = (tri.pts[0][1]+tri.pts[1][1]+tri.pts[2][1])/3;
      if (Math.hypot(cx-x, cy-y) < 200) tri.phase += Math.PI;
    }
  }
  resize() { this._buildTris(); }
}
