import type { GameState, Plant } from '../model/plant'
import type { SlotCriteria, CollectionDef, CollectionInstanceState } from '../model/collections'
import { COLLECTION_DEFS, getCollectionDef } from './collection_defs'
import { expressedShape, expressedCenter, expressedEffect, expressedColor, expressedPetalCount, expressedLightness, colorBucket } from './genetic/genetic_utils'
import { calcRarity } from './rarity'

export const COLLECTIONS_DISPLAY_SLOTS = 4

// ─── Matching ─────────────────────────────────────────────────────────────────

export function slotMatchesPlant(criteria: SlotCriteria, plant: Plant): boolean {
  if (criteria.shape !== undefined && expressedShape(plant.petalShape) !== criteria.shape) return false
  if (criteria.centerType !== undefined && expressedCenter(plant.centerType) !== criteria.centerType) return false
  if (criteria.effect !== undefined && expressedEffect(plant.petalEffect) !== criteria.effect) return false
  if (criteria.petalCount !== undefined && expressedPetalCount(plant.petalCount) !== criteria.petalCount) return false
  if (criteria.lightness !== undefined && expressedLightness(plant.petalLightness) !== criteria.lightness) return false
  if (criteria.colorBucket !== undefined) {
    const color = expressedColor(plant.petalHue, plant.petalLightness)
    if (colorBucket(color) !== criteria.colorBucket) return false
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
  if (cond.type === 'catalog_size') {
    return state.catalog.length >= cond.threshold
  }
  if (cond.type === 'after_collection') {
    const instance = state.collections?.instances.find(i => i.collectionId === cond.collectionId)
    return instance?.completedAt !== undefined
  }
  return false
}

export function getVisibleCollections(state: GameState): CollectionDef[] {
  return COLLECTION_DEFS.filter(def => isCollectionUnlocked(def, state))
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
  }
  state.collections!.instances.push(instance)
  return instance
}

export function initCollectionsState(state: GameState): void {
  if (!state.collections) {
    state.collections = {
      instances: [],
      displaySlots: Array(COLLECTIONS_DISPLAY_SLOTS).fill(null),
    }
  }
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
  if (!slotMatchesPlant(slot, pot.plant)) return false

  const instance = getOrCreateInstance(state, collectionId)
  if (instance.slots[slotIndex].plant !== null) return false

  instance.slots[slotIndex].plant = pot.plant
  pot.plant = null
  pot.phaseStart = null

  checkCollectionCompletion(state, collectionId)
  return true
}

// ─── Completion ───────────────────────────────────────────────────────────────

function checkCollectionCompletion(state: GameState, collectionId: string): void {
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
    if (instance.slots.every(s => s.plant !== null)) {
      instance.completedAt = Date.now()
      newlyCompleted.push(instance.collectionId)
    }
  }
  return newlyCompleted
}

// ─── Display slots ────────────────────────────────────────────────────────────

export function moveToDisplay(state: GameState, collectionId: string, slotIndex: number): boolean {
  if (!state.collections) return false
  const instance = state.collections.instances.find(i => i.collectionId === collectionId)
  if (!instance?.completedAt) return false
  if (state.collections.displaySlots[slotIndex] !== null) return false
  state.collections.displaySlots[slotIndex] = collectionId
  return true
}

export function moveFromDisplay(state: GameState, slotIndex: number): boolean {
  if (!state.collections) return false
  if (state.collections.displaySlots[slotIndex] === null) return false
  state.collections.displaySlots[slotIndex] = null
  return true
}
