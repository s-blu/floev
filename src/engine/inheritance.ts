import { clamp, jitter, MUTATION_CHANCE, pick, randomColorForBucket, GRADIENT_ALLELE_KEEP_CHANCE, randomGradient } from './genetics';
import { type AllelePair, type HSLColor } from '../model/plant';
import { COLOR_BUCKET_DOMINANCE } from "./genetic.util";

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
export function inheritColor(
  parentA: AllelePair<HSLColor>,
  parentB: AllelePair<HSLColor>): AllelePair<HSLColor> {
  const raw = inheritAllele(parentA, parentB);
  const mutateA = Math.random() < MUTATION_CHANCE;
  const mutateB = Math.random() < MUTATION_CHANCE;
  return {
    a: mutateA ? randomColorForBucket(pick([...COLOR_BUCKET_DOMINANCE])) : {
      h: clamp(jitter(raw.a.h, 10), 0, 359),
      s: clamp(jitter(raw.a.s, 6), 30, 100),
      l: clamp(jitter(raw.a.l, 6), 30, 78),
    },
    b: mutateB ? randomColorForBucket(pick([...COLOR_BUCKET_DOMINANCE])) : {
      h: clamp(jitter(raw.b.h, 10), 0, 359),
      s: clamp(jitter(raw.b.s, 6), 30, 100),
      l: clamp(jitter(raw.b.l, 6), 30, 78),
    },
  };
}
export function inheritGradient(
  parentA: AllelePair<HSLColor | null>,
  parentB: AllelePair<HSLColor | null>,
  childColorPair: AllelePair<HSLColor>): AllelePair<HSLColor | null> {
  const raw = inheritAllele(parentA, parentB);

  const resolveAllele = (allele: HSLColor | null, baseColor: HSLColor): HSLColor | null => {
    if (allele !== null) {
      return Math.random() < GRADIENT_ALLELE_KEEP_CHANCE
        ? { h: clamp(jitter(allele.h, 12), 0, 359), s: clamp(jitter(allele.s, 8), 25, 100), l: clamp(jitter(allele.l, 6), 20, 75) }
        : null;
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
