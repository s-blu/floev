import type { GameState } from '../model/plant'
import { calcRarityScore, calcRarity } from './rarity'
import { catalogKey } from './catalog'

// ─── Migration system ─────────────────────────────────────────────────────────

interface Migration {
  version: number
  run: (state: GameState) => void
}

function migrateHue(hue: number, from: number, to: number): number {
  return hue === from ? to : hue
}

function migrateAllPlantHues(plants: import('../model/plant').Plant[], from: number, to: number) {
  for (const plant of plants) {
    plant.petalHue.a = migrateHue(plant.petalHue.a, from, to)
    plant.petalHue.b = migrateHue(plant.petalHue.b, from, to)
  }
}

const migrations: Migration[] = [
  {
    version: 1,
    run(state) {
      for (const entry of state.catalog) {
        entry.rarityScore = calcRarityScore(entry.plant)
        entry.rarity = calcRarity(entry.plant)
      }
      state.catalog.sort((a, b) => b.rarityScore - a.rarityScore)
    },
  },
  {
    version: 2,
    run(state) {
      const potPlants = state.pots.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[]
      const showcasePlants = state.showcase.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[]
      const catalogPlants = state.catalog.map(e => e.plant)
      migrateAllPlantHues([...potPlants, ...showcasePlants, ...catalogPlants, ...state.seeds], 0, 5)
      for (const entry of state.catalog) {
        entry.key = catalogKey(entry.plant)
      }
    },
  },
  {
    version: 6,
    run(state) {
      state.achievements.unlocked = state.achievements.unlocked.filter(id => id !== 'color_div_8')
      state.achievements.rewarded = state.achievements.rewarded.filter(id => id !== 'color_div_8')
    },
  },
]

export const LATEST_MIGRATION_VERSION = migrations.length > 0
  ? Math.max(...migrations.map(m => m.version))
  : 0

export function runMigrations(state: GameState): boolean {
  const current = state.migrationVersion ?? 0
  const pending = migrations.filter(m => m.version > current).sort((a, b) => a.version - b.version)
  if (pending.length === 0) return false
  for (const migration of pending) {
    migration.run(state)
  }
  state.migrationVersion = LATEST_MIGRATION_VERSION
  return true
}
