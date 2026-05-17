import { EffectBase } from '../core/EffectBase.js';

function polygon(n, r) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}

function star(points, rOuter, rInner) {
  const verts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return verts;
}

const normalize = verts => {
  const n = Math.max(verts.length, 12);
  const result = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * verts.length;
    const idx = Math.floor(t);
    const f = t - idx;
    const a = verts[idx % verts.length], b = verts[(idx + 1) % verts.length];
    result.push([a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f]);
  }
  return result;
};

export class MorphingEffect extends EffectBase {
  init() {
    const r = Math.min(this.W, this.H) * 0.28;
    const shapes = [
      normalize(polygon(3, r)),
      normalize(polygon(4, r)),
      normalize(polygon(6, r)),
      normalize(polygon(8, r)),
      normalize(star(5, r, r * 0.45)),
      normalize(star(6, r, r * 0.5)),
      normalize(polygon(3, r * 0.6).map(([x,y]) => [x, -y])),
    ];
    this._shapes = shapes;
    this._cur = 0;
    this._next = 1;
    this._t = 0;
    this._duration = 120;
    this._rotation = 0;
    this._rotSpeed = 0.003;
    this._particles = [];
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += dt;
    this._rotation += this._rotSpeed * dt;
    if (this._t >= this._duration) {
      this._t = 0;
      this._cur = this._next;
      this._next = (this._next + 1) % this._shapes.length;
    }
    // Ripple from mouse
    if (this.mouse.active) {
      this._rotSpeed = this.lerp(this._rotSpeed, 0.01 * this.intensity, 0.05);
    } else {
      this._rotSpeed = this.lerp(this._rotSpeed, 0.003, 0.02);
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const progress = this.smoothstep(this._t / this._duration);
    const fromVerts = this._shapes[this._cur];
    const toVerts = this._shapes[this._next];
    const cx = this.W / 2, cy = this.H / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(this._rotation);
    // Morphed shape
    const interp = fromVerts.map(([fx, fy], i) => [
      fx + (toVerts[i][0] - fx) * progress,
      fy + (toVerts[i][1] - fy) * progress,
    ]);
    // Glow
    ctx.shadowBlur = 20 * this.intensity; ctx.shadowColor = this.rgba(col, 0.5);
    ctx.strokeStyle = this.rgba(col, 0.8);
    ctx.lineWidth = 2;
    ctx.fillStyle = this.rgba(col, 0.08);
    ctx.beginPath();
    interp.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Inner glow
    ctx.shadowBlur = 0;
    const r2 = Math.min(this.W, this.H) * 0.06;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r2);
    g.addColorStop(0, this.rgba(col, 0.5)); g.addColorStop(1, this.rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  onExplosion() { this._t = this._duration; }
}
