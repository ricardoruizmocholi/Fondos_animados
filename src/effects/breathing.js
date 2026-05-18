import { EffectBase } from '../core/EffectBase.js';
import { ColorSystem } from '../core/ColorSystem.js';

export class BreathingEffect extends EffectBase {
  init() { this._t = 0; }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#ffffff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#1a1a2e' : '#f0f4ff'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    // period ~4s at speed=0.5 → 0.008 * 0.5 * 60fps ≈ π/2 per 4s
    this._t += 0.008 * this.spd * dt;
  }

  draw() {
    const { W, H, ctx } = this;
    const phase = (Math.sin(this._t * Math.PI) + 1) / 2;  // 0→1→0 smooth
    const col = ColorSystem.mix(this.c1, this.c2, phase);

    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);

    // Vignette that intensifies at peak
    const vig = 0.15 + phase * 0.55;
    const r = Math.hypot(W, H) * 0.5;
    const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.25, W / 2, H / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${vig.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * Breathing — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), t=0, rafId;
    function mixC(h1,h2,p){var a=parseInt(h1.replace('#',''),16),b=parseInt(h2.replace('#',''),16);return 'rgb('+[16,8,0].map(function(s){return Math.round(((a>>s)&255)+(((b>>s)&255)-((a>>s)&255))*p)}).join(',')+')';}
    function draw(){
      var W=canvas.width,H=canvas.height,phase=(Math.sin(t*Math.PI)+1)/2;
      ctx.fillStyle=mixC(color1,color2,phase);ctx.fillRect(0,0,W,H);
      var vig=0.15+phase*0.55,r=Math.sqrt(W*W+H*H)*0.5;
      var g=ctx.createRadialGradient(W/2,H/2,r*.25,W/2,H/2,r);
      g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+vig.toFixed(3)+')');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
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
