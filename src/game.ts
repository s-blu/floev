import type { GameState, Pot, Plant, CatalogEntry, Rarity } from './plant'
import { randomPlant, calcRarity, calcRarityScore, catalogKey } from './genetics'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bloom_v1'
const POT_COUNT = 9

export const PHASE_DURATION_MS: Record<number, number> = {
  1: 10_000,
  2: 18_000,
  3: 28_000,
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
  // Sort by rarityScore descending so legendaries appear first
  state.catalog.sort((a, b) => b.rarityScore - a.rarityScore)
  return true
}
