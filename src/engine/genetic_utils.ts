import { PetalShape, CenterType, HSLColor, AllelePair, ChromaticL } from "../model/plant";
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S } from "./genetic";

// ─── Dominance helpers ────────────────────────────────────────────────────────

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']
export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen']

/**
 * Color dominance buckets — used for the HUE locus only.
 * "white" and "gray" are achromatic sentinels encoded in petalHue.
 */
export type ColorBucket = 'white' | 'yellow' | 'red' | 'pink' | 'purple' | 'blue' | 'green' | 'gray'
export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'pink', 'purple', 'blue', 'green', 'gray',
]

export const PALETTE_HUE_RANGES = {
  yellow: (hue: number): boolean => 35 < hue && hue <= 60,
  red:    (hue: number): boolean => hue <= 35 || hue > 345,
  green:  (hue: number): boolean => 60 < hue && hue <= 155,
  blue:   (hue: number): boolean => 155 < hue && hue <= 240,
  purple: (hue: number): boolean => 240 < hue && hue <= 275,
  pink:   (hue: number): boolean => 275 < hue && hue <= 345,
}

// Lower index = more dominant
export const CENTER_COLORS = [
  { h: 40,  s: 100, l: 95 }, // creme
  { h: 120, s: 50,  l: 80 }, // grün
  { h: 55,  s: 100, l: 50 }, // kräftiges gelb
  { h: 20,  s: 100, l: 65 }, // kräftiges orange
]

// ─── Lightness dominance: 30 > 60 > 90 ───────────────────────────────────────

/** The three discrete lightness levels, ordered most-dominant first. */
export const LIGHTNESS_DOMINANCE: ChromaticL[] = [30, 60, 90]

/** Return the more dominant of two lightness alleles (30 > 60 > 90). */
export function dominantLightness(a: ChromaticL, b: ChromaticL): ChromaticL {
  const ia = LIGHTNESS_DOMINANCE.indexOf(a)
  const ib = LIGHTNESS_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}

/** Expressed lightness phenotype from an AllelePair. */
export function expressedLightness(pair: AllelePair<ChromaticL>): ChromaticL {
  if (!pair) return 30; // TODO quickfix; this gets called with undefined, find out why
  return dominantLightness(pair.a, pair.b)
}

// ─── Hue / achromatic helpers ─────────────────────────────────────────────────

/** Returns true when hue is one of the special achromatic sentinel values. */
export function isAchromaticHue(h: number): boolean {
  return (
    h === ACHROMATIC_HUE_WHITE ||
    h === ACHROMATIC_HUE_GRAY_DARK ||
    h === ACHROMATIC_HUE_GRAY_MID ||
    h === ACHROMATIC_HUE_GRAY_LIGHT
  )
}

/** Classify a chromatic hue number into a ColorBucket. */
export function hueBucket(h: number): ColorBucket {
  if (h === ACHROMATIC_HUE_WHITE)      return 'white'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'gray'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'gray'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'gray'
  if (PALETTE_HUE_RANGES.yellow(h)) return 'yellow'
  if (PALETTE_HUE_RANGES.red(h))    return 'red'
  if (PALETTE_HUE_RANGES.green(h))  return 'green'
  if (PALETTE_HUE_RANGES.blue(h))   return 'blue'
  if (PALETTE_HUE_RANGES.purple(h)) return 'purple'
  if (PALETTE_HUE_RANGES.pink(h))   return 'pink'
  return 'blue'
}

/** Return the more dominant of two hue alleles. */
export function dominantHue(a: number, b: number): number {
  const ia = COLOR_BUCKET_DOMINANCE.indexOf(hueBucket(a))
  const ib = COLOR_BUCKET_DOMINANCE.indexOf(hueBucket(b))
  return ia <= ib ? a : b
}

/** Expressed hue phenotype from an AllelePair. */
export function expressedHue(pair: AllelePair<number>): number {
  if (!pair) return 0;
  return dominantHue(pair.a, pair.b)
}

