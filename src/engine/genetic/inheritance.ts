import {
  randomHueForBucket, randomLightnessAllele,
} from './genetic';
import { clamp, jitter, pick } from './genetic_utils';
import { MUTATION_CHANCE, GRADIENT_ALLELE_KEEP_CHANCE, GRADIENT_ALLELE_GAIN_CHANCE } from '../../model/genetic_model';
import { type AllelePair, type ChromaticL } from '../../model/plant';
import { COLOR_BUCKET_DOMINANCE, LIGHTNESS_DOMINANCE } from "../../model/dominance";

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
// Hue is a discrete trait with bucket-based dominance.
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

// ─── Gradient locus ───────────────────────────────────────────────────────────
//
// hasGradient is a boolean allele pair.
// Expressed only when BOTH alleles are true (recessive phenotype — rare).
// - A true allele has GRADIENT_ALLELE_KEEP_CHANCE of staying true.
// - A false allele has GRADIENT_ALLELE_GAIN_CHANCE of flipping to true.

export function inheritGradient(
  parentA: AllelePair<boolean>,
  parentB: AllelePair<boolean>,
): AllelePair<boolean> {
  const raw = inheritAllele(parentA, parentB);

  const resolveAllele = (allele: boolean): boolean => {
    if (allele) {
      return Math.random() < GRADIENT_ALLELE_KEEP_CHANCE;
    } else {
      return Math.random() < GRADIENT_ALLELE_GAIN_CHANCE;
    }
  };

  return {
    a: resolveAllele(raw.a),
    b: resolveAllele(raw.b),
  };
}
