import type {
  Plant, HSLColor, PetalShape, CenterType, PlantPhase, Rarity,
  BreedEstimate, AllelePair, ColorBucket,
} from './plant'
import {
  expressedColor, expressedShape, expressedCenter, expressedNumber,
  expressedGradient, colorBucket, COLOR_BUCKET_DOMINANCE
} from './plant'

// ─── Constants ───────────────────────────────────────────────────────────────

const PETAL_SHAPES: PetalShape[] = ['round', 'pointed', 'wavy']
const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

/** Probability of a point mutation on a single allele during breeding */
const MUTATION_CHANCE = 0.04

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
const GRADIENT_ALLELE_KEEP_CHANCE = 0.55

const MIN_STEM_HEIGHT = 0.35

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomGradient(baseH: number, baseS: number, baseL: number): HSLColor {
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
function randomColorForBucket(bucket: ColorBucket): HSLColor {
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

// ─── Allele inheritance ───────────────────────────────────────────────────────

function inheritAllele<T>(parentA: AllelePair<T>, parentB: AllelePair<T>): AllelePair<T> {
  return {
    a: Math.random() < 0.5 ? parentA.a : parentA.b,
    b: Math.random() < 0.5 ? parentB.a : parentB.b,
  }
}

function inheritNumber(
  parentA: AllelePair<number>,
  parentB: AllelePair<number>,
  min: number,
  max: number,
  jitterRange: number,
): AllelePair<number> {
  const raw = inheritAllele(parentA, parentB)
  return {
    a: clamp(jitter(raw.a, jitterRange), min, max),
    b: clamp(jitter(raw.b, jitterRange), min, max),
  }
}

function inheritDiscrete<T>(
  parentA: AllelePair<T>,
  parentB: AllelePair<T>,
  options: T[],
): AllelePair<T> {
  const raw = inheritAllele(parentA, parentB)
  return {
    a: Math.random() < MUTATION_CHANCE ? pick(options) : raw.a,
    b: Math.random() < MUTATION_CHANCE ? pick(options) : raw.b,
  }
}

function inheritColor(
  parentA: AllelePair<HSLColor>,
  parentB: AllelePair<HSLColor>,
): AllelePair<HSLColor> {
  const raw = inheritAllele(parentA, parentB)
  const mutateA = Math.random() < MUTATION_CHANCE
  const mutateB = Math.random() < MUTATION_CHANCE
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
  }
}

function inheritGradient(
  parentA: AllelePair<HSLColor | null>,
  parentB: AllelePair<HSLColor | null>,
  childColorPair: AllelePair<HSLColor>,
): AllelePair<HSLColor | null> {
  const raw = inheritAllele(parentA, parentB)

  const resolveAllele = (allele: HSLColor | null, baseColor: HSLColor): HSLColor | null => {
    if (allele !== null) {
      return Math.random() < GRADIENT_ALLELE_KEEP_CHANCE
        ? { h: clamp(jitter(allele.h, 12), 0, 359), s: clamp(jitter(allele.s, 8), 25, 100), l: clamp(jitter(allele.l, 6), 20, 75) }
        : null
    } else {
      return Math.random() < 0.06
        ? randomGradient(baseColor.h, baseColor.s, baseColor.l)
        : null
    }
  }

  return {
    a: resolveAllele(raw.a, childColorPair.a),
    b: resolveAllele(raw.b, childColorPair.b),
  }
}

// ─── Breeding ────────────────────────────────────────────────────────────────

export function breedPlants(a: Plant, b: Plant): Plant {
  const petalColor = inheritColor(a.petalColor, b.petalColor)
  const gradientColor = inheritGradient(a.gradientColor, b.gradientColor, petalColor)

  return {
    id: uid(),
    stemHeight: inheritNumber(a.stemHeight, b.stemHeight, MIN_STEM_HEIGHT, 1.0, 0.08),
    petalCount: {
      a: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).a), 3, 8),
      b: clamp(Math.round(inheritNumber(a.petalCount, b.petalCount, 3, 8, 0.8).b), 3, 8),
    },
    petalShape:   inheritDiscrete(a.petalShape, b.petalShape, PETAL_SHAPES),
    petalColor,
    gradientColor,
    centerType:   inheritDiscrete(a.centerType, b.centerType, CENTER_TYPES),
    centerColor:  inheritColor(a.centerColor, b.centerColor),
    phase: 1 as PlantPhase,
    generation: Math.max(a.generation ?? 0, b.generation ?? 0) + 1,
    parentIds: [a.id, b.id],
  }
}

// ─── Breeding estimate ───────────────────────────────────────────────────────

export function computeBreedEstimate(a: Plant, b: Plant): BreedEstimate {
  const samples: Plant[] = []
  for (let i = 0; i < 20; i++) samples.push(breedPlants(a, b))

  const expressed = samples.map(p => expressedColor(p.petalColor))
  const hues = expressed.map(c => c.h)
  const avgH = hues.reduce((s, v) => s + v, 0) / hues.length
  const pCounts = samples.map(p => Math.round(expressedNumber(p.petalCount)))

  const shapeMap: Record<string, number> = {}
  samples.forEach(p => {
    const s = expressedShape(p.petalShape)
    shapeMap[s] = (shapeMap[s] ?? 0) + 1
  })
  const likelyShape = Object.entries(shapeMap).sort((a, b) => b[1] - a[1])[0][0] as PetalShape

  const gradCount = samples.filter(p => expressedGradient(p.gradientColor) !== null).length
  const avgS = expressed.reduce((s, c) => s + c.s, 0) / expressed.length
  const avgL = expressed.reduce((s, c) => s + c.l, 0) / expressed.length

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
  }
}

// ─── Rarity ──────────────────────────────────────────────────────────────────

const SHAPE_SCORE: Record<PetalShape, number> = { round: 0, pointed: 12, wavy: 30 }
const COLOR_SCORE: Record<string, number> = {
  white: 0, yellow: 5, red: 12, purple: 20, blue: 27, gray: 30,
}
const CENTER_SCORE: Record<CenterType, number> = { dot: 0, disc: 8, stamen: 20 }

export function calcRarityScore(plant: Plant): number {
  const shape  = expressedShape(plant.petalShape)
  const color  = expressedColor(plant.petalColor)
  const center = expressedCenter(plant.centerType)
  const grad   = expressedGradient(plant.gradientColor)
  const count  = Math.round(expressedNumber(plant.petalCount))
  const stem   = expressedNumber(plant.stemHeight)

  let score = 0
  score += SHAPE_SCORE[shape]
  score += COLOR_SCORE[colorBucket(color)] ?? 0
  score += CENTER_SCORE[center]
  score += grad !== null ? 20 : 0

  if (count >= 7) score += 5
  if (stem > 0.85) score += 5

  return Math.min(100, Math.max(1, score))
}

export function calcRarity(plant: Plant): Rarity {
  const score = calcRarityScore(plant)
  if (score >= 90) return 4  // legendary
  if (score >= 75) return 3  // epic
  if (score >= 50) return 2  // rare
  if (score >= 22) return 1  // uncommon
  return 0                   // common
}

// ─── Catalog key ────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color  = expressedColor(plant.petalColor)
  const shape  = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count  = Math.round(expressedNumber(plant.petalCount))
  return `${count}-${shape}-${center}-${Math.round(color.h / 20)}`
}
