import type { HSLColor } from '../../model/plant';


// ─── Helpers ─────────────────────────────────────────────────────────────────
export function hsl({ h, s, l }: HSLColor): string {
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
/** Darken a colour for petal stroke */
export function darken(c: HSLColor): HSLColor {
  return { h: c.h, s: Math.max(c.s - 10, 0), l:  Math.max(c.l - 20, 0) }
}


// ─── SVG Helpers ─────────────────────────────────────────────────────────────────
export function renderGradientDef(petalColor: HSLColor, gradColor: HSLColor, gradId: string): string {
  const pc = petalColor;
  const gc = gradColor;
  return (
    `<radialGradient id="${gradId}" cx="40%" cy="55%" r="65%">` +
    `<stop offset="0%" stop-color="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 16, 40, 92) })}"/>` +
    `<stop offset="100%" stop-color="${hsl(gc)}"/>` +
    `</radialGradient>`
  );
}

