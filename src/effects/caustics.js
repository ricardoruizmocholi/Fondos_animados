import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class CausticsEffect extends EffectBase {
  init() {
    this._t = 0;
    this._sc = 4;
    this._off = document.createElement('canvas');
    this._offCtx = this._off.getContext('2d');
    this._resize();
  }

  _resize() {
    this._off.width  = Math.ceil(this.W / this._sc);
    this._off.height = Math.ceil(this.H / this._sc);
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0d1b2a' : '#d0e8ff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#80d0ff' : '#0060b0'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    this._t += 0.008 * this.spd * dt;
  }

  draw() {
    const W = this._off.width, H = this._off.height;
    const img = this._offCtx.createImageData(W, H);
    const d = img.data;
    const t = this._t;
    const [r1, g1, b1] = ColorSystem.hexToRgb(this.c1);
    const [r2, g2, b2] = ColorSystem.hexToRgb(this.c2);
    const sc = this._sc;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const x = px / W * 6 - 3;
        const y = py / H * 6 - 3;
        // Caustic formula: sum of interfering sine waves
        const v = Math.sin(x * 1.2 + t) * Math.sin(y * 0.9 + t * 1.1) * Math.sin((x + y) * 0.7 + t * 0.8);
        const bright = this.clamp((v + 1) / 2, 0, 1);
        const f = bright * bright;  // contrast boost
        const i = (py * W + px) * 4;
        d[i]   = Math.round(r1 + (r2 - r1) * f);
        d[i+1] = Math.round(g1 + (g2 - g1) * f);
        d[i+2] = Math.round(b1 + (b2 - b1) * f);
        d[i+3] = 255;
      }
    }
    this._offCtx.putImageData(img, 0, 0);
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this._off, 0, 0, W, H, 0, 0, this.W, this.H);
    this.ctx.restore();
  }

  resize() { this._resize(); }
  destroy() { this._off = null; }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * Caustics — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), t=0, rafId, sc=4;
    function hexRgb(h){var n=parseInt(h.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];}
    var off=document.createElement('canvas'), oCtx=off.getContext('2d');
    function draw(){
      var W=canvas.width,H=canvas.height,ow=Math.ceil(W/sc),oh=Math.ceil(H/sc);
      off.width=ow;off.height=oh;
      var img=oCtx.createImageData(ow,oh),d=img.data,rgb1=hexRgb(color1),rgb2=hexRgb(color2);
      for(var py=0;py<oh;py++){for(var px=0;px<ow;px++){
        var x=px/ow*6-3,y=py/oh*6-3;
        var v=Math.sin(x*1.2+t)*Math.sin(y*.9+t*1.1)*Math.sin((x+y)*.7+t*.8);
        var f=Math.max(0,Math.min(1,(v+1)/2));f=f*f;
        var i=(py*ow+px)*4;
        d[i]=Math.round(rgb1[0]+(rgb2[0]-rgb1[0])*f);
        d[i+1]=Math.round(rgb1[1]+(rgb2[1]-rgb1[1])*f);
        d[i+2]=Math.round(rgb1[2]+(rgb2[2]-rgb1[2])*f);
        d[i+3]=255;
      }}
      oCtx.putImageData(img,0,0);ctx.drawImage(off,0,0,ow,oh,0,0,W,H);
    }
    function loop(){t+=0.008*speed;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
