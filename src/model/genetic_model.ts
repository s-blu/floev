
/**
 * Color dominance buckets — used for the HUE locus only.
 * "white" and "gray" are achromatic sentinels encoded in petalHue.
 */

import type { CenterType, HSLColor, PetalShape } from './plant';

export type ColorBucket = 'white' | 'yellow' | 'red' | 'pink' | 'purple' | 'blue' | 'green' | 'gray';
export const PALETTE_HUE_RANGES = {
  yellow: (hue: number): boolean => 35 < hue && hue <= 60,
  red: (hue: number): boolean => hue <= 35 || hue > 345,
  green: (hue: number): boolean => 60 < hue && hue <= 155,
  blue: (hue: number): boolean => 155 < hue && hue <= 240,
  purple: (hue: number): boolean => 240 < hue && hue <= 275,
  pink: (hue: number): boolean => 275 < hue && hue <= 345,
};
// Lower index = more dominant

export const CENTER_COLORS = [
  { h: 40, s: 100, l: 95 }, // creme
  { h: 120, s: 50, l: 80 }, // grün
  { h: 55, s: 100, l: 50 }, // kräftiges gelb
  { h: 20, s: 100, l: 65 }, // kräftiges orange
];

// ─── Constants ───────────────────────────────────────────────────────────────

export const PETAL_SHAPES: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']
export const SHAPE_ALLELE_POOL_EXCLUDED_RARES: PetalShape[] = [
  ...Array(35).fill('round'),
  ...Array(25).fill('lanzett'),
  ...Array(18).fill('tropfen'),
  ...Array(10).fill('wavy'),
];
export const SHAPE_ALLELE_POOL: PetalShape[] = [
  ...SHAPE_ALLELE_POOL_EXCLUDED_RARES,
  ...Array(4).fill('wavy'),
  ...Array(8).fill('zickzack'),
];


// ─── Achromatic sentinel hues ─────────────────────────────────────────────────
//
// These are special out-of-range values stored in the petalHue locus to encode
// achromatic colours.  They are never real hue degrees.
// When one of these is the expressed hue, petalLightness is ignored.
//

export const ACHROMATIC_HUE_WHITE = -1
export const ACHROMATIC_HUE_GRAY_DARK = -2
export const ACHROMATIC_HUE_GRAY_MID = -3
export const ACHROMATIC_HUE_GRAY_LIGHT = -4;
export const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

export const MUTATION_CHANCE = 0.04

// Gradient allele chances:
// RANDOM: probability that a wild plant carries a gradient allele (true)
// KEEP: probability that an inherited gradient allele stays true (vs. flipping to false)
// GAIN: probability that a false allele mutates to true during breeding
export const GRADIENT_ALLELE_CHANCE_RANDOM = 0.28
export const GRADIENT_ALLELE_KEEP_CHANCE = 0.55
export const GRADIENT_ALLELE_GAIN_CHANCE = 0.06

export const MIN_STEM_HEIGHT = 0.35

export const PALETTE_S = 90;
// ─── Palette hues ─────────────────────────────────────────────────────────────
//                    red   / y / turquoise / blue / purple   / pink        / red

export const PALETTE_HUES = [0, 25, 60, 160, 180, 200, 230, 250, 270, 290, 310, 330, 350] as const
export const PALETTE_HUES_BUCKETS = {
  yellow: PALETTE_HUES.filter(PALETTE_HUE_RANGES.yellow),
  red: PALETTE_HUES.filter(PALETTE_HUE_RANGES.red),
  green: PALETTE_HUES.filter(PALETTE_HUE_RANGES.green),
  blue: PALETTE_HUES.filter(PALETTE_HUE_RANGES.blue),
  purple: PALETTE_HUES.filter(PALETTE_HUE_RANGES.purple),
  pink: PALETTE_HUES.filter(PALETTE_HUE_RANGES.pink),
}

export const PALETTE_L = [30, 60, 90] as const

// ─── Achromatic legacy color objects (used by centerColor) ────────────────────

export const COLOR_WHITE: HSLColor = { h: 0, s: 0, l: 100 }
export const COLOR_GRAY_DARK: HSLColor = { h: 0, s: 0, l: 0 }
export const COLOR_GRAY_MID: HSLColor = { h: 0, s: 0, l: 40 }
export const COLOR_GRAY_LIGHT: HSLColor = { h: 0, s: 0, l: 70 }
