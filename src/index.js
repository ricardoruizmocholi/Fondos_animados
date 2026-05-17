// ── Core ──────────────────────────────────────────────────────────────────────
export { EffectBase }    from './core/EffectBase.js';
export { ColorSystem }   from './core/ColorSystem.js';
export { EventBus }      from './core/EventBus.js';

// ── Effects ───────────────────────────────────────────────────────────────────
export { LightsEffect }       from './effects/lights.js';
export { ShadowsEffect }      from './effects/shadows.js';
export { DotsEffect }         from './effects/dots.js';
export { LinesEffect }        from './effects/lines.js';
export { SmokeEffect }        from './effects/smoke.js';
export { WaterEffect }        from './effects/water.js';
export { NetworkEffect }      from './effects/network.js';
export { StarfieldEffect }    from './effects/starfield.js';
export { FirefliesEffect }    from './effects/fireflies.js';
export { ConfettiEffect }     from './effects/confetti.js';
export { BubblesEffect }      from './effects/bubbles.js';
export { MatrixEffect }       from './effects/matrix.js';
export { GalaxyEffect }       from './effects/galaxy.js';
export { MeshGradientEffect } from './effects/mesh_gradient.js';
export { AuroraEffect }       from './effects/aurora.js';
export { PlasmaEffect }       from './effects/plasma.js';
export { BlobEffect }         from './effects/blob.js';
export { HolographicEffect }  from './effects/holographic.js';
export { HexGridEffect }      from './effects/hex_grid.js';
export { TopologyEffect }     from './effects/topology.js';
export { CircuitEffect }      from './effects/circuit.js';
export { VoronoiEffect }      from './effects/voronoi.js';
export { TrianglesEffect }    from './effects/triangles.js';
export { MorphingEffect }     from './effects/morphing.js';
export { RainEffect }         from './effects/rain.js';
export { SnowEffect }         from './effects/snow.js';
export { FireEffect }         from './effects/fire.js';
export { LightningEffect }    from './effects/lightning.js';
export { RippleEffect }       from './effects/ripple.js';
export { NoiseFieldEffect }   from './effects/noise_field.js';

// ── Effect registry ───────────────────────────────────────────────────────────
import { LightsEffect }       from './effects/lights.js';
import { ShadowsEffect }      from './effects/shadows.js';
import { DotsEffect }         from './effects/dots.js';
import { LinesEffect }        from './effects/lines.js';
import { SmokeEffect }        from './effects/smoke.js';
import { WaterEffect }        from './effects/water.js';
import { NetworkEffect }      from './effects/network.js';
import { StarfieldEffect }    from './effects/starfield.js';
import { FirefliesEffect }    from './effects/fireflies.js';
import { ConfettiEffect }     from './effects/confetti.js';
import { BubblesEffect }      from './effects/bubbles.js';
import { MatrixEffect }       from './effects/matrix.js';
import { GalaxyEffect }       from './effects/galaxy.js';
import { MeshGradientEffect } from './effects/mesh_gradient.js';
import { AuroraEffect }       from './effects/aurora.js';
import { PlasmaEffect }       from './effects/plasma.js';
import { BlobEffect }         from './effects/blob.js';
import { HolographicEffect }  from './effects/holographic.js';
import { HexGridEffect }      from './effects/hex_grid.js';
import { TopologyEffect }     from './effects/topology.js';
import { CircuitEffect }      from './effects/circuit.js';
import { VoronoiEffect }      from './effects/voronoi.js';
import { TrianglesEffect }    from './effects/triangles.js';
import { MorphingEffect }     from './effects/morphing.js';
import { RainEffect }         from './effects/rain.js';
import { SnowEffect }         from './effects/snow.js';
import { FireEffect }         from './effects/fire.js';
import { LightningEffect }    from './effects/lightning.js';
import { RippleEffect }       from './effects/ripple.js';
import { NoiseFieldEffect }   from './effects/noise_field.js';

