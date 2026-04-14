import type { GameState } from '../model/plant'
import type { UpgradeId, PotDesign } from '../model/shop'
import { UPGRADES, POT_COLORS, POT_SHAPES } from '../model/shop'

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

  // If buying a pot upgrade, add a new pot to the garden
  if (id === 'unlock_pot_10' || id === 'unlock_pot_11' || id === 'unlock_pot_12') {
    const newId = state.pots.length
    state.pots.push({ id: newId, plant: null, phaseStart: null })
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

export function setPotDesign(state: GameState, design: Partial<PotDesign>): void {
  state.potDesign = { ...(state.potDesign ?? { colorId: 'terracotta', shape: 'standard' }), ...design }
}
