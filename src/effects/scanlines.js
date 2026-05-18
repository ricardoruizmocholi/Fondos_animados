import { EffectBase } from '../core/EffectBase.js';

export class ScanlinesEffect extends EffectBase {
  init() {
    this._offset = 0;
    this._noise = this._buildNoise();
  }

  _buildNoise() {
    const nc = document.createElement('canvas');
    nc.width = this.W || 800; nc.height = this.H || 600;
    const nctx = nc.getContext('2d');
    const img = nctx.createImageData(nc.width, nc.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 40);
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = 22;
    }
    nctx.putImageData(img, 0, 0);
    return nc;
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0a0a' : '#f5f5f5'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#2a2a3a' : '#c0c0d0'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    this._offset = (this._offset + 2 * this.spd * dt) % 4;
  }

  draw() {
    const { W, H, ctx } = this;

    ctx.fillStyle = this.c1;
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.strokeStyle = this.rgba(this.c2, 0.15);
    ctx.lineWidth = 1;
    const gap = 4;
    const start = this._offset % gap;
    for (let y = start; y < H; y += gap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Film grain
    if (this._noise && this._noise.width === W && this._noise.height === H) {
      ctx.drawImage(this._noise, 0, 0);
    } else {
      this._noise = this._buildNoise();
    }

    // Subtle phosphor glow at bottom
    const glow = ctx.createLinearGradient(0, H * 0.85, 0, H);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(1, this.rgba(this.c1, 0.25));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  resize() { this._noise = this._buildNoise(); }
  destroy() { this._noise = null; }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * Scanlines — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), offset=0, rafId;
    function rgba(h,a){var n=parseInt(h.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
    var nc=document.createElement('canvas'),nCtx=nc.getContext('2d');
    function buildNoise(W,H){nc.width=W;nc.height=H;var img=nCtx.createImageData(W,H);for(var i=0;i<img.data.length;i+=4){var v=Math.floor(Math.random()*40);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=22;}nCtx.putImageData(img,0,0);}
    buildNoise(canvas.width,canvas.height);
    function draw(){
      var W=canvas.width,H=canvas.height;
      if(nc.width!==W||nc.height!==H)buildNoise(W,H);
      ctx.fillStyle=color1;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=rgba(color2,.15);ctx.lineWidth=1;
      var s=offset%4;for(var y=s;y<H;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.drawImage(nc,0,0);
    }
    function loop(){offset=(offset+2*speed)%4;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
