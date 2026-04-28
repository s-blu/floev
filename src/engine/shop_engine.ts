import type { GameState } from '../model/plant'
import type { UpgradeId, PotDesign } from '../model/shop'
import { UPGRADES, POT_COLORS, POT_SHAPES, MAX_POT_COUNT, EXTRA_POT_BASE_PRICE, EXTRA_POT_PRICE_STEP, SHOWCASE_INITIAL_SLOTS, SHOWCASE_MAX_SLOTS, SHOWCASE_POT_BASE_ID, SHOWCASE_EXTRA_SLOT_PRICE, SHOWCASE_PREMIUM_SLOT_THRESHOLD, SHOWCASE_PREMIUM_SLOT_PRICE } from '../model/shop'
import { INITIAL_POT_COUNT } from './game'

// ─── Upgrade helpers ──────────────────────────────────────────────────────────

export function hasUpgrade(state: GameState, id: UpgradeId): boolean {
  return state.upgrades?.includes(id) ?? false
}

export function buyUpgrade(state: GameState, id: UpgradeId): boolean {
  const upgrade = UPGRADES.find(u => u.id === id)
  if (!upgrade) return false
  if (hasUpgrade(state, id)) return false
  if (state.coins < upgrade.price) return false

  state.coins -= upgrade.price
  state.upgrades = [...(state.upgrades ?? []), id]

  if (id === 'unlock_showcase') {
    for (let i = 0; i < SHOWCASE_INITIAL_SLOTS; i++) {
      state.showcase.push({ id: SHOWCASE_POT_BASE_ID + i, plant: null, phaseStart: null })
    }
  }

  return true
}

// ─── Cosmetics helpers ────────────────────────────────────────────────────────

export function hasPotColor(state: GameState, colorId: string): boolean {
  const color = POT_COLORS.find(c => c.id === colorId)
  if (color?.free) return true
  return state.unlockedPotColors?.includes(colorId) ?? false
}

export function hasPotShape(state: GameState, shape: string): boolean {
  const s = POT_SHAPES.find(p => p.id === shape)
  if (s?.free) return true
  return state.unlockedPotShapes?.includes(shape) ?? false
}

export function buyPotColor(state: GameState, colorId: string): boolean {
  const color = POT_COLORS.find(c => c.id === colorId)
  if (!color) return false
  if (hasPotColor(state, colorId)) return false
  if (state.coins < color.price) return false

  state.coins -= color.price
  state.unlockedPotColors = [...(state.unlockedPotColors ?? []), colorId]
  return true
}

export function buyPotShape(state: GameState, shape: string): boolean {
  const s = POT_SHAPES.find(p => p.id === shape)
  if (!s) return false
  if (hasPotShape(state, shape)) return false
  if (state.coins < s.price) return false

  state.coins -= s.price
  state.unlockedPotShapes = [...(state.unlockedPotShapes ?? []), shape]
  return true
}

// ─── Extra pot purchasing ─────────────────────────────────────────────────────

export function getExtraPotPrice(state: GameState): number {
  const bought = Math.max(0, state.pots.length - INITIAL_POT_COUNT)
  return EXTRA_POT_BASE_PRICE + bought * EXTRA_POT_PRICE_STEP
}

export function canBuyExtraPot(state: GameState): boolean {
  return state.pots.length < MAX_POT_COUNT
}

export function buyExtraPot(state: GameState): boolean {
  if (!canBuyExtraPot(state)) return false
  const price = getExtraPotPrice(state)
  if (state.coins < price) return false

  state.coins -= price
  state.pots.push({ id: state.pots.length, plant: null, phaseStart: null })
  return true
}

// ─── Pot design ───────────────────────────────────────────────────────────────

export function setPotDesign(state: GameState, potId: number, design: Partial<PotDesign>): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return
  const current = pot.design ?? { colorId: 'terracotta', shape: 'standard' }
  pot.design = { ...current, ...design }
}

export function setShowcasePotDesign(state: GameState, potId: number, design: Partial<PotDesign>): void {
  const pot = state.showcase.find(p => p.id === potId)
  if (!pot) return
  const current = pot.design ?? { colorId: 'terracotta', shape: 'standard' }
  pot.design = { ...current, ...design }
}

// ─── Extra showcase slot purchasing ──────────────────────────────────────────

export function getShowcaseSlotPrice(state: GameState): number {
  return state.showcase.length >= SHOWCASE_PREMIUM_SLOT_THRESHOLD
    ? SHOWCASE_PREMIUM_SLOT_PRICE
    : SHOWCASE_EXTRA_SLOT_PRICE
}

export function canBuyExtraShowcaseSlot(state: GameState): boolean {
  return state.showcase.length < SHOWCASE_MAX_SLOTS
}

export function buyExtraShowcaseSlot(state: GameState): boolean {
  if (!canBuyExtraShowcaseSlot(state)) return false
  const price = getShowcaseSlotPrice(state)
  if (state.coins < price) return false
  state.coins -= price
  state.showcase.push({ id: SHOWCASE_POT_BASE_ID + state.showcase.length, plant: null, phaseStart: null })
  return true
}
