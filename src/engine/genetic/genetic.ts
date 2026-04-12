import type {
  Plant, HSLColor, PetalShape, PlantPhase, ChromaticL,
} from '../../model/plant'
import type { ColorBucket } from "../../model/genetic_model"
import { expressedColor, expressedShape, expressedCenter, expressedNumber, pick, uid } from "./genetic_utils"
import { ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_LIGHT, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_WHITE, CENTER_COLORS, CENTER_TYPES, COLOR_GRAY_DARK, COLOR_GRAY_LIGHT, COLOR_GRAY_MID, COLOR_WHITE, GRADIENT_ALLELE_CHANCE_RANDOM, MIN_STEM_HEIGHT, PALETTE_HUES, PALETTE_HUES_BUCKETS, PALETTE_L, PALETTE_S, SHAPE_ALLELE_POOL } from "../../model/genetic_model"

export function randomPetalShapeAllele(): PetalShape {
  return SHAPE_ALLELE_POOL[Math.floor(Math.random() * SHAPE_ALLELE_POOL.length)]
}
// ─── quantizeColor (still used by gradient logic) ────────────────────────────

export function quantizeColor(h: number, s: number, l: number): HSLColor {
  if (s < 10) {
    if (l >= 85) return COLOR_WHITE
    if (l >= 55) return COLOR_GRAY_LIGHT
    if (l >= 20) return COLOR_GRAY_MID
    return COLOR_GRAY_DARK
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

export function randomGradient(baseH: number, _baseS: number, baseL: number): HSLColor {
  const offsetH = (baseH + 40 + Math.random() * 140) % 360
  const targetL = baseL <= 30 ? 30 : baseL - 20
  return quantizeColor(offsetH, PALETTE_S, targetL)
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

// ─── Allele pools for randomPlant ────────────────────────────────────────────
//
// HUE pool: same distribution as before — white common, grays rare.
// LIGHTNESS pool: L=90 most common (light/pastel), L=30 rarest.

function buildHueAllelePool(): number[] {
  const pool: number[] = []

  // White: häufig
  for (let i = 0; i < 12; i++) pool.push(ACHROMATIC_HUE_WHITE)

  // Chromatic hues — frequency independent of lightness now
  for (const h of PALETTE_HUES) {
    for (let i = 0; i < 9; i++) pool.push(h)   // equal weight per hue
  }

  // Grays: sehr selten
  pool.push(ACHROMATIC_HUE_GRAY_DARK)
  pool.push(ACHROMATIC_HUE_GRAY_MID)
  pool.push(ACHROMATIC_HUE_GRAY_LIGHT)

  return pool
}

function buildLightnessAllelePool(): ChromaticL[] {
  const pool: ChromaticL[] = []
  for (let i = 0; i < 5; i++) pool.push(90)  // light — häufig
  for (let i = 0; i < 3; i++) pool.push(60)  // mid
  for (let i = 0; i < 1; i++) pool.push(30)  // dark — selten
  return pool
}

const HUE_ALLELE_POOL       = buildHueAllelePool()
const LIGHTNESS_ALLELE_POOL = buildLightnessAllelePool()

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

  // Gradient base color derived from expressed color for coherence
  const expressedH = hueA  // rough approximation for gradient seed
  const expressedL = lA

  const gradA: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(expressedH < 0 ? 0 : expressedH, PALETTE_S, expressedL) : null
  const gradB: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(hueB < 0 ? 0 : hueB, PALETTE_S, lB) : null

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
    petalLightness: { a: lA,   b: lB   },
    gradientColor:  { a: gradA, b: gradB },
    centerType:     { a: pick(CENTER_TYPES), b: pick(CENTER_TYPES) },
    centerColor:    { a: randomCenterColor(), b: randomCenterColor() },
    phase: 1 as PlantPhase,
    generation: 0,
  }
}

// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color  = expressedColor(plant.petalHue, plant.petalLightness)
  const shape  = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count  = Math.round(expressedNumber(plant.petalCount))
  return `${count}-${shape}-${center}-${color.h}-${color.s}-${color.l}`
}

// ─── randomColorForBucket — kept for inheritance.ts mutation ─────────────────
/** @deprecated Use randomHueForBucket + randomLightnessAllele instead. */
export function randomColorForBucket(bucket: ColorBucket): HSLColor {
  switch (bucket) {
    case 'white': return COLOR_WHITE
    case 'gray':  return pick([COLOR_GRAY_DARK, COLOR_GRAY_MID, COLOR_GRAY_LIGHT])
    default:      return quantizeColor(pick(PALETTE_HUES_BUCKETS[bucket]), PALETTE_S, pick([...PALETTE_L]))
  }
}
