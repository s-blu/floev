import type { GameState } from '../model/plant'
import { calcRarityScore, calcRarity } from './rarity'

// ─── Migration system ─────────────────────────────────────────────────────────

interface Migration {
  version: number
  run: (state: GameState) => void
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
