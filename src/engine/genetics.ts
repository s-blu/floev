import type {
  Plant, HSLColor, PetalShape, CenterType, PlantPhase,
} from '../model/plant'
import type { ColorBucket } from "./genetic.util"
import { expressedColor, expressedShape, expressedCenter, expressedNumber } from "./genetic.util"

// ─── Constants ───────────────────────────────────────────────────────────────

export const PETAL_SHAPES: PetalShape[] = ['round', 'pointed', 'wavy']
export const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

/** Probability of a point mutation on a single allele during breeding */
export const MUTATION_CHANCE = 0.04

/**
 * Gradient allele frequencies:
 * Random plants: each allele has ~28% chance to be a gradient allele,
 * so ~8% of plants express it (both alleles must carry it).
 */
const GRADIENT_ALLELE_CHANCE_RANDOM = 0.28

/**
 * During breeding, an inherited gradient allele is kept with this probability,
 * otherwise it becomes null (no-gradient).
 */
export const GRADIENT_ALLELE_KEEP_CHANCE = 0.55

export const MIN_STEM_HEIGHT = 0.35

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomGradient(baseH: number, baseS: number, baseL: number): HSLColor {
  return {
    h: (baseH + 30 + Math.random() * 60) % 360,
    s: clamp(jitter(baseS, 10), 30, 100),
    l: clamp(baseL - 10 - Math.random() * 8, 25, 75),
  }
}

function randomCenterColor(): HSLColor {
  const r = Math.random()
  if (r < 0.15) {
    return { h: 45, s: 20 + Math.random() * 20, l: 90 + Math.random() * 8 }
  } else if (r < 0.55) {
    return { h: 40 + Math.random() * 35, s: 55 + Math.random() * 30, l: 78 + Math.random() * 12 }
  } else {
    return { h: 90 + Math.random() * 50, s: 40 + Math.random() * 30, l: 72 + Math.random() * 14 }
  }
}

/** Generate a random HSLColor for a given dominance bucket */
export function randomColorForBucket(bucket: ColorBucket): HSLColor {
  switch (bucket) {
    case 'white':  return { h: 45,  s: 10 + Math.random() * 12, l: 88 + Math.random() * 10 }
    case 'yellow': return { h: 48 + Math.random() * 20, s: 75 + Math.random() * 20, l: 58 + Math.random() * 14 }
    case 'red':    return { h: (Math.random() < 0.5 ? 348 + Math.random() * 12 : Math.random() * 18), s: 72 + Math.random() * 22, l: 45 + Math.random() * 18 }
    case 'purple': return { h: 275 + Math.random() * 50, s: 55 + Math.random() * 30, l: 40 + Math.random() * 22 }
    case 'blue':   return { h: 200 + Math.random() * 65, s: 60 + Math.random() * 30, l: 42 + Math.random() * 22 }
    case 'gray':   return { h: Math.random() * 360, s: 5 + Math.random() * 15, l: 10 + Math.random() * 60 }
  }
}

/** Generate a completely random petal color */
function randomPetalColor(): HSLColor {
  const h = Math.random() * 360
  const s = 60 + Math.random() * 30
  const l = 50 + Math.random() * 18
  return { h, s, l }
}

// ─── Random plant ─────────────────────────────────────────────────────────────

export function randomPlant(): Plant {
  const colorA = randomPetalColor()
  const colorB = randomPetalColor()

  const gradA: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(colorA.h, colorA.s, colorA.l) : null
  const gradB: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(colorB.h, colorB.s, colorB.l) : null

  const stemA = MIN_STEM_HEIGHT + Math.random() * 0.65
  const stemB = MIN_STEM_HEIGHT + Math.random() * 0.65

  const countA = 3 + Math.floor(Math.random() * 6)
  const countB = 3 + Math.floor(Math.random() * 6)

  return {
    id: uid(),
    stemHeight: { a: stemA, b: stemB },
    petalCount: { a: countA, b: countB },
    petalShape:  { a: pick(PETAL_SHAPES), b: pick(PETAL_SHAPES) },
    petalColor:  { a: colorA, b: colorB },
    gradientColor: { a: gradA, b: gradB },
    centerType:  { a: pick(CENTER_TYPES), b: pick(CENTER_TYPES) },
    centerColor: { a: randomCenterColor(), b: randomCenterColor() },
    phase: 1 as PlantPhase,
    generation: 0,
  }
}

// ─── Catalog key ────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color  = expressedColor(plant.petalColor)
  const shape  = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count  = Math.round(expressedNumber(plant.petalCount))
  return `${count}-${shape}-${center}-${Math.round(color.h / 20)}`
}
