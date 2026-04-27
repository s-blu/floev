import type { GameState, Pot, Plant, PlantPhase } from '../model/plant'
import { randomPlant } from './genetic/genetic'
import { addToCatalog } from './catalog'
import { calcCoinScore } from './rarity'
import { USE_FIXED_PLANTS, DEV_PHASE_DURATION_MS, DEV_STARTING_COINS, DEBUG_PLANTS, DEBUG_SEEDS, USE_FIXED_SEEDS } from '../dev.config'
import { MAX_SEED_STORAGE, SEEDS_PER_SLOT } from '../model/genetic_model'
import { runMigrations, LATEST_MIGRATION_VERSION } from './migrations'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY        = 'bloom_v1'
const STORAGE_KEY_BACKUP = 'bloom_v1_backup'
export const INITIAL_POT_COUNT = 9
const STARTER_PLANTS = 4;

export const PHASE_DURATION_MS: Record<number, number> = import.meta.env.DEV
  ? DEV_PHASE_DURATION_MS
  : { 1: 2 * 60_000, 2: 4 * 60_000, 3: 6 * 60_000 }


/** Maps a 1–100 rarity score to coins. Roughly exponential. */
export function coinValueForScore(score: number): number {
  return Math.max(3, Math.round(Math.pow(score / 10, 1.8)))
}

const useDebugPlants = import.meta.env.DEV && USE_FIXED_PLANTS;
const useDebugSeeds = import.meta.env.DEV && USE_FIXED_SEEDS;
// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  let pots: Pot[];
  if (useDebugPlants) {
    pots = Array.from({ length: INITIAL_POT_COUNT }, (_, i) => ({
      id: i,
      plant: i < DEBUG_PLANTS.length ? DEBUG_PLANTS[i] : null,
      phaseStart: i < DEBUG_PLANTS.length ? Date.now() - 5000 : null,
    }))
  } else {
    // Starter plants: all in phase 3 (Bud), finishing at 12s / 30s / 60s / 3min
    const phase3Dur = PHASE_DURATION_MS[3];
    const starterOffsets = [12_000, 30_000, 60_000, 180_000];
    pots = Array.from({ length: INITIAL_POT_COUNT }, (_, i) => {
      if (i >= STARTER_PLANTS) return { id: i, plant: null, phaseStart: null };
      const plant = randomPlant();
      plant.phase = 3 as PlantPhase;
      return { id: i, plant, phaseStart: Date.now() - (phase3Dur - starterOffsets[i]) };
    });
  }


  const gameState: GameState = { pots, showcase: [], catalog: [], coins: import.meta.env.DEV ? DEV_STARTING_COINS : 0, achievements: { unlocked: [], rewarded: [] }, upgrades: [], unlockedPotColors: [], unlockedPotShapes: [], seeds: [], seedLayout: Array(MAX_SEED_STORAGE).fill(''), lastSave: Date.now(), migrationVersion: LATEST_MIGRATION_VERSION }
  if (useDebugSeeds) {
    gameState.seeds = DEBUG_SEEDS
    DEBUG_SEEDS.forEach((s, i) => { gameState.seedLayout[i] = s.id })
    gameState.upgrades.push('unlock_seed_drawer')
  }

  return gameState
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GameState

      localStorage.setItem(STORAGE_KEY_BACKUP, raw)

      // backwards compatibility: old saves without coins
      if (parsed.coins === undefined) parsed.coins = 0
      if (!parsed.achievements) parsed.achievements = { unlocked: [], rewarded: [] }
      if (!parsed.upgrades) parsed.upgrades = []
      if (!parsed.unlockedPotColors) parsed.unlockedPotColors = []
      if (!parsed.unlockedPotShapes) parsed.unlockedPotShapes = []
      if (!parsed.showcase) parsed.showcase = []
      if (!parsed.seeds) parsed.seeds = []
      if (!parsed.seedLayout || parsed.seedLayout.length !== MAX_SEED_STORAGE) {
        parsed.seedLayout = Array(MAX_SEED_STORAGE).fill('')
        parsed.seeds.forEach((s, i) => { if (i < MAX_SEED_STORAGE) parsed.seedLayout[i] = s.id })
      }
      // orderBook is generated on first use — no migration needed

      if (runMigrations(parsed)) saveState(parsed)
      return parsed
    }
  } catch {
    const backup = localStorage.getItem(STORAGE_KEY_BACKUP)
    if (backup) {
      try { return JSON.parse(backup) as GameState } catch { /* backup also corrupt */ }
    }
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
    while (pot.plant.phase < 4 && getPhaseProgress(pot) >= 1) {
      const dur = PHASE_DURATION_MS[pot.plant.phase]
      const phaseEnd = (pot.phaseStart ?? Date.now()) + dur
      pot.plant.phase = (pot.plant.phase + 1) as Plant['phase']
      pot.phaseStart  = phaseEnd
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
  const reward = coinValueForScore(calcCoinScore(pot.plant))
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

export function placeSeedInSpecificPot(state: GameState, plant: Plant, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot || pot.plant) return false
  pot.plant      = plant
  pot.phaseStart = Date.now()
  return true
}

// ─── Seed storage actions ─────────────────────────────────────────────────────

export function addSeedToStorage(state: GameState, plant: Plant): boolean {
  if (state.seeds.length >= MAX_SEED_STORAGE) return false
  state.seeds.push(plant)
  const emptyPos = state.seedLayout.findIndex(id => id === '')
  if (emptyPos !== -1) state.seedLayout[emptyPos] = plant.id
  return true
}

export function removeSeedFromStorage(state: GameState, seedId: string): Plant | null {
  const idx = state.seeds.findIndex(s => s.id === seedId)
  if (idx === -1) return null
  const layoutPos = state.seedLayout.indexOf(seedId)
  if (layoutPos !== -1) state.seedLayout[layoutPos] = ''
  return state.seeds.splice(idx, 1)[0]
}

export function moveSeedToSlot(state: GameState, seedId: string, targetSlotIdx: number): boolean {
  const currentPos = state.seedLayout.indexOf(seedId)
  if (currentPos === -1) return false
  const slotStart = targetSlotIdx * SEEDS_PER_SLOT
  const slotEnd = slotStart + SEEDS_PER_SLOT
  const targetPos = state.seedLayout.slice(slotStart, slotEnd).indexOf('')
  if (targetPos === -1) return false  // target slot is full
  state.seedLayout[currentPos] = ''
  state.seedLayout[slotStart + targetPos] = seedId
  return true
}

// ─── Showcase actions ────────────────────────────────────────────────────────

export function moveToShowcase(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return false
  const freePot = state.showcase.find(p => !p.plant)
  if (!freePot) return false
  freePot.plant = pot.plant
  pot.plant     = null
  return true
}

export function moveFromShowcase(state: GameState, showcasePotId: number): boolean {
  const showcasePot = state.showcase.find(p => p.id === showcasePotId)
  if (!showcasePot?.plant) return false
  const freePot = state.pots.find(p => !p.plant)
  if (!freePot) return false
  freePot.plant      = showcasePot.plant
  showcasePot.plant  = null
  return true
}
