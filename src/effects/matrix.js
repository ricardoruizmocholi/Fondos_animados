import { EffectBase } from '../core/EffectBase.js';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

export class MatrixEffect extends EffectBase {
  init() {
    this._cw = 16;
    const cols = Math.floor(this.W / this._cw);
    this._cols = Array.from({ length: cols }, () => ({
      y: this.rand(-this.H, 0),
      speed: this.rand(3, 9) * this.intensity,
      len: this.rand(10, 30),
      chars: Array.from({ length: 35 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
      charTimer: 0,
    }));
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    for (const col of this._cols) {
      col.y += col.speed * dt;
      col.charTimer += dt;
      if (col.charTimer > 3) {
        col.charTimer = 0;
        const ri = Math.floor(Math.random() * col.chars.length);
        col.chars[ri] = CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      if (col.y - col.len * this._cw > this.H) {
        col.y = this.rand(-200, -20);
        col.speed = this.rand(3, 9) * this.intensity;
        col.len = this.rand(10, 30);
      }
    }
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    // Trail effect: semi-transparent dark overlay
    ctx.fillStyle = this.darkMode ? 'rgba(0,0,0,0.05)' : 'rgba(245,245,245,0.05)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.font = `${this._cw - 2}px monospace`;
    ctx.textAlign = 'center';
    for (let ci = 0; ci < this._cols.length; ci++) {
      const c = this._cols[ci];
      const x = ci * this._cw + this._cw / 2;
      for (let i = 0; i < c.len; i++) {
        const y = c.y - i * this._cw;
        if (y < -this._cw || y > this.H) continue;
        const t = 1 - i / c.len;
        if (i === 0) {
          // Head: bright white
          ctx.fillStyle = this.darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
        } else {
          ctx.fillStyle = this.rgba(col, t * 0.85);
        }
        ctx.fillText(c.chars[i % c.chars.length], x, y);
      }
    }
  }

  onExplosion(x, y) {
    for (const col of this._cols) col.speed *= 2;
    setTimeout(() => { for (const col of this._cols) col.speed /= 2; }, 1000);
  }
}
