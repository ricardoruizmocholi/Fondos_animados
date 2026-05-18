import { EffectBase } from '../core/EffectBase.js';

export class TopographyFlowEffect extends EffectBase {
  init() {
    this._yOff = 0;   // scroll offset — field moves upward
    this._step = 14;  // grid pitch
  }

  get c1()  { return this.options.color1 || (this.darkMode ? '#0a0f1a' : '#f0f4ff'); }
  get c2()  { return this.options.color2 || (this.darkMode ? '#4488cc' : '#1a3a6a'); }
  get spd() { return this.options.speed  ?? 0.5; }

  update(_m, dt = 1) {
    this._yOff += 0.5 * this.spd * dt;
  }

  _field(x, y) {
    return Math.sin(x * 0.006 + this._yOff * 0.003) * 0.45 +
           Math.cos(y * 0.007 - this._yOff * 0.002 + 1.2) * 0.35 +
           Math.sin((x + y) * 0.004 + this._yOff * 0.001) * 0.20;
  }

  draw() {
    const { W, H, ctx } = this;
    const step = this._step;
    const LEVELS = 9;

    ctx.fillStyle = this.c1;
    ctx.fillRect(0, 0, W, H);

    const cols = Math.ceil(W / step) + 1;
    const rows = Math.ceil(H / step) + 2;

    // Sample field (shifted by yOff so it scrolls)
    const field = [];
    for (let r = 0; r < rows; r++) {
      field[r] = [];
      for (let c = 0; c < cols; c++) {
        const x = c * step;
        const y = r * step - (this._yOff % step); // scroll
        field[r][c] = this._field(x, y);
      }
    }

    ctx.save();
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let lv = 0; lv < LEVELS; lv++) {
      const threshold = -0.75 + (lv / LEVELS) * 1.5;
      const alpha = (0.1 + (lv / LEVELS) * 0.5) * this.spd;
      ctx.strokeStyle = this.rgba(this.c2, alpha);
      ctx.beginPath();

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v00 = field[r][c], v10 = field[r][c+1];
          const v01 = field[r+1][c];
          const x0 = c * step, y0 = r * step - (this._yOff % step);

          if ((v00 < threshold) !== (v10 < threshold)) {
            const tx = x0 + step * (threshold - v00) / ((v10 - v00) || 0.0001);
            ctx.moveTo(tx, y0);
            if ((v01 < threshold) !== (v00 < threshold)) {
              ctx.lineTo(x0, y0 + step * (threshold - v00) / ((v01 - v00) || 0.0001));
            } else if ((v01 < threshold) !== (field[r+1][c+1] < threshold)) {
              const tx2 = x0 + step * (threshold - v01) / ((field[r+1][c+1] - v01) || 0.0001);
              ctx.lineTo(tx2, y0 + step);
            }
          }
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  getStandaloneCode(c1, c2, spd) {
    return `/**
 * TopographyFlow — animated-bg-lib
 * Uso: const stop = initBackground(document.getElementById('canvas'), options)
 *      stop() // para destruir
 */
(function() {
  function initBackground(canvas, options) {
    var opts=options||{}, color1=opts.color1||'${c1}', color2=opts.color2||'${c2}', speed=opts.speed!==undefined?opts.speed:${spd};
    var ctx=canvas.getContext('2d'), yOff=0, rafId, step=14, LEVELS=9;
    function rgba(h,a){var n=parseInt(h.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
    function field(x,y){return Math.sin(x*.006+yOff*.003)*.45+Math.cos(y*.007-yOff*.002+1.2)*.35+Math.sin((x+y)*.004+yOff*.001)*.20;}
    function draw(){
      var W=canvas.width,H=canvas.height,cols=Math.ceil(W/step)+1,rows=Math.ceil(H/step)+2;
      ctx.fillStyle=color1;ctx.fillRect(0,0,W,H);
      var f=[];for(var r=0;r<rows;r++){f[r]=[];for(var c=0;c<cols;c++)f[r][c]=field(c*step,r*step-(yOff%step));}
      ctx.lineWidth=1;ctx.lineCap='round';
      for(var lv=0;lv<LEVELS;lv++){
        var thr=-0.75+(lv/LEVELS)*1.5,alpha=(.1+(lv/LEVELS)*.5)*speed;
        ctx.strokeStyle=rgba(color2,alpha);ctx.beginPath();
        for(var r=0;r<rows-1;r++){for(var c=0;c<cols-1;c++){
          var v00=f[r][c],v10=f[r][c+1],v01=f[r+1][c],x0=c*step,y0=r*step-(yOff%step);
          if((v00<thr)!==(v10<thr)){var tx=x0+step*(thr-v00)/((v10-v00)||.0001);ctx.moveTo(tx,y0);
            if((v01<thr)!==(v00<thr))ctx.lineTo(x0,y0+step*(thr-v00)/((v01-v00)||.0001));
            else if((v01<thr)!==(f[r+1][c+1]<thr))ctx.lineTo(x0+step*(thr-v01)/((f[r+1][c+1]-v01)||.0001),y0+step);}
        }}ctx.stroke();
      }
    }
    function loop(){yOff+=.5*speed;draw();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);
    return function(){cancelAnimationFrame(rafId);};
  }
  if(typeof module!=='undefined')module.exports={initBackground};
  else window.AnimatedBGEffect={initBackground};
})();`;
  }
}
