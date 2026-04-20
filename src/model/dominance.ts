import { ColorBucket } from "./genetic_model";
import { PetalShape, CenterType, ChromaticL, PetalEffect } from "./plant";

// ─── Dominance helpers ────────────────────────────────────────────────────────

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack'];
export const CENTER_TYPE_DOMINANCE: CenterType[]  = ['dot', 'disc', 'stamen'];
export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellowgreen', 'red', 'pink', 'purple', 'blue', 'gray',
];

// ─── Lightness dominance: 30 > 60 > 90 ───────────────────────────────────────
/** The three discrete lightness levels, ordered most-dominant first. */
export const LIGHTNESS_DOMINANCE: ChromaticL[] = [30, 60, 90];

// ─── Effect dominance ─────────────────────────────────────────────────────────
// none (common) → bicolor → gradient → shimmer  → iridescent (rarest)
export const PETAL_EFFECT_DOMINANCE: PetalEffect[] = [
  'none', 'bicolor', 'gradient', 'shimmer', 'iridescent',
];
