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
  return { h: c.h, s: Math.max(c.s - 10, 0), l: Math.max(c.l - 20, 0) }
}

// ─── SVG Gradient ─────────────────────────────────────────────────────────────
//
// Monochrome radial gradient:
//   - 0–25%:  L90 (light, near center)
//   - 25–75%: L60 (mid tone)
//   - 100%:   L30 (dark, at petal tips)
//
// For achromatic hues (s=0) we map to equivalent lightness stops.
//
export function renderGradientDef(petalColor: HSLColor, gradId: string): string {
  const { h, s } = petalColor

  let c90: string, c60: string, c30: string

  if (s === 0) {
    // Achromatic: use plain lightness steps
    c90 = `hsl(0,0%,90%)`
    c60 = `hsl(0,0%,55%)`
    c30 = `hsl(0,0%,18%)`
  } else {
    c90 = `hsl(${h},${s}%,90%)`
    c60 = `hsl(${h},${s}%,60%)`
    c30 = `hsl(${h},${s}%,30%)`
  }

  return (
    `<radialGradient id="${gradId}" cx="50%" cy="50%" r="100%">` +
    `<stop offset="0%"   stop-color="${c90}"/>` +
    `<stop offset="25%"  stop-color="${c90}"/>` +
    `<stop offset="75%"  stop-color="${c60}"/>` +
    `<stop offset="100%" stop-color="${c30}"/>` +
    `</radialGradient>`
  )
}
