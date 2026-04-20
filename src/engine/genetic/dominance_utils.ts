import { PETAL_SHAPE_DOMINANCE, CENTER_TYPE_DOMINANCE, COLOR_BUCKET_DOMINANCE, LIGHTNESS_DOMINANCE, PETAL_EFFECT_DOMINANCE } from "../../model/dominance";
import { PetalShape, CenterType, ChromaticL, PetalEffect } from "../../model/plant";
import { hueBucket } from "./genetic_utils";


/** Return the more dominant of two petal shapes. */
export function dominantShape(a: PetalShape, b: PetalShape): PetalShape {
  const ia = PETAL_SHAPE_DOMINANCE.indexOf(a);
  const ib = PETAL_SHAPE_DOMINANCE.indexOf(b);
  return ia <= ib ? a : b;
}

/** Return the more dominant of two center types. */
export function dominantCenter(a: CenterType, b: CenterType): CenterType {
  const ia = CENTER_TYPE_DOMINANCE.indexOf(a);
  const ib = CENTER_TYPE_DOMINANCE.indexOf(b);
  return ia <= ib ? a : b;
}

/** Return the more dominant of two hue alleles. */
export function dominantHue(a: number, b: number): number {
  const ia = COLOR_BUCKET_DOMINANCE.indexOf(hueBucket(a));
  const ib = COLOR_BUCKET_DOMINANCE.indexOf(hueBucket(b));
  return ia <= ib ? a : b;
}

/** Return the more dominant of two lightness alleles (30 > 60 > 90). */
export function dominantLightness(a: ChromaticL, b: ChromaticL): ChromaticL {
  const ia = LIGHTNESS_DOMINANCE.indexOf(a);
  const ib = LIGHTNESS_DOMINANCE.indexOf(b);
  return ia <= ib ? a : b;
}

/**
 * Return the more dominant of two petal effect alleles.
 * none > bicolor > gradient > shimmer > crystalline > iridescent
 */
export function dominantEffect(a: PetalEffect, b: PetalEffect): PetalEffect {
  const ia = PETAL_EFFECT_DOMINANCE.indexOf(a);
  const ib = PETAL_EFFECT_DOMINANCE.indexOf(b);
  return ia <= ib ? a : b;
}
