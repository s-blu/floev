import type { Plant, GameState } from '../model/plant';
import { type SinglePredicate, type BuffReqKind, type BuffRequirement, type BuffId, BUFFS } from '../model/shop';
import { coinValueForScore } from './game';
import { getBuffLevel } from './game_params';
import { expressedEffect, expressedPetalCount, expressedShape, hueBucket, expressedHue } from './genetic/genetic_utils';
import { calcRarity, calcRarityScore } from './rarity';
import { hasUpgrade } from './shop_engine';

// ─── Buff system ──────────────────────────────────────────────────────────────
function matchesSingle(plant: Plant, pred: SinglePredicate): boolean {
  switch (pred.kind) {
    case 'any': return true;
    case 'rarity_min': return calcRarity(plant) >= pred.min;
    case 'effect': return expressedEffect(plant.petalEffect) === pred.effect;
    case 'effect_or': return pred.effects.includes(expressedEffect(plant.petalEffect));
    case 'petal_count': return expressedPetalCount(plant.petalCount) === pred.count;
    case 'shape': return expressedShape(plant.petalShape) === pred.shape;
    case 'shape_or': return pred.shapes.includes(expressedShape(plant.petalShape));
    case 'color_bucket': return hueBucket(expressedHue(plant.petalHue)) === pred.bucket;
    case 'color_bucket_or': return pred.buckets.includes(hueBucket(expressedHue(plant.petalHue)));
    case 'coin_value_min': return coinValueForScore(calcRarityScore(plant)) >= pred.min;
  }
}

export function plantMatchesReq(plant: Plant, req: BuffReqKind): boolean {
  if (req.kind === 'combined') return req.predicates.every(p => matchesSingle(plant, p));
  return matchesSingle(plant, req);
}

export function canFulfillRequirements(
  potPlants: Plant[],
  seedPlants: Plant[],
  requirements: BuffRequirement[]
): boolean {
  const remainingPot = [...potPlants];
  const remainingSeed = [...seedPlants];

  for (const reqSlot of requirements) {
    const pool = reqSlot.source === 'pot' ? remainingPot : remainingSeed;
    let needed = reqSlot.count;
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      if (plantMatchesReq(pool[i], reqSlot.req)) {
        pool.splice(i, 1);
        needed--;
      }
    }
    if (needed > 0) return false;
  }
  return true;
}

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

export function canRedeemBuff(state: GameState, id: BuffId, potIds: number[], seedIds: string[]): boolean {
  if (isBuffMaxed(state, id)) return false;
  const def = getBuffDef(id);
  if (!def) return false;
  if (def.unlock_required && !hasUpgrade(state, def.unlock_required)) return false;

  const nextLevel = getNextBuffLevel(state, id);
  const levelDef = def.levels[nextLevel - 1];
  if (!levelDef) return false;

  const potPlants = potIds.map(id => state.pots.find(p => p.id === id)?.plant).filter((p): p is Plant => !!p && p.phase === 4);
  const seedPlants = seedIds.map(id => state.seeds.find(s => s.id === id)).filter((p): p is Plant => !!p);

  return canFulfillRequirements(potPlants, seedPlants, levelDef.requirements);
}

export function redeemBuff(state: GameState, id: BuffId, potIds: number[], seedIds: string[]): boolean {
  if (!canRedeemBuff(state, id, potIds, seedIds)) return false;

  for (const potId of potIds) {
    const pot = state.pots.find(p => p.id === potId);
    if (pot?.plant) {
      pot.plant = null;
      pot.phaseStart = null;
    }
  }
  for (const seedId of seedIds) {
    const idx = state.seeds.findIndex(s => s.id === seedId);
    if (idx >= 0) {
      state.seeds.splice(idx, 1);
      const layoutIdx = state.seedLayout.indexOf(seedId);
      if (layoutIdx >= 0) state.seedLayout[layoutIdx] = '';
    }
  }

  state.buffs = { ...state.buffs, [id]: getNextBuffLevel(state, id) };
  return true;
}
