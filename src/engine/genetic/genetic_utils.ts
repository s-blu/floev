import { ColorBucket, PALETTE_HUE_RANGES } from "../../model/genetic_model";
import { PetalShape, CenterType, HSLColor, AllelePair, ChromaticL, PetalEffect, StemTypes } from "../../model/plant";
import { dominantShape, dominantCenter, dominantHue, dominantLightness, dominantEffect } from "./dominance_utils";
import { PALETTE_S } from '../../model/genetic_model';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT } from '../../model/genetic_model';

const RARE_SHAPES: PetalShape[] = ['wavy', 'zickzack'];
const RARE_EFFECTS: PetalEffect[] = ['shimmer', 'iridescent'];
const GRAY_HUES = [ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT];


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

  if (h === ACHROMATIC_HUE_WHITE)      return { h: 1, s: 0, l: 100 }
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return { h: 2, s: 0, l: 10  }
  if (h === ACHROMATIC_HUE_GRAY_MID)   return { h: 2, s: 0, l: 40  }
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return { h: 2, s: 0, l: 70  }

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
export function expressedStem(pair: AllelePair<StemTypes>): StemTypes {
  return pair.a;
}

/** Numeric traits use the average of both alleles (incomplete dominance). */
export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
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

// ─── Rare recessive carrier detection ────────────────────────────────────────

/**
 * Returns true if the plant carries at least one rare allele that is not
 * currently expressed (i.e., masked by a more dominant allele).
 * Rare traits: wavy/zickzack shapes, stamen center, gray colors, shimmer/iridescent effects.
 */
export function hasHiddenRareTrait(plant: import('../../model/plant').Plant): boolean {
  const exprShape = expressedShape(plant.petalShape);
  if (!RARE_SHAPES.includes(exprShape)) {
    if (RARE_SHAPES.includes(plant.petalShape.a) || RARE_SHAPES.includes(plant.petalShape.b)) return true;
  }

  const exprCenter = expressedCenter(plant.centerType);
  if (exprCenter !== 'stamen') {
    if (plant.centerType.a === 'stamen' || plant.centerType.b === 'stamen') return true;
  }

  const exprHue = expressedHue(plant.petalHue);
  if (!GRAY_HUES.includes(exprHue)) {
    if (GRAY_HUES.includes(plant.petalHue.a) || GRAY_HUES.includes(plant.petalHue.b)) return true;
  }

  const exprEffect = expressedEffect(plant.petalEffect);
  if (!RARE_EFFECTS.includes(exprEffect)) {
    if (RARE_EFFECTS.includes(plant.petalEffect.a) || RARE_EFFECTS.includes(plant.petalEffect.b)) return true;
  }

  return false;
}

// ─── Homozygosity ─────────────────────────────────────────────────────────────

export function isHomozygous(plant: import('../../model/plant').Plant): boolean {
  if (plant.petalShape.a     !== plant.petalShape.b)     return false
  if (plant.centerType.a     !== plant.centerType.b)     return false
  if (plant.petalHue.a       !== plant.petalHue.b)       return false
  if (plant.petalLightness.a !== plant.petalLightness.b) return false
  if (plant.petalEffect.a    !== plant.petalEffect.b)    return false

  const NUM_TOL = 0.12
  if (Math.abs(plant.stemHeight.a - plant.stemHeight.b) > NUM_TOL) return false
  if (Math.abs(plant.petalCount.a - plant.petalCount.b) > 1.0)     return false

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
