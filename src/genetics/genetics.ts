import type { Plant, HSLColor, PetalShape, CenterType, PlantPhase, Rarity, BreedEstimate } from '../types/plant'

// ─── Constants ───────────────────────────────────────────────────────────────

const PETAL_SHAPES: PetalShape[] = ['round', 'pointed', 'wavy']
const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

/** Probability of a rare wild-jump mutation on any single trait */
const RARE_MUTATION_CHANCE = 0.04

/** Probability of a gradient appearing on a fresh random plant */
const GRADIENT_CHANCE_RANDOM = 0.08

/** Probability of gradient in offspring when at least one parent has a gradient */
const GRADIENT_CHANCE_INHERITED = 0.25

/** Probability of gradient in offspring when neither parent has one */
const GRADIENT_CHANCE_BASE = 0.06

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Interpolate angles correctly around the 0/360 wrap */
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

function pickDiscrete<T>(a: T, b: T, options: T[]): T {
  const r = Math.random()
  if (r < RARE_MUTATION_CHANCE) return options[Math.floor(Math.random() * options.length)]
  return r < 0.5 ? a : b
}

function randomGradient(baseH: number, baseS: number, baseL: number): HSLColor {
  return {
    h: (baseH + 30 + Math.random() * 60) % 360,
    s: clamp(jitter(baseS, 10), 30, 100),
    l: clamp(baseL - 10 - Math.random() * 8, 25, 75),
  }
}

// ─── Random plant ─────────────────────────────────────────────────────────────

export function randomPlant(): Plant {
  const h = Math.random() * 360
  const s = 60 + Math.random() * 30
  const l = 50 + Math.random() * 18
  const hasGradient = Math.random() < GRADIENT_CHANCE_RANDOM

  return {
    id: uid(),
    stemHeight: 0.3 + Math.random() * 0.7,
    petalCount: 3 + Math.floor(Math.random() * 6),
    petalShape: PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)],
    petalColor: { h, s, l },
    gradientColor: hasGradient ? randomGradient(h, s, l) : null,
    centerType: CENTER_TYPES[Math.floor(Math.random() * CENTER_TYPES.length)],
    phase: 1 as PlantPhase,
    generation: 0,
  }
}

// ─── Breeding ────────────────────────────────────────────────────────────────

export function breedPlants(a: Plant, b: Plant): Plant {
  const t = Math.random()
  const h = lerpAngle(a.petalColor.h, b.petalColor.h, t)
  const s = (a.petalColor.s + b.petalColor.s) / 2
  const l = (a.petalColor.l + b.petalColor.l) / 2

  const parentGrad = a.gradientColor ?? b.gradientColor
  const gradChance = parentGrad
    ? GRADIENT_CHANCE_INHERITED
    : GRADIENT_CHANCE_BASE
  const hasGrad = Math.random() < gradChance

  // Rare wild-jump: a trait leaps to a completely different value (~4% chance)
  const rareJump = Math.random() < RARE_MUTATION_CHANCE

  return {
    id: uid(),
    stemHeight: clamp(
      rareJump ? Math.random() : jitter((a.stemHeight + b.stemHeight) / 2, 0.12),
      0.25,
      1.0,
    ),
    petalCount: clamp(
      Math.round(rareJump ? 3 + Math.random() * 5 : jitter((a.petalCount + b.petalCount) / 2, 1)),
      3,
      8,
    ),
    petalShape: pickDiscrete(a.petalShape, b.petalShape, PETAL_SHAPES),
    petalColor: {
      h: clamp(rareJump ? Math.random() * 360 : jitter(h, 12), 0, 359),
      s: clamp(jitter(s, 7), 30, 100),
      l: clamp(jitter(l, 7), 30, 78),
    },
    gradientColor: hasGrad ? randomGradient(h, s, l) : null,
    centerType: pickDiscrete(a.centerType, b.centerType, CENTER_TYPES),
    phase: 1 as PlantPhase,
    generation: Math.max(a.generation ?? 0, b.generation ?? 0) + 1,
  }
}

// ─── Breeding estimate ───────────────────────────────────────────────────────

/**
 * Run 16 simulated breedings (without rare jumps) and return a statistical
 * estimate for the breeding panel UI.
 */
export function computeBreedEstimate(a: Plant, b: Plant): BreedEstimate {
  // Temporarily suppress rare jumps by running a "clean" breed simulation
  const samples: Plant[] = []
  for (let i = 0; i < 16; i++) {
    samples.push(breedPlants(a, b))
  }

  const hues = samples.map(r => r.petalColor.h)
  const avgH = hues.reduce((s, v) => s + v, 0) / hues.length
  const pCounts = samples.map(r => r.petalCount)

  const shapeMap: Record<string, number> = {}
  samples.forEach(r => { shapeMap[r.petalShape] = (shapeMap[r.petalShape] ?? 0) + 1 })
  const likelyShape = (Object.entries(shapeMap).sort((a, b) => b[1] - a[1])[0][0]) as PetalShape

  const gradCount = samples.filter(r => r.gradientColor).length
  const avgS = samples.reduce((s, r) => s + r.petalColor.s, 0) / samples.length
  const avgL = samples.reduce((s, r) => s + r.petalColor.l, 0) / samples.length

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

export function calcRarity(plant: Plant): Rarity {
  let score = 0
  if (plant.petalCount >= 7) score++
  if (plant.petalShape === 'wavy') score++
  if (plant.centerType === 'stamen') score++
  // Purple/violet hue range is considered rare
  const hueDist = Math.min(
    Math.abs(plant.petalColor.h - 270),
    360 - Math.abs(plant.petalColor.h - 270),
  )
  if (hueDist < 25) score++
  if (plant.gradientColor) score++
  if (plant.stemHeight > 0.85) score++
  return Math.min(score, 3) as Rarity
}

// ─── Catalog key ────────────────────────────────────────────────────────────

/** Deduplication key — coarse enough to group similar plants together */
export function catalogKey(plant: Plant): string {
  return `${plant.petalCount}-${plant.petalShape}-${plant.centerType}-${Math.round(plant.petalColor.h / 20)}`
}
