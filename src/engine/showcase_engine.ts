import type { GameState } from '../model/plant';

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
