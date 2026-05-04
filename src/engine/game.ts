import type { GameState, Pot, Plant, PlantPhase } from '../model/plant'
import { randomPlant } from './genetic/genetic'
import { addToCatalog } from './catalog'
import { USE_FIXED_PLANTS, DEV_PHASE_DURATION_MS, DEV_STARTING_COINS, DEBUG_PLANTS, DEBUG_SEEDS, USE_FIXED_SEEDS } from '../dev.config'
import { MAX_SEED_STORAGE, SAATENSCHUBLADE_SLOTS } from '../model/genetic_model'
import { getSeedSlotCount, getSeedCapacity } from './seed_storage_engine'
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


  const gameState: GameState = { pots, showcase: [], catalog: [], coins: import.meta.env.DEV ? DEV_STARTING_COINS : 0, achievements: { unlocked: [], rewarded: [] }, upgrades: [], unlockedPotColors: [], unlockedPotShapes: [], unlockedPotEffects: [], seeds: [], seedLayout: Array(MAX_SEED_STORAGE).fill(''), seedSlotLabels: Array.from({ length: SAATENSCHUBLADE_SLOTS }, () => []), extraSeedRows: 0, lastSave: Date.now(), migrationVersion: LATEST_MIGRATION_VERSION }
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

      // backwards compatibility
      if (parsed.coins === undefined) parsed.coins = 0
      if (!parsed.achievements) parsed.achievements = { unlocked: [], rewarded: [] }
      if (!parsed.upgrades) parsed.upgrades = []
      if (!parsed.unlockedPotColors)  parsed.unlockedPotColors  = []
      if (!parsed.unlockedPotShapes)  parsed.unlockedPotShapes  = []
      if (!parsed.unlockedPotEffects) parsed.unlockedPotEffects = []
      if (!parsed.showcase) parsed.showcase = []
      if (!parsed.seeds) parsed.seeds = []
      if (parsed.extraSeedRows === undefined) parsed.extraSeedRows = 0
      const expectedCapacity = getSeedCapacity(parsed)
      const expectedSlotCount = getSeedSlotCount(parsed)
      if (!parsed.seedLayout || parsed.seedLayout.length !== expectedCapacity) {
        parsed.seedLayout = Array(expectedCapacity).fill('')
        parsed.seeds.forEach((s, i) => { if (i < expectedCapacity) parsed.seedLayout[i] = s.id })
      }
      if (!parsed.seedSlotLabels || parsed.seedSlotLabels.length !== expectedSlotCount) {
        const existing = parsed.seedSlotLabels ?? []
        parsed.seedSlotLabels = Array.from({ length: expectedSlotCount }, (_, i) => existing[i] ?? [])
      }

      if (runMigrations(parsed)) saveState(parsed)
      return parsed
    }
  } catch (err) {
    console.error('Could not read the save state! Try to recover backup, if there is any', err)
    const backup = localStorage.getItem(STORAGE_KEY_BACKUP)
    if (backup) {
      try { 
        const bak = JSON.parse(backup) as GameState
        return  bak;
      } catch (e) {
        console.error('Backup was not recoverable, need to initialize anew', e)
      }
    }
  }
  return createInitialState()
}

export function saveState(state: GameState): void {
  try {
    state.lastSave = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('unable to save game', err)
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
  onBloom?: (plant: Plant, potIndex: number, isNew: boolean) => void,
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
        const isNew = addToCatalog(state, pot.plant)
        const potIndex = state.pots.indexOf(pot) + 1
        onBloom?.(pot.plant, potIndex, isNew)
      }
      changed = true
    }
  }
  return changed
}
