import { uid } from './genetic/genetic_utils';
import { MIN_STEM_HEIGHT, CENTER_TYPES, MUTATION_CHANCE, PETAL_EFFECTS } from '../model/genetic_model';
import { PETAL_SHAPES } from '../model/genetic_model';
import { inheritHue, inheritLightness, inheritEffect, inheritNumber, inheritDiscrete } from './genetic/inheritance';
import { type Plant, type PlantPhase, type BreedEstimate, type PetalShape, type CenterType, type PetalEffect, type PetalCount } from '../model/plant';
import { expressedColor, expressedShape } from "./genetic/genetic_utils";
import { dominantShape, dominantCenter, dominantEffect, dominantPetalCount } from "./genetic/dominance_utils";
import { PETAL_COUNTS } from './discovery_utils';

// ─── Cross-breeding ───────────────────────────────────────────────────────────

export function breedPlants(a: Plant, b: Plant): Plant {
  return {
    id: uid(),
    stemHeight: inheritNumber(a.stemHeight, b.stemHeight, MIN_STEM_HEIGHT, 1.0, 0.08),
    petalCount:     inheritDiscrete(a.petalCount, b.petalCount, [...PETAL_COUNTS] as PetalCount[]),
    petalShape:     inheritDiscrete(a.petalShape, b.petalShape, PETAL_SHAPES),
    petalHue:       inheritHue(a.petalHue, b.petalHue),
    petalLightness: inheritLightness(a.petalLightness, b.petalLightness),
    petalEffect:    inheritEffect(a.petalEffect, b.petalEffect),
    centerType:     inheritDiscrete(a.centerType, b.centerType, CENTER_TYPES),
    stem: a.stem,
    phase: 1 as PlantPhase,
    generation: Math.max(a.generation ?? 0, b.generation ?? 0) + 1,
    parentIds: [a.id, b.id],
  };
}

// ─── Self-pollination ─────────────────────────────────────────────────────────

export function selfPollinateePlant(plant: Plant): Plant {
  return {
    id: uid(),
    stemHeight: inheritNumber(plant.stemHeight, plant.stemHeight, MIN_STEM_HEIGHT, 1.0, 0.08),
    petalCount:     inheritDiscrete(plant.petalCount, plant.petalCount, [...PETAL_COUNTS] as PetalCount[]),
    petalShape:     inheritDiscrete(plant.petalShape,  plant.petalShape,  PETAL_SHAPES),
    petalHue:       inheritHue(plant.petalHue, plant.petalHue),
    petalLightness: inheritLightness(plant.petalLightness, plant.petalLightness),
    petalEffect:    inheritEffect(plant.petalEffect, plant.petalEffect),
    centerType:     inheritDiscrete(plant.centerType,  plant.centerType,  CENTER_TYPES),
    phase: 1 as PlantPhase,
    stem: plant.stem,
    generation: (plant.generation ?? 0) + 1,
    parentIds: [plant.id, plant.id],
  };
}

// ─── Analytical probability helpers ──────────────────────────────────────────

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
    const noMut = dominanceFn(allA, allB)
    counts.set(noMut, (counts.get(noMut) ?? 0) + (1 - m) * (1 - m))

    const pA = m * (1 - m)
    for (const opt of options) {
      const e = dominanceFn(opt, allB)
      counts.set(e, (counts.get(e) ?? 0) + pA / options.length)
    }

    const pB = (1 - m) * m
    for (const opt of options) {
      const e = dominanceFn(allA, opt)
      counts.set(e, (counts.get(e) ?? 0) + pB / options.length)
    }

    const pBoth = m * m
    for (const oA of options) {
      for (const oB of options) {
        const e = dominanceFn(oA, oB)
        counts.set(e, (counts.get(e) ?? 0) + pBoth / (options.length * options.length))
      }
    }
  }

  const result = new Map<T, number>()
  for (const [k, v] of counts) {
    result.set(k, v / 4)
  }
  return result
}

// ─── Breeding estimate ────────────────────────────────────────────────────────

export function computeBreedEstimate(a: Plant, b: Plant): BreedEstimate {
  const shapeProbMap = discreteProbabilities(a.petalShape, b.petalShape, PETAL_SHAPES, dominantShape)
  const shapeProbs: { shape: PetalShape; pct: number }[] = PETAL_SHAPES
    .map(s => ({ shape: s, pct: Math.round((shapeProbMap.get(s) ?? 0) * 100) }))
    .filter(x => x.pct > 0)
    .sort((x, y) => y.pct - x.pct)

  const centerProbMap = discreteProbabilities(a.centerType, b.centerType, CENTER_TYPES, dominantCenter)
  const centerProbs: { center: CenterType; pct: number }[] = CENTER_TYPES
    .map(c => ({ center: c, pct: Math.round((centerProbMap.get(c) ?? 0) * 100) }))
    .filter(x => x.pct > 0)
    .sort((x, y) => y.pct - x.pct)

  const effectProbMap = discreteProbabilities(a.petalEffect, b.petalEffect, PETAL_EFFECTS, dominantEffect)
  const effectProbs: { effect: PetalEffect; pct: number }[] = PETAL_EFFECTS
    .map(e => ({ effect: e, pct: Math.round((effectProbMap.get(e) ?? 0) * 100) }))
    .filter(x => x.pct > 0)
    .sort((x, y) => y.pct - x.pct)

  const countProbMap = discreteProbabilities(a.petalCount, b.petalCount, [...PETAL_COUNTS] as PetalCount[], dominantPetalCount)
  const possibleCounts = ([...PETAL_COUNTS] as PetalCount[]).filter(c => (countProbMap.get(c) ?? 0) > 0)
  const minP: PetalCount = possibleCounts[0] ?? 3
  const maxP: PetalCount = possibleCounts[possibleCounts.length - 1] ?? 7

  const samples: Plant[] = Array.from({ length: 30 }, () => breedPlants(a, b))
  const expressed = samples.map(p => expressedColor(p.petalHue, p.petalLightness))
  const hues = expressed.map(c => c.h)
  const avgH = hues.reduce((s, v) => s + v, 0) / hues.length
  const avgS = expressed.reduce((s, c) => s + c.s, 0) / expressed.length
  const avgL = expressed.reduce((s, c) => s + c.l, 0) / expressed.length

  // gradPct kept for breedestimate_ui compatibility
  const gradPct = Math.round((effectProbMap.get('gradient') ?? 0) * 100)

  const parentAHues: [number, number]      = [a.petalHue.a, a.petalHue.b]
  const parentBHues: [number, number]      = [b.petalHue.a, b.petalHue.b]
  const parentALightness: [number, number] = [a.petalLightness.a, a.petalLightness.b]
  const parentBLightness: [number, number] = [b.petalLightness.a, b.petalLightness.b]

  return {
    midH: avgH,
    minH: (avgH + 338) % 360,
    maxH: (avgH + 22)  % 360,
    minP,
    maxP,
    likelyShape: shapeProbs[0]?.shape ?? expressedShape(a.petalShape),
    shapeProbs,
    centerProbs,
    effectProbs,
    gradPct,
    avgS,
    avgL,
    parentAHues,
    parentBHues,
    parentALightness,
    parentBLightness,
  }
}
