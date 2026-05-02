import type { GameState, ChromaticL, CatalogEntry } from '../model/plant'
import { calcRarityScore, calcRarity } from './rarity'
import { catalogKey, getPlantName } from './catalog'

// Old gray sentinel values, kept only for migration purposes.
const _LEGACY_GRAY_DARK  = -2
const _LEGACY_GRAY_MID   = -3
const _LEGACY_GRAY_LIGHT = -4

function legacyGrayToLightness(h: number): ChromaticL | null {
  if (h === _LEGACY_GRAY_DARK)  return 30
  if (h === _LEGACY_GRAY_MID)   return 60
  if (h === _LEGACY_GRAY_LIGHT) return 90
  return null
}

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
    version: 3,
    run(state) {
      state.achievements.unlocked = state.achievements.unlocked.filter(id => id !== 'color_div_8')
      state.achievements.rewarded = state.achievements.rewarded.filter(id => id !== 'color_div_8')
    },
  },
  {
    version: 4,
    run(state) {
      
      const potPlants     = state.pots.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[]
      const showcasePlants = state.showcase.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[]
      const catalogPlants = state.catalog.map(e => e.plant)
      const allPlants     = [...potPlants, ...showcasePlants, ...catalogPlants, ...state.seeds]
console.log('migration 4', allPlants)
      for (const plant of allPlants) {
        const lA = legacyGrayToLightness(plant.petalHue.a)
        if (lA !== null) { plant.petalLightness.a = lA; plant.petalHue.a = -2 }
        const lB = legacyGrayToLightness(plant.petalHue.b)
        if (lB !== null) { plant.petalLightness.b = lB; plant.petalHue.b = -2 }
      }
      for (const entry of state.catalog) {
        entry.key = catalogKey(entry.plant)
      }
    },
  },
  {
    version: 5,
    run(state) {
      const COMPENSATION_PER_LOST_ENTRY = 10

      function snapCount(n: number): number {
        if (n <= 3.5) return 3
        if (n <= 6)   return 5
        return 8
      }

      const allPlants = [
        ...state.pots.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[],
        ...state.showcase.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[],
        ...state.catalog.map(e => e.plant),
        ...state.seeds,
      ]
      for (const plant of allPlants) {
        plant.petalCount.a = snapCount(plant.petalCount.a) as import('../model/plant').PetalCount
        plant.petalCount.b = snapCount(plant.petalCount.b) as import('../model/plant').PetalCount
      }

      const seen = new Set<string>()
      const deduped: CatalogEntry[] = []
      let lostEntries = 0
      for (const entry of state.catalog) {
        entry.key = catalogKey(entry.plant)
        if (!seen.has(entry.key)) { seen.add(entry.key); deduped.push(entry) }
        else lostEntries++
      }
      state.catalog = deduped
      state.catalog.sort((a, b) => b.rarityScore - a.rarityScore)
      state.coins += lostEntries * COMPENSATION_PER_LOST_ENTRY

      if (lostEntries > 0) {
        state.pendingMigrationNotice = {
          lostCatalogEntries: lostEntries,
          compensation: lostEntries * COMPENSATION_PER_LOST_ENTRY,
        }
      }
    },
  },
  {
    version: 6,
    run(state) {
      const allPlants = [
        ...state.pots.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[],
        ...state.showcase.map(p => p.plant).filter(Boolean) as import('../model/plant').Plant[],
        ...state.catalog.map(e => e.plant),
        ...state.seeds,
      ]
      for (const plant of allPlants) {
        if ((plant.petalCount.a as number) === 7) plant.petalCount.a = 8
        if ((plant.petalCount.b as number) === 7) plant.petalCount.b = 8
      }
      for (const entry of state.catalog) {
        entry.key = catalogKey(entry.plant)
      }
    },
  },
  {
    version: 7,
    run(state) {
      for (const entry of state.catalog) {
        entry.plantname = getPlantName(entry.plant)
      }
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
