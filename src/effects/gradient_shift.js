import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class GradientShiftEffect extends EffectBase {
  init() { this._angle = 0; }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#ffffff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#1a1a2e' : '#f0f4ff'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    this._angle = (this._angle + 0.15 * this.spd * dt) % 360;
  }

  draw() {
    const { W, H, ctx } = this;
    const rad = this._angle * Math.PI / 180;
    const cx = W / 2, cy = H / 2, len = Math.hypot(W, H) / 2;
    const g = ctx.createLinearGradient(
      cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
    );
    const t = this.clamp((Math.sin(this._angle * Math.PI / 90) + 1) / 2, 0.05, 0.95);
    g.addColorStop(0, this.c1);
    g.addColorStop(t * 0.45 + 0.1, ColorSystem.mix(this.c1, this.c2, 0.5));
    g.addColorStop(1, this.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * GradientShift — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), angle=0, rafId;
    function mixC(h1,h2,t){var a=parseInt(h1.replace('#',''),16),b=parseInt(h2.replace('#',''),16);return 'rgb('+[0,1,2].map(function(i){return Math.round(((a>>(16-i*8))&255)+(((b>>(16-i*8))&255)-((a>>(16-i*8))&255))*t)}).join(',')+')';}
    function draw(){
      var W=canvas.width,H=canvas.height,rad=angle*Math.PI/180,cx=W/2,cy=H/2,len=Math.sqrt(W*W+H*H)/2;
      var g=ctx.createLinearGradient(cx-Math.cos(rad)*len,cy-Math.sin(rad)*len,cx+Math.cos(rad)*len,cy+Math.sin(rad)*len);
      var t=Math.max(.05,Math.min(.95,(Math.sin(angle*Math.PI/90)+1)/2));
      g.addColorStop(0,color1);g.addColorStop(t*.45+.1,mixC(color1,color2,.5));g.addColorStop(1,color2);
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }
    function loop(){angle=(angle+0.15*speed)%360;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
