import { rgba, clamp } from './utils.js';

export function createDotsEffect(canvas, ctx, state) {
  const SPACING = 38;
  let cols, rows, dots = [], waveOrigins = [], time = 0;

  function init() {
    cols = Math.ceil(canvas.width / SPACING) + 2;
    rows = Math.ceil(canvas.height / SPACING) + 2;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          bx: (c - 0.5) * SPACING,
          by: (r - 0.5) * SPACING,
          ox: 0, oy: 0,
        });
      }
    }
    waveOrigins = [];
  }

  function update(dt) {
    time += 0.016 * dt;
    const { mouseX, mouseY, mouseActive } = state;
    const amp = 9 * state.intensity;

    // Decay click waves
    for (let i = waveOrigins.length - 1; i >= 0; i--) {
      waveOrigins[i].age += dt * 0.04;
      if (waveOrigins[i].age > 1) waveOrigins.splice(i, 1);
    }

    for (const d of dots) {
      // Ambient wave
      let ox = 0;
      let oy = Math.sin(d.bx * 0.018 + d.by * 0.009 + time * 1.2) * amp
              + Math.cos(d.bx * 0.009 - d.by * 0.014 + time * 0.9) * amp * 0.5;

      // Mouse influence
      if (mouseActive) {
        const dx = mouseX - d.bx, dy = mouseY - d.by;
        const dist = Math.hypot(dx, dy);
        const rad = 160 * state.intensity;
        if (dist < rad && dist > 1) {
          const f = (rad - dist) / rad;
          const wave = Math.sin(dist * 0.04 - time * 5) * f * amp * 1.8;
          ox += (dx / dist) * wave;
          oy += (dy / dist) * wave;
        }
      }

      // Click wave rings
      for (const w of waveOrigins) {
        const dx = d.bx - w.x, dy = d.by - w.y;
        const dist = Math.hypot(dx, dy);
        const front = w.age * 400;
        const band = 60;
        const delta = Math.abs(dist - front);
        if (delta < band) {
          const intensity = Math.sin((1 - delta / band) * Math.PI) * (1 - w.age) * amp * 3 * w.sign;
          const angle = Math.atan2(dy, dx);
          ox += Math.cos(angle) * intensity;
          oy += Math.sin(angle) * intensity;
        }
      }

      d.ox = clamp(ox, -SPACING * 0.7, SPACING * 0.7);
      d.oy = clamp(oy, -SPACING * 0.7, SPACING * 0.7);
    }
  }

  function draw() {
    const col = state.color;
    const r = 2.5 * state.intensity + 1;
    for (const d of dots) {
      const x = d.bx + d.ox;
      const y = d.by + d.oy;
      const mag = Math.hypot(d.ox, d.oy) / (SPACING * 0.7);
      const alpha = 0.25 + mag * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, clamp(alpha, 0.15, 1));
      ctx.fill();
    }
  }

  function addWave(x, y, sign) {
    waveOrigins.push({ x, y, age: 0, sign });
  }

  function getExportCode(color, intensity) {
    return [
      '// canvas-bg-dots.js — Puntos: grid que se deforma en ondas',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-dots.js"></script>',
      '//   3. import { init } from "./canvas-bg-dots.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx = canvas.getContext("2d");',
      '  const COLOR = "' + color + '", INTENSITY = ' + intensity + ', SP = 38;',
      '  let W,H,dots=[],waves=[],t=0,mx=0,my=0,ma=false,it;',
      '  const rgb=(hex,a)=>{const n=parseInt(hex.replace("#",""),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"};',
      '  function resize(){',
      '    W=canvas.width=innerWidth;H=canvas.height=innerHeight;',
      '    dots=[];const cols=Math.ceil(W/SP)+2,rows=Math.ceil(H/SP)+2;',
      '    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)dots.push({bx:(c-.5)*SP,by:(r-.5)*SP,ox:0,oy:0});',
      '  }',
      '  function update(){',
      '    t+=0.016;const amp=9*INTENSITY;',
      '    for(let i=waves.length-1;i>=0;i--){waves[i].age+=.04;if(waves[i].age>1)waves.splice(i,1);}',
      '    for(const d of dots){',
      '      let ox=0,oy=Math.sin(d.bx*.018+d.by*.009+t*1.2)*amp+Math.cos(d.bx*.009-d.by*.014+t*.9)*amp*.5;',
      '      if(ma){const dx=mx-d.bx,dy=my-d.by,dist=Math.hypot(dx,dy),rad=160*INTENSITY;',
      '        if(dist<rad&&dist>1){const f=(rad-dist)/rad,wv=Math.sin(dist*.04-t*5)*f*amp*1.8;ox+=dx/dist*wv;oy+=dy/dist*wv;}}',
      '      for(const w of waves){const dx=d.bx-w.x,dy=d.by-w.y,dist=Math.hypot(dx,dy),front=w.age*400,band=60,delta=Math.abs(dist-front);',
      '        if(delta<band){const iv=Math.sin((1-delta/band)*Math.PI)*(1-w.age)*amp*3*w.s,a=Math.atan2(dy,dx);ox+=Math.cos(a)*iv;oy+=Math.sin(a)*iv;}}',
      '      d.ox=Math.max(-SP*.7,Math.min(SP*.7,ox));d.oy=Math.max(-SP*.7,Math.min(SP*.7,oy));',
      '    }',
      '  }',
      '  function draw(){',
      '    ctx.clearRect(0,0,W,H);const r=2.5*INTENSITY+1;',
      '    for(const d of dots){const x=d.bx+d.ox,y=d.by+d.oy,m=Math.hypot(d.ox,d.oy)/(SP*.7),a=Math.min(1,.25+m*.7);',
      '      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgb(COLOR,a);ctx.fill();}',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",e=>{waves.push({x:e.clientX,y:e.clientY,age:0,s:1});});',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();waves.push({x:e.clientX,y:e.clientY,age:0,s:-1});});',
      '  window.addEventListener("resize",resize);',
      '  resize();',
      '  (function loop(){update();draw();requestAnimationFrame(loop);})();',
      '}',
    ].join('\n');
  }

  init();
  return {
    update, draw,
    resize: init,
    onExplosion: (x, y) => addWave(x, y, 1),
    onImplosion: (x, y) => addWave(x, y, -1),
    destroy() {},
    getExportCode,
  };
}
