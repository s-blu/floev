import {
  clamp, jitter, MUTATION_CHANCE, pick,
  GRADIENT_ALLELE_KEEP_CHANCE, randomGradient, quantizeColor,
  randomHueForBucket, randomLightnessAllele, PALETTE_S,
} from './genetic';
import { type AllelePair, type HSLColor, type ChromaticL } from '../model/plant';
import { COLOR_BUCKET_DOMINANCE, LIGHTNESS_DOMINANCE } from "./genetic_utils";

// ─── Generic allele inheritance ───────────────────────────────────────────────

function inheritAllele<T>(parentA: AllelePair<T>, parentB: AllelePair<T>): AllelePair<T> {
  return {
    a: Math.random() < 0.5 ? parentA.a : parentA.b,
    b: Math.random() < 0.5 ? parentB.a : parentB.b,
  };
}

// ─── Numeric traits ───────────────────────────────────────────────────────────

export function inheritNumber(
  parentA: AllelePair<number>,
  parentB: AllelePair<number>,
  min: number,
  max: number,
  jitterRange: number,
): AllelePair<number> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: clamp(jitter(raw.a, jitterRange), min, max),
    b: clamp(jitter(raw.b, jitterRange), min, max),
  };
}

// ─── Discrete traits (shape, centerType) ─────────────────────────────────────

export function inheritDiscrete<T>(
  parentA: AllelePair<T>,
  parentB: AllelePair<T>,
  options: T[],
): AllelePair<T> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: Math.random() < MUTATION_CHANCE ? pick(options) : raw.a,
    b: Math.random() < MUTATION_CHANCE ? pick(options) : raw.b,
  };
}

// ─── Hue locus ────────────────────────────────────────────────────────────────
//
// Hue is a discrete trait with bucket-based dominance (same as before).
// Mutation → jump to a random hue from a random colour bucket.

export function inheritHue(
  parentA: AllelePair<number>,
  parentB: AllelePair<number>,
): AllelePair<number> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: Math.random() < MUTATION_CHANCE
      ? randomHueForBucket(pick([...COLOR_BUCKET_DOMINANCE]))
      : raw.a,
    b: Math.random() < MUTATION_CHANCE
      ? randomHueForBucket(pick([...COLOR_BUCKET_DOMINANCE]))
      : raw.b,
  };
}

// ─── Lightness locus ──────────────────────────────────────────────────────────
//
// Lightness is a discrete Mendelian trait: 30 | 60 | 90.
// Dominance order: 30 > 60 > 90.
// Mutation → jump to a random lightness level.

export function inheritLightness(
  parentA: AllelePair<ChromaticL>,
  parentB: AllelePair<ChromaticL>,
): AllelePair<ChromaticL> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: Math.random() < MUTATION_CHANCE
      ? pick([...LIGHTNESS_DOMINANCE])
      : raw.a,
    b: Math.random() < MUTATION_CHANCE
      ? pick([...LIGHTNESS_DOMINANCE])
      : raw.b,
  };
}

// ─── Gradient ─────────────────────────────────────────────────────────────────

export function inheritGradient(
  parentA: AllelePair<HSLColor | null>,
  parentB: AllelePair<HSLColor | null>,
  childHuePair: AllelePair<number>,
  childLightnessPair: AllelePair<ChromaticL>,
): AllelePair<HSLColor | null> {
  const raw = inheritAllele(parentA, parentB);

  const resolveAllele = (allele: HSLColor | null, baseH: number, baseL: number): HSLColor | null => {
    if (allele !== null) {
      return Math.random() < GRADIENT_ALLELE_KEEP_CHANCE ? allele : null;
    } else {
      return Math.random() < 0.06
        ? randomGradient(baseH < 0 ? 0 : baseH, PALETTE_S, baseL)
        : null;
    }
  };

  return {
    a: resolveAllele(raw.a, childHuePair.a, childLightnessPair.a),
    b: resolveAllele(raw.b, childHuePair.b, childLightnessPair.b),
  };
}
