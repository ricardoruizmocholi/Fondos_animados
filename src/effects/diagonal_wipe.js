import { EffectBase } from '../core/EffectBase.js';

export class DiagonalWipeEffect extends EffectBase {
  init() { this._offset = 0; }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#ffffff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#1a1a2e' : '#f0f4ff'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    const bandW = 120;
    this._offset = (this._offset + 0.4 * this.spd * dt) % (bandW * 2);
  }

  draw() {
    const { W, H, ctx } = this;
    const bandW = 120;
    const off = this._offset;

    // Background
    ctx.fillStyle = this.c1;
    ctx.fillRect(0, 0, W, H);

    // Diagonal parallelogram bands at 45° (shift = H in X direction)
    ctx.fillStyle = this.c2;
    const diag = W + H + bandW * 4;
    const span = Math.ceil(diag / (bandW * 2)) + 2;

    for (let i = -2; i < span; i++) {
      const startX = i * bandW * 2 + off;
      ctx.beginPath();
      ctx.moveTo(startX,           0);
      ctx.lineTo(startX + bandW,   0);
      ctx.lineTo(startX + bandW + H, H);
      ctx.lineTo(startX + H,         H);
      ctx.closePath();
      ctx.fill();
    }
  }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * DiagonalWipe — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), offset=0, rafId;
    function draw(){
      var W=canvas.width,H=canvas.height,bW=120,span=Math.ceil((W+H+bW*4)/(bW*2))+2;
      ctx.fillStyle=color1;ctx.fillRect(0,0,W,H);
      ctx.fillStyle=color2;
      for(var i=-2;i<span;i++){var s=i*bW*2+offset;ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(s+bW,0);ctx.lineTo(s+bW+H,H);ctx.lineTo(s+H,H);ctx.closePath();ctx.fill();}
    }
    function loop(){offset=(offset+0.4*speed)%240;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
