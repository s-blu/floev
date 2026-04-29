import type { GameState } from '../model/plant';

// ─── Swap actions ─────────────────────────────────────────────────────────────

export function swapGardenPots(state: GameState, potId1: number, potId2: number): boolean {
  const pot1 = state.pots.find(p => p.id === potId1);
  const pot2 = state.pots.find(p => p.id === potId2);
  if (!pot1 || !pot2 || pot1 === pot2) return false;
  const tmp = { plant: pot1.plant, phaseStart: pot1.phaseStart, design: pot1.design };
  pot1.plant = pot2.plant;
  pot1.phaseStart = pot2.phaseStart;
  pot1.design = pot2.design;
  pot2.plant = tmp.plant;
  pot2.phaseStart = tmp.phaseStart;
  pot2.design = tmp.design;
  return true;
}

export function swapShowcasePots(state: GameState, potId1: number, potId2: number): boolean {
  const pot1 = state.showcase.find(p => p.id === potId1);
  const pot2 = state.showcase.find(p => p.id === potId2);
  if (!pot1 || !pot2 || pot1 === pot2) return false;
  const tmp = { plant: pot1.plant, phaseStart: pot1.phaseStart, design: pot1.design };
  pot1.plant = pot2.plant;
  pot1.phaseStart = pot2.phaseStart;
  pot1.design = pot2.design;
  pot2.plant = tmp.plant;
  pot2.phaseStart = tmp.phaseStart;
  pot2.design = tmp.design;
  return true;
}

// ─── Showcase actions ────────────────────────────────────────────────────────

export function moveToShowcase(state: GameState, potId: number): boolean {
  const pot = state.pots.find(p => p.id === potId);
  if (!pot?.plant || pot.plant.phase < 4) return false;
  const freePot = state.showcase.find(p => !p.plant);
  if (!freePot) return false;
  freePot.plant = pot.plant;
  freePot.phaseStart = pot.phaseStart;
  pot.plant = null;
  pot.phaseStart = null;
  const gardenDesign = pot.design;
  pot.design = freePot.design;
  freePot.design = gardenDesign;
  return true;
}

export function moveFromShowcase(state: GameState, showcasePotId: number): boolean {
  const showcasePot = state.showcase.find(p => p.id === showcasePotId);
  if (!showcasePot?.plant) return false;
  const freePot = state.pots.find(p => !p.plant);
  if (!freePot) return false;
  freePot.plant = showcasePot.plant;
  freePot.phaseStart = showcasePot.phaseStart;
  showcasePot.plant = null;
  showcasePot.phaseStart = null;
  const gardenDesign = freePot.design;
  freePot.design = showcasePot.design;
  showcasePot.design = gardenDesign;
  return true;
}
