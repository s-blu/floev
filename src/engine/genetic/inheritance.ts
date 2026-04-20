import {
  randomHueForBucket
} from './genetic';
import { clamp, jitter, pick } from './genetic_utils';
import { MUTATION_CHANCE, PETAL_EFFECTS } from '../../model/genetic_model';
import { type AllelePair, type ChromaticL, type PetalEffect } from '../../model/plant';
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

// ─── Effect locus ─────────────────────────────────────────────────────────────
//
// Replaces the old boolean hasGradient locus.
// Standard Mendelian inheritance with MUTATION_CHANCE to any effect.
// Rarer effects (shimmer, crystalline, iridescent) are naturally uncommon
// because they are underrepresented in the allele pool and are recessive
// against everything more dominant.

export function inheritEffect(
  parentA: AllelePair<PetalEffect>,
  parentB: AllelePair<PetalEffect>,
): AllelePair<PetalEffect> {
  return inheritDiscrete(parentA, parentB, PETAL_EFFECTS);
}
