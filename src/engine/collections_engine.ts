import type { GameState, Plant } from '../model/plant'
import type { SlotCriteria, CollectionDef, CollectionInstanceState } from '../model/collections'
import {
  COLLECTION_DEFS,
  getCollectionDef,
  buildFreeCollectionDef,
  FREE_HERBARIUM_MIN_SIZE,
  FREE_HERBARIUM_MAX_SIZE,
  FREE_BK_MIN_SIZE,
  FREE_BK_MAX_SIZE,
} from './collection_defs'
import { expressedShape, expressedCenter, expressedEffect, expressedColor, expressedPetalCount, expressedLightness, colorBucket } from './genetic/genetic_utils'
import { calcRarity } from './rarity'

export const MAX_FAVORITES = 4

// ─── Matching ─────────────────────────────────────────────────────────────────

export function slotMatchesPlant(criteria: SlotCriteria, plant: Plant): boolean {
  if (criteria.shape !== undefined && expressedShape(plant.petalShape) !== criteria.shape) return false
  if (criteria.centerType !== undefined && expressedCenter(plant.centerType) !== criteria.centerType) return false
  if (criteria.effect !== undefined && expressedEffect(plant.petalEffect) !== criteria.effect) return false
  if (criteria.petalCount !== undefined && expressedPetalCount(plant.petalCount) !== criteria.petalCount) return false
  if (criteria.lightness !== undefined && expressedLightness(plant.petalLightness) !== criteria.lightness) return false
  if (criteria.hue !== undefined || criteria.colorBucket !== undefined) {
    const color = expressedColor(plant.petalHue, plant.petalLightness)
    if (criteria.hue !== undefined && color.h !== criteria.hue) return false
    if (criteria.colorBucket !== undefined && colorBucket(color) !== criteria.colorBucket) return false
  }
  if (criteria.minRarity !== undefined && calcRarity(plant) < criteria.minRarity) return false
  return true
}

export function getEligiblePots(criteria: SlotCriteria, state: GameState): number[] {
  return state.pots
    .filter(p => p.plant && p.plant.phase === 4 && slotMatchesPlant(criteria, p.plant))
    .map(p => p.id)
}

// ─── Unlock logic ─────────────────────────────────────────────────────────────

export function isCollectionUnlocked(def: CollectionDef, state: GameState): boolean {
  const cond = def.unlockCondition
  if (!cond) return true
  if (cond.type === 'catalog_size') {
    return state.catalog.length >= cond.threshold
  }
  if (cond.type === 'after_collection') {
    const instance = state.collections?.instances.find(i => i.collectionId === cond.collectionId)
    return instance?.completedAt !== undefined
  }
  if (cond.type === 'catalog_has') {
    return state.catalog.some(e => slotMatchesPlant(cond.criteria, e.plant))
  }
  if (cond.type === 'catalog_has_any') {
    return cond.criteriaList.some(criteria => state.catalog.some(e => slotMatchesPlant(criteria, e.plant)))
  }
  return false
}

export function getVisibleCollections(state: GameState): CollectionDef[] {
  const defined = COLLECTION_DEFS.filter(def => isCollectionUnlocked(def, state))
  const freeHerbs = Array.from(
    { length: state.freeHerbariumCount ?? 0 },
    (_, i) => buildFreeCollectionDef('herbarium', i),
  )
  const freeBks = Array.from(
    { length: state.freeBkCount ?? 0 },
    (_, i) => buildFreeCollectionDef('blumenkasten', i),
  )
  return [...defined, ...freeHerbs, ...freeBks]
}

// ─── Instance management ──────────────────────────────────────────────────────

export function getOrCreateInstance(state: GameState, collectionId: string): CollectionInstanceState {
  if (!state.collections) initCollectionsState(state)
  const existing = state.collections!.instances.find(i => i.collectionId === collectionId)
  if (existing) return existing
  const def = getCollectionDef(collectionId)
  if (!def) throw new Error(`Unknown collection: ${collectionId}`)
  const instance: CollectionInstanceState = {
    collectionId,
    slots: def.slots.map(() => ({ plant: null })),
    activeSize: def.freeForm
      ? (def.vessel === 'herbarium' ? FREE_HERBARIUM_MIN_SIZE : FREE_BK_MIN_SIZE)
      : undefined,
  }
  state.collections!.instances.push(instance)
  return instance
}

