import { UpgradeId } from "./shop";

// ─── Permanent Buffs ──────────────────────────────────────────────────────────

export type BuffId = 'faster_growth' | 'seed_luck' | 'cooldown_reduction' | 'trade_skill';

export interface BuffLevel {
  value: number; // cumulative effect value (e.g. 0.10 = 10%)
  cost: number; // research points required
}

export interface BuffDef {
  id: BuffId;
  icon: string;
  unlock_required?: UpgradeId;
  levels: BuffLevel[];
}
// ─── Buff level generators ────────────────────────────────────────────────────

function fasterGrowthLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.10, cost: 2 }, { value: 0.15, cost: 3 }];
  let v = 0.15;
  while (v < 0.75 - 0.001) {
    v = Math.round((v + 0.03) * 100) / 100;
    levels.push({ value: Math.min(v, 0.75), cost: 3 });
  }
  return levels;
}

function seedLuckLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.05, cost: 2 }];
  let v = 0.05;
  while (v < 0.35 - 0.001) {
    v = Math.round((v + 0.02) * 100) / 100;
    levels.push({ value: Math.min(v, 0.35), cost: 3 });
  }
  return levels;
}

function cooldownReductionLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.10, cost: 2 }];
  let v = 0.20;
  while (v < 0.70 - 0.001) {
    v = Math.round((v + 0.05) * 100) / 100;
    levels.push({ value: Math.min(v, 0.70), cost: 3 });
  }
  return levels;
}

function tradeSkillLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.10, cost: 2 }];
  let v = 0.10;
  while (v < 0.50 - 0.001) {
    v = Math.round((v + 0.03) * 100) / 100;
    levels.push({ value: Math.min(v, 0.50), cost: 3 });
  }
  return levels;
}

export const BUFFS: BuffDef[] = [
  {
    id: 'faster_growth',
    icon: '⚡',
    levels: fasterGrowthLevels(),
  },
  {
    id: 'seed_luck',
    icon: '🍀',
    unlock_required: 'unlock_seed_drawer',
    levels: seedLuckLevels(),
  },
  {
    id: 'cooldown_reduction',
    icon: '⏱',
    unlock_required: 'unlock_seed_drawer',
    levels: cooldownReductionLevels(),
  },
  {
    id: 'trade_skill',
    icon: '💰',
    levels: tradeSkillLevels(),
  },
];
