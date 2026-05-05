import { rgba } from './utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const RING_CFG = [
  { radius: 60,  count: 18, speed: 0.000_70 },
  { radius: 110, count: 22, speed: 0.000_50 },
  { radius: 170, count: 24, speed: 0.000_40 },
  { radius: 240, count: 28, speed: 0.000_35 },
  { radius: 320, count: 30, speed: 0.000_30 },
];

const BASE_Y = 0.42;                              // Y-compression → simulates viewing angle
const DS     = Math.sqrt(1 - BASE_Y * BASE_Y);   // depth scale ≈ 0.908

// lerp
const lp = (a, b, t) => a + (b - a) * t;

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────
export default class AguaEffect {
  constructor(canvas, color) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.color  = color;
    this.frame  = 0;

    this.cx = canvas.width  / 2;
    this.cy = canvas.height / 2;

    // Interactive tilt (mouse)
    this.tiltX  = 0;  this.tiltY  = 0;
    this.ttiltX = 0;  this.ttiltY = 0;

    // Click spring (radius scale)
    this.scale    = 1;
    this.scaleVel = 0;

    // Global opacity (near center = 1.0, far/idle = 0.3)
    this.gAlpha = 0.3;

    this._initRings();
  }

  _initRings() {
    this.rings = RING_CFG.map((cfg, ri) => ({
      ...cfg,
      phase: (ri / RING_CFG.length) * Math.PI * 2 * 0.13, // stagger
      particles: Array.from({ length: cfg.count }, (_, i) => ({
        base: (i / cfg.count) * Math.PI * 2,
        d:    0,   // accumulated micro-perturbation (radians)
        idx:  i,
      })),
    }));
  }

  // ── 3D projection ──────────────────────────────────────────────────────────
  // Ring lies in XY plane, base-tilted around X (→ Y compressed by BASE_Y,
  // depth = DS factor). Interactive tilt via tiltX (Y-axis) + tiltY (X-axis).
  _project(angle, r, tiltX, tiltY) {
    // Ring point (base inclination already baked into BY/DS)
    const px =  Math.cos(angle) * r;
    const py =  Math.sin(angle) * r * BASE_Y;
    const pz =  Math.sin(angle) * r * DS;

    // Rotate around Y by tiltX
    const rx =  px * Math.cos(tiltX) + pz * Math.sin(tiltX);
    const ry =  py;
    const rz = -px * Math.sin(tiltX) + pz * Math.cos(tiltX);

    // Rotate around X by tiltY
    const fx = rx;
    const fy = ry * Math.cos(tiltY) - rz * Math.sin(tiltY);
    const fz = ry * Math.sin(tiltY) + rz * Math.cos(tiltY);

    return { sx: this.cx + fx, sy: this.cy + fy, z: fz };
  }

  // Exact tangent in screen space (derivative of _project w.r.t. angle)
  _tangent(angle, r, tiltX, tiltY) {
    const dpx = -Math.sin(angle) * r;
    const dpy =  Math.cos(angle) * r * BASE_Y;
    const dpz =  Math.cos(angle) * r * DS;

    const drx =  dpx * Math.cos(tiltX) + dpz * Math.sin(tiltX);
    const dry =  dpy;
    const drz = -dpx * Math.sin(tiltX) + dpz * Math.cos(tiltX);

    const dfx = drx;
    const dfy = dry * Math.cos(tiltY) - drz * Math.sin(tiltY);

    const len = Math.hypot(dfx, dfy) || 1;
    return { tx: dfx / len, ty: dfy / len };
  }

  // ── update(mouse) ──────────────────────────────────────────────────────────
  update(mouse) {
    this.frame++;
    const { x: mx, y: my, active } = mouse;

    // Target tilt
    if (active) {
      this.ttiltX = ((mx - this.cx) / this.canvas.width)  *  0.40;
      this.ttiltY = ((my - this.cy) / this.canvas.height) *  0.25;
    } else {
      this.ttiltX = 0;
      this.ttiltY = 0;
    }
    this.tiltX += (this.ttiltX - this.tiltX) * 0.03;
    this.tiltY += (this.ttiltY - this.tiltY) * 0.03;

    // Spring back to scale = 1
    this.scaleVel += (1 - this.scale) * 0.04;
    this.scaleVel *= 0.88;
    this.scale    += this.scaleVel;

    // Global alpha: closer to center → brighter
    const dCenter    = active ? Math.hypot(mx - this.cx, my - this.cy) : 999;
    const tDist      = Math.min(dCenter / 280, 1);
    const targetAlpha = lp(1.0, 0.3, tDist);
    this.gAlpha += (targetAlpha - this.gAlpha) * 0.05;

    // Advance rings + micro-perturbation
    const f = this.frame;
    for (const ring of this.rings) {
      ring.phase += ring.speed;
      for (const p of ring.particles) {
        p.d += Math.sin(f * 0.0007 + p.idx) * 0.0004;
      }
    }
  }

  // ── draw() ────────────────────────────────────────────────────────────────
  draw() {
    const ctx      = this.ctx;
    const col      = this.color;
    const { tiltX, tiltY, scale, gAlpha } = this;
    const nRings   = this.rings.length;

    // Collect all segments with depth
    const segs = [];

    for (let ri = 0; ri < nRings; ri++) {
      const ring   = this.rings[ri];
      const r      = ring.radius * scale;
      const lineLen = lp(12, 20, ri / (nRings - 1));
      const hl     = lineLen / 2;
      const maxZ   = r * DS;

      for (const p of ring.particles) {
        const angle = ring.phase + p.base + p.d;

        const { sx, sy, z } = this._project(angle, r, tiltX, tiltY);
        const { tx, ty }    = this._tangent (angle, r, tiltX, tiltY);

        // Depth → opacity & width
        const zNorm    = Math.min(Math.max((z / (maxZ || 1) + 1) / 2, 0), 1);
        const opacity  = lp(0.08, 0.90, zNorm) * gAlpha;
        const lineWidth = lp(0.40, 1.80, zNorm);

        segs.push({
          x1: sx - tx * hl,  y1: sy - ty * hl,
          x2: sx + tx * hl,  y2: sy + ty * hl,
          z, opacity, lineWidth,
        });
      }
    }

    // Sort back → front (ascending z)
    segs.sort((a, b) => a.z - b.z);

    ctx.save();
    ctx.lineCap = 'round';

    for (const s of segs) {
      if (s.opacity < 0.01) continue;
      ctx.lineWidth   = s.lineWidth;
      ctx.strokeStyle = rgba(col, s.opacity);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Click: all rings expand 15 % then spring back
  onExplosion()  { this.scale = 1.15; this.scaleVel = 0; }
  // Right-click: rings contract then spring back
  onImplosion()  { this.scale = 0.82; this.scaleVel = 0; }

  resize() {
    this.cx = this.canvas.width  / 2;
    this.cy = this.canvas.height / 2;
  }

  destroy() {}

  getExportCode(color, intensity) {
    return [
      '// canvas-bg-water.js — Anillos orbitales con profundidad 3D simulada',
      '// Uso:',
      '//   1. <canvas id="c" style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
      '//   2. <script type="module" src="canvas-bg-water.js"></script>',
      '//   3. import { init } from "./canvas-bg-water.js"; init(document.getElementById("c"));',
      '',
      'export function init(canvas) {',
      '  const ctx=canvas.getContext("2d");',
      '  const COLOR="' + color + '",INTENSITY=' + intensity + ';',
      '  const CFG=[{r:60,n:18,s:.0007},{r:110,n:22,s:.0005},{r:170,n:24,s:.0004},{r:240,n:28,s:.00035},{r:320,n:30,s:.0003}];',
      '  const BY=0.42,DS=Math.sqrt(1-BY*BY);',
      '  const lp=(a,b,t)=>a+(b-a)*t;',
      '  const rgb=(hex,a)=>{const n=parseInt(hex.replace("#",""),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"};',
      '  let W,H,cx,cy,mx=0,my=0,ma=false,it,fr=0,tX=0,tY=0,ttX=0,ttY=0,sc=1,sv=0,ga=0.3;',
      '  const rings=CFG.map((c,i)=>({...c,ph:(i/CFG.length)*Math.PI*2*.13,ps:Array.from({length:c.n},(_,j)=>({b:(j/c.n)*Math.PI*2,d:0,idx:j}))}));',
      '  function proj(a,r,tx,ty){const px=Math.cos(a)*r,py=Math.sin(a)*r*BY,pz=Math.sin(a)*r*DS,rx=px*Math.cos(tx)+pz*Math.sin(tx),ry=py,rz=-px*Math.sin(tx)+pz*Math.cos(tx),fx=rx,fy=ry*Math.cos(ty)-rz*Math.sin(ty),fz=ry*Math.sin(ty)+rz*Math.cos(ty);return{sx:cx+fx,sy:cy+fy,z:fz};}',
      '  function tang(a,r,tx,ty){const dpx=-Math.sin(a)*r,dpy=Math.cos(a)*r*BY,dpz=Math.cos(a)*r*DS,drx=dpx*Math.cos(tx)+dpz*Math.sin(tx),dry=dpy,drz=-dpx*Math.sin(tx)+dpz*Math.cos(tx),dfx=drx,dfy=dry*Math.cos(ty)-drz*Math.sin(ty),len=Math.hypot(dfx,dfy)||1;return{tx:dfx/len,ty:dfy/len};}',
      '  function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cx=W/2;cy=H/2;}',
      '  function update(){',
      '    fr++;if(ma){ttX=((mx-cx)/W)*.4;ttY=((my-cy)/H)*.25;}else{ttX=0;ttY=0;}',
      '    tX+=(ttX-tX)*.03;tY+=(ttY-tY)*.03;',
      '    sv+=(1-sc)*.04;sv*=.88;sc+=sv;',
      '    const dc=ma?Math.hypot(mx-cx,my-cy):999;ga+=(lp(1,.3,Math.min(dc/280,1))-ga)*.05;',
      '    for(const ring of rings){ring.ph+=ring.s;for(const p of ring.ps)p.d+=Math.sin(fr*.0007+p.idx)*.0004;}',
      '  }',
      '  function draw(){',
      '    ctx.clearRect(0,0,W,H);const segs=[];const NR=rings.length;',
      '    for(let ri=0;ri<NR;ri++){const ring=rings[ri],r=ring.r*sc,hl=lp(12,20,ri/(NR-1))/2,mZ=r*DS;',
      '      for(const p of ring.ps){const a=ring.ph+p.b+p.d,{sx,sy,z}=proj(a,r,tX,tY),{tx,ty}=tang(a,r,tX,tY),zn=Math.min(Math.max((z/(mZ||1)+1)/2,0),1);',
      '        segs.push({x1:sx-tx*hl,y1:sy-ty*hl,x2:sx+tx*hl,y2:sy+ty*hl,z,op:lp(.08,.9,zn)*ga,lw:lp(.4,1.8,zn)});}}',
      '    segs.sort((a,b)=>a.z-b.z);ctx.lineCap="round";',
      '    for(const s of segs){if(s.op<.01)continue;ctx.lineWidth=s.lw;ctx.strokeStyle=rgb(COLOR,s.op);ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();}',
      '  }',
      '  canvas.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;ma=true;clearTimeout(it);it=setTimeout(()=>ma=false,2000);});',
      '  canvas.addEventListener("click",()=>{sc=1.15;sv=0;});',
      '  canvas.addEventListener("contextmenu",e=>{e.preventDefault();sc=0.82;sv=0;});',
      '  window.addEventListener("resize",resize);',
      '  resize();',
      '  (function loop(){update();draw();requestAnimationFrame(loop);})();',
      '}',
    ].join('\n');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory adapter — keeps main.js import untouched
// ─────────────────────────────────────────────────────────────────────────────
export function createWaterEffect(canvas, _ctx, state) {
  const eff = new AguaEffect(canvas, state.resolvedColor || state.color);
  return {
    update(_dt)    {
      eff.color = state.resolvedColor || state.color;
      eff.update({ x: state.mouseX, y: state.mouseY, active: state.mouseActive });
    },
    draw()         { eff.draw(); },
    resize()       { eff.resize(); },
    onExplosion()  { eff.onExplosion(); },
    onImplosion()  { eff.onImplosion(); },
    destroy()      { eff.destroy(); },
    getExportCode(c, i) { return eff.getExportCode(c, i); },
  };
}
