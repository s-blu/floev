import type { GameState } from '../model/plant'
import type { UpgradeId, PotDesign } from '../model/shop'
import { UPGRADES, POT_COLORS, POT_SHAPES, POT_EFFECTS, MAX_POT_COUNT, EXTRA_POT_BASE_PRICE, EXTRA_POT_PRICE_STEP, SHOWCASE_INITIAL_SLOTS, SHOWCASE_MAX_SLOTS, SHOWCASE_POT_BASE_ID} from '../model/shop'
import { INITIAL_POT_COUNT } from './game'
import { gardenSettings } from '../model/garden_settings'
import { MAX_EXTRA_SEED_ROWS, EXTRA_SEED_ROW_PRICE, SEEDS_PER_SLOT } from '../model/genetic_model'
import { getSeedSlotCount } from './seed_storage_engine'

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

// ─── Pot effects ─────────────────────────────────────────────────────────────

export function hasPotEffect(state: GameState, effectId: string): boolean {
  const e = POT_EFFECTS.find(p => p.id === effectId)
  if (e?.free) return true
  return state.unlockedPotEffects?.includes(effectId) ?? false
}

export function buyPotEffect(state: GameState, effectId: string): boolean {
  const e = POT_EFFECTS.find(p => p.id === effectId)
  if (!e) return false
  if (hasPotEffect(state, effectId)) return false
  if (state.coins < e.price) return false

  state.coins -= e.price
  state.unlockedPotEffects = [...(state.unlockedPotEffects ?? []), effectId]
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
  const current = pot.design ?? { ...gardenSettings.defaultDesign } as PotDesign
  pot.design = { ...current, ...design }
}

export function setShowcasePotDesign(state: GameState, potId: number, design: Partial<PotDesign>): void {
  const pot = state.showcase.find(p => p.id === potId)
  if (!pot) return
  const current = pot.design ?? { ...gardenSettings.defaultDesign } as PotDesign
  pot.design = { ...current, ...design }
}

// ─── Extra showcase slot purchasing ──────────────────────────────────────────

export function getShowcaseSlotPrice(state: GameState): number {
  const treshholdPrices = [
    {from: 1, to: 6, price: 50},
    {from: 6, to: 9, price: 200},
    {from: 9, to: 12, price: 300},
  ]

  const currSlots = state.showcase.length;
  const treshold = treshholdPrices.find(t => t.from <= currSlots && currSlots < t.to)

  return treshold?.price ?? 200
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


// ─── Extra seed row purchasing ────────────────────────────────────────────────

export function canBuyExtraSeedRow(state: GameState): boolean {
  return (state.extraSeedRows ?? 0) < MAX_EXTRA_SEED_ROWS
}

export function buyExtraSeedRow(state: GameState): boolean {
  if (!canBuyExtraSeedRow(state)) return false
  if (state.coins < EXTRA_SEED_ROW_PRICE) return false
  state.coins -= EXTRA_SEED_ROW_PRICE
  state.extraSeedRows = (state.extraSeedRows ?? 0) + 1
  const newSlots = getSeedSlotCount(state)
  const targetLayoutLength = newSlots * SEEDS_PER_SLOT
  while (state.seedLayout.length < targetLayoutLength) state.seedLayout.push('')
  while (state.seedSlotLabels.length < newSlots) state.seedSlotLabels.push([])
  return true
}
