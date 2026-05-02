import type { GameState, Plant } from '../model/plant'
import type { UpgradeId, PotDesign, BuffId, BuffReqKind, SinglePredicate, BuffRequirement } from '../model/shop'
import { UPGRADES, POT_COLORS, POT_SHAPES, POT_EFFECTS, MAX_POT_COUNT, EXTRA_POT_BASE_PRICE, EXTRA_POT_PRICE_STEP, SHOWCASE_INITIAL_SLOTS, SHOWCASE_MAX_SLOTS, SHOWCASE_POT_BASE_ID, SHOWCASE_EXTRA_SLOT_PRICE, SHOWCASE_PREMIUM_SLOT_THRESHOLD, SHOWCASE_PREMIUM_SLOT_PRICE, BUFFS } from '../model/shop'
import { INITIAL_POT_COUNT, coinValueForScore } from './game'
import { gardenSettings } from '../model/garden_settings'
import { expressedEffect, expressedShape, expressedPetalCount, hueBucket, expressedHue } from './genetic/genetic_utils'
import { calcRarity, calcRarityScore } from './rarity'
import { getBuffLevel } from './game_params'

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

// ─── Buff system ──────────────────────────────────────────────────────────────

function matchesSingle(plant: Plant, pred: SinglePredicate): boolean {
  switch (pred.kind) {
    case 'any':             return true
    case 'rarity_min':      return calcRarity(plant) >= pred.min
    case 'effect':          return expressedEffect(plant.petalEffect) === pred.effect
    case 'effect_or':       return pred.effects.includes(expressedEffect(plant.petalEffect))
    case 'petal_count':     return expressedPetalCount(plant.petalCount) === pred.count
    case 'shape':           return expressedShape(plant.petalShape) === pred.shape
    case 'shape_or':        return pred.shapes.includes(expressedShape(plant.petalShape))
    case 'color_bucket':    return hueBucket(expressedHue(plant.petalHue)) === pred.bucket
    case 'color_bucket_or': return pred.buckets.includes(hueBucket(expressedHue(plant.petalHue)))
    case 'coin_value_min':  return coinValueForScore(calcRarityScore(plant)) >= pred.min
  }
}

export function plantMatchesReq(plant: Plant, req: BuffReqKind): boolean {
  if (req.kind === 'combined') return req.predicates.every(p => matchesSingle(plant, p))
  return matchesSingle(plant, req)
}

export function canFulfillRequirements(
  potPlants: Plant[],
  seedPlants: Plant[],
  requirements: BuffRequirement[],
): boolean {
  const remainingPot  = [...potPlants]
  const remainingSeed = [...seedPlants]

  for (const reqSlot of requirements) {
    const pool = reqSlot.source === 'pot' ? remainingPot : remainingSeed
    let needed = reqSlot.count
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      if (plantMatchesReq(pool[i], reqSlot.req)) {
        pool.splice(i, 1)
        needed--
      }
    }
    if (needed > 0) return false
  }
  return true
}

export function getBuffDef(id: BuffId) {
  return BUFFS.find(b => b.id === id)
}

export function getNextBuffLevel(state: GameState, id: BuffId): number {
  return getBuffLevel(state, id) + 1
}

export function isBuffMaxed(state: GameState, id: BuffId): boolean {
  const def = getBuffDef(id)
  return !def || getBuffLevel(state, id) >= def.levels.length
}

export function canRedeemBuff(state: GameState, id: BuffId, potIds: number[], seedIds: string[]): boolean {
  if (isBuffMaxed(state, id)) return false
  const def = getBuffDef(id)
  if (!def) return false
  if (def.unlock_required && !hasUpgrade(state, def.unlock_required)) return false

  const nextLevel = getNextBuffLevel(state, id)
  const levelDef = def.levels[nextLevel - 1]
  if (!levelDef) return false

  const potPlants  = potIds.map(id => state.pots.find(p => p.id === id)?.plant).filter((p): p is Plant => !!p && p.phase === 4)
  const seedPlants = seedIds.map(id => state.seeds.find(s => s.id === id)).filter((p): p is Plant => !!p)

  return canFulfillRequirements(potPlants, seedPlants, levelDef.requirements)
}

export function redeemBuff(state: GameState, id: BuffId, potIds: number[], seedIds: string[]): boolean {
  if (!canRedeemBuff(state, id, potIds, seedIds)) return false

  for (const potId of potIds) {
    const pot = state.pots.find(p => p.id === potId)
    if (pot?.plant) {
      pot.plant = null
      pot.phaseStart = null
    }
  }
  for (const seedId of seedIds) {
    const idx = state.seeds.findIndex(s => s.id === seedId)
    if (idx >= 0) {
      state.seeds.splice(idx, 1)
      const layoutIdx = state.seedLayout.indexOf(seedId)
      if (layoutIdx >= 0) state.seedLayout[layoutIdx] = ''
    }
  }

  state.buffs = { ...state.buffs, [id]: getNextBuffLevel(state, id) }
  return true
}