export function initCollectionsState(state: GameState): void {
  if (!state.collections) {
    state.collections = {
      instances: [],
      favorites: [],
    }
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function addFavorite(state: GameState, collectionId: string): boolean {
  if (!state.collections) return false
  const favs = state.collections.favorites
  if (favs.includes(collectionId)) return false
  if (favs.length >= MAX_FAVORITES) return false
  favs.push(collectionId)
  return true
}

export function removeFavorite(state: GameState, collectionId: string): boolean {
  if (!state.collections) return false
  const idx = state.collections.favorites.indexOf(collectionId)
  if (idx === -1) return false
  state.collections.favorites.splice(idx, 1)
  return true
}

// ─── Fill slot ────────────────────────────────────────────────────────────────

export function fillSlot(
  state: GameState,
  collectionId: string,
  slotIndex: number,
  potId: number,
): boolean {
  const def = getCollectionDef(collectionId)
  if (!def) return false
  const slot = def.slots[slotIndex]
  if (!slot) return false

  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase !== 4) return false

  const instance = getOrCreateInstance(state, collectionId)

  if (def.freeForm) {
    const minSize = def.vessel === 'herbarium' ? FREE_HERBARIUM_MIN_SIZE : FREE_BK_MIN_SIZE
    if (slotIndex >= (instance.activeSize ?? minSize)) return false
  } else {
    if (!slotMatchesPlant(slot, pot.plant)) return false
  }

  if (instance.slots[slotIndex].plant !== null) return false

  instance.slots[slotIndex].plant = pot.plant
  pot.plant = null
  pot.phaseStart = null

  checkCollectionCompletion(state, collectionId)
  return true
}

// ─── Clear slot ───────────────────────────────────────────────────────────────

export function clearSlot(state: GameState, collectionId: string, slotIndex: number): boolean {
  const instance = state.collections?.instances.find(i => i.collectionId === collectionId)
  if (!instance || instance.slots[slotIndex]?.plant === null) return false
  instance.slots[slotIndex].plant = null
  instance.completedAt = undefined
  return true
}

// ─── Completion ───────────────────────────────────────────────────────────────

function checkCollectionCompletion(state: GameState, collectionId: string): void {
  const def = getCollectionDef(collectionId)
  if (def?.freeForm) return
  const instance = state.collections?.instances.find(i => i.collectionId === collectionId)
  if (!instance || instance.completedAt !== undefined) return
  if (instance.slots.every(s => s.plant !== null)) {
    instance.completedAt = Date.now()
  }
}

export function checkAllCollectionCompletions(state: GameState): string[] {
  if (!state.collections) return []
  const newlyCompleted: string[] = []
  for (const instance of state.collections.instances) {
    if (instance.completedAt !== undefined) continue
    const def = getCollectionDef(instance.collectionId)
    if (def?.freeForm) continue
    if (instance.slots.every(s => s.plant !== null)) {
      instance.completedAt = Date.now()
      newlyCompleted.push(instance.collectionId)
    }
  }
  return newlyCompleted
}

// ─── Free collection size ─────────────────────────────────────────────────────

export function setFreeCollectionSize(state: GameState, collectionId: string, newSize: number): boolean {
  const def = getCollectionDef(collectionId)
  if (!def?.freeForm) return false
  const minSize = def.vessel === 'herbarium' ? FREE_HERBARIUM_MIN_SIZE : FREE_BK_MIN_SIZE
  const maxSize = def.vessel === 'herbarium' ? FREE_HERBARIUM_MAX_SIZE : FREE_BK_MAX_SIZE
  if (newSize < minSize || newSize > maxSize) return false
  const instance = getOrCreateInstance(state, collectionId)
  if (instance.slots.slice(newSize).some(s => s.plant !== null)) return false
  instance.activeSize = newSize
  return true
}

