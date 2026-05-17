import { EffectBase } from '../core/EffectBase.js';

export class FirefliesEffect extends EffectBase {
  init() {
    const n = Math.round(20 + 40 * this.intensity);
    this._ff = Array.from({ length: n }, (_, i) => ({
      x: this.rand(0, this.W), y: this.rand(0, this.H),
      phase: this.rand(0, Math.PI * 2),
      speed: this.rand(0.4, 1.2),
      amplitude: this.rand(30, 80),
      freq: this.rand(0.005, 0.015),
      brightness: this.rand(0.4, 1),
      dBright: this.rand(-0.01, 0.01),
      r: this.rand(2, 5),
      baseX: 0, baseY: 0, dir: this.rand(0, Math.PI * 2),
    }));
    this._ff.forEach(f => { f.baseX = f.x; f.baseY = f.y; });
    this._t = 0;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    const { x: mx, y: my, active } = this.mouse;
    for (const f of this._ff) {
      f.phase += f.freq * dt;
      f.dir += this.rand(-0.02, 0.02) * dt;
      f.baseX += Math.cos(f.dir) * f.speed * 0.3 * dt;
      f.baseY += Math.sin(f.dir) * f.speed * 0.3 * dt;
      f.x = f.baseX + Math.cos(f.phase) * f.amplitude;
      f.y = f.baseY + Math.sin(f.phase * 0.7) * f.amplitude * 0.6;
      f.brightness += f.dBright * dt;
      if (f.brightness > 1 || f.brightness < 0.2) f.dBright *= -1;
      if (active) {
        const d = Math.hypot(f.x - mx, f.y - my);
        if (d < 100) { f.baseX += (f.x - mx) / d * 1.5 * dt; f.baseY += (f.y - my) / d * 1.5 * dt; }
      }
      this.wrap({ x: f.baseX, y: f.baseY });
      if (f.baseX < -100) f.baseX = this.W + 100;
      else if (f.baseX > this.W + 100) f.baseX = -100;
      if (f.baseY < -100) f.baseY = this.H + 100;
      else if (f.baseY > this.H + 100) f.baseY = -100;
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = this.darkMode ? 'screen' : 'source-over';
    for (const f of this._ff) {
      const b = f.brightness;
      ctx.shadowBlur = f.r * 8; ctx.shadowColor = this.rgba(col, b * 0.8);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
      g.addColorStop(0, this.rgba(col, b * 0.9));
      g.addColorStop(0.3, this.rgba(col, b * 0.4));
      g.addColorStop(1, this.rgba(col, 0));
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, b); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }

  onExplosion(x, y) {
    for (const f of this._ff) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < 200) { f.baseX += (f.x - x) / d * 5; f.baseY += (f.y - y) / d * 5; }
    }
  }
}
