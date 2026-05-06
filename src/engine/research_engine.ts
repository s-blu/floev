// ─── Research book engine ─────────────────────────────────────────────────────

import type { Plant, GameState } from '../model/plant'
import type { PetalShape, PetalCount, CenterType, PetalEffect, ChromaticL } from '../model/plant'
import type { ColorBucket } from '../model/genetic_model'
import type { ResearchTask, ResearchTaskSpec } from '../model/research'
import { hasUpgrade } from './shop_engine'
import { getEffectiveDate } from './orders_engine'
import {
  expressedShape,
  expressedCenter,
  expressedEffect,
  expressedLightness,
  expressedPetalCount,
  expressedHue,
  hueBucket,
  uid,
} from './genetic/genetic_utils'

// ─── Seeded RNG (re-used from orders_engine pattern) ─────────────────────────

function seededRng(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b) | 0
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b) | 0
  h ^= h >>> 16
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5
    return ((h >>> 0) / 0xFFFFFFFF)
  }
}

function pickRng<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ─── Difficulty pools ─────────────────────────────────────────────────────────

const PETAL_COUNTS: PetalCount[] = [3, 5, 8]

const POOLS = {
  1: {
    shapes:       ['round', 'lanzett'] as PetalShape[],
    colorBuckets: ['white', 'yellowgreen', 'red', 'pink'] as ColorBucket[],
    lightness:    90 as ChromaticL,
    centerTypes:  ['dot'] as CenterType[],
    effects:      ['none'] as PetalEffect[],
  },
  2: {
    shapes:       ['tropfen', 'wavy', 'lanzett'] as PetalShape[],
    colorBuckets: ['yellowgreen', 'red', 'pink', 'purple', 'blue', 'gray'] as ColorBucket[],
    lightness:    60 as ChromaticL,
    centerTypes:  ['dot', 'disc'] as CenterType[],
    effects:      ['none', 'bicolor', 'gradient'] as PetalEffect[],
  },
  3: {
    shapes:       ['zickzack', 'wavy'] as PetalShape[],
    colorBuckets: ['blue', 'gray', 'purple'] as ColorBucket[],
    lightness:    30 as ChromaticL,
    centerTypes:  ['disc', 'stamen'] as CenterType[],
    effects:      ['shimmer', 'iridescent', 'gradient'] as PetalEffect[],
  },
} as const

// ─── Spec matching ────────────────────────────────────────────────────────────

function specMatchesPlant(spec: ResearchTaskSpec, plant: Plant): boolean {
  if (expressedShape(plant.petalShape)      !== spec.shape)       return false
  if (expressedPetalCount(plant.petalCount) !== spec.petalCount)  return false
  if (expressedCenter(plant.centerType)     !== spec.centerType)  return false
  if (expressedEffect(plant.petalEffect)    !== spec.effect)      return false
  const hue = expressedHue(plant.petalHue)
  if (hueBucket(hue)                        !== spec.colorBucket) return false
  if (spec.colorBucket === 'white') return true   // white has no lightness variation
  return expressedLightness(plant.petalLightness) === spec.lightness
}

export function researchSpecInCatalog(state: GameState, spec: ResearchTaskSpec): boolean {
  return state.catalog.some(entry => specMatchesPlant(spec, entry.plant))
}

// ─── Spec generation ──────────────────────────────────────────────────────────

function randomSpec(difficulty: 1 | 2 | 3, rng: () => number): ResearchTaskSpec {
  const pool = POOLS[difficulty]
  const shape       = pickRng(pool.shapes, rng)
  const petalCount  = pickRng(PETAL_COUNTS, rng)
  const colorBucket = pickRng(pool.colorBuckets, rng)
  const lightness   = colorBucket === 'white' ? 100 : pool.lightness
  const centerType  = pickRng(pool.centerTypes, rng)
  const effect      = pickRng(pool.effects, rng)
  return { shape, petalCount, colorBucket, lightness, centerType, effect }
}

export function generateResearchTasks(state: GameState, date: string): ResearchTask[] {
  const tasks: ResearchTask[] = []
  for (const difficulty of [1, 2, 3] as const) {
    const rng = seededRng(`${date}-research-d${difficulty}`)
    let spec: ResearchTaskSpec | null = null
    for (let attempt = 0; attempt < 500 && !spec; attempt++) {
      const candidate = randomSpec(difficulty, rng)
      if (!researchSpecInCatalog(state, candidate)) spec = candidate
    }
    tasks.push({
      id:            uid(),
      spec:          spec ?? randomSpec(difficulty, seededRng(`${date}-research-d${difficulty}-fallback`)),
      difficulty,
      completedToday: false,
    })
  }
  return tasks
}

// ─── Daily init & reset ───────────────────────────────────────────────────────

export function initResearchBook(state: GameState): void {
  if (!hasUpgrade(state, 'unlock_research_book')) return
  const today = getEffectiveDate()
  if (!state.researchBook) {
    state.researchBook = { tasks: generateResearchTasks(state, today), lastEffectiveDate: today }
    return
  }
  if (state.researchBook.lastEffectiveDate !== today) {
    state.researchBook.tasks = generateResearchTasks(state, today)
    state.researchBook.lastEffectiveDate = today
  }
}

// ─── On catalog entry — check research completion ─────────────────────────────

/** Call this after a plant is added to the catalog. Returns task index (0-based) or -1. */
export function checkResearchOnCatalog(state: GameState, plant: Plant): number {
  if (!state.researchBook) return -1
  initResearchBook(state)
  const tasks = state.researchBook.tasks
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    if (task.completedToday) continue
    if (specMatchesPlant(task.spec, plant)) {
      task.completedToday   = true
      task.completedByPlant = plant
      state.researchPoints  = (state.researchPoints ?? 0) + 1
      return i
    }
  }
  return -1
}

// ─── Discovered trait sets (for spoiler prevention in UI) ─────────────────────

export interface DiscoveredTraits {
  shapes:       Set<PetalShape>
  colorBuckets: Set<ColorBucket>
  centerTypes:  Set<CenterType>
  effects:      Set<PetalEffect>
}

export function getDiscoveredTraits(state: GameState): DiscoveredTraits {
  const shapes       = new Set<PetalShape>()
  const colorBuckets = new Set<ColorBucket>()
  const centerTypes  = new Set<CenterType>()
  const effects      = new Set<PetalEffect>()
  for (const entry of state.catalog) {
    const p = entry.plant
    shapes.add(expressedShape(p.petalShape))
    colorBuckets.add(hueBucket(expressedHue(p.petalHue)))
    centerTypes.add(expressedCenter(p.centerType))
    effects.add(expressedEffect(p.petalEffect))
  }
  return { shapes, colorBuckets, centerTypes, effects }
}

export function specHasUnknownTrait(spec: ResearchTaskSpec, discovered: DiscoveredTraits): boolean {
  if (!discovered.shapes.has(spec.shape))            return true
  if (!discovered.colorBuckets.has(spec.colorBucket)) return true
  if (!discovered.centerTypes.has(spec.centerType))   return true
  if (!discovered.effects.has(spec.effect))           return true
  return false
}
