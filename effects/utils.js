export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
export function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
