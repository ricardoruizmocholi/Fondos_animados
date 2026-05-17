import { EffectBase } from '../core/EffectBase.js';

export class LightningEffect extends EffectBase {
  init() {
    this._bolts = [];
    this._t = 0;
    this._nextBolt = this.rand(30, 90);
    this._segments = [];
  }

  _segment(x1, y1, x2, y2, depth, segs) {
    if (depth === 0) { segs.push([x1, y1, x2, y2]); return; }
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * depth * 40;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * depth * 15;
    this._segment(x1, y1, mx, my, depth - 1, segs);
    this._segment(mx, my, x2, y2, depth - 1, segs);
    // Branch
    if (depth >= 2 && Math.random() < 0.4) {
      const bx = mx + (Math.random() - 0.5) * 60, by = my + this.rand(30, 80);
      this._segment(mx, my, bx, by, depth - 2, segs);
    }
  }

  _spawnBolt() {
    const x1 = this.rand(this.W * 0.1, this.W * 0.9);
    const segs = [];
    this._segment(x1, 0, x1 + this.rand(-100, 100), this.H * this.rand(0.5, 0.95), 4, segs);
    this._bolts.push({ segs, life: 1, flash: 1 });
    if (this.mouse.active) {
      const segs2 = [];
      this._segment(this.rand(0, this.W), 0, this.mouse.x, this.mouse.y, 4, segs2);
      this._bolts.push({ segs: segs2, life: 1, flash: 1 });
    }
  }

  update(mouse, dt = 1) {
    super.update(mouse);
    this._t += dt;
    this._nextBolt -= dt;
    if (this._nextBolt <= 0) {
      this._spawnBolt();
      this._nextBolt = this.rand(40, 120) / this.intensity;
    }
    for (const b of this._bolts) {
      b.life -= 0.05 * dt;
      b.flash -= 0.1 * dt;
    }
    this._bolts = this._bolts.filter(b => b.life > 0);
  }

  draw() {
    const col = this.resolvedColor();
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    for (const bolt of this._bolts) {
      const alpha = Math.max(bolt.life, 0);
      const flashAlpha = Math.max(bolt.flash, 0);
      // Screen flash
      if (flashAlpha > 0) {
        ctx.fillStyle = this.rgba(col, flashAlpha * 0.04);
        ctx.fillRect(0, 0, this.W, this.H);
      }
      // Main bolt
      ctx.shadowBlur = 18; ctx.shadowColor = this.rgba(col, alpha * 0.9);
      ctx.strokeStyle = this.rgba(col, alpha);
      ctx.lineWidth = 2;
      for (const [x1, y1, x2, y2] of bolt.segs) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // Bright core
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
      ctx.shadowBlur = 4;
      for (const [x1, y1, x2, y2] of bolt.segs) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  onExplosion(x, y) {
    const segs = [];
    const startX = this.rand(0, this.W);
    this._segment(startX, 0, x, y, 4, segs);
    this._bolts.push({ segs, life: 1.5, flash: 1 });
  }
}
