import type { GameState } from '../model/plant'
import { BUFFS, type BuffId } from '../model/shop'
import { PHASE_DURATION_MS } from './game'
import { SURPLUS_SEED_CHANCE, SELF_POLLINATE_SURPLUS_SEED_CHANCE, SEED_CRAFT_COOLDOWN_MS } from '../model/genetic_model'

export function getBuffLevel(state: GameState, id: string): number {
  return state.buffs?.[id] ?? 0
}

function buffValue(state: GameState, id: BuffId): number {
  const level = getBuffLevel(state, id)
  if (level === 0) return 0
  const def = BUFFS.find(b => b.id === id)
  return def?.levels[level - 1]?.value ?? 0
}

export function getEffectivePhaseDurations(state: GameState): Record<number, number> {
  const factor = 1 - buffValue(state, 'faster_growth')
  return {
    1: PHASE_DURATION_MS[1] * factor,
    2: PHASE_DURATION_MS[2] * factor,
    3: PHASE_DURATION_MS[3] * factor,
  }
}

export function getEffectiveSurplusSeedChance(state: GameState): number {
  return SURPLUS_SEED_CHANCE + buffValue(state, 'seed_luck')
}

export function getEffectiveSelfPollinateSeedChance(state: GameState): number {
  return SELF_POLLINATE_SURPLUS_SEED_CHANCE + buffValue(state, 'seed_luck')
}

export function getEffectiveCooldownMs(state: GameState): number {
  return SEED_CRAFT_COOLDOWN_MS * (1 - buffValue(state, 'cooldown_reduction'))
}

export function getEffectiveCoinMultiplier(state: GameState): number {
  return 1 + buffValue(state, 'trade_skill')
}
