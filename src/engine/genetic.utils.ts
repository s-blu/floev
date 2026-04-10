import { PetalShape, CenterType, HSLColor, AllelePair } from "../model/plant";


// ─── Dominance helpers ────────────────────────────────────────────────────────

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']
export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen']

/**
 * Color dominance buckets.
 * white > yellow > red > purple > blue > gray
 *
 * "white" matches s=0, l=100 (the fixed white color).
 * "gray"  matches s=0, l<100 (the three fixed gray tones).
 * All chromatic palette colors (s=90) are classified by hue range.
 */
export type ColorBucket = 'white' | 'yellow' | 'red' | 'purple' | 'blue' | 'gray'

export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'purple', 'blue', 'gray',
]

/** Classify an HSLColor into a dominance bucket */
export function colorBucket(c: HSLColor): ColorBucket {
  // Achromatic: s=0 (white and the three grays)
  if (c.s === 0) {
    return c.l >= 95 ? 'white' : 'gray'
  }
  // Chromatic palette colors (s=90): classify by hue
  const h = c.h
  if (h >= 40 && h <= 70)  return 'yellow'
  if (h >= 340 || h <= 20) return 'red'
  if (h >= 270 && h <= 330) return 'purple'
  if (h >= 160 && h <= 269) return 'blue'
  // orange (h 21–39): treat as red family
  if (h > 20 && h < 40)    return 'red'
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

export function expressedColor(pair: AllelePair<HSLColor>): HSLColor {
  return dominantColor(pair.a, pair.b)
}
export function expressedShape(pair: AllelePair<PetalShape>): PetalShape {
  return dominantShape(pair.a, pair.b)
}
export function expressedCenter(pair: AllelePair<CenterType>): CenterType {
  return dominantCenter(pair.a, pair.b)
}
/** Numeric traits use the average of both alleles (incomplete dominance) */
export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
}
/** Gradient: no-gradient is dominant. Gradient only shows if BOTH alleles carry it. */
export function expressedGradient(pair: AllelePair<HSLColor | null>): HSLColor | null {
  if (pair.a !== null && pair.b !== null) return pair.a
  return null
}
