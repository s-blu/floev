import type { GameState, Pot, Plant, CatalogEntry, Rarity } from '../types/plant'
import { randomPlant, calcRarity, catalogKey } from '../genetics/genetics'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bloom_v1'
const POT_COUNT = 9

/**
 * Duration in ms for each growth phase.
 * Index = phase number (0 unused, 4 = bloom = no timer)
 */
export const PHASE_DURATION_MS: Record<number, number> = {
  1: 10_000,   // Seed
  2: 18_000,   // Sprout
  3: 28_000,   // Bud
}

export const PHASE_LABELS: Record<number, string> = {
  0: 'Leer',
  1: 'Samen',
  2: 'Keimling',
  3: 'Jungpflanze',
  4: 'Blüte',
}

export const RARITY_LABELS: Record<Rarity, string> = {
  0: 'gewöhnlich',
  1: 'ungewöhnlich',
  2: 'selten',
  3: 'legendär',
}

export const RARITY_COLORS: Record<Rarity, string> = {
  0: '#888780',
  1: '#1D9E75',
  2: '#D85A30',
  3: '#D4537E',
}

// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  const pots: Pot[] = Array.from({ length: POT_COUNT }, (_, i) => ({
    id: i,
    plant: i === 0 ? randomPlant() : null,
    phaseStart: i === 0 ? Date.now() - 5000 : null,
  }))
  return { pots, catalog: [], lastSave: Date.now() }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as GameState
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
    // Storage full or unavailable — silently continue
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

/**
 * Advance plant phases based on elapsed time.
 * Returns true if any plant changed phase (triggers a re-render).
 */
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
  const entry: CatalogEntry = {
    key,
    plant: structuredClone(plant),
    rarity: calcRarity(plant),
    discovered: Date.now(),
  }
  state.catalog.push(entry)
  state.catalog.sort((a, b) => b.rarity - a.rarity)
  return true
}
