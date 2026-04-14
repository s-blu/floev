import type { GameState, Pot, Plant, CatalogEntry, Rarity } from '../model/plant'
import { plannedPlant, randomPlant } from './genetic/genetic'
import { catalogKey } from './catalog'
import { calcRarity, calcRarityScore } from './rarity'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bloom_v1'
const POT_COUNT = 9
const STARTER_PLANTS = 3;

export const PHASE_DURATION_MS: Record<number, number> = {
  1: 10_000,
  2: 18_000,
  3: 28_000,
}

export const RARITY_LABELS: Record<Rarity, string> = {
  0: 'gewöhnlich',
  1: 'ungewöhnlich',
  2: 'selten',
  3: 'episch',
  4: 'legendär',
}

export const RARITY_COLORS: Record<Rarity, string> = {
  0: '#888780',
  1: '#1D9E75',
  2: '#4655e0',
  3: '#b437ee',
  4: '#f08000',
}


/** Maps a 1–100 rarity score to coins. Roughly exponential. */
export function coinValueForScore(score: number): number {
  return Math.max(1, Math.round(Math.pow(score / 10, 1.8)))
}

const useDebugPlants = false;
const DEBUG_PLANTS = [
  plannedPlant(
    {
      hue: 0,
      petalShape: 'lanzett',
      hasGradient: true
    }
  ),
    plannedPlant(
    {
      hue: 100,
      petalShape: 'tropfen',
      hasGradient: true
    }
  ),
    plannedPlant(
    {
      hue: 200,
      petalShape: 'wavy',
      hasGradient: true
    }
  ),
    plannedPlant(
    {
      hue: 250,
      petalShape: 'zickzack',
      hasGradient: true
    }
  ),
      plannedPlant(
    {
      hue: 310,
      petalShape: 'round',
      hasGradient: true
    }
  )
]

// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  let pots: Pot[];
  if (useDebugPlants) {
    pots = Array.from({ length: POT_COUNT }, (_, i) => ({
      id: i,
      plant: i < DEBUG_PLANTS.length ? DEBUG_PLANTS[i]: null,
      phaseStart: i < DEBUG_PLANTS.length ? Date.now() - 90000 : null,
    }))
    
  } else {
    pots = Array.from({ length: POT_COUNT }, (_, i) => ({
      id: i,
      plant: i < STARTER_PLANTS ? randomPlant() : null,
      phaseStart: i < STARTER_PLANTS ? Date.now() - 50000 : null,
    }))
    
  }
  return {
    pots, catalog: [], coins: 0,
    achievements: { unlocked: [], rewarded: [] },
    upgrades: [],
    unlockedPotColors: [],
    unlockedPotShapes: [],
    potDesign: { colorId: 'terracotta', shape: 'standard' },
    lastSave: Date.now(),
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GameState
      // backwards compatibility: old saves without coins
      if (parsed.coins === undefined) parsed.coins = 0
      if (!parsed.achievements) parsed.achievements = { unlocked: [], rewarded: [] }
      if (!parsed.upgrades) parsed.upgrades = []
      if (!parsed.unlockedPotColors) parsed.unlockedPotColors = []
      if (!parsed.unlockedPotShapes) parsed.unlockedPotShapes = []
      if (!parsed.potDesign) parsed.potDesign = { colorId: 'terracotta', shape: 'standard' }

      return parsed
    }
  } catch {
    // Corrupt save — start fresh
  }
  return createInitialState()
}

export function saveState(state: GameState): void {
  try {
    state.lastSave = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable
  }
}

export function resetState(): GameState {
  localStorage.removeItem(STORAGE_KEY)
  return createInitialState()
}

// ─── Phase management ────────────────────────────────────────────────────────

export function getPhaseProgress(pot: Pot): number {
  if (!pot.plant || pot.plant.phase >= 4) return 1
  const dur = PHASE_DURATION_MS[pot.plant.phase]
  if (!dur || !pot.phaseStart) return 1
  return Math.min(1, (Date.now() - pot.phaseStart) / dur)
}

export function advancePhases(
  state: GameState,
  onBloom?: (plant: Plant) => void,
): boolean {
  let changed = false
  for (const pot of state.pots) {
    if (!pot.plant || pot.plant.phase >= 4) continue
    if (getPhaseProgress(pot) >= 1) {
      pot.plant.phase = (pot.plant.phase + 1) as Plant['phase']
      pot.phaseStart = Date.now()
      if (pot.plant.phase === 4) {
        addToCatalog(state, pot.plant)
        onBloom?.(pot.plant)
      }
      changed = true
    }
  }
  return changed
}

// ─── Pot actions ─────────────────────────────────────────────────────────────

export function plantSeed(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot || pot.plant) return false
  pot.plant = randomPlant()
  pot.phaseStart = Date.now()
  return true
}

export function removePlant(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return false
  pot.plant = null
  pot.phaseStart = null
  return true
}

/** Sell a blooming plant: removes it and awards coins based on rarity. Returns coins earned or -1 on failure. */
export function sellPlant(state: GameState, potId: number): number {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return -1
  const entry = state.catalog.find(e => e.plant.id === pot.plant!.id)
  const rarity: Rarity = entry?.rarity ?? 0
  const reward = coinValueForScore(entry?.rarityScore ?? 1)
  state.coins += reward
  pot.plant = null
  pot.phaseStart = null
  return reward
}

export function placeSeedInEmptyPot(state: GameState, plant: Plant): number | null {
  const pot = state.pots.find(p => !p.plant)
  if (!pot) return null
  pot.plant = plant
  pot.phaseStart = Date.now()
  return pot.id
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export function addToCatalog(state: GameState, plant: Plant): boolean {
  const key = catalogKey(plant)
  if (state.catalog.find(e => e.key === key)) return false
  const rarityScore = calcRarityScore(plant)
  const entry: CatalogEntry = {
    key,
    plant: structuredClone(plant),
    rarityScore,
    rarity: calcRarity(plant),
    discovered: Date.now(),
  }
  state.catalog.push(entry)
  state.catalog.sort((a, b) => b.rarityScore - a.rarityScore)
  return true
}
