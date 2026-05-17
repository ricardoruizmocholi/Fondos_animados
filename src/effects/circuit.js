// FIXME: PCB layout is randomly generated on init; a future version should use
// proper routing algorithms. Signal pulse rendering is simplified.
import { EffectBase } from '../core/EffectBase.js';

export class CircuitEffect extends EffectBase {
  init() {
    this._grid = 28;
    this._traces = [];
    this._signals = [];
    this._t = 0;
    this._buildCircuit();
  }

  _buildCircuit() {
    this._traces = [];
    const g = this._grid;
    const cols = Math.floor(this.W / g), rows = Math.floor(this.H / g);
    const visited = new Set();
    const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
    const startCount = Math.round(5 + 10 * this.intensity);
    for (let s = 0; s < startCount; s++) {
      let cx = Math.floor(Math.random() * cols), cy = Math.floor(Math.random() * rows);
      const pts = [{ x: cx * g + g/2, y: cy * g + g/2 }];
      const len = Math.round(this.rand(4, 12));
      let dir = Math.floor(Math.random() * 4);
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.3) dir = Math.floor(Math.random() * 4);
        const [dx, dy] = dirs[dir];
        cx = this.clamp(cx + dx, 0, cols - 1);
        cy = this.clamp(cy + dy, 0, rows - 1);
        pts.push({ x: cx * g + g/2, y: cy * g + g/2 });
      }
      if (pts.length > 2) this._traces.push({ pts, len: 0 });
    }
    // Init signals
    this._signals = this._traces.slice(0, Math.round(4 + 6 * this.intensity)).map(tr => ({
      trace: tr, t: Math.random(), speed: this.rand(0.003, 0.01),
    }));
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    for (const sig of this._signals) {
      sig.t += sig.speed * dt;
      if (sig.t > 1) sig.t = 0;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    // Draw traces
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const tr of this._traces) {
      ctx.strokeStyle = this.rgba(col, 0.22 * this.intensity);
      ctx.beginPath();
      ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
      for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
      ctx.stroke();
      // Junctions
      for (const pt of tr.pts) {
        ctx.fillStyle = this.rgba(col, 0.35 * this.intensity);
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Draw signals
    for (const sig of this._signals) {
      const { pts } = sig.trace;
      if (pts.length < 2) continue;
      const total = pts.length - 1;
      const pos = sig.t * total;
      const segIdx = Math.floor(pos), segT = pos - segIdx;
      const p0 = pts[Math.min(segIdx, total - 1)], p1 = pts[Math.min(segIdx + 1, total)];
      const sx = p0.x + (p1.x - p0.x) * segT, sy = p0.y + (p1.y - p0.y) * segT;
      ctx.shadowBlur = 12; ctx.shadowColor = this.rgba(col, 0.9);
      ctx.fillStyle = this.rgba(col, 0.95);
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  resize() { this._buildCircuit(); }
  onExplosion(x, y) {
    for (const sig of this._signals) sig.speed *= 3;
    setTimeout(() => { for (const sig of this._signals) sig.speed /= 3; }, 800);
  }
}
