import type { HSLColor, PetalShape } from '../../model/plant';


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
export function renderGradientDef(petalColor: HSLColor, petalShape: PetalShape, gradId: string): string {
  let { h, s } = petalColor

  let c90: string, c60: string, c30: string

  if (s === 0) {
    h = 0;
    s = 0;
    // Achromatic: use plain lightness steps
    c90 = `hsl(0,0%,90%)`
    c60 = `hsl(0,0%,55%)`
    c30 = `hsl(0,0%,18%)`
  } else {
    c90 = `hsl(${h},${s}%,90%)`
    c60 = `hsl(${h},${s}%,60%)`
    c30 = `hsl(${h},${s}%,30%)`
  }

  const gradientMap = {
    0: hslString(90),
    15: hslString(85),
    30: hslString(70),
    40: hslString(60),
    60: hslString(50),
    70: hslString(40),
    85: hslString(35),
    100: hslString(30)
  }

  function hslString(l: number) {
    return `hsl(${h},${s}%,${l}%)`
  }

  const gradientStops = Object.keys(gradientMap).map(key => `<stop offset="${key}%"   stop-color="${gradientMap[key]}"/>`)
  const coords = {
    cx: 20,
    cy: 50,
    r: 75
  }

  if (petalShape === 'wavy') {
    coords.cx = 50;
    coords.cy = 10;
  }
  if (petalShape === 'tropfen') {
    coords.cx = 50;
    coords.r = 50;
  }
  if (petalShape === 'zickzack') {
    coords.cx = 50;
    coords.r = 65;
  }


  return (
    `<radialGradient id="${gradId}" cx="${coords.cx}%" cy="${coords.cy}%" r="${coords.r}%">` +
    gradientStops +
    `</radialGradient>`
  )
}
