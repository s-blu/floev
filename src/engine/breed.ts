import { uid, MIN_STEM_HEIGHT, clamp, PETAL_SHAPES, CENTER_TYPES } from './genetics';
import { inheritColor, inheritGradient, inheritNumber, inheritDiscrete } from './inheritance';
import { type Plant, type PlantPhase, type BreedEstimate, expressedColor, expressedNumber, expressedShape, type PetalShape, expressedGradient } from '../model/plant';

// ─── Breeding ────────────────────────────────────────────────────────────────

export function breedPlants(a: Plant, b: Plant): Plant {
  const petalColor = inheritColor(a.petalColor, b.petalColor);
  const gradientColor = inheritGradient(a.gradientColor, b.gradientColor, petalColor);

  return {
    id: uid(),
    stemHeight: inheritNumber(a.stemHeight, b.stemHeight, MIN_STEM_HEIGHT, 1.0, 0.08),
    petalCount: {
      a: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).a), 3, 8),
      b: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).b), 3, 8),
    },
    petalShape: inheritDiscrete(a.petalShape, b.petalShape, PETAL_SHAPES),
    petalColor,
    gradientColor,
    centerType: inheritDiscrete(a.centerType, b.centerType, CENTER_TYPES),
    centerColor: inheritColor(a.centerColor, b.centerColor),
    phase: 1 as PlantPhase,
    generation: Math.max(a.generation ?? 0, b.generation ?? 0) + 1,
    parentIds: [a.id, b.id],
  };
}
// ─── Breeding estimate ───────────────────────────────────────────────────────

export function computeBreedEstimate(a: Plant, b: Plant): BreedEstimate {
  const samples: Plant[] = [];
  for (let i = 0; i < 20; i++) samples.push(breedPlants(a, b));

  const expressed = samples.map(p => expressedColor(p.petalColor));
  const hues = expressed.map(c => c.h);
  const avgH = hues.reduce((s, v) => s + v, 0) / hues.length;
  const pCounts = samples.map(p => Math.round(expressedNumber(p.petalCount)));

  const shapeMap: Record<string, number> = {};
  samples.forEach(p => {
    const s = expressedShape(p.petalShape);
    shapeMap[s] = (shapeMap[s] ?? 0) + 1;
  });
  const likelyShape = Object.entries(shapeMap).sort((a, b) => b[1] - a[1])[0][0] as PetalShape;

  const gradCount = samples.filter(p => expressedGradient(p.gradientColor) !== null).length;
  const avgS = expressed.reduce((s, c) => s + c.s, 0) / expressed.length;
  const avgL = expressed.reduce((s, c) => s + c.l, 0) / expressed.length;

  return {
    midH: avgH,
    minH: (avgH + 360 - 22) % 360,
    maxH: (avgH + 22) % 360,
    minP: Math.min(...pCounts),
    maxP: Math.max(...pCounts),
    likelyShape,
    gradPct: Math.round((gradCount / samples.length) * 100),
    avgS,
    avgL,
  };
}
