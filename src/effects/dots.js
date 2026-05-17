import { EffectBase } from '../core/EffectBase.js';

const SP = 38;

export class DotsEffect extends EffectBase {
  init() {
    this._dots = [];
    this._waves = [];
    this._trail = [];
    this._time = 0;
    const cols = Math.ceil(this.W / SP) + 2, rows = Math.ceil(this.H / SP) + 2;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this._dots.push({ bx: (c - 0.5) * SP, by: (r - 0.5) * SP, ox: 0, oy: 0 });
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._time += 0.016 * dt;
    const { x: mx, y: my, active } = this.mouse;
    const amp = 9 * this.intensity;

    if (active) this._trail.push({ x: mx, y: my, age: 0 });
    for (const t of this._trail) t.age++;
    while (this._trail.length && this._trail[0].age > 80) this._trail.shift();

    for (let i = this._waves.length - 1; i >= 0; i--) {
      this._waves[i].age += dt * 0.04;
      if (this._waves[i].age > 1) this._waves.splice(i, 1);
    }

    for (const d of this._dots) {
      let ox = 0, oy = Math.sin(d.bx * 0.018 + d.by * 0.009 + this._time * 1.2) * amp
                     + Math.cos(d.bx * 0.009 - d.by * 0.014 + this._time * 0.9) * amp * 0.5;
      if (active) {
        const dx = mx - d.bx, dy = my - d.by, dist = Math.hypot(dx, dy), rad = 160 * this.intensity;
        if (dist < rad && dist > 1) {
          const f = (rad - dist) / rad;
          const w = Math.sin(dist * 0.04 - this._time * 5) * f * amp * 1.8;
          ox += dx / dist * w; oy += dy / dist * w;
        }
      }
      for (const w of this._waves) {
        const dx = d.bx - w.x, dy = d.by - w.y, dist = Math.hypot(dx, dy);
        const delta = Math.abs(dist - w.age * 400);
        if (delta < 60) {
          const iv = Math.sin((1 - delta / 60) * Math.PI) * (1 - w.age) * amp * 3 * w.sign;
          const a = Math.atan2(dy, dx);
          ox += Math.cos(a) * iv; oy += Math.sin(a) * iv;
        }
      }
      d.ox = this.clamp(ox, -SP * 0.7, SP * 0.7);
      d.oy = this.clamp(oy, -SP * 0.7, SP * 0.7);
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    const blend = this.darkMode ? 'screen' : 'multiply';
    ctx.save();
    ctx.globalCompositeOperation = blend;
    for (const t of this._trail) {
      const f = t.age / 80;
      const op = (1 - f) * 0.18, r = (1 - f) * 90 + 20;
      const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
      g.addColorStop(0, this.rgba(col, op)); g.addColorStop(1, this.rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(t.x - r, t.y - r, r * 2, r * 2);
    }
    if (this.mouse.active && this._trail.length) {
      const lt = this._trail[this._trail.length - 1];
      const g = ctx.createRadialGradient(lt.x, lt.y, 0, lt.x, lt.y, 60);
      g.addColorStop(0, this.rgba(col, 0.35)); g.addColorStop(1, this.rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(lt.x - 60, lt.y - 60, 120, 120);
    }
    ctx.restore();

    const r = 2.5 * this.intensity + 1;
    const { x: mx, y: my, active } = this.mouse;
    const ir = this.options.influenceRadius;
    for (const d of this._dots) {
      const x = d.bx + d.ox, y = d.by + d.oy;
      const mag = Math.hypot(d.ox, d.oy) / (SP * 0.7);
      let alpha = 0.25 + mag * 0.7;
      if (active) {
        const dc = Math.hypot(x - mx, y - my);
        if (dc < ir) alpha *= 1 + (1 - dc / ir) * 0.8;
      }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, this.clamp(alpha, 0.15, 1));
      ctx.fill();
    }
  }

  onExplosion(x, y) { this._waves.push({ x, y, age: 0, sign: 1 }); }
  onImplosion(x, y) { this._waves.push({ x, y, age: 0, sign: -1 }); }
}
