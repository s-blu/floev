import type { GameState, Pot, Plant, Rarity, PetalEffect, PlantPhase } from '../model/plant'
import { plannedPlant, randomPlant } from './genetic/genetic'
import { addToCatalog, getCatalogEntryForPlant } from './catalog'
import { USE_FIXED_PLANTS, DEV_PHASE_DURATION_MS, DEV_STARTING_COINS } from './devConfig'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'bloom_v1'
const POT_COUNT     = 9
const STARTER_PLANTS = 4;

export const PHASE_DURATION_MS: Record<number, number> = import.meta.env.DEV
  ? DEV_PHASE_DURATION_MS
  : { 1: 360_000, 2: 480_000, 3: 600_000 }

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
  return Math.max(3, Math.round(Math.pow(score / 10, 1.8)))
}

const useDebugPlants = import.meta.env.DEV && USE_FIXED_PLANTS;
const sharedDebugConfig = {
      hue: 200,
      petalCount: 5,
      plantPhase: 3 as PlantPhase,
}
const DEBUG_PLANTS = [
    plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'round',
      petalEffect: 'shimmer' as PetalEffect,
    }
  ),
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'lanzett',
      petalEffect: 'bicolor' as PetalEffect,
    }
  ),
    plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'tropfen',
      petalEffect: 'iridescent' as PetalEffect,
    }
  ),
    plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'wavy',
      petalEffect: 'gradient' as PetalEffect,
    }
  ),
    plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'zickzack',
    }
  ),
]

// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  let pots: Pot[];
  if (useDebugPlants) {
    pots = Array.from({ length: POT_COUNT }, (_, i) => ({
      id: i,
      plant: i < DEBUG_PLANTS.length ? DEBUG_PLANTS[i] : null,
      phaseStart: i < DEBUG_PLANTS.length ? Date.now() - 5000 : null,
    }))
  } else {
    // Starter plants: all in phase 3 (Bud), finishing at 6s / 30s / 60s / 3min
    const phase3Dur = PHASE_DURATION_MS[3];
    const starterOffsets = [12_000, 30_000, 60_000, 180_000];
    pots = Array.from({ length: POT_COUNT }, (_, i) => {
      if (i >= STARTER_PLANTS) return { id: i, plant: null, phaseStart: null };
      const plant = randomPlant();
      plant.phase = 3 as PlantPhase;
      return { id: i, plant, phaseStart: Date.now() - (phase3Dur - starterOffsets[i]) };
    });
  }
  return { pots, catalog: [], coins: import.meta.env.DEV ? DEV_STARTING_COINS : 0, achievements: { unlocked: [], rewarded: [] }, upgrades: [], unlockedPotColors: [], unlockedPotShapes: [], lastSave: Date.now() }
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
      pot.phaseStart  = Date.now()
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
  pot.plant      = randomPlant()
  pot.phaseStart = Date.now()
  return true
}

export function removePlant(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return false
  pot.plant      = null
  pot.phaseStart = null
  return true
}

export function sellPlant(state: GameState, potId: number): number {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return -1
  const entry  = getCatalogEntryForPlant(state, pot.plant)
  const reward = coinValueForScore(entry?.rarityScore ?? 1)
  state.coins += reward
  pot.plant      = null
  pot.phaseStart = null
  return reward
}

export function placeSeedInEmptyPot(state: GameState, plant: Plant): number | null {
  const pot = state.pots.find(p => !p.plant)
  if (!pot) return null
  pot.plant      = plant
  pot.phaseStart = Date.now()
  return pot.id
}
