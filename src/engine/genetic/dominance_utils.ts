import { PETAL_SHAPE_DOMINANCE, CENTER_TYPE_DOMINANCE, COLOR_BUCKET_DOMINANCE, LIGHTNESS_DOMINANCE } from "../../model/dominance";
import { ACHROMATIC_HUE_WHITE, PALETTE_HUES, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT } from "../../model/genetic_model";
import { PetalShape, CenterType, ChromaticL } from "../../model/plant";
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


// ─── Allele pools for randomPlant ────────────────────────────────────────────
//
// HUE pool: same distribution as before — white common, grays rare.
// LIGHTNESS pool: L=90 most common (light/pastel), L=30 rarest.
function buildHueAllelePool(): number[] {
  const pool: number[] = []

  // White: häufig
  for (let i = 0; i < 12; i++) pool.push(ACHROMATIC_HUE_WHITE)

  // Chromatic hues — frequency independent of lightness now
  for (const h of PALETTE_HUES) {
    for (let i = 0; i < 9; i++) pool.push(h) // equal weight per hue
  }

  // Grays: sehr selten
  pool.push(ACHROMATIC_HUE_GRAY_DARK)
  pool.push(ACHROMATIC_HUE_GRAY_MID)
  pool.push(ACHROMATIC_HUE_GRAY_LIGHT)

  return pool
}
function buildLightnessAllelePool(): ChromaticL[] {
  const pool: ChromaticL[] = []
  for (let i = 0; i < 5; i++) pool.push(90) // light — häufig
  for (let i = 0; i < 3; i++) pool.push(60) // mid
  for (let i = 0; i < 1; i++) pool.push(30) // dark — selten
  return pool
}
export const HUE_ALLELE_POOL = buildHueAllelePool()
export const LIGHTNESS_ALLELE_POOL = buildLightnessAllelePool()

