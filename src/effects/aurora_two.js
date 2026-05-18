import { EffectBase } from '../core/EffectBase.js';

export class AuroraTwoEffect extends EffectBase {
  init() { this._t = 0; }

  get c1()  { return this.options.color1 || (this.darkMode ? '#020608' : '#e8f4ff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#00ff88' : '#0055aa'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) { this._t += 0.006 * this.spd * dt; }

  draw() {
    const { W, H, ctx } = this;
    const t = this._t;

    // Sky base
    ctx.fillStyle = this.c1;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const strips = 24;
    const sw = W / strips;

    for (let i = 0; i < strips; i++) {
      const nx = i / strips;
      // Multi-octave height noise
      const nh = Math.sin(nx * 4.1 + t * 0.9) * 0.28 +
                 Math.sin(nx * 7.3 - t * 1.4 + 1.0) * 0.18 +
                 Math.sin(nx * 2.1 + t * 0.5 + 2.3) * 0.12;
      const curtainTop  = H * (0.05 + nh * 0.15);
      const curtainH    = H * (0.3 + Math.abs(nh) * 0.25);
      const alpha = (0.04 + Math.abs(nh) * 0.12) * this.spd;

      const g = ctx.createLinearGradient(0, curtainTop, 0, curtainTop + curtainH);
      g.addColorStop(0,   this.rgba(this.c2, 0));
      g.addColorStop(0.25, this.rgba(this.c2, alpha));
      g.addColorStop(0.6,  this.rgba(this.c2, alpha * 0.6));
      g.addColorStop(1,   this.rgba(this.c2, 0));

      ctx.fillStyle = g;
      ctx.fillRect(i * sw - 1, curtainTop, sw + 2, curtainH);
    }
    ctx.restore();

    // Stars (subtle dots)
    ctx.save();
    const rng = mulberry32(42);
    for (let s = 0; s < 80; s++) {
      const sx = rng() * W, sy = rng() * H * 0.5;
      const blink = 0.2 + Math.abs(Math.sin(t * 1.5 + s)) * 0.5;
      ctx.fillStyle = this.rgba(this.c2, blink * 0.25);
      ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * AuroraTwo — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), t=0, rafId;
    function rgba(h,a){var n=parseInt(h.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
    function rng32(s){return function(){s^=s<<13;s^=s>>17;s^=s<<5;return((s>>>0)/4294967296);};}
    var starRng=rng32(42);var stars=Array.from({length:80},function(){return{x:starRng(),y:starRng()*.5};});
    function draw(){
      var W=canvas.width,H=canvas.height,strips=24,sw=W/strips;
      ctx.fillStyle=color1;ctx.fillRect(0,0,W,H);
      ctx.save();ctx.globalCompositeOperation='screen';
      for(var i=0;i<strips;i++){
        var nx=i/strips,nh=Math.sin(nx*4.1+t*.9)*.28+Math.sin(nx*7.3-t*1.4+1)*.18+Math.sin(nx*2.1+t*.5+2.3)*.12;
        var ct=H*(.05+nh*.15),ch=H*(.3+Math.abs(nh)*.25),alpha=(.04+Math.abs(nh)*.12)*speed;
        var g=ctx.createLinearGradient(0,ct,0,ct+ch);g.addColorStop(0,rgba(color2,0));g.addColorStop(.25,rgba(color2,alpha));g.addColorStop(.6,rgba(color2,alpha*.6));g.addColorStop(1,rgba(color2,0));
        ctx.fillStyle=g;ctx.fillRect(i*sw-1,ct,sw+2,ch);
      }
      ctx.restore();
      for(var s=0;s<stars.length;s++){var b=.2+Math.abs(Math.sin(t*1.5+s))*.5;ctx.fillStyle=rgba(color2,b*.25);ctx.beginPath();ctx.arc(stars[s].x*W,stars[s].y*H,.8,0,Math.PI*2);ctx.fill();}
    }
    function loop(){t+=0.006*speed;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}

// Deterministic pseudo-random (Mulberry32) for stable star positions
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
