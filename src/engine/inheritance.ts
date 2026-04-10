import { clamp, jitter, MUTATION_CHANCE, pick, randomColorForBucket, GRADIENT_ALLELE_KEEP_CHANCE, randomGradient, quantizeColor } from './genetics';
import { type AllelePair, type HSLColor } from '../model/plant';
import { COLOR_BUCKET_DOMINANCE } from "./genetic.utils";

// ─── Allele inheritance ───────────────────────────────────────────────────────
function inheritAllele<T>(parentA: AllelePair<T>, parentB: AllelePair<T>): AllelePair<T> {
  return {
    a: Math.random() < 0.5 ? parentA.a : parentA.b,
    b: Math.random() < 0.5 ? parentB.a : parentB.b,
  };
}

export function inheritNumber(
  parentA: AllelePair<number>,
  parentB: AllelePair<number>,
  min: number,
  max: number,
  jitterRange: number): AllelePair<number> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: clamp(jitter(raw.a, jitterRange), min, max),
    b: clamp(jitter(raw.b, jitterRange), min, max),
  };
}

export function inheritDiscrete<T>(
  parentA: AllelePair<T>,
  parentB: AllelePair<T>,
  options: T[]): AllelePair<T> {
  const raw = inheritAllele(parentA, parentB);
  return {
    a: Math.random() < MUTATION_CHANCE ? pick(options) : raw.a,
    b: Math.random() < MUTATION_CHANCE ? pick(options) : raw.b,
  };
}

/**
 * Color inheritance.
 *
 * Since all palette colors are fixed (s=0 for achromatic, s=90 for chromatic),
 * we can't simply jitter h/s/l — that would produce off-palette colors.
 *
 * Strategy:
 *   - No mutation: inherit the allele exactly (palette color passes through unchanged).
 *   - Mutation: jump to a random color from a random bucket (via randomColorForBucket).
 *
 * The "hue drift" / "adjacent hue" effect that jitter previously provided is
 * intentionally removed: every plant color is now a crisp palette entry.
 */
export function inheritColor(
  parentA: AllelePair<HSLColor>,
  parentB: AllelePair<HSLColor>): AllelePair<HSLColor> {
  const raw = inheritAllele(parentA, parentB);
  const mutateA = Math.random() < MUTATION_CHANCE;
  const mutateB = Math.random() < MUTATION_CHANCE;
  return {
    a: mutateA
      ? randomColorForBucket(pick([...COLOR_BUCKET_DOMINANCE]))
      : raw.a,   // exact palette color — no jitter
    b: mutateB
      ? randomColorForBucket(pick([...COLOR_BUCKET_DOMINANCE]))
      : raw.b,
  };
}

export function inheritGradient(
  parentA: AllelePair<HSLColor | null>,
  parentB: AllelePair<HSLColor | null>,
  childColorPair: AllelePair<HSLColor>): AllelePair<HSLColor | null> {
  const raw = inheritAllele(parentA, parentB);

  const resolveAllele = (allele: HSLColor | null, baseColor: HSLColor): HSLColor | null => {
    if (allele !== null) {
      // Keep the gradient allele with its existing palette color (no jitter)
      return Math.random() < GRADIENT_ALLELE_KEEP_CHANCE ? allele : null;
    } else {
      return Math.random() < 0.06
        ? randomGradient(baseColor.h, baseColor.s, baseColor.l)
        : null;
    }
  };

  return {
    a: resolveAllele(raw.a, childColorPair.a),
    b: resolveAllele(raw.b, childColorPair.b),
  };
}
