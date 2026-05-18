import { EffectBase } from '../core/EffectBase.js';

// Inject shared SVG gooey filter once
let _svgEl = null, _refCount = 0;
function acquireSVG() {
  _refCount++;
  if (_svgEl) return;
  _svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  _svgEl.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  _svgEl.innerHTML = `<defs>
    <filter id="blob-gooey" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>`;
  document.body.appendChild(_svgEl);
}
function releaseSVG() {
  _refCount--;
  if (_refCount <= 0 && _svgEl) { _svgEl.remove(); _svgEl = null; _refCount = 0; }
}

export class BlobLavaEffect extends EffectBase {
  init() {
    acquireSVG();
    const n = 4 + Math.round(this.spd);
    this._blobs = Array.from({ length: n }, () => ({
      x: this.rand(0.15, 0.85) * this.W,
      y: this.rand(0.15, 0.85) * this.H,
      r: this.rand(60, 120),
      vx: this.rand(-0.4, 0.4),
      vy: this.rand(-0.35, 0.35),
      phase: this.rand(0, Math.PI * 2),
    }));
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#e8e8f0'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#ff6030' : '#ff4a00'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    for (const b of this._blobs) {
      b.phase += 0.015 * this.spd * dt;
      b.vx += (Math.random() - 0.5) * 0.04 * dt;
      b.vy += (Math.random() - 0.5) * 0.04 * dt;
      b.vx = this.clamp(b.vx * Math.pow(0.97, dt), -1.2, 1.2);
      b.vy = this.clamp(b.vy * Math.pow(0.97, dt), -1.2, 1.2);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r * 0.3 || b.x > this.W - b.r * 0.3) b.vx *= -1;
      if (b.y < b.r * 0.3 || b.y > this.H - b.r * 0.3) b.vy *= -1;
      b.x = this.clamp(b.x, 0, this.W);
      b.y = this.clamp(b.y, 0, this.H);
    }
  }

  draw() {
    const { W, H, ctx } = this;
    ctx.fillStyle = this.c1;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.filter = 'url(#blob-gooey)';
    for (const b of this._blobs) {
      const r = b.r * (1 + Math.sin(b.phase) * 0.12);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      g.addColorStop(0, this.rgba(this.c2, 1));
      g.addColorStop(0.6, this.rgba(this.c2, 0.85));
      g.addColorStop(1, this.rgba(this.c2, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();
  }

  destroy() { releaseSVG(); }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * BlobLava — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), rafId;
    function rgba(h,a){var n=parseInt(h.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
    // SVG gooey filter
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('style','position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML='<defs><filter id="bloblava-gooey"><feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter></defs>';
    document.body.appendChild(svg);
    var W=canvas.width,H=canvas.height;
    var blobs=Array.from({length:4},function(){return{x:(0.15+Math.random()*0.7)*W,y:(0.15+Math.random()*0.7)*H,r:60+Math.random()*60,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.7,ph:Math.random()*Math.PI*2};});
    function draw(){
      W=canvas.width;H=canvas.height;
      ctx.fillStyle=color1;ctx.fillRect(0,0,W,H);
      ctx.save();ctx.filter='url(#bloblava-gooey)';
      for(var b of blobs){
        b.ph+=0.015*speed;b.vx+=(Math.random()-.5)*.04;b.vy+=(Math.random()-.5)*.04;
        b.vx=Math.max(-1.2,Math.min(1.2,b.vx*.97));b.vy=Math.max(-1.2,Math.min(1.2,b.vy*.97));
        b.x+=b.vx;b.y+=b.vy;
        if(b.x<b.r*.3||b.x>W-b.r*.3)b.vx*=-1;if(b.y<b.r*.3||b.y>H-b.r*.3)b.vy*=-1;
        var r=b.r*(1+Math.sin(b.ph)*.12);
        var g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,r);g.addColorStop(0,rgba(color2,1));g.addColorStop(.6,rgba(color2,.85));g.addColorStop(1,rgba(color2,0));
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();
      }
      ctx.filter='none';ctx.restore();
    }
    function loop(){draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);svg.remove();};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
