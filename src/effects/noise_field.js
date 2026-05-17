import { EffectBase } from '../core/EffectBase.js';

export class NoiseFieldEffect extends EffectBase {
  init() {
    const n = Math.round(120 + 280 * this.intensity);
    this._p = Array.from({ length: n }, () => ({
      x: this.rand(0, this.W),
      y: this.rand(0, this.H),
      life: this.rand(0, 1),
      speed: this.rand(0.8, 2.2),
      hue: this.rand(0, 360),
    }));
    this._t = 0;
    this._trailCanvas = document.createElement('canvas');
    this._trailCtx = this._trailCanvas.getContext('2d');
    this._trailCanvas.width  = this.W;
    this._trailCanvas.height = this.H;
  }

  _field(x, y) {
    const scale = 0.003;
    const t = this._t;
    return (
      Math.sin(x * scale + t * 0.3) * 0.4 +
      Math.cos(y * scale - t * 0.25 + 1.2) * 0.35 +
      Math.sin((x + y) * scale * 0.7 + t * 0.5) * 0.15 +
      Math.cos(Math.hypot(x - this.W/2, y - this.H/2) * scale * 0.5 + t * 0.4) * 0.1
    ) * Math.PI * 2;
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += 0.012 * dt;
    const { x: mx, y: my, active } = this.mouse;
    for (const p of this._p) {
      let angle = this._field(p.x, p.y);
      // Mouse turbulence
      if (active) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < 120) angle += (Math.PI / 2) * (1 - d / 120) * this.intensity;
      }
      p.x += Math.cos(angle) * p.speed * dt;
      p.y += Math.sin(angle) * p.speed * dt;
      p.life -= 0.005 * dt;
      if (p.life <= 0 || p.x < 0 || p.x > this.W || p.y < 0 || p.y > this.H) {
        p.x = this.rand(0, this.W);
        p.y = this.rand(0, this.H);
        p.life = 1;
      }
    }
  }

  draw() {
    const col = this.resolvedColor();
    const tc = this._trailCtx;
    // Fade trail canvas
    tc.fillStyle = this.darkMode ? 'rgba(0,0,0,0.04)' : 'rgba(245,245,245,0.04)';
    tc.fillRect(0, 0, this.W, this.H);
    // Draw particles to trail canvas
    tc.globalCompositeOperation = 'source-over';
    for (const p of this._p) {
      const alpha = p.life * 0.6 * this.intensity;
      tc.fillStyle = this.rgba(col, alpha);
      tc.beginPath();
      tc.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      tc.fill();
    }
    // Copy trail canvas to main
    this.ctx.drawImage(this._trailCanvas, 0, 0);
    // Draw field arrows (sparse, on hover)
    if (this.mouse.active) {
      const ctx = this.ctx;
      const step = 40;
      ctx.save();
      ctx.strokeStyle = this.rgba(col, 0.12);
      ctx.lineWidth = 0.8;
      for (let y = step; y < this.H; y += step) {
        for (let x = step; x < this.W; x += step) {
          const a = this._field(x, y);
          const len = 12;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  resize() {
    this._trailCanvas.width  = this.W;
    this._trailCanvas.height = this.H;
    this.init();
  }
  destroy() { this._trailCanvas = null; }
  onExplosion(x, y) { for (const p of this._p) { p.life = 0; } }
}
