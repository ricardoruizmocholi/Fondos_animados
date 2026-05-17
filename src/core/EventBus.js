export class EventBus {
  constructor(canvas) {
    this.canvas = canvas;
    this._h     = new Map();
    this.mouse  = { x: canvas.width / 2, y: canvas.height / 2, active: false };
    this._idle  = null;

    this._mv = this._mv.bind(this);
    this._cl = this._cl.bind(this);
    this._rc = this._rc.bind(this);
    this._rs = this._rs.bind(this);

    canvas.addEventListener('mousemove',   this._mv);
    canvas.addEventListener('click',       this._cl);
    canvas.addEventListener('contextmenu', this._rc);
    window.addEventListener('resize',      this._rs);
  }

  _mv(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
    clearTimeout(this._idle);
    this._idle = setTimeout(() => { this.mouse.active = false; }, 2000);
    this._emit('mousemove', { ...this.mouse });
  }
  _cl(e) { this._emit('click',  { x: e.clientX, y: e.clientY }); }
  _rc(e) { e.preventDefault(); this._emit('rclick', { x: e.clientX, y: e.clientY }); }
  _rs()  { this._emit('resize'); }

  on(ev, fn) {
    if (!this._h.has(ev)) this._h.set(ev, []);
    this._h.get(ev).push(fn);
    return () => this.off(ev, fn);
  }
  off(ev, fn) {
    const a = this._h.get(ev);
    if (a) this._h.set(ev, a.filter(f => f !== fn));
  }
  _emit(ev, d) { this._h.get(ev)?.forEach(f => f(d)); }

  destroy() {
    this.canvas.removeEventListener('mousemove',   this._mv);
    this.canvas.removeEventListener('click',       this._cl);
    this.canvas.removeEventListener('contextmenu', this._rc);
    window.removeEventListener('resize',           this._rs);
    this._h.clear();
  }
}