// ─── colorBucket — kept for rarity.ts compatibility ──────────────────────────

/** Classify an HSLColor into a dominance bucket (used by rarity scoring). */
export function colorBucket(c: HSLColor): ColorBucket {
  if (c.s === 0) return c.l >= 95 ? 'white' : 'gray'
  return hueBucket(c.h)
}

// ─── expressedColor — assembles HSLColor from the two separate loci ───────────

/**
 * Assembles the expressed HSLColor from the two independent loci:
 *   - petalHue        → dominant hue allele wins
 *   - petalLightness  → dominant lightness allele wins (30 > 60 > 90)
 *
 * For achromatic hues (white / gray sentinels) the lightness locus is ignored
 * and the sentinel's fixed HSLColor is returned directly.
 */
export function expressedColor(
  huePair: AllelePair<number>,
  lightnessPair: AllelePair<ChromaticL>,
): HSLColor {
  const h = expressedHue(huePair)

  // Achromatic sentinels — lightness locus irrelevant
  if (h === ACHROMATIC_HUE_WHITE)      return { h: 0,   s: 0, l: 100 }
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return { h: 0,   s: 0, l: 0   }
  if (h === ACHROMATIC_HUE_GRAY_MID)   return { h: 0,   s: 0, l: 40  }
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return { h: 0,   s: 0, l: 70  }

  const l = expressedLightness(lightnessPair)
  return { h, s: PALETTE_S, l }
}

// ─── Other expressed-phenotype helpers ───────────────────────────────────────

export function expressedShape(pair: AllelePair<PetalShape>): PetalShape {
  return dominantShape(pair.a, pair.b)
}
export function expressedCenter(pair: AllelePair<CenterType>): CenterType {
  return dominantCenter(pair.a, pair.b)
}
/** Numeric traits use the average of both alleles (incomplete dominance). */
export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
}
/** Gradient: only expressed when BOTH alleles carry a gradient. */
export function expressedGradient(pair: AllelePair<HSLColor | null>): HSLColor | null {
  if (pair.a !== null && pair.b !== null) return pair.a
  return null
}

/** Return the more dominant of two petal shapes. */
export function dominantShape(a: PetalShape, b: PetalShape): PetalShape {
  const ia = PETAL_SHAPE_DOMINANCE.indexOf(a)
  const ib = PETAL_SHAPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}

/** Return the more dominant of two center types. */
export function dominantCenter(a: CenterType, b: CenterType): CenterType {
  const ia = CENTER_TYPE_DOMINANCE.indexOf(a)
  const ib = CENTER_TYPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}

// ─── Homozygosity ─────────────────────────────────────────────────────────────

/**
 * Returns true if ALL genetically meaningful loci of a plant are homozygous
 * (both alleles identical). Used to show the "pure line" indicator.
 *
 * Numeric loci (stemHeight, petalCount) are considered homozygous when their
 * alleles are within a small tolerance, since they carry continuous jitter.
 */
export function isHomozygous(plant: import('../model/plant').Plant): boolean {
  // Discrete loci — must be strictly equal
  if (plant.petalShape.a    !== plant.petalShape.b)    return false
  if (plant.centerType.a    !== plant.centerType.b)    return false
  if (plant.petalHue.a      !== plant.petalHue.b)      return false
  if (plant.petalLightness.a !== plant.petalLightness.b) return false

  // Gradient locus — both null or both non-null with same hue
  const gA = plant.gradientColor.a
  const gB = plant.gradientColor.b
  if ((gA === null) !== (gB === null)) return false
  if (gA !== null && gB !== null && gA.h !== gB.h)     return false

  // Numeric loci — allow small tolerance (jitter artefacts)
  const NUM_TOL = 0.12
  if (Math.abs(plant.stemHeight.a  - plant.stemHeight.b)  > NUM_TOL) return false
  if (Math.abs(plant.petalCount.a  - plant.petalCount.b)  > 1.0)     return false

  return true
}
