import { ColorBucket, PALETTE_HUE_RANGES } from "../../model/genetic_model";
import { PetalShape, CenterType, HSLColor, AllelePair, ChromaticL } from "../../model/plant";
import { dominantShape, dominantCenter, dominantHue, dominantLightness } from "./dominance_utils";
import { PALETTE_S } from '../../model/genetic_model';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT } from '../../model/genetic_model';


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
  if (PALETTE_HUE_RANGES.yellowgreen(h)) return 'yellowgreen'
  if (PALETTE_HUE_RANGES.red(h))    return 'red'
  if (PALETTE_HUE_RANGES.blue(h))   return 'blue'
  if (PALETTE_HUE_RANGES.purple(h)) return 'purple'
  if (PALETTE_HUE_RANGES.pink(h))   return 'pink'
  return 'blue'
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
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return { h: 0,   s: 0, l: 10  }
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

/**
 * Gradient is expressed only when BOTH alleles are true (recessive-recessive).
 * Returns true when the plant shows the gradient phenotype.
 */
export function expressedGradient(pair: AllelePair<boolean>): boolean {
  return pair.a === true && pair.b === true
}

/** Expressed lightness phenotype from an AllelePair. */
export function expressedLightness(pair: AllelePair<ChromaticL>): ChromaticL {
  if (!pair) return 30; // TODO quickfix; this gets called with undefined, find out why
  return dominantLightness(pair.a, pair.b)
}

// ─── Homozygosity ─────────────────────────────────────────────────────────────

/**
 * Returns true if ALL genetically meaningful loci of a plant are homozygous
 * (both alleles identical). Used to show the "pure line" indicator.
 *
 * Numeric loci (stemHeight, petalCount) are considered homozygous when their
 * alleles are within a small tolerance, since they carry continuous jitter.
 */
export function isHomozygous(plant: import('../../model/plant').Plant): boolean {
  // Discrete loci — must be strictly equal
  if (plant.petalShape.a    !== plant.petalShape.b)    return false
  if (plant.centerType.a    !== plant.centerType.b)    return false
  if (plant.petalHue.a      !== plant.petalHue.b)      return false
  if (plant.petalLightness.a !== plant.petalLightness.b) return false

  // Gradient locus
  if (plant.hasGradient.a !== plant.hasGradient.b) return false

  // Numeric loci — allow small tolerance (jitter artefacts)
  const NUM_TOL = 0.12
  if (Math.abs(plant.stemHeight.a  - plant.stemHeight.b)  > NUM_TOL) return false
  if (Math.abs(plant.petalCount.a  - plant.petalCount.b)  > 1.0)     return false

  return true
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
