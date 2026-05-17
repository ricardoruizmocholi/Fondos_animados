import { EffectBase } from '../core/EffectBase.js';

const RING_CFG = [
  { radius: 60,  count: 18, speed: 0.00070 },
  { radius: 110, count: 22, speed: 0.00050 },
  { radius: 170, count: 24, speed: 0.00040 },
  { radius: 240, count: 28, speed: 0.00035 },
  { radius: 320, count: 30, speed: 0.00030 },
];
const BY = 0.42, DS = Math.sqrt(1 - BY * BY);

export class WaterEffect extends EffectBase {
  init() {
    this._frame = 0;
    this._scale = 1; this._scaleVel = 0; this._nextDrop = 0;
    this._tiltX = 0; this._tiltY = 0; this._ttX = 0; this._ttY = 0;
    this._gAlpha = 0.3;
    this._rings = RING_CFG.map((c, i) => ({
      ...c,
      phase: (i / RING_CFG.length) * Math.PI * 2 * 0.13,
      particles: Array.from({ length: c.count }, (_, j) => ({
        base: (j / c.count) * Math.PI * 2, d: 0,
      })),
    }));
  }

  _proj(a, r, tx, ty) {
    const px = Math.cos(a)*r, py = Math.sin(a)*r*BY, pz = Math.sin(a)*r*DS;
    const rx = px*Math.cos(tx)+pz*Math.sin(tx), ry = py, rz = -px*Math.sin(tx)+pz*Math.cos(tx);
    const fy = ry*Math.cos(ty)-rz*Math.sin(ty), fz = ry*Math.sin(ty)+rz*Math.cos(ty);
    return { sx: this.W/2+rx, sy: this.H/2+fy, z: fz };
  }

  _tang(a, r, tx, ty) {
    const dpx = -Math.sin(a)*r, dpy = Math.cos(a)*r*BY, dpz = Math.cos(a)*r*DS;
    const drx = dpx*Math.cos(tx)+dpz*Math.sin(tx), dry = dpy, drz = -dpx*Math.sin(tx)+dpz*Math.cos(tx);
    const dfx = drx, dfy = dry*Math.cos(ty)-drz*Math.sin(ty);
    const len = Math.hypot(dfx, dfy) || 1;
    return { tx: dfx/len, ty: dfy/len };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._frame++;
    const { x: mx, y: my, active } = this.mouse;
    if (active) { this._ttX = ((mx-this.W/2)/this.W)*0.40; this._ttY = ((my-this.H/2)/this.H)*0.25; }
    else { this._ttX = 0; this._ttY = 0; }
    this._tiltX += (this._ttX - this._tiltX) * 0.03;
    this._tiltY += (this._ttY - this._tiltY) * 0.03;
    this._scaleVel += (1 - this._scale) * 0.04;
    this._scaleVel *= 0.88;
    this._scale += this._scaleVel;
    const dc = active ? Math.hypot(mx-this.W/2, my-this.H/2) : 999;
    this._gAlpha += (this.lerp(1, 0.3, Math.min(dc/280, 1)) - this._gAlpha) * 0.05;
    const f = this._frame;
    for (const ring of this._rings) {
      ring.phase += ring.speed;
      for (let i = 0; i < ring.particles.length; i++)
        ring.particles[i].d += Math.sin(f * 0.0007 + i) * 0.0004;
    }
    this._nextDrop -= dt;
    if (this._nextDrop <= 0) {
      this._scale = Math.min(this._scale, 1.05); // gentle autonomous pulse
      this._nextDrop = 55 + Math.random() * 35;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const { _tiltX: tx, _tiltY: ty, _scale: sc, _gAlpha: ga } = this;
    const nR = this._rings.length;
    const segs = [];
    for (let ri = 0; ri < nR; ri++) {
      const ring = this._rings[ri], r = ring.radius * sc;
      const hl = this.lerp(12, 20, ri / (nR - 1)) / 2;
      const mZ = r * DS;
      for (const p of ring.particles) {
        const angle = ring.phase + p.base + p.d;
        const { sx, sy, z } = this._proj(angle, r, tx, ty);
        const { tx: t1, ty: t2 } = this._tang(angle, r, tx, ty);
        const zn = this.clamp((z / (mZ || 1) + 1) / 2, 0, 1);
        segs.push({
          x1: sx-t1*hl, y1: sy-t2*hl, x2: sx+t1*hl, y2: sy+t2*hl,
          z, op: this.lerp(0.08, 0.9, zn) * ga, lw: this.lerp(0.4, 1.8, zn),
        });
      }
    }
    segs.sort((a, b) => a.z - b.z);
    ctx.save(); ctx.lineCap = 'round';
    for (const s of segs) {
      if (s.op < 0.01) continue;
      ctx.lineWidth = s.lw;
      ctx.strokeStyle = this.rgba(col, s.op);
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
    }
    ctx.restore();
  }

  onExplosion() { this._scale = 1.15; this._scaleVel = 0; }
  onImplosion() { this._scale = 0.82; this._scaleVel = 0; }
}
