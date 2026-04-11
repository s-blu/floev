import { PetalShape, CenterType, HSLColor, AllelePair } from "../model/plant";


// ─── Dominance helpers ────────────────────────────────────────────────────────

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']
export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen']

/**
 * Color dominance buckets.
 * "white" matches s=0, l=100 (the fixed white color).
 * "gray"  matches s=0, l<100 (the three fixed gray tones).
 * All chromatic palette colors (s=90) are classified by hue range.
 */
export type ColorBucket = 'white' | 'yellow' | 'red' | 'pink' | 'purple' | 'blue' | 'green' | 'gray'
export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'pink', 'purple', 'blue','green', 'gray',
]
export const PALETTE_HUE_RANGES = {
  yellow: (hue: number): boolean => 35 < hue && hue <= 60,
  red: (hue: number): boolean => hue <= 35 || hue > 345,
  green: (hue: number): boolean => 60 < hue && hue <= 155,
  blue: (hue: number): boolean => 155 < hue && hue <= 240,
  purple: (hue: number): boolean => 240 < hue && hue <= 275,
  pink: (hue: number): boolean => 275 < hue && hue <= 345
}


// Lower index = more dominant
export const CENTER_COLORS = [
  { h: 40, s: 100, l: 95 }, // creme
  { h: 120, s: 50, l: 80 }, // grün
  { h: 55, s: 100, l: 50 }, // kräftiges gelb
  { h: 20, s: 100, l: 65 } // kräftiges orange
]

/** Classify an HSLColor into a dominance bucket */
export function colorBucket(c: HSLColor): ColorBucket {
  // Achromatic: s=0 (white and the three grays)
  if (c.s === 0) {
    return c.l >= 95 ? 'white' : 'gray'
  }
  // Chromatic palette colors (s=90): classify by hue
  const h = c.h
  if (PALETTE_HUE_RANGES.yellow(h))  return 'yellow'
  if (PALETTE_HUE_RANGES.red(h)) return 'red'
  if (PALETTE_HUE_RANGES.green(h)) return 'green'
  if (PALETTE_HUE_RANGES.blue(h)) return 'blue'
  if (PALETTE_HUE_RANGES.purple(h)) return 'purple'
  if (PALETTE_HUE_RANGES.pink(h)) return 'pink'

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
