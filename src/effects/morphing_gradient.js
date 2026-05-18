import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class MorphingGradientEffect extends EffectBase {
  init() {
    this._t = 0;
    // 4 corners with different oscillation periods (in seconds)
    this._corners = [
      { period: 3, phase: 0 },       // TL
      { period: 4, phase: Math.PI }, // TR
      { period: 5, phase: 1.2 },     // BL
      { period: 7, phase: 2.4 },     // BR
    ];
    this._sc = 6; // render scale
    this._off = document.createElement('canvas');
    this._offCtx = this._off.getContext('2d');
    this._resize();
  }

  _resize() {
    this._off.width  = Math.ceil(this.W / this._sc);
    this._off.height = Math.ceil(this.H / this._sc);
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#ffffff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#1a1a2e' : '#f0f4ff'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) { this._t += 0.016 * this.spd * dt; }

  draw() {
    const W = this._off.width, H = this._off.height;
    const img = this._offCtx.createImageData(W, H);
    const d = img.data;
    const t = this._t;

    // Corner blend factors (0=c1, 1=c2)
    const cf = this._corners.map(c => (Math.sin(t * 2 * Math.PI / c.period + c.phase) + 1) / 2);
    const [r1, g1, b1] = ColorSystem.hexToRgb(this.c1);
    const [r2, g2, b2] = ColorSystem.hexToRgb(this.c2);

    function mix(f, c1, c2) { return c1 + (c2 - c1) * f; }

    for (let y = 0; y < H; y++) {
      const v = y / (H - 1 || 1);
      for (let x = 0; x < W; x++) {
        const u = x / (W - 1 || 1);
        // Bilinear interpolation of corner factors
        const f = cf[0]*(1-u)*(1-v) + cf[1]*u*(1-v) + cf[2]*(1-u)*v + cf[3]*u*v;
        const i = (y * W + x) * 4;
        d[i]   = Math.round(mix(f, r1, r2));
        d[i+1] = Math.round(mix(f, g1, g2));
        d[i+2] = Math.round(mix(f, b1, b2));
        d[i+3] = 255;
      }
    }
    this._offCtx.putImageData(img, 0, 0);
    this.ctx.save();
    this.ctx.imageSmoothingQuality = 'low';
    this.ctx.drawImage(this._off, 0, 0, W, H, 0, 0, this.W, this.H);
    this.ctx.restore();
  }

  resize() { this._resize(); }
  destroy() { this._off = null; }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * MorphingGradient — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), t=0, rafId, sc=6;
    var periods=[3,4,5,7], phases=[0,Math.PI,1.2,2.4];
    function hexRgb(h){var n=parseInt(h.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];}
    var off=document.createElement('canvas'), oCtx=off.getContext('2d');
    function draw(){
      var W=canvas.width,H=canvas.height;
      off.width=Math.ceil(W/sc);off.height=Math.ceil(H/sc);
      var ow=off.width,oh=off.height,img=oCtx.createImageData(ow,oh),d=img.data;
      var cf=periods.map(function(p,i){return(Math.sin(t*2*Math.PI/p+phases[i])+1)/2;});
      var rgb1=hexRgb(color1),rgb2=hexRgb(color2);
      for(var y=0;y<oh;y++){for(var x=0;x<ow;x++){
        var u=x/(ow-1||1),v=y/(oh-1||1);
        var f=cf[0]*(1-u)*(1-v)+cf[1]*u*(1-v)+cf[2]*(1-u)*v+cf[3]*u*v;
        var i4=(y*ow+x)*4;
        d[i4]=Math.round(rgb1[0]+(rgb2[0]-rgb1[0])*f);
        d[i4+1]=Math.round(rgb1[1]+(rgb2[1]-rgb1[1])*f);
        d[i4+2]=Math.round(rgb1[2]+(rgb2[2]-rgb1[2])*f);
        d[i4+3]=255;
      }}
      oCtx.putImageData(img,0,0);
      ctx.drawImage(off,0,0,ow,oh,0,0,W,H);
    }
    function loop(){t+=0.016*speed;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
