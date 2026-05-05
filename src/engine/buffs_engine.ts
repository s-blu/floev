import type { GameState } from '../model/plant';
import { type BuffId, BUFFS } from '../model/shop';
import { getBuffLevel } from './game_params';

// ─── Buff system ──────────────────────────────────────────────────────────────

export function getBuffDef(id: BuffId) {
  return BUFFS.find(b => b.id === id);
}

export function getNextBuffLevel(state: GameState, id: BuffId): number {
  return getBuffLevel(state, id) + 1;
}

export function isBuffMaxed(state: GameState, id: BuffId): boolean {
  const def = getBuffDef(id);
  return !def || getBuffLevel(state, id) >= def.levels.length;
}

export function canBuyBuff(state: GameState, id: BuffId): boolean {
  if (isBuffMaxed(state, id)) return false;
  const def = getBuffDef(id);
  if (!def) return false;
  const nextLevel = getNextBuffLevel(state, id);
  const levelDef = def.levels[nextLevel - 1];
  if (!levelDef) return false;
  return (state.researchPoints ?? 0) >= levelDef.cost;
}

export function buyBuff(state: GameState, id: BuffId): boolean {
  if (!canBuyBuff(state, id)) return false;
  const def = getBuffDef(id)!;
  const nextLevel = getNextBuffLevel(state, id);
  const levelDef = def.levels[nextLevel - 1]!;
  state.researchPoints = (state.researchPoints ?? 0) - levelDef.cost;
  state.buffs = { ...state.buffs, [id]: nextLevel };
  return true;
}
