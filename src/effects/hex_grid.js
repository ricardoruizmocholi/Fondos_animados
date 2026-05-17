import { EffectBase } from '../core/EffectBase.js';

export class HexGridEffect extends EffectBase {
  init() {
    this._size = Math.round(30 + 20 * (1 - this.intensity));
    this._hexes = [];
    this._buildGrid();
  }

  _buildGrid() {
    this._hexes = [];
    const s = this._size, h = s * Math.sqrt(3);
    const cols = Math.ceil(this.W / (s * 1.5)) + 2;
    const rows = Math.ceil(this.H / h) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const cx = c * s * 1.5 + s;
        const cy = r * h + (c % 2 === 0 ? 0 : h / 2) + h / 2;
        this._hexes.push({ cx, cy, brightness: 0, decay: 0.92 + Math.random() * 0.05 });
      }
    }
  }

  _hexPath(cx, cy, s) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      const x = cx + s * Math.cos(a), y = cy + s * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  _nearest(x, y) {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < this._hexes.length; i++) {
      const h = this._hexes[i];
      const d = Math.hypot(h.cx - x, h.cy - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  _neighbors(idx) {
    const h = this._hexes[idx], s = this._size * 1.8;
    return this._hexes.reduce((acc, o, i) => {
      if (i !== idx && Math.hypot(h.cx - o.cx, h.cy - o.cy) < s) acc.push(i);
      return acc;
    }, []);
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    for (const h of this._hexes) h.brightness *= Math.pow(h.decay, dt);
    if (this.mouse.active) {
      const ni = this._nearest(this.mouse.x, this.mouse.y);
      if (ni >= 0 && this._hexes[ni].brightness < 0.5) {
        this._hexes[ni].brightness = 1;
        for (const nb of this._neighbors(ni)) {
          if (this._hexes[nb].brightness < 0.4) this._hexes[nb].brightness = 0.55;
        }
      }
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const s = this._size * 0.96;
    ctx.save();
    ctx.lineWidth = 1;
    for (const h of this._hexes) {
      this._hexPath(h.cx, h.cy, s);
      const b = h.brightness;
      ctx.fillStyle = this.rgba(col, b * 0.4 * this.intensity);
      ctx.fill();
      ctx.strokeStyle = this.rgba(col, 0.15 + b * 0.5);
      ctx.stroke();
      if (b > 0.1) {
        ctx.shadowBlur = b * 20;
        ctx.shadowColor = this.rgba(col, b * 0.7);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  onExplosion(x, y) {
    const range = 200;
    for (const h of this._hexes) {
      const d = Math.hypot(h.cx - x, h.cy - y);
      if (d < range) h.brightness = Math.max(h.brightness, 1 - d / range);
    }
  }
  resize() { this._buildGrid(); }
}
