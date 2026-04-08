import { PetalShape, CenterType, HSLColor, AllelePair } from "../model/plant";


// ─── Dominance helpers ────────────────────────────────────────────────────────
/**
 * Dominance order for petal shape.
 * Lower index = more dominant.
 */

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'pointed', 'wavy']
/**
 * Dominance order for center type.
 * Lower index = more dominant.
 */

export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen']
/**
 * Hue ranges that define colour "allele buckets" for dominance checks.
 * Order = dominance (index 0 is most dominant).
 * White/cream is detected by low saturation (s < 20), not by hue.
 * Black is detected by very low lightness (l < 18).
 */

export type ColorBucket = 'white' // s < 20, l > 75  — dominant
  |
  'yellow' // h 45–70
  |
  'red' // h 340–360 or 0–20
  |
  'purple' // h 270–330
  |
  'blue' // h 190–269
  |
  'gray'; // s < 20 or l < 18 (includes near-black)

export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'purple', 'blue', 'gray',
]
/** Classify an HSLColor into a dominance bucket */

export function colorBucket(c: HSLColor): ColorBucket {
  if (c.s < 20 && c.l > 75) return 'white'
  if (c.s < 22 || c.l < 18) return 'gray'
  const h = c.h
  if (h >= 45 && h <= 70) return 'yellow'
  if (h >= 340 || h <= 20) return 'red'
  if (h >= 270 && h <= 330) return 'purple'
  if (h >= 190 && h <= 269) return 'blue'
  // Fallback — treat remaining hues by proximity to known buckets
  if (h > 20 && h < 45) return 'red' // orange-red
  if (h > 70 && h < 190) return 'yellow' // yellow-green
  return 'blue'
}
/** Return the more dominant of two HSLColors */

export function dominantColor(a: HSLColor, b: HSLColor): HSLColor {
  const ia = COLOR_BUCKET_DOMINANCE.indexOf(colorBucket(a))
  const ib = COLOR_BUCKET_DOMINANCE.indexOf(colorBucket(b))
  return ia <= ib ? a : b
}
/** Return the more dominant of two petal shapes */

export function dominantShape(a: PetalShape, b: PetalShape): PetalShape {
  const ia = PETAL_SHAPE_DOMINANCE.indexOf(a)
  const ib = PETAL_SHAPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}
/** Return the more dominant of two center types */

export function dominantCenter(a: CenterType, b: CenterType): CenterType {
  const ia = CENTER_TYPE_DOMINANCE.indexOf(a)
  const ib = CENTER_TYPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}
// ─── Expressed phenotype helpers ─────────────────────────────────────────────
/** The color that is actually displayed (dominant allele wins) */

export function expressedColor(pair: AllelePair<HSLColor>): HSLColor {
  return dominantColor(pair.a, pair.b)
}
/** The shape that is actually displayed */

export function expressedShape(pair: AllelePair<PetalShape>): PetalShape {
  return dominantShape(pair.a, pair.b)
}
/** The center type that is actually displayed */

export function expressedCenter(pair: AllelePair<CenterType>): CenterType {
  return dominantCenter(pair.a, pair.b)
}
/** Numeric traits use the average of both alleles (incomplete dominance) */

export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
}
/** Gradient: no-gradient is dominant. Gradient only shows if BOTH alleles carry it. */

export function expressedGradient(pair: AllelePair<HSLColor | null>): HSLColor | null {
  if (pair.a !== null && pair.b !== null) return pair.a // both carry it → show
  return null
}
