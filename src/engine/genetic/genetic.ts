import type {
  Plant, HSLColor, PetalShape, PlantPhase, ChromaticL,
  CenterType, PetalEffect,
} from '../../model/plant'
import type { ColorBucket } from "../../model/genetic_model"
import { pick, uid } from "./genetic_utils"
import {
  ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_LIGHT, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_WHITE,
  CENTER_TYPES,
  EFFECT_ALLELE_POOL,
  HUE_ALLELE_POOL,
  LIGHTNESS_ALLELE_POOL,
  MIN_STEM_HEIGHT,PALETTE_HUES_BUCKETS, PALETTE_L, SHAPE_ALLELE_POOL,
  STEM_TYPES,
} from "../../model/genetic_model"
export function randomPetalShapeAllele(): PetalShape {
  return SHAPE_ALLELE_POOL[Math.floor(Math.random() * SHAPE_ALLELE_POOL.length)]
}

// ─── Random hue/lightness allele for a given ColorBucket ─────────────────────

export function randomHueForBucket(bucket: ColorBucket): number {
  switch (bucket) {
    case 'white': return ACHROMATIC_HUE_WHITE
    case 'gray':  return pick([ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT])
    default:      return pick(PALETTE_HUES_BUCKETS[bucket] ?? PALETTE_HUES_BUCKETS.red)
  }
}

export function randomLightnessAllele(): ChromaticL {
  return pick([...PALETTE_L]) as ChromaticL
}

function randomHueAllele(): number {
  return HUE_ALLELE_POOL[Math.floor(Math.random() * HUE_ALLELE_POOL.length)]
}
function randomLAllele(): ChromaticL {
  return LIGHTNESS_ALLELE_POOL[Math.floor(Math.random() * LIGHTNESS_ALLELE_POOL.length)]
}
function randomEffectAllele(): PetalEffect {
  return EFFECT_ALLELE_POOL[Math.floor(Math.random() * EFFECT_ALLELE_POOL.length)]
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
    petalShape:     { a: randomPetalShapeAllele(false), b: randomPetalShapeAllele() },
    petalHue:       { a: hueA, b: hueB },
    petalLightness: { a: lA, b: lB },
    petalEffect:    { a: EFFECT_ALLELE_POOL[0], b: randomEffectAllele() },
    centerType:     { a: pick(CENTER_TYPES.slice(0, -1)), b: pick(CENTER_TYPES) },
    phase: 1 as PlantPhase,
    stem: { a: STEM_TYPES[0], b: STEM_TYPES[0] },
    generation: 0,
  }
}

// ─── Planned plant (for debug / help modal / tests) ──────────────────────────

export function plannedPlant(plantConfiguration: {
  hue?:          number
  lightness?:    ChromaticL
  petalShape?:   PetalShape
  petalEffect?:  PetalEffect
  stemHeight?:   number
  petalCount?:   number
  centerType?:   CenterType
  centerColor?:  HSLColor
  plantPhase?:   PlantPhase
}): Plant {
  const config = {
    hue:         0,
    lightness:   60 as ChromaticL,
    petalShape:  'round' as PetalShape,
    petalEffect: 'none' as PetalEffect,
    stemHeight:  MIN_STEM_HEIGHT + Math.random() * 0.65,
    petalCount:  3 + Math.floor(Math.random() * 6),
    centerType:  'dot' as CenterType,
    plantPhase:  4 as PlantPhase,
    ...plantConfiguration,
  }

  return {
    id: uid(),
    stemHeight:     { a: config.stemHeight,  b: config.stemHeight  },
    petalCount:     { a: config.petalCount,  b: config.petalCount  },
    petalShape:     { a: config.petalShape,  b: config.petalShape  },
    petalHue:       { a: config.hue,         b: config.hue         },
    petalLightness: { a: config.lightness,   b: config.lightness   },
    petalEffect:    { a: config.petalEffect, b: config.petalEffect },
    centerType:     { a: config.centerType,  b: config.centerType  },
    phase:      config.plantPhase,
    stem: { a: STEM_TYPES[0], b: STEM_TYPES[0] },    
    generation: 0,
  }
}
