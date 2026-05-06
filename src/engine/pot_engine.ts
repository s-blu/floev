import type { GameState, Plant } from '../model/plant';
import { coinValueForScore } from './game';
import { getEffectiveCoinMultiplier } from './game_params';
import { randomPlant } from './genetic/genetic';
import { calcCoinScore } from './rarity';

// ─── Pot actions ─────────────────────────────────────────────────────────────

export function plantSeed(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId);
  if (!pot || pot.plant) return false;
  pot.plant = randomPlant();
  pot.phaseStart = Date.now();
  return true;
}

export function removePlant(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId);
  if (!pot) return false;
  pot.plant = null;
  pot.phaseStart = null;
  return true;
}

export function sellPlant(state: GameState, potId: number): number {
  const pot = state.pots.find(p => p.id === potId);
  if (!pot?.plant || pot.plant.phase < 4) return -1;
  const reward = coinValueForScore(calcCoinScore(pot.plant), getEffectiveCoinMultiplier(state));
  state.coins += reward;
  pot.plant = null;
  pot.phaseStart = null;
  return reward;
}

export function placeSeedInEmptyPot(state: GameState, plant: Plant): number | null {
  const pot = state.pots.find(p => !p.plant);
  if (!pot) return null;
  pot.plant = plant;
  pot.phaseStart = Date.now();
  return pot.id;
}

export function placeSeedInSpecificPot(state: GameState, plant: Plant, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId);
  if (!pot || pot.plant) return false;
  pot.plant = plant;
  pot.phaseStart = Date.now();
  return true;
}
