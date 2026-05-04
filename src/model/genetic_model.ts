
/**
 * Color dominance buckets — used for the HUE locus only.
 * "white" and "gray" are achromatic sentinels encoded in petalHue.
 */

import type { CenterType, ChromaticL, PetalShape,PetalEffect, StemTypes } from './plant';

export const STEM_TYPES: StemTypes[] = ["two-leaved-stem"]

export type ColorBucket = 'white' | 'yellowgreen' | 'red' | 'pink' | 'purple' | 'blue' | 'gray';
export const PALETTE_HUE_RANGES = {
  yellowgreen: (hue: number): boolean => 25 < hue && hue <= 175,
  red:         (hue: number): boolean => hue <= 25 || hue > 345,
  blue:        (hue: number): boolean => 175 < hue && hue <= 245,
  purple:      (hue: number): boolean => 245 < hue && hue <= 275,
  pink:        (hue: number): boolean => 275 < hue && hue <= 345,
};

export const CENTER_COLORS = {
  default: { h: 40, s: 100, l: 95 },
  90: { h: 60, s: 90, l: 80 },
  60: { h: 60, s: 90, l: 50 },
  30: { h: 40, s: 90, l: 60 },
}
// ─── Constants ───────────────────────────────────────────────────────────────

export const PETAL_SHAPES: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']
export const SHAPE_ALLELE_POOL_EXCLUDED_RARES: PetalShape[] = [
  ...Array(35).fill('round'),
  ...Array(25).fill('lanzett'),
  ...Array(18).fill('tropfen'),
  ...Array(4).fill('wavy'),
];
export const SHAPE_ALLELE_POOL: PetalShape[] = [
  ...SHAPE_ALLELE_POOL_EXCLUDED_RARES,
  ...Array(10).fill('wavy'),
  ...Array(8).fill('zickzack'),
];

// ─── Petal effects ────────────────────────────────────────────────────────────

export const PETAL_EFFECTS: PetalEffect[] = [
  'none', 'bicolor', 'gradient', 'shimmer', 'iridescent',
]

/**
 * Allele pool for petalEffect in wild/random plants.
 *
 * Probabilities per allele draw:
 *   none        ~62%   (dominant, common)
 *   bicolor     ~20%   (uncommon)
 *   gradient    ~10%   (rare — expressed only when homozygous or vs none)
 *   shimmer      ~5%   (epic)
 *   iridescent   ~1%   (legendary rarity)
 */
function buildEffectAllelePool(): PetalEffect[] {
  const pool: PetalEffect[] = []
  for (let i = 0; i < 62; i++) pool.push('none')
  for (let i = 0; i < 20; i++) pool.push('bicolor')
  for (let i = 0; i < 10; i++) pool.push('gradient')
  for (let i = 0;  i < 5; i++) pool.push('shimmer')
  for (let i = 0;  i < 1; i++) pool.push('iridescent')
  return pool
}
export const EFFECT_ALLELE_POOL = buildEffectAllelePool()

// ─── Achromatic sentinel hues ─────────────────────────────────────────────────
//
// These are special out-of-range values stored in the petalHue locus to encode
// achromatic colours.  They are never real hue degrees.
// WHITE ignores petalLightness (single fixed colour).
// GRAY uses petalLightness normally, like any chromatic hue.
//
export const ACHROMATIC_HUE_WHITE = -1
export const ACHROMATIC_HUE_GRAY  = -2

export const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

export const MUTATION_CHANCE = 0.04

/** @deprecated use EFFECT_ALLELE_POOL instead — kept briefly for migration */
export const GRADIENT_ALLELE_CHANCE_RANDOM = 0.28

export const MIN_STEM_HEIGHT = 0.35

export const PALETTE_S = 90;
// ─── Palette hues ─────────────────────────────────────────────────────────────
//---------------------------red   / yellgr  / blue / purple   / pink        / red
export const PALETTE_HUES = [5, 25, 60, 160, 180, 200, 230, 255, 270, 290, 310, 330, 350] as const
export const PALETTE_HUES_BUCKETS = {
  yellowgreen: PALETTE_HUES.filter(PALETTE_HUE_RANGES.yellowgreen),
  red:         PALETTE_HUES.filter(PALETTE_HUE_RANGES.red),
  blue:        PALETTE_HUES.filter(PALETTE_HUE_RANGES.blue),
  purple:      PALETTE_HUES.filter(PALETTE_HUE_RANGES.purple),
  pink:        PALETTE_HUES.filter(PALETTE_HUE_RANGES.pink),
}

export const PALETTE_L = [30, 60, 90] as const

// ─── Allele pools for randomPlant ────────────────────────────────────────────
function buildHueAllelePool(): number[] {
  const pool: number[] = [];

  // White: häufig
  for (let i = 0; i < 12; i++) pool.push(ACHROMATIC_HUE_WHITE);

  // Chromatic hues — frequency independent of lightness now
  for (const h of PALETTE_HUES) {
    for (let i = 0; i < 9; i++) pool.push(h); // equal weight per hue
  }

  // Grays: sehr selten
  for (let i = 0; i < 6; i++) {
    pool.push(ACHROMATIC_HUE_GRAY);
  }
  return pool;
}

function buildLightnessAllelePool(): ChromaticL[] {
  const pool: ChromaticL[] = [];
  for (let i = 0; i < 5; i++) pool.push(90); // light — häufig
  for (let i = 0; i < 3; i++) pool.push(60); // mid
  for (let i = 0; i < 1; i++) pool.push(30); // dark — selten
  return pool;
}
export const HUE_ALLELE_POOL       = buildHueAllelePool();
export const LIGHTNESS_ALLELE_POOL = buildLightnessAllelePool();
export const RARE_SHAPES: PetalShape[] = ['wavy', 'zickzack'];
export const RARE_EFFECTS: PetalEffect[] = ['shimmer', 'iridescent'];

// ─── Saatenschublade ──────────────────────────────────────────────────────────

export const SAATENSCHUBLADE_SLOTS = 20
export const SEEDS_PER_SLOT = 5
export const MAX_SEED_STORAGE = SAATENSCHUBLADE_SLOTS * SEEDS_PER_SLOT
export const SEED_SLOTS_PER_ROW = 4
export const MAX_EXTRA_SEED_ROWS = 3
export const EXTRA_SEED_ROW_PRICE = 250
export const SURPLUS_SEED_CHANCE = 0.15
export const SELF_POLLINATE_SURPLUS_SEED_CHANCE = 0.2
export const MAX_SURPLUS_SEEDS_PER_PLANT = 3
export const SEED_SELL_VALUE = 5
export const SEED_CRAFT_COOLDOWN_MS = 20 * 60 * 60 * 1000
export const MULTI_SEED_COUNT_MIN = 3
export const MULTI_SEED_COUNT_MAX = 5
