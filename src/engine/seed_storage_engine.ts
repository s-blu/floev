import { MAX_SEED_STORAGE, SEED_SELL_VALUE, SEEDS_PER_SLOT } from '../model/genetic_model';
import type { GameState, Plant } from '../model/plant';

// ─── Seed storage actions ─────────────────────────────────────────────────────

export function addSeedToStorage(state: GameState, plant: Plant): boolean {
  if (state.seeds.length >= MAX_SEED_STORAGE) return false;
  state.seeds.push(plant);
  const emptyPos = state.seedLayout.findIndex(id => id === '');
  if (emptyPos !== -1) state.seedLayout[emptyPos] = plant.id;
  return true;
}

export function removeSeedFromStorage(state: GameState, seedId: string): Plant | null {
  const idx = state.seeds.findIndex(s => s.id === seedId);
  if (idx === -1) return null;
  const layoutPos = state.seedLayout.indexOf(seedId);
  if (layoutPos !== -1) state.seedLayout[layoutPos] = '';
  return state.seeds.splice(idx, 1)[0];
}

export function sellSeedFromStorage(state: GameState, seedId: string): number {
  const seed = removeSeedFromStorage(state, seedId);
  if (!seed) return -1;
  state.coins += SEED_SELL_VALUE;
  return SEED_SELL_VALUE;
}

export function moveSeedToSlot(state: GameState, seedId: string, targetSlotIdx: number): boolean {
  const currentPos = state.seedLayout.indexOf(seedId);
  if (currentPos === -1) return false;
  const slotStart = targetSlotIdx * SEEDS_PER_SLOT;
  const slotEnd = slotStart + SEEDS_PER_SLOT;
  const targetPos = state.seedLayout.slice(slotStart, slotEnd).indexOf('');
  if (targetPos === -1) return false; // target slot is full
  state.seedLayout[currentPos] = '';
  state.seedLayout[slotStart + targetPos] = seedId;
  return true;
}
