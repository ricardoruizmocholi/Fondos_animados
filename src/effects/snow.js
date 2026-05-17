import { EffectBase } from '../core/EffectBase.js';

export class SnowEffect extends EffectBase {
  init() {
    const n = Math.round(60 + 140 * this.intensity);
    this._flakes = Array.from({ length: n }, () => this._mk(true));
    this._t = 0;
    this._accumH = 0; // virtual accumulation height
  }

  _mk(init = false) {
    return {
      x: this.rand(0, this.W),
      y: init ? this.rand(-this.H, 0) : this.rand(-20, -3),
      r: this.rand(2, 5),
      speed: this.rand(0.5, 2) * this.intensity,
      drift: this.rand(-0.4, 0.4),
      phase: this.rand(0, Math.PI * 2),
      wfreq: this.rand(0.02, 0.06),
      op: this.rand(0.5, 0.9),
    };
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.016 * dt;
    const wind = Math.sin(this._t * 0.2) * 0.4 * this.intensity;
    const { x: mx, y: my, active } = this.mouse;
    for (const f of this._flakes) {
      f.phase += f.wfreq * dt;
      f.x += (Math.sin(f.phase) * f.drift + wind) * dt;
      f.y += f.speed * dt;
      if (active) {
        const d = Math.hypot(f.x - mx, f.y - my);
        if (d < 80) { f.x += (f.x - mx) / d * 1.2 * dt; f.y += (f.y - my) / d * 0.8 * dt; }
      }
      if (f.x < -10) f.x = this.W + 10;
      else if (f.x > this.W + 10) f.x = -10;
      if (f.y > this.H + 5) Object.assign(f, this._mk());
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();

    // Accumulation gradient at bottom
    const accumH = Math.min(this._t * 0.5, 30) * this.intensity;
    if (accumH > 0.5) {
      const g = ctx.createLinearGradient(0, this.H - accumH * 2, 0, this.H);
      g.addColorStop(0, this.rgba(col, 0));
      g.addColorStop(1, this.rgba(col, 0.25 * this.intensity));
      ctx.fillStyle = g;
      ctx.fillRect(0, this.H - accumH * 2, this.W, accumH * 2);
    }

    // Snowflakes
    ctx.shadowBlur = 4;
    for (const f of this._flakes) {
      ctx.shadowColor = this.rgba(col, f.op * 0.5);
      ctx.fillStyle = this.rgba(col, f.op);
      ctx.globalAlpha = f.op;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      // Cross detail on larger flakes
      if (f.r > 3.5) {
        ctx.strokeStyle = this.rgba(col, f.op * 0.7);
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(f.x - Math.cos(a) * f.r, f.y - Math.sin(a) * f.r);
          ctx.lineTo(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r);
          ctx.stroke();
        }
      }
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.restore();
  }

  onExplosion(x, y) {
    for (const f of this._flakes) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < 150) { f.x += (f.x-x)/d*8; f.y -= 5; }
    }
  }
}
