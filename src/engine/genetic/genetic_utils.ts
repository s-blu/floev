import { ColorBucket, PALETTE_HUE_RANGES } from "../../model/genetic_model";
import { PetalShape, CenterType, HSLColor, AllelePair, ChromaticL, PetalEffect, StemTypes, PetalCount } from "../../model/plant";
import { dominantShape, dominantCenter, dominantHue, dominantLightness, dominantEffect, dominantPetalCount } from "./dominance_utils";
import { PALETTE_S } from '../../model/genetic_model';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY } from '../../model/genetic_model';


// ─── Hue / achromatic helpers ─────────────────────────────────────────────────

/** Returns true when hue is one of the special achromatic sentinel values. */
export function isAchromaticHue(h: number): boolean {
  return h === ACHROMATIC_HUE_WHITE || h === ACHROMATIC_HUE_GRAY
}

/** Classify a chromatic hue number into a ColorBucket. */
export function hueBucket(h: number): ColorBucket {
  if (h === ACHROMATIC_HUE_WHITE) return 'white'
  if (h === ACHROMATIC_HUE_GRAY)  return 'gray'
  if (PALETTE_HUE_RANGES.yellowgreen(h)) return 'yellowgreen'
  if (PALETTE_HUE_RANGES.red(h))         return 'red'
  if (PALETTE_HUE_RANGES.blue(h))        return 'blue'
  if (PALETTE_HUE_RANGES.purple(h))      return 'purple'
  if (PALETTE_HUE_RANGES.pink(h))        return 'pink'
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

// ─── expressedColor ───────────────────────────────────────────────────────────

export function expressedColor(
  huePair: AllelePair<number>,
  lightnessPair: AllelePair<ChromaticL>,
): HSLColor {
  const h = expressedHue(huePair)

  if (h === ACHROMATIC_HUE_WHITE) return { h: 1, s: 0, l: 100 }

  const l = expressedLightness(lightnessPair)
  if (h === ACHROMATIC_HUE_GRAY)  return { h: 2, s: 0, l }
  return { h, s: PALETTE_S, l }
}

// ─── Other expressed-phenotype helpers ───────────────────────────────────────

export function expressedShape(pair: AllelePair<PetalShape>): PetalShape {
  return dominantShape(pair.a, pair.b)
}
export function expressedCenter(pair: AllelePair<CenterType>): CenterType {
  return dominantCenter(pair.a, pair.b)
}
export function expressedStem(pair: AllelePair<StemTypes>): StemTypes {
  return pair.a;
}

/** Numeric traits use the average of both alleles (incomplete dominance). */
export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
}

/** Expressed petal count: kleinste Zahl dominiert (3 > 5 > 7). */
export function expressedPetalCount(pair: AllelePair<PetalCount>): PetalCount {
  return dominantPetalCount(pair.a, pair.b)
}

/** Returns the expressed petal effect (most dominant allele wins). */
export function expressedEffect(pair: AllelePair<PetalEffect>): PetalEffect {
  if (!pair) return 'none';
  return dominantEffect(pair.a, pair.b)
}

/**
 * Convenience: returns true when the expressed effect is 'gradient'.
 * Used by rarity, achievements and the breed estimate for backwards compat.
 * For new code, prefer expressedEffect() directly.
 */
export function expressedGradient(pair: AllelePair<PetalEffect>): boolean {
  return expressedEffect(pair) === 'gradient'
}

/** Expressed lightness phenotype from an AllelePair. */
export function expressedLightness(pair: AllelePair<ChromaticL>): ChromaticL {
  if (!pair) return 30;
  return dominantLightness(pair.a, pair.b)
}


// ─── Homozygosity ─────────────────────────────────────────────────────────────

export function isHomozygous(plant: import('../../model/plant').Plant): boolean {
  if (plant.petalShape.a     !== plant.petalShape.b)     return false
  if (plant.centerType.a     !== plant.centerType.b)     return false
  if (plant.petalHue.a       !== plant.petalHue.b)       return false
  if (plant.petalLightness.a !== plant.petalLightness.b) return false
  if (plant.petalEffect.a    !== plant.petalEffect.b)    return false

  if (plant.petalCount.a !== plant.petalCount.b) return false

  const NUM_TOL = 0.12
  if (Math.abs(plant.stemHeight.a - plant.stemHeight.b) > NUM_TOL) return false

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
