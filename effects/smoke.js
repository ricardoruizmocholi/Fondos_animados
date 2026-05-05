import { rgba, rand, clamp } from './utils.js';

// Simple multi-octave noise using sine waves
function noise(x, y, t) {
  return (
    Math.sin(x * 0.008 + t * 0.4) * 0.45 +
    Math.cos(y * 0.011 - t * 0.6 + 1.7) * 0.30 +
    Math.sin((x + y) * 0.005 + t * 0.9 + 3.1) * 0.15 +
    Math.cos(x * 0.02 - y * 0.013 + t * 1.3 + 0.8) * 0.10
  );
}

export function createSmokeEffect(canvas, ctx, state) {
  let puffs = [], time = 0;

  const target = () => Math.round(55 * state.intensity);

  function makePuff(x, y) {
    const atBottom = (x === undefined);
    return {
      x: atBottom ? rand(0, canvas.width) : x,
      y: atBottom ? canvas.height + rand(0, 60) : y,
      vx: rand(-0.3, 0.3),
      vy: rand(-0.8, -0.3),
      size: rand(20, 50),
      growRate: rand(0.15, 0.4),
      op: rand(0.06, 0.16),
      fadeRate: rand(0.001, 0.003),
      phase: rand(0, 100),
    };
  }

  function init() {
    puffs = [];
    const n = target();
    for (let i = 0; i < n; i++) {
      const p = makePuff();
      // Spread initial positions vertically
      p.y = rand(0, canvas.height);
      puffs.push(p);
    }
  }

  function update(dt) {
    time += 0.016 * dt;
    const n = target();
    while (puffs.length < n) puffs.push(makePuff());

    const { mouseX, mouseY, mouseActive } = state;

    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];

      // Noise-driven horizontal drift
      const nx = noise(p.x + p.phase, p.y, time);
      p.vx += nx * 0.08 * dt;

      // Upward drift
      p.vy -= 0.012 * dt;

      // Mouse turbulence
      if (mouseActive) {
        const dx = mouseX - p.x, dy = mouseY - p.y;
        const d = Math.hypot(dx, dy);
        const turbRad = 140;
        if (d < turbRad) {
          const f = ((turbRad - d) / turbRad) * 0.25 * state.intensity * dt;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f * 0.5;
        }
      }

      p.vx *= Math.pow(0.97, dt);
      p.vy *= Math.pow(0.99, dt);

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += p.growRate * dt;
      p.op -= p.fadeRate * dt;

      // Wrap x
      if (p.x < -p.size) p.x = canvas.width + p.size;
      else if (p.x > canvas.width + p.size) p.x = -p.size;

      // Respawn when faded or off top
      if (p.op <= 0 || p.y < -p.size) {
        puffs[i] = makePuff();
      }
    }

    if (puffs.length > n) puffs.length = n;
  }

  function drawSoftCircle(x, y, r, alpha, col) {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, rgba(col, alpha));
    grd.addColorStop(0.4, rgba(col, alpha * 0.5));
    grd.addColorStop(1, rgba(col, 0));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  function draw() {
    const col = state.color;
    ctx.save();
    // Composite: lighter blend for glowing smoke
    ctx.globalCompositeOperation = 'screen';
    for (const p of puffs) {
      drawSoftCircle(p.x, p.y, p.size, clamp(p.op, 0, 0.3), col);
      // Bright core
      drawSoftCircle(p.x, p.y, p.size * 0.3, clamp(p.op * 1.5, 0, 0.4), col);
    }
    ctx.restore();
  }

  function disturb(x, y, sign) {
    for (const p of puffs) {
      const dx = p.x - x, dy = p.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) {
        p.vx += (dx / d) * 3 * sign;
        p.vy += (dy / d) * 3 * sign;
      }
    }
  }

  function getExportCode(color, intensity) {
    const n = Math.round(55 * intensity);
    return [
      '// canvas-bg-smoke.js — Humo: volutas con noise y turbulencia de cursor',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-smoke.js"></script>',
      '//   3. import { init } from "./canvas-bg-smoke.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx = canvas.getContext("2d");',
      '  const COLOR = "' + color + '", COUNT = ' + n + ';',
      '  let W,H,ps=[],t=0,mx=0,my=0,ma=false,it;',
      '  const rnd=(a,b)=>a+Math.random()*(b-a);',
      '  const rgb=(hex,a)=>{const n=parseInt(hex.replace("#",""),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"};',
      '  const noise=(x,y,t)=>Math.sin(x*.008+t*.4)*.45+Math.cos(y*.011-t*.6+1.7)*.3+Math.sin((x+y)*.005+t*.9+3.1)*.15;',
      '  const mk=()=>({x:rnd(0,W),y:H+rnd(0,60),vx:rnd(-.3,.3),vy:rnd(-.8,-.3),size:rnd(20,50),gr:rnd(.15,.4),op:rnd(.06,.16),fr:rnd(.001,.003),ph:rnd(0,100)});',
      '  function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;ps=Array.from({length:COUNT},()=>{const p=mk();p.y=rnd(0,H);return p;});}',
      '  function update(){',
      '    t+=.016;while(ps.length<COUNT)ps.push(mk());',
      '    for(let i=ps.length-1;i>=0;i--){const p=ps[i];',
      '      p.vx+=noise(p.x+p.ph,p.y,t)*.08;p.vy-=.012;',
      '      if(ma){const dx=mx-p.x,dy=my-p.y,d=Math.hypot(dx,dy);if(d<140&&d>1){const f=((140-d)/140)*.25;p.vx+=dx/d*f;p.vy+=dy/d*f*.5;}}',
      '      p.vx*=.97;p.vy*=.99;p.x+=p.vx;p.y+=p.vy;p.size+=p.gr;p.op-=p.fr;',
      '      if(p.x<-p.size)p.x=W+p.size;if(p.x>W+p.size)p.x=-p.size;',
      '      if(p.op<=0||p.y<-p.size)ps[i]=mk();',
      '    }',
      '  }',
      '  function softCircle(x,y,r,a){',
      '    const g=ctx.createRadialGradient(x,y,0,x,y,r);',
      '    g.addColorStop(0,rgb(COLOR,a));g.addColorStop(.4,rgb(COLOR,a*.5));g.addColorStop(1,rgb(COLOR,0));',
      '    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();',
      '  }',
      '  function draw(){',
      '    ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation="screen";',
      '    for(const p of ps){softCircle(p.x,p.y,p.size,Math.min(p.op,.3));softCircle(p.x,p.y,p.size*.3,Math.min(p.op*1.5,.4));}',
      '    ctx.globalCompositeOperation="source-over";',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",e=>{for(const p of ps){const dx=p.x-e.clientX,dy=p.y-e.clientY,d=Math.hypot(dx,dy);if(d<200&&d>1){p.vx+=dx/d*3;p.vy+=dy/d*3;}}});',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();for(const p of ps){const dx=e.clientX-p.x,dy=e.clientY-p.y,d=Math.hypot(dx,dy);if(d<200&&d>1){p.vx+=dx/d*3;p.vy+=dy/d*3;}}});',
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
    onExplosion: (x, y) => disturb(x, y, 1),
    onImplosion: (x, y) => disturb(x, y, -1),
    destroy() {},
    getExportCode,
  };
}