export const EFFECTS = {
  lights:        { Class: LightsEffect,       category: 'Original',   label: 'Luces',       tech: 'Canvas2D' },
  shadows:       { Class: ShadowsEffect,      category: 'Original',   label: 'Sombras',     tech: 'Canvas2D' },
  dots:          { Class: DotsEffect,         category: 'Original',   label: 'Puntos',      tech: 'Canvas2D' },
  lines:         { Class: LinesEffect,        category: 'Original',   label: 'Líneas',      tech: 'Canvas2D' },
  smoke:         { Class: SmokeEffect,        category: 'Original',   label: 'Humo',        tech: 'Canvas2D' },
  water:         { Class: WaterEffect,        category: 'Original',   label: 'Agua',        tech: 'Canvas2D' },
  network:       { Class: NetworkEffect,      category: 'Partículas', label: 'Network',     tech: 'Canvas2D' },
  starfield:     { Class: StarfieldEffect,    category: 'Partículas', label: 'Starfield',   tech: 'Canvas2D' },
  fireflies:     { Class: FirefliesEffect,    category: 'Partículas', label: 'Fireflies',   tech: 'Canvas2D' },
  confetti:      { Class: ConfettiEffect,     category: 'Partículas', label: 'Confetti',    tech: 'Canvas2D' },
  bubbles:       { Class: BubblesEffect,      category: 'Partículas', label: 'Bubbles',     tech: 'Canvas2D' },
  matrix:        { Class: MatrixEffect,       category: 'Partículas', label: 'Matrix',      tech: 'Canvas2D' },
  galaxy:        { Class: GalaxyEffect,       category: 'Partículas', label: 'Galaxy',      tech: 'Canvas2D' },
  mesh_gradient: { Class: MeshGradientEffect, category: 'Gradientes', label: 'Mesh',        tech: 'Canvas2D' },
  aurora:        { Class: AuroraEffect,       category: 'Gradientes', label: 'Aurora',      tech: 'Canvas2D' },
  plasma:        { Class: PlasmaEffect,       category: 'Gradientes', label: 'Plasma',      tech: 'Canvas2D' },
  blob:          { Class: BlobEffect,         category: 'Gradientes', label: 'Blob',        tech: 'Canvas2D' },
  holographic:   { Class: HolographicEffect,  category: 'Gradientes', label: 'Holographic', tech: 'Canvas2D' },
  hex_grid:      { Class: HexGridEffect,      category: 'Geométrica', label: 'Hex Grid',    tech: 'Canvas2D' },
  topology:      { Class: TopologyEffect,     category: 'Geométrica', label: 'Topology',    tech: 'Canvas2D' },
  circuit:       { Class: CircuitEffect,      category: 'Geométrica', label: 'Circuit',     tech: 'Canvas2D' },
  voronoi:       { Class: VoronoiEffect,      category: 'Geométrica', label: 'Voronoi',     tech: 'Canvas2D' },
  triangles:     { Class: TrianglesEffect,    category: 'Geométrica', label: 'Triangles',   tech: 'Canvas2D' },
  morphing:      { Class: MorphingEffect,     category: 'Geométrica', label: 'Morphing',    tech: 'Canvas2D' },
  rain:          { Class: RainEffect,         category: 'Física',     label: 'Rain',        tech: 'Canvas2D' },
  snow:          { Class: SnowEffect,         category: 'Física',     label: 'Snow',        tech: 'Canvas2D' },
  fire:          { Class: FireEffect,         category: 'Física',     label: 'Fire',        tech: 'Canvas2D' },
  lightning:     { Class: LightningEffect,    category: 'Física',     label: 'Lightning',   tech: 'Canvas2D' },
  ripple:        { Class: RippleEffect,       category: 'Física',     label: 'Ripple',      tech: 'Canvas2D' },
  noise_field:   { Class: NoiseFieldEffect,   category: 'Abstracto',  label: 'Noise Field', tech: 'Canvas2D' },
};

// ── AnimatedBG — public API ───────────────────────────────────────────────────
export class AnimatedBG {
  /**
   * @param {HTMLCanvasElement|string} target - Canvas element or CSS selector
   * @param {object} options
   * @param {string} [options.effect='lights']
   * @param {string} [options.color='#4f9cf9']
   * @param {number} [options.intensity=0.8]
   * @param {boolean} [options.darkMode=true]
   */
  constructor(target, options = {}) {
    this.canvas = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.canvas) throw new Error(`AnimatedBG: canvas not found — "${target}"`);

    this.options = {
      effect: 'lights',
      color: '#4f9cf9',
      intensity: 0.8,
      darkMode: true,
      ...options,
    };

    this._ctx      = this.canvas.getContext('2d');
    this._effect   = null;
    this._raf      = null;
    this._running  = false;
    this._lastTs   = 0;
    this._mouse    = { x: this.canvas.width / 2, y: this.canvas.height / 2, active: false };
    this._idleTimer = null;

    this._bindEvents();
    this._resize();
    this._loadEffect(this.options.effect);
  }

  // ── Private ──────────────────────────────────────────────────────────────
  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousemove', e => {
      this._mouse.x = e.clientX; this._mouse.y = e.clientY; this._mouse.active = true;
      clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(() => { this._mouse.active = false; }, 2000);
    });
    c.addEventListener('click', e => this._effect?.onExplosion?.(e.clientX, e.clientY));
    c.addEventListener('contextmenu', e => { e.preventDefault(); this._effect?.onImplosion?.(e.clientX, e.clientY); });
    window.addEventListener('resize', () => { this._resize(); this._effect?.resize?.(); });
  }

  _resize() {
    const el = this.canvas;
    el.width  = el.offsetWidth  || window.innerWidth;
    el.height = el.offsetHeight || window.innerHeight;
  }

  _loadEffect(name) {
    this._effect?.destroy?.();
    const entry = EFFECTS[name.toLowerCase()];
    if (!entry) { console.warn(`AnimatedBG: effect "${name}" not found`); return; }
    this._effect = new entry.Class(this.canvas, { ...this.options });
  }

  _loop(ts) {
    const dt = this._lastTs ? Math.min((ts - this._lastTs) / 16.667, 4) : 1;
    this._lastTs = ts;
    this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._effect?.update(this._mouse, dt);
    this._effect?.draw();
    if (this._running) this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Public API ────────────────────────────────────────────────────────────
  start() {
    if (this._running) return this;
    this._running = true;
    this._raf = requestAnimationFrame(ts => this._loop(ts));
    return this;
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    return this;
  }

  setEffect(name) {
    this.options.effect = name;
    this._loadEffect(name);
    return this;
  }

  setColor(color) {
    this.options.color = color;
    this._effect?.setOptions?.({ color });
    return this;
  }

  setIntensity(intensity) {
    this.options.intensity = intensity;
    this._effect?.setOptions?.({ intensity });
    return this;
  }

  setDarkMode(dark) {
    this.options.darkMode = dark;
    this._effect?.setOptions?.({ darkMode: dark });
    return this;
  }

  destroy() {
    this.stop();
    this._effect?.destroy?.();
    this._effect = null;
  }
}
