import type {
  Plant, HSLColor, PetalShape, PlantPhase, ChromaticL,
  CenterType,
} from '../../model/plant'
import type { ColorBucket } from "../../model/genetic_model"
import { pick, uid } from "./genetic_utils"
import {
  ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_LIGHT, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_WHITE,
  CENTER_COLORS, CENTER_TYPES,
  GRADIENT_ALLELE_CHANCE_RANDOM,
  MIN_STEM_HEIGHT, PALETTE_HUES, PALETTE_HUES_BUCKETS, PALETTE_L, PALETTE_S, SHAPE_ALLELE_POOL,
} from "../../model/genetic_model"
import { HUE_ALLELE_POOL, LIGHTNESS_ALLELE_POOL } from './dominance_utils'

export function randomPetalShapeAllele(): PetalShape {
  return SHAPE_ALLELE_POOL[Math.floor(Math.random() * SHAPE_ALLELE_POOL.length)]
}

// ─── quantizeColor (still used by legacy centerColor logic) ──────────────────

export function quantizeColor(h: number, s: number, l: number): HSLColor {
  if (s < 10) {
    if (l >= 85) return { h: 0, s: 0, l: 100 }
    if (l >= 55) return { h: 0, s: 0, l: 70 }
    if (l >= 20) return { h: 0, s: 0, l: 40 }
    return { h: 0, s: 0, l: 0 }
  }
  let bestHue = PALETTE_HUES[0]
  let bestDist = Infinity
  for (const ph of PALETTE_HUES) {
    const d = Math.min(Math.abs(h - ph), 360 - Math.abs(h - ph))
    if (d < bestDist) { bestDist = d; bestHue = ph }
  }
  let bestL = PALETTE_L[0]
  let bestLDist = Infinity
  for (const pl of PALETTE_L) {
    const d = Math.abs(l - pl)
    if (d < bestLDist) { bestLDist = d; bestL = pl }
  }
  return { h: bestHue, s: PALETTE_S, l: bestL }
}

function randomCenterColor(): HSLColor {
  const r = Math.random()
  if (r < 0.12)      return CENTER_COLORS[3]
  else if (r < 0.30) return CENTER_COLORS[2]
  else if (r < 0.55) return CENTER_COLORS[1]
  else               return CENTER_COLORS[0]
}

// ─── Random hue/lightness allele for a given ColorBucket ─────────────────────

/** Return a random chromatic hue allele for the given bucket. */
export function randomHueForBucket(bucket: ColorBucket): number {
  switch (bucket) {
    case 'white': return ACHROMATIC_HUE_WHITE
    case 'gray':  return pick([ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT])
    default:      return pick(PALETTE_HUES_BUCKETS[bucket])
  }
}

/** Return a random lightness allele (30 | 60 | 90). */
export function randomLightnessAllele(): ChromaticL {
  return pick([...PALETTE_L]) as ChromaticL
}

function randomHueAllele(): number {
  return HUE_ALLELE_POOL[Math.floor(Math.random() * HUE_ALLELE_POOL.length)]
}
function randomLAllele(): ChromaticL {
  return LIGHTNESS_ALLELE_POOL[Math.floor(Math.random() * LIGHTNESS_ALLELE_POOL.length)]
}

// ─── Random plant ─────────────────────────────────────────────────────────────

export function randomPlant(): Plant {
  const hueA = randomHueAllele()
  const hueB = randomHueAllele()
  const lA   = randomLAllele()
  const lB   = randomLAllele()

  const stemA = MIN_STEM_HEIGHT + Math.random() * 0.65
  const stemB = MIN_STEM_HEIGHT + Math.random() * 0.65

  const countA = 3 + Math.floor(Math.random() * 6)
  const countB = 3 + Math.floor(Math.random() * 6)

  return {
    id: uid(),
    stemHeight:     { a: stemA, b: stemB },
    petalCount:     { a: countA, b: countB },
    petalShape:     { a: randomPetalShapeAllele(), b: randomPetalShapeAllele() },
    petalHue:       { a: hueA, b: hueB },
    petalLightness: { a: lA, b: lB },
    hasGradient:    {
      a: Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM,
      b: Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM,
    },
    centerType:     { a: pick(CENTER_TYPES), b: pick(CENTER_TYPES) },
    centerColor:    { a: randomCenterColor(), b: randomCenterColor() },
    phase: 1 as PlantPhase,
    generation: 0,
  }
}

export function plannedPlant(plantConfiguration: {
  hue?: number, 
  lightness?: ChromaticL, 
  petalShape?: PetalShape, 
  hasGradient?: boolean,
  stemHeight?: number,
  petalCount?: number,
  centerType?: CenterType,
  centerColor?: HSLColor
  plantPhase?: PlantPhase
}): Plant {
  const config = {
    hue: 0, 
    lightness: 60 as ChromaticL, 
    petalShape: 'round' as PetalShape, 
    hasGradient: false,
    stemHeight: MIN_STEM_HEIGHT + Math.random() * 0.65,
    petalCount: 3 + Math.floor(Math.random() * 6),
    centerType: 'dot' as CenterType,
    centerColor: CENTER_COLORS[0],
    plantPhase: 4,
    ...plantConfiguration
  }

  return {
    id: uid(),
    stemHeight:     { a: config.stemHeight, b: config.stemHeight },
    petalCount:     { a: config.petalCount, b: config.petalCount },
    petalShape:     { a: config.petalShape, b: config.petalShape },
    petalHue:       { a: config.hue, b: config.hue },
    petalLightness: { a: config.lightness, b: config.lightness },
    hasGradient:    {
      a: config.hasGradient,
      b: config.hasGradient
    },
    centerType:     { a: config.centerType, b: config.centerType },
    centerColor:    { a: config.centerColor, b: config.centerColor },
    phase: 1 as PlantPhase,
    generation: 0,
  }
}
