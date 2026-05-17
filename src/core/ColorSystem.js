export class ColorSystem {
  static hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  static rgba(hex, a) {
    const [r, g, b] = ColorSystem.hexToRgb(hex);
    return `rgba(${r},${g},${b},${parseFloat(a.toFixed(3))})`;
  }

  static darken(hex, factor = 0.38) {
    const [r, g, b] = ColorSystem.hexToRgb(hex);
    return '#' + [r, g, b]
      .map(c => Math.round(c * factor).toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToHsl(hex) {
    let [r, g, b] = ColorSystem.hexToRgb(hex).map(c => c / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6;
      }
    }
    return [h * 360, s * 100, l * 100];
  }

  static hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = t => {
      if (t < 0) t++; if (t > 1) t--;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    return '#' + [hue(h + 1/3), hue(h), hue(h - 1/3)]
      .map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  }

  static shiftHue(hex, deg) {
    const [h, s, l] = ColorSystem.hexToHsl(hex);
    return ColorSystem.hslToHex(((h + deg) % 360 + 360) % 360, s, l);
  }

  static mix(hexA, hexB, t) {
    const [r1, g1, b1] = ColorSystem.hexToRgb(hexA);
    const [r2, g2, b2] = ColorSystem.hexToRgb(hexB);
    return '#' + [
      Math.round(r1 + (r2 - r1) * t),
      Math.round(g1 + (g2 - g1) * t),
      Math.round(b1 + (b2 - b1) * t),
    ].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  static resolve(hex, darkMode) {
    return darkMode ? hex : ColorSystem.darken(hex, 0.38);
  }
}
