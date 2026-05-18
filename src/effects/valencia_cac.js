import { EffectBase } from '../core/EffectBase.js';

export class ValenciaCACEffect extends EffectBase {
  init() {
    this._t = 0;
    this._buildArches();
    this._shimmer = Array.from({ length: 30 }, () => ({
      x: this.rand(0, this.W),
      y: this.rand(-30, 30),
      len: this.rand(20, 80),
      phase: this.rand(0, Math.PI * 2),
      speed: this.rand(0.02, 0.06),
    }));
  }

  _buildArches() {
    const W = this.W, H = this.H;
    const mid = H * 0.52;   // horizon / waterline
    this._arches = [
      { x0: W * 0.05, span: W * 0.90, r: mid * 0.92, phase: 0,    pw: 2.5 },
      { x0: W * 0.12, span: W * 0.76, r: mid * 0.78, phase: 0.8,  pw: 2.0 },
      { x0: W * 0.20, span: W * 0.60, r: mid * 0.65, phase: 1.5,  pw: 1.5 },
      { x0: W * 0.28, span: W * 0.44, r: mid * 0.50, phase: 2.2,  pw: 1.2 },
      { x0: W * 0.36, span: W * 0.28, r: mid * 0.35, phase: 3.0,  pw: 1.0 },
      { x0: W * 0.42, span: W * 0.16, r: mid * 0.22, phase: 3.8,  pw: 0.8 },
    ];
    this._horizon = mid;
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0d1b2a' : '#d0e0f0'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#e8f4ff' : '#ffffff'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    this._t += 0.006 * this.spd * dt;
    for (const s of this._shimmer) s.phase += s.speed * dt;
  }

  draw() {
    const { W, H, ctx } = this;
    const horiz = this._horizon;

    // Sky background
    const sky = ctx.createLinearGradient(0, 0, 0, horiz);
    sky.addColorStop(0, this.c1);
    sky.addColorStop(1, this.rgba(this.c2, 0.08));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Water (bottom half) — darker tint
    const water = ctx.createLinearGradient(0, horiz, 0, H);
    water.addColorStop(0, this.rgba(this.c1, 0.9));
    water.addColorStop(1, this.c1);
    ctx.fillStyle = water;
    ctx.fillRect(0, horiz, W, H - horiz);

    ctx.save();
    ctx.lineCap = 'round';

    for (const arch of this._arches) {
      const tilt = Math.sin(this._t + arch.phase) * (3 * Math.PI / 180);

      const drawArch = (yBase, scaleY, alpha) => {
        ctx.beginPath();
        const steps = Math.max(80, Math.round(arch.span / 4));
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const x = arch.x0 + f * arch.span;
          const y = yBase - arch.r * Math.sin(Math.PI * f + tilt) * scaleY;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = this.rgba(this.c2, alpha);
        ctx.lineWidth = arch.pw;
        ctx.shadowBlur = 8 * alpha;
        ctx.shadowColor = this.rgba(this.c2, alpha * 0.5);
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Real arch (above waterline)
      drawArch(horiz, 1, 0.80);
      // Reflection (below waterline, inverted, faded)
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.translate(0, horiz * 2);
      ctx.scale(1, -1);
      drawArch(horiz, 1, 1);
      ctx.restore();
    }

    // Water shimmer lines
    ctx.lineWidth = 1;
    for (const s of this._shimmer) {
      const op = Math.max(0, Math.sin(s.phase) * 0.35);
      if (op < 0.02) continue;
      ctx.strokeStyle = this.rgba(this.c2, op);
      const y = horiz + 15 + s.y + Math.sin(s.phase * 0.7) * 8;
      if (y < horiz || y > H) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, y);
      ctx.lineTo(s.x + s.len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  resize() { this._buildArches(); }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * ValenciaCAC — animated-bg-lib (Ciudad de las Artes y las Ciencias)
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), t=0, rafId;
    function rgba(h,a){var n=parseInt(h.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
    var shimmer=Array.from({length:30},function(){return{x:Math.random()*canvas.width,y:(Math.random()-.5)*60,len:20+Math.random()*60,ph:Math.random()*Math.PI*2,sp:0.02+Math.random()*.04};});
    function draw(){
      var W=canvas.width,H=canvas.height,hz=H*.52;
      var sky=ctx.createLinearGradient(0,0,0,hz);sky.addColorStop(0,color1);sky.addColorStop(1,rgba(color2,.08));ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      var wat=ctx.createLinearGradient(0,hz,0,H);wat.addColorStop(0,rgba(color1,.9));wat.addColorStop(1,color1);ctx.fillStyle=wat;ctx.fillRect(0,hz,W,H-hz);
      var arches=[{x0:W*.05,sp:W*.9,r:hz*.92,ph:0,pw:2.5},{x0:W*.12,sp:W*.76,r:hz*.78,ph:.8,pw:2},{x0:W*.2,sp:W*.6,r:hz*.65,ph:1.5,pw:1.5},{x0:W*.28,sp:W*.44,r:hz*.5,ph:2.2,pw:1.2},{x0:W*.36,sp:W*.28,r:hz*.35,ph:3,pw:1},{x0:W*.42,sp:W*.16,r:hz*.22,ph:3.8,pw:.8}];
      ctx.save();ctx.lineCap='round';
      for(var arch of arches){
        var tilt=Math.sin(t+arch.ph)*(.052);
        ctx.beginPath();var N=80;for(var i=0;i<=N;i++){var f=i/N,x=arch.x0+f*arch.sp,y=hz-arch.r*Math.sin(Math.PI*f+tilt);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.strokeStyle=rgba(color2,.8);ctx.lineWidth=arch.pw;ctx.stroke();
        ctx.save();ctx.globalAlpha=.25;ctx.translate(0,hz*2);ctx.scale(1,-1);
        ctx.beginPath();for(var i=0;i<=N;i++){var f=i/N,x=arch.x0+f*arch.sp,y=hz-arch.r*Math.sin(Math.PI*f+tilt);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.strokeStyle=rgba(color2,1);ctx.lineWidth=arch.pw;ctx.stroke();ctx.restore();
      }
      ctx.lineWidth=1;for(var s of shimmer){s.ph+=s.sp;var op=Math.max(0,Math.sin(s.ph)*.35);if(op<.02)continue;ctx.strokeStyle=rgba(color2,op);var sy=hz+15+s.y+Math.sin(s.ph*.7)*8;if(sy<hz||sy>H)continue;ctx.beginPath();ctx.moveTo(s.x,sy);ctx.lineTo(s.x+s.len,sy);ctx.stroke();}
      ctx.restore();
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
