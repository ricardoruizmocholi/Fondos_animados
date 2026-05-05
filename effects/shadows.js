import { rgba, rand, dist } from './utils.js';

export function createShadowsEffect(canvas, ctx, state) {
  let blobs = [];

  // Non-linear: 10%→~6, 70%→~49, 100%→105 (3× original max)
  const target = () => Math.round(5 + 100 * Math.pow(state.intensity, 2.2));

  function makeBlob() {
    return {
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      rx: rand(40, 100),
      ry: rand(30, 80),
      angle: rand(0, Math.PI * 2),
      dangle: rand(-0.005, 0.005),
      op: rand(0.25, 0.55),
      fadeStart: null,
      fadeOp: 0,
    };
  }

  function init() {
    blobs = Array.from({ length: target() }, makeBlob);
  }

  function update(dt) {
    const n = target();
    const now = performance.now();

    // Handle fading blobs first
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i];
      if (b.fadeStart !== null) {
        const progress = Math.min((now - b.fadeStart) / 400, 1);
        b.op = b.fadeOp * (1 - progress);
        if (progress >= 1) {
          // Replace with a fresh blob spawned off-screen
          const nb = makeBlob();
          nb.x = rand(-150, -50);
          nb.y = rand(0, canvas.height);
          blobs[i] = nb;
          continue;
        }
      }
    }

    // Adjust count
    while (blobs.length < n) blobs.push(makeBlob());
    if (blobs.length > n) {
      // Only trim non-fading blobs
      for (let i = blobs.length - 1; i >= n; i--) {
        if (blobs[i].fadeStart === null) blobs.splice(i, 1);
      }
    }

    const { mouseX, mouseY, mouseActive, influenceRadius } = state;

    for (const b of blobs) {
      if (b.fadeStart !== null) continue; // fading blobs drift naturally
      b.vx += (Math.random() - 0.5) * 0.03 * dt;
      b.vy += (Math.random() - 0.5) * 0.03 * dt;
      b.angle += b.dangle * dt;

      if (mouseActive) {
        const d = dist(b.x, b.y, mouseX, mouseY);
        if (d < influenceRadius * 1.5 && d > 1) {
          const f = ((influenceRadius * 1.5 - d) / (influenceRadius * 1.5)) * 0.06 * state.intensity * dt;
          b.vx -= ((mouseX - b.x) / d) * f;
          b.vy -= ((mouseY - b.y) / d) * f;
        }
      }

      b.vx *= Math.pow(0.97, dt);
      b.vy *= Math.pow(0.97, dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const margin = 120;
      if (b.x < -margin) b.x = canvas.width + margin;
      else if (b.x > canvas.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = canvas.height + margin;
      else if (b.y > canvas.height + margin) b.y = -margin;
    }
  }

  function draw() {
    const col = state.resolvedColor || state.color;
    const blendMode = state.darkMode ? 'screen' : 'source-over';

    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    for (const b of blobs) {
      if (b.op <= 0) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.scale(b.rx / 60, b.ry / 60);

      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
      halo.addColorStop(0,   rgba(col, b.op * 0.12));
      halo.addColorStop(0.6, rgba(col, b.op * 0.06));
      halo.addColorStop(1,   rgba(col, 0));
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      ctx.shadowBlur = 30;
      ctx.shadowColor = rgba(col, b.op * 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, b.op * 0.07);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
    ctx.restore();

    // Cursor halo — soft light ring around the mouse for contrast
    if (state.mouseActive) {
      const haloColor = state.darkMode
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(0,0,0,0.09)';
      const grd = ctx.createRadialGradient(
        state.mouseX, state.mouseY, 0,
        state.mouseX, state.mouseY, 40
      );
      grd.addColorStop(0, haloColor);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(state.mouseX, state.mouseY, 40, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  function onExplosion(x, y) {
    // Click on a blob → fade it out; otherwise regular explosion
    let hit = null;
    let hitDist = Infinity;
    for (const b of blobs) {
      if (b.fadeStart !== null) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      const hitRadius = Math.max(b.rx, b.ry) * 0.85;
      if (d < hitRadius && d < hitDist) {
        hit = b;
        hitDist = d;
      }
    }
    if (hit) {
      hit.fadeStart = performance.now();
      hit.fadeOp = hit.op;
    } else {
      for (const b of blobs) {
        if (b.fadeStart !== null) continue;
        const dx = b.x - x, dy = b.y - y;
        const d = Math.hypot(dx, dy);
        if (d < 250 && d > 1) {
          const f = ((250 - d) / 250) * 7;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }
    }
  }

  function onImplosion(x, y) {
    for (const b of blobs) {
      if (b.fadeStart !== null) continue;
      const dx = b.x - x, dy = b.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 250 && d > 1) {
        const f = ((250 - d) / 250) * 7;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
    }
  }

  function getExportCode(color, intensity) {
    const n = Math.round(5 + 100 * Math.pow(intensity, 2.2));
    return [
      '// canvas-bg-shadows.js — Sombras: manchas translúcidas que huyen del cursor',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-shadows.js"></script>',
      '//   3. import { init } from "./canvas-bg-shadows.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx = canvas.getContext("2d");',
      '  const COLOR = "' + color + '";',
      '  const COUNT = ' + n + ';',
      '  let W, H, bs = [], mx = 0, my = 0, ma = false, it;',
      '  const rnd = (a,b) => a+Math.random()*(b-a);',
      '  const mk = () => ({x:rnd(0,W),y:rnd(0,H),vx:rnd(-.4,.4),vy:rnd(-.4,.4),rx:rnd(40,100),ry:rnd(30,80),angle:rnd(0,Math.PI*2),dangle:rnd(-.005,.005),op:rnd(.25,.55),fs:null,fo:0});',
      '  function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;bs=Array.from({length:COUNT},mk);}',
      '  function update(){',
      '    const now=performance.now();',
      '    for(let i=bs.length-1;i>=0;i--){const b=bs[i];if(b.fs!==null){const p=Math.min((now-b.fs)/400,1);b.op=b.fo*(1-p);if(p>=1){const nb=mk();nb.x=-100;bs[i]=nb;}}}',
      '    while(bs.length<COUNT)bs.push(mk());',
      '    for(const b of bs){if(b.fs!==null)continue;',
      '      b.vx+=(Math.random()-.5)*.03;b.vy+=(Math.random()-.5)*.03;b.angle+=b.dangle;',
      '      if(ma){const dx=mx-b.x,dy=my-b.y,d=Math.hypot(dx,dy);if(d<180&&d>1){const f=((180-d)/180)*.06;b.vx-=dx/d*f;b.vy-=dy/d*f;}}',
      '      b.vx*=.97;b.vy*=.97;b.x+=b.vx;b.y+=b.vy;',
      '      if(b.x<-120)b.x=W+120;if(b.x>W+120)b.x=-120;if(b.y<-120)b.y=H+120;if(b.y>H+120)b.y=-120;',
      '    }',
      '  }',
      '  function draw(){',
      '    const rgb=(hex,a)=>{const n=parseInt(hex.replace("#",""),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"};',
      '    ctx.clearRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation="screen";',
      '    for(const b of bs){if(b.op<=0)continue;',
      '      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.scale(b.rx/60,b.ry/60);',
      '      const g=ctx.createRadialGradient(0,0,0,0,0,60);g.addColorStop(0,rgb(COLOR,b.op*.12));g.addColorStop(.6,rgb(COLOR,b.op*.06));g.addColorStop(1,rgb(COLOR,0));',
      '      ctx.beginPath();ctx.arc(0,0,60,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();',
      '      ctx.shadowBlur=30;ctx.shadowColor=rgb(COLOR,b.op*.4);ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fillStyle=rgb(COLOR,b.op*.07);ctx.fill();ctx.shadowBlur=0;',
      '      ctx.restore();}ctx.restore();',
      '    if(ma){const g=ctx.createRadialGradient(mx,my,0,mx,my,40);g.addColorStop(0,"rgba(255,255,255,0.15)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.beginPath();ctx.arc(mx,my,40,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",e=>{',
      '    let hit=null,hd=Infinity;for(const b of bs){if(b.fs!==null)continue;const d=Math.hypot(b.x-e.clientX,b.y-e.clientY);if(d<Math.max(b.rx,b.ry)*.85&&d<hd){hit=b;hd=d;}}',
      '    if(hit){hit.fs=performance.now();hit.fo=hit.op;}else{for(const b of bs){const dx=b.x-e.clientX,dy=b.y-e.clientY,d=Math.hypot(dx,dy);if(d<250&&d>1){const f=(250-d)/250*7;b.vx+=dx/d*f;b.vy+=dy/d*f;}}}',
      '  });',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();for(const b of bs){const dx=b.x-e.clientX,dy=b.y-e.clientY,d=Math.hypot(dx,dy);if(d<250&&d>1){const f=(250-d)/250*7;b.vx-=dx/d*f;b.vy-=dy/d*f;}}});',
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
    onExplosion,
    onImplosion,
    destroy() {},
    getExportCode,
  };
}
