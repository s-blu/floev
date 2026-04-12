import { uid, MIN_STEM_HEIGHT, clamp, PETAL_SHAPES, CENTER_TYPES, MUTATION_CHANCE } from './genetics';
import { inheritHue, inheritLightness, inheritGradient, inheritNumber, inheritDiscrete } from './inheritance';
import { type Plant, type PlantPhase, type BreedEstimate, type PetalShape, type CenterType } from '../model/plant';
import {
  expressedColor, expressedNumber, expressedShape, expressedGradient,
  dominantShape, dominantCenter, CENTER_COLORS
} from "./genetic.utils";
// ─── Breeding ────────────────────────────────────────────────────────────────

export function breedPlants(a: Plant, b: Plant): Plant {
  const petalHue       = inheritHue(a.petalHue, b.petalHue);
  const petalLightness = inheritLightness(a.petalLightness, b.petalLightness);
  const gradientColor  = inheritGradient(a.gradientColor, b.gradientColor, petalHue, petalLightness);

  return {
    id: uid(),
    stemHeight: inheritNumber(a.stemHeight, b.stemHeight, MIN_STEM_HEIGHT, 1.0, 0.08),
    petalCount: {
      a: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).a), 3, 8),
      b: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).b), 3, 8),
    },
    petalShape:      inheritDiscrete(a.petalShape, b.petalShape, PETAL_SHAPES),
    petalHue,
    petalLightness,
    gradientColor,
    centerType: inheritDiscrete(a.centerType, b.centerType, CENTER_TYPES),
    centerColor: inheritColor_centerColor(a, b),
    phase: 1 as PlantPhase,
    generation: Math.max(a.generation ?? 0, b.generation ?? 0) + 1,
    parentIds: [a.id, b.id],
  };
}

// centerColor still uses the old full-HSLColor inheritance (unchanged)
function inheritColor_centerColor(a: Plant, b: Plant) {
  const raw = {
    a: Math.random() < 0.5 ? a.centerColor.a : a.centerColor.b,
    b: Math.random() < 0.5 ? b.centerColor.a : b.centerColor.b,
  };
  return {
    a: Math.random() < MUTATION_CHANCE ? randomCenterColorMutation() : raw.a,
    b: Math.random() < MUTATION_CHANCE ? randomCenterColorMutation() : raw.b,
  };
}


function randomCenterColorMutation() {
  return CENTER_COLORS[Math.floor(Math.random() * CENTER_COLORS.length)];
}

// ─── Analytical probability helpers ──────────────────────────────────────────

/**
 * Computes exact phenotype probabilities for a discrete trait.
 *
 * For each of the 4 equally-likely allele-pair combinations
 * (parentA.a|b × parentB.a|b) we enumerate:
 *   - no mutation on either allele  (prob (1-m)²)
 *   - mutation on allele A only     (prob m(1-m)) → uniform over options
 *   - mutation on allele B only     (prob (1-m)m) → uniform over options
 *   - mutation on both              (prob m²)     → uniform over options²
 *
 * The expressed phenotype is determined by the dominance function.
 */
function discreteProbabilities<T>(
  parentA: { a: T; b: T },
  parentB: { a: T; b: T },
  options: T[],
  dominanceFn: (a: T, b: T) => T,
): Map<T, number> {
  const m = MUTATION_CHANCE
  const counts = new Map<T, number>()

  const alleleCombs: [T, T][] = [
    [parentA.a, parentB.a],
    [parentA.a, parentB.b],
    [parentA.b, parentB.a],
    [parentA.b, parentB.b],
  ]

  for (const [allA, allB] of alleleCombs) {
    // Case 1: no mutation
    const noMut = dominanceFn(allA, allB)
    counts.set(noMut, (counts.get(noMut) ?? 0) + (1 - m) * (1 - m))

    // Case 2: allele A mutates, B stays
    const pA = m * (1 - m)
    for (const opt of options) {
      const e = dominanceFn(opt, allB)
      counts.set(e, (counts.get(e) ?? 0) + pA / options.length)
    }

    // Case 3: allele B mutates, A stays
    const pB = (1 - m) * m
    for (const opt of options) {
      const e = dominanceFn(allA, opt)
      counts.set(e, (counts.get(e) ?? 0) + pB / options.length)
    }

    // Case 4: both mutate
    const pBoth = m * m
    for (const oA of options) {
      for (const oB of options) {
        const e = dominanceFn(oA, oB)
        counts.set(e, (counts.get(e) ?? 0) + pBoth / (options.length * options.length))
      }
    }
  }

  // Normalize: divide by 4 allele combinations
  const result = new Map<T, number>()
  for (const [k, v] of counts) {
    result.set(k, v / 4)
  }
  return result
}

// ─── Breeding estimate ────────────────────────────────────────────────────────

export function computeBreedEstimate(a: Plant, b: Plant): BreedEstimate {
  // Shape probabilities (analytical)
  const shapeProbMap = discreteProbabilities(a.petalShape, b.petalShape, PETAL_SHAPES, dominantShape)
  const shapeProbs: { shape: PetalShape; pct: number }[] = PETAL_SHAPES
    .map(s => ({ shape: s, pct: Math.round((shapeProbMap.get(s) ?? 0) * 100) }))
    .filter(x => x.pct > 0)
    .sort((x, y) => y.pct - x.pct)

  // Center type probabilities (analytical)
  const centerProbMap = discreteProbabilities(a.centerType, b.centerType, CENTER_TYPES, dominantCenter)
  const centerProbs: { center: CenterType; pct: number }[] = CENTER_TYPES
    .map(c => ({ center: c, pct: Math.round((centerProbMap.get(c) ?? 0) * 100) }))
    .filter(x => x.pct > 0)
    .sort((x, y) => y.pct - x.pct)

  // Petal count range
  const midCount = (expressedNumber(a.petalCount) + expressedNumber(b.petalCount)) / 2
  const minP = Math.max(3, Math.round(midCount - 1.5))
  const maxP = Math.min(8, Math.round(midCount + 1.5))

  // Sample 30 children for realistic colour spread
  const samples: Plant[] = Array.from({ length: 30 }, () => breedPlants(a, b))
  const expressed = samples.map(p => expressedColor(p.petalHue, p.petalLightness))
  const hues = expressed.map(c => c.h)
  const avgH = hues.reduce((s, v) => s + v, 0) / hues.length
  const avgS = expressed.reduce((s, c) => s + c.s, 0) / expressed.length
  const avgL = expressed.reduce((s, c) => s + c.l, 0) / expressed.length

  const gradCount = samples.filter(p => expressedGradient(p.gradientColor) !== null).length

  return {
    midH: avgH,
    minH: (avgH + 338) % 360,
    maxH: (avgH + 22) % 360,
    minP,
    maxP,
    likelyShape: shapeProbs[0]?.shape ?? expressedShape(a.petalShape),
    shapeProbs,
    centerProbs,
    gradPct: Math.round((gradCount / samples.length) * 100),
    avgS,
    avgL,
  }
}
