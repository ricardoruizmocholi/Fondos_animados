import { createLightsEffect }  from './effects/lights.js';
import { createShadowsEffect } from './effects/shadows.js';
import { createDotsEffect }    from './effects/dots.js';
import { createLinesEffect }   from './effects/lines.js';
import { createSmokeEffect }   from './effects/smoke.js';
import { createWaterEffect }   from './effects/water.js';

const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

const state = {
  mouseX: window.innerWidth  / 2,
  mouseY: window.innerHeight / 2,
  mouseActive: false,
  influenceRadius: 120,
  color: '#00aaff',
  intensity: 0.7,
  darkMode: true,
  resolvedColor: '#00aaff',
};

// ── Theme helpers ─────────────────────────────────────────────────────────────
function computeResolvedColor() {
  if (state.darkMode) return state.color;
  // Darken significantly so elements are visible on the light background
  const n = parseInt(state.color.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = 0.38;
  return '#' + [Math.round(r * f), Math.round(g * f), Math.round(b * f)]
    .map(c => c.toString(16).padStart(2, '0')).join('');
}

function setTheme(dark) {
  state.darkMode = dark;
  state.resolvedColor = computeResolvedColor();
  document.body.classList.toggle('light-mode', !dark);
  document.getElementById('theme-toggle').textContent = dark ? '☀' : '🌙';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

const factories = {
  lights:  createLightsEffect,
  shadows: createShadowsEffect,
  dots:    createDotsEffect,
  lines:   createLinesEffect,
  smoke:   createSmokeEffect,
  water:   createWaterEffect,
};

let currentName = 'lights';
let effect = null;
let idleTimer = null;
let lastTs = 0;

// ── Resize ────────────────────────────────────────────────────────────────────
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  effect?.resize?.();
}
window.addEventListener('resize', resize);

// ── Effect switcher ───────────────────────────────────────────────────────────
function switchEffect(name) {
  effect?.destroy?.();
  currentName = name;
  effect = factories[name](canvas, ctx, state);
  document.querySelectorAll('.effect-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.effect === name));
}

// ── Animation loop ────────────────────────────────────────────────────────────
function loop(ts) {
  const dt = lastTs ? Math.min((ts - lastTs) / 16.667, 4) : 1;
  lastTs = ts;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect?.update(dt);
  effect?.draw();
  requestAnimationFrame(loop);
}

// ── Mouse ─────────────────────────────────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
  state.mouseActive = true;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { state.mouseActive = false; }, 2000);
});

canvas.addEventListener('click', e => {
  effect?.onExplosion(e.clientX, e.clientY);
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  effect?.onImplosion(e.clientX, e.clientY);
});

// ── UI: theme toggle ──────────────────────────────────────────────────────────
document.getElementById('theme-toggle').addEventListener('click', () => {
  setTheme(!state.darkMode);
});

// ── UI: effect buttons ────────────────────────────────────────────────────────
document.querySelectorAll('.effect-btn').forEach(btn =>
  btn.addEventListener('click', () => switchEffect(btn.dataset.effect))
);

// ── UI: color ─────────────────────────────────────────────────────────────────
const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', e => {
  state.color = e.target.value;
  state.resolvedColor = computeResolvedColor();
});

document.querySelectorAll('.swatch').forEach(btn =>
  btn.addEventListener('click', () => {
    state.color = btn.dataset.color;
    state.resolvedColor = computeResolvedColor();
    colorPicker.value = btn.dataset.color;
  })
);

// ── UI: intensity slider ──────────────────────────────────────────────────────
const slider    = document.getElementById('intensity-slider');
const sliderVal = document.getElementById('intensity-val');
slider.addEventListener('input', e => {
  state.intensity = +e.target.value / 100;
  sliderVal.textContent = e.target.value + '%';
});

// ── Export ────────────────────────────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const code = effect?.getExportCode?.(state.color, state.intensity);
  if (!code) return;
  const blob = new Blob([code], { type: 'text/javascript' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'canvas-bg-' + currentName + '.js',
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme !== 'light'); // default: dark

resize();
switchEffect('lights');
requestAnimationFrame(loop);
