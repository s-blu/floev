import { ColorBucket } from "./genetic_model";
import { PetalShape, CenterType, ChromaticL } from "./plant";

// ─── Dominance helpers ────────────────────────────────────────────────────────

export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack'];
export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen'];
export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'pink', 'purple', 'blue', 'green', 'gray',
];
// ─── Lightness dominance: 30 > 60 > 90 ───────────────────────────────────────
/** The three discrete lightness levels, ordered most-dominant first. */

export const LIGHTNESS_DOMINANCE: ChromaticL[] = [30, 60, 90];

