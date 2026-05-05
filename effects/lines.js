import { rgba, rand, clamp } from './utils.js';

export function createLinesEffect(canvas, ctx, state) {
  const CELL = 55;
  let segments = [], time = 0;

  function init() {
    segments = [];
    const cols = Math.ceil(canvas.width / CELL) + 1;
    const rows = Math.ceil(canvas.height / CELL) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        segments.push({
          x: (c + 0.5) * CELL + rand(-8, 8),
          y: (r + 0.5) * CELL + rand(-8, 8),
          angle: rand(0, Math.PI * 2),
          targetAngle: rand(0, Math.PI * 2),
          length: rand(20, 50),
          speed: rand(0.008, 0.02),
        });
      }
    }
  }

  function update(dt) {
    time += 0.016 * dt;
    const { mouseX, mouseY, mouseActive, influenceRadius } = state;

    for (const s of segments) {
      let target;
      const dx = mouseX - s.x, dy = mouseY - s.y;
      const d = Math.hypot(dx, dy);

      if (mouseActive && d < influenceRadius * 1.5) {
        const t = d / (influenceRadius * 1.5);
        const toward = Math.atan2(dy, dx);
        target = toward;
        // Blend: closer = stronger pull
        const strength = (1 - t);
        s.targetAngle = target;
        s.speed = 0.06 * strength * state.intensity + 0.01;
      } else {
        // Autonomous: drift target slowly
        s.targetAngle += (rand(-0.02, 0.02) * dt);
        s.speed = rand(0.006, 0.014);
      }

      // Smooth rotation toward target (shortest arc)
      let diff = s.targetAngle - s.angle;
      // Normalize to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      s.angle += diff * s.speed * dt * 3;
    }
  }

  function draw() {
    const col = state.color;
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (const s of segments) {
      const L = s.length * 0.5;
      const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
      const x1 = s.x - cos * L, y1 = s.y - sin * L;
      const x2 = s.x + cos * L, y2 = s.y + sin * L;

      // Gradient along segment
      const grd = ctx.createLinearGradient(x1, y1, x2, y2);
      grd.addColorStop(0, rgba(col, 0.08));
      grd.addColorStop(0.5, rgba(col, 0.75));
      grd.addColorStop(1, rgba(col, 0.08));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grd;
      ctx.stroke();
    }
    ctx.restore();
  }

  function burst(x, y, sign) {
    for (const s of segments) {
      const dx = s.x - x, dy = s.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 200) {
        if (sign === 1) {
          // Explosion: point away
          s.targetAngle = Math.atan2(dy, dx);
          s.speed = 0.15;
        } else {
          // Implosion: point toward center
          s.targetAngle = Math.atan2(-dy, -dx);
          s.speed = 0.15;
        }
      }
    }
  }

  function getExportCode(color, intensity) {
    return [
      '// canvas-bg-lines.js — Líneas: segmentos que apuntan al cursor',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-lines.js"></script>',
      '//   3. import { init } from "./canvas-bg-lines.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx = canvas.getContext("2d");',
      '  const COLOR = "' + color + '", INTENSITY = ' + intensity + ', CELL = 55;',
      '  let W,H,segs=[],mx=0,my=0,ma=false,it;',
      '  const rnd=(a,b)=>a+Math.random()*(b-a);',
      '  const rgb=(hex,a)=>{const n=parseInt(hex.replace("#",""),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"};',
      '  function resize(){',
      '    W=canvas.width=innerWidth;H=canvas.height=innerHeight;segs=[];',
      '    const cols=Math.ceil(W/CELL)+1,rows=Math.ceil(H/CELL)+1;',
      '    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)',
      '      segs.push({x:(c+.5)*CELL+rnd(-8,8),y:(r+.5)*CELL+rnd(-8,8),angle:rnd(0,Math.PI*2),targetAngle:rnd(0,Math.PI*2),length:rnd(20,50),speed:rnd(.008,.02)});',
      '  }',
      '  function update(){',
      '    for(const s of segs){',
      '      const dx=mx-s.x,dy=my-s.y,d=Math.hypot(dx,dy);',
      '      if(ma&&d<CELL*1.5*INTENSITY){',
      '        s.targetAngle=Math.atan2(dy,dx);s.speed=.06*(1-d/(CELL*1.5*INTENSITY))*INTENSITY+.01;',
      '      } else {s.targetAngle+=rnd(-.02,.02);}',
      '      let diff=s.targetAngle-s.angle;',
      '      while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;',
      '      s.angle+=diff*s.speed*3;',
      '    }',
      '  }',
      '  function draw(){',
      '    ctx.clearRect(0,0,W,H);ctx.lineWidth=1.5;ctx.lineCap="round";',
      '    for(const s of segs){',
      '      const L=s.length*.5,cos=Math.cos(s.angle),sin=Math.sin(s.angle);',
      '      const x1=s.x-cos*L,y1=s.y-sin*L,x2=s.x+cos*L,y2=s.y+sin*L;',
      '      const g=ctx.createLinearGradient(x1,y1,x2,y2);',
      '      g.addColorStop(0,rgb(COLOR,.08));g.addColorStop(.5,rgb(COLOR,.75));g.addColorStop(1,rgb(COLOR,.08));',
      '      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=g;ctx.stroke();',
      '    }',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",e=>{for(const s of segs){const dx=s.x-e.clientX,dy=s.y-e.clientY,d=Math.hypot(dx,dy);if(d<200){s.targetAngle=Math.atan2(dy,dx);s.speed=.15;}}});',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();for(const s of segs){const dx=s.x-e.clientX,dy=s.y-e.clientY,d=Math.hypot(dx,dy);if(d<200){s.targetAngle=Math.atan2(-dy,-dx);s.speed=.15;}}});',
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
    onExplosion: (x, y) => burst(x, y, 1),
    onImplosion: (x, y) => burst(x, y, -1),
    destroy() {},
    getExportCode,
  };
}
