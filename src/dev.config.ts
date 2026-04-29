// Dev-only overrides — only active when running via `vite dev`.
// Flip USE_FIXED_PLANTS to true to use predetermined plants instead of random ones.

import { plannedPlant } from './engine/genetic/genetic';
import type { PlantPhase, PetalEffect } from './model/plant';


export const DEV_PHASE_DURATION_MS: Record<number, number> = {
  1: 10_000,  // 10 sec
  2: 15_000,  // 15 sec
  3: 20_000,  // 20 sec
}
export const DEV_STARTING_COINS = 200;

export const USE_FIXED_PLANTS = true;
const sharedDebugConfig = {
  hue: -4,
  petalCount: 6,
  petalEffect: 'shimmer' as PetalEffect,
  plantPhase: 3 as PlantPhase,
}
export const DEBUG_PLANTS = [
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'zickzack',
      petalCount: 8,
      hue: 5,
    }
  ),
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'zickzack',
      hue: 60,
    }
  ),
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'tropfen',
      petalCount: 4,
      hue: 220
    }
  ),
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'round',
      petalCount: 3,
      hue: 320
    }
  ),
  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'zickzack',
    }
  ),

  plannedPlant(
    {
      ...sharedDebugConfig,
      petalShape: 'lanzett',
    }
  ),
]

export const USE_FIXED_SEEDS = true;
const sharedSeedConfig = {
  hue: -4,
  petalCount: 6,
  plantPhase: 3 as PlantPhase,
}
export const DEBUG_SEEDS = [
    plannedPlant(
    {
      ...sharedSeedConfig,
      petalShape: 'round',
    }
  ),
      plannedPlant(
    {
      ...sharedSeedConfig,
      petalShape: 'lanzett',
    }
  ),
      plannedPlant(
    {
      ...sharedSeedConfig,
      petalShape: 'tropfen',
    }
  ),
      plannedPlant(
    {
      ...sharedSeedConfig,
      petalShape: 'wavy',
      petalEffect: 'shimmer'
    }
  ),
  plannedPlant(
    {
      ...sharedSeedConfig,
      petalEffect: 'iridescent',
      centerType: 'stamen',
      petalShape: 'zickzack',
    }
  ),
]

