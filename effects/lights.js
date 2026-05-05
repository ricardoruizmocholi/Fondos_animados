import { rgba, rand, dist } from './utils.js';

export function createLightsEffect(canvas, ctx, state) {
  let particles = [];

  // Non-linear: 10%→~12, 70%→~165, 100%→360 (3× original max)
  const target = () => Math.round(10 + 350 * Math.pow(state.intensity, 2.2));

  function makeParticle() {
    return {
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.7, 0.7),
      vy: rand(-0.7, 0.7),
      r: rand(1.5, 4.5),
      op: rand(0.4, 1.0),
    };
  }

  function init() {
    particles = Array.from({ length: target() }, makeParticle);
  }

  function update(dt) {
    const n = target();
    while (particles.length < n) particles.push(makeParticle());
    if (particles.length > n) particles.length = n;

    const { mouseX, mouseY, mouseActive, influenceRadius } = state;

    for (const p of particles) {
      p.vx += (Math.random() - 0.5) * 0.06 * dt;
      p.vy += (Math.random() - 0.5) * 0.06 * dt;

      if (mouseActive) {
        const d = dist(p.x, p.y, mouseX, mouseY);
        if (d < influenceRadius && d > 1) {
          const f = ((influenceRadius - d) / influenceRadius) * 0.05 * state.intensity * dt;
          p.vx += ((mouseX - p.x) / d) * f;
          p.vy += ((mouseY - p.y) / d) * f;
        }
      }

      const damp = Math.pow(0.965, dt);
      p.vx *= damp;
      p.vy *= damp;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < -20) p.x = canvas.width + 20;
      else if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      else if (p.y > canvas.height + 20) p.y = -20;
    }
  }

  function draw() {
    const col = state.resolvedColor || state.color;
    ctx.save();
    for (const p of particles) {
      ctx.shadowBlur = p.r * 7;
      ctx.shadowColor = rgba(col, 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, p.op);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function push(x, y, sign) {
    for (const p of particles) {
      const dx = p.x - x, dy = p.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 220 && d > 1) {
        const f = ((220 - d) / 220) * 9 * sign;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
  }

  function getExportCode(color, intensity) {
    const n = Math.round(10 + 350 * Math.pow(intensity, 2.2));
    return [
      '// canvas-bg-lights.js — Luces: partículas brillantes con halo',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-lights.js"></script>',
      '//   3. import { init } from "./canvas-bg-lights.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx = canvas.getContext("2d");',
      '  const COLOR = "' + color + '";',
      '  const COUNT = ' + n + ';',
      '  let W, H, ps = [], mx = 0, my = 0, ma = false, it;',
      '  const rnd = (a,b) => a + Math.random()*(b-a);',
      '  const rgb = (hex,a) => { const n=parseInt(hex.replace("#",""),16); return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"; };',
      '  const mk = () => ({x:rnd(0,W),y:rnd(0,H),vx:rnd(-.7,.7),vy:rnd(-.7,.7),r:rnd(1.5,4.5),op:rnd(.4,1)});',
      '  function resize() { W=canvas.width=innerWidth; H=canvas.height=innerHeight; ps=Array.from({length:COUNT},mk); }',
      '  function update() {',
      '    while(ps.length<COUNT) ps.push(mk()); ps.length=COUNT;',
      '    for(const p of ps) {',
      '      p.vx+=(Math.random()-.5)*.06; p.vy+=(Math.random()-.5)*.06;',
      '      if(ma){const dx=mx-p.x,dy=my-p.y,d=Math.hypot(dx,dy);if(d<120&&d>1){const f=((120-d)/120)*.05;p.vx+=dx/d*f;p.vy+=dy/d*f;}}',
      '      p.vx*=.965; p.vy*=.965; p.x+=p.vx; p.y+=p.vy;',
      '      if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;',
      '    }',
      '  }',
      '  function draw() {',
      '    ctx.clearRect(0,0,W,H);',
      '    for(const p of ps){ctx.shadowBlur=p.r*7;ctx.shadowColor=rgb(COLOR,.85);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=rgb(COLOR,p.op);ctx.fill();}',
      '    ctx.shadowBlur=0;',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",e=>{for(const p of ps){const dx=p.x-e.clientX,dy=p.y-e.clientY,d=Math.hypot(dx,dy);if(d<220&&d>1){const f=(220-d)/220*9;p.vx+=dx/d*f;p.vy+=dy/d*f;}}});',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();for(const p of ps){const dx=e.clientX-p.x,dy=e.clientY-p.y,d=Math.hypot(dx,dy);if(d<220&&d>1){const f=(220-d)/220*9;p.vx+=dx/d*f;p.vy+=dy/d*f;}}});',
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
    onExplosion: (x, y) => push(x, y, 1),
    onImplosion: (x, y) => push(x, y, -1),
    destroy() {},
    getExportCode,
  };
}
