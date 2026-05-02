import { expressedShape, expressedCenter, expressedEffect, expressedColor, expressedHue, expressedPetalCount, hueBucket, colorBucket } from './genetic/genetic_utils';
import { PETAL_SHAPES, CENTER_TYPES, PETAL_EFFECTS, PALETTE_HUES_BUCKETS, PALETTE_L, RARE_SHAPES, RARE_EFFECTS } from '../model/genetic_model';
import type { CatalogEntry, Plant } from '../model/plant';
import type { ColorBucket } from '../model/genetic_model';
import type { PetalEffect } from '../model/plant';

export const PETAL_COUNTS = [3, 5, 7] as const;
export const DISPLAY_EFFECTS = PETAL_EFFECTS.filter(e => e !== 'none') as PetalEffect[];
export const RARE_BUCKETS = new Set<ColorBucket>(['purple', 'blue', 'gray']);

// ─── Discovery set builders ───────────────────────────────────────────────────

export function buildDiscoveredShapeCounts(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const shape = expressedShape(e.plant.petalShape);
    const count = expressedPetalCount(e.plant.petalCount);
    set.add(`${shape}_${count}`);
  }
  return set;
}

export function buildDiscoveredShapeCenters(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const shape = expressedShape(e.plant.petalShape);
    const center = expressedCenter(e.plant.centerType);
    set.add(`${shape}_${center}`);
  }
  return set;
}

export function buildDiscoveredShapeEffects(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const shape = expressedShape(e.plant.petalShape);
    const effect = expressedEffect(e.plant.petalEffect);
    if (effect !== 'none') set.add(`${shape}_${effect}`);
  }
  return set;
}

export function buildDiscoveredShapeColors(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const shape = expressedShape(e.plant.petalShape);
    const bucket = colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness));
    set.add(`${shape}_${bucket}`);
  }
  return set;
}

export function buildDiscoveredColors(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const c = expressedColor(e.plant.petalHue, e.plant.petalLightness);
    set.add(`${c.h}_${c.l}`);
  }
  return set;
}

// ─── Completion index cell builders ──────────────────────────────────────────

export function buildFoundBaseColorCells(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    if (expressedEffect(e.plant.petalEffect) !== 'none') continue;
    const shape  = expressedShape(e.plant.petalShape);
    const color  = expressedColor(e.plant.petalHue, e.plant.petalLightness);
    const count  = expressedPetalCount(e.plant.petalCount);
    const center = expressedCenter(e.plant.centerType);
    set.add(`${shape}_${color.h}_${color.l}_${count}_${center}`);
  }
  return set;
}

export function buildFoundEffectCells(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const effect = expressedEffect(e.plant.petalEffect);
    if (effect === 'none') continue;
    const shape  = expressedShape(e.plant.petalShape);
    const color  = expressedColor(e.plant.petalHue, e.plant.petalLightness);
    const count  = expressedPetalCount(e.plant.petalCount);
    const center = expressedCenter(e.plant.centerType);
    set.add(`${shape}_${color.h}_${effect}_${count}_${center}`);
  }
  return set;
}

// ─── Bucket key helpers (shared with discovery index UI) ─────────────────────

export function getBucketKeys(bucket: ColorBucket): string[] {
  if (bucket === 'white') return ['1_100'];
  if (bucket === 'gray') return ['2_30', '2_60', '2_90'];
  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [];
  return hues.flatMap(hue => (PALETTE_L as readonly number[]).map(l => `${hue}_${l}`));
}

// ─── "Fully discovered" checks ────────────────────────────────────────────────

export function isShapeFullyDiscovered(
  shape: string,
  discoveredCounts: Set<string>,
  discoveredCenters: Set<string>,
  discoveredEffects: Set<string>,
): boolean {
  return (
    PETAL_COUNTS.every(c  => discoveredCounts.has(`${shape}_${c}`)) &&
    CENTER_TYPES.every(ct => discoveredCenters.has(`${shape}_${ct}`)) &&
    DISPLAY_EFFECTS.every(ef => discoveredEffects.has(`${shape}_${ef}`))
  );
}

export function isStamenFullyDiscovered(discoveredCenters: Set<string>): boolean {
  return PETAL_SHAPES.every(s => discoveredCenters.has(`${s}_stamen`));
}

export function isEffectFullyDiscovered(effect: string, discoveredEffects: Set<string>): boolean {
  return PETAL_SHAPES.every(s => discoveredEffects.has(`${s}_${effect}`));
}

export function isBucketFullyDiscovered(bucket: ColorBucket, discoveredColors: Set<string>): boolean {
  return getBucketKeys(bucket).every(k => discoveredColors.has(k));
}

// ─── Rarity radar: hidden rare + not yet fully discovered ─────────────────────

/**
 * Returns true if the plant carries at least one hidden (recessive) allele
 * for a rare trait category that the player has not yet fully discovered.
 *
 * Rare categories:
 *   - Shapes:   wavy, zickzack  — until all shape×count/center/effect combos are found
 *   - Center:   stamen          — until all shape×stamen combos are found
 *   - Effects:  shimmer, iridescent — until all shape×effect combos are found
 *   - Hue:      purple/blue/gray buckets — until all hue×lightness entries are found
 */
export function hasHiddenRareUndiscoveredTrait(plant: Plant, catalog: CatalogEntry[]): boolean {
  const discoveredCounts  = buildDiscoveredShapeCounts(catalog);
  const discoveredCenters = buildDiscoveredShapeCenters(catalog);
  const discoveredEffects = buildDiscoveredShapeEffects(catalog);
  const discoveredColors  = buildDiscoveredColors(catalog);

  // Rare shapes (wavy, zickzack)
  const exprShape = expressedShape(plant.petalShape);
  if (!RARE_SHAPES.includes(exprShape)) {
    for (const allele of [plant.petalShape.a, plant.petalShape.b] as const) {
      if (RARE_SHAPES.includes(allele) && !isShapeFullyDiscovered(allele, discoveredCounts, discoveredCenters, discoveredEffects)) {
        return true;
      }
    }
  }

  // Stamen center
  const exprCenter = expressedCenter(plant.centerType);
  if (exprCenter !== 'stamen') {
    if ((plant.centerType.a === 'stamen' || plant.centerType.b === 'stamen') &&
        !isStamenFullyDiscovered(discoveredCenters)) {
      return true;
    }
  }

  // Rare effects (shimmer, iridescent)
  const exprEffect = expressedEffect(plant.petalEffect);
  if (!RARE_EFFECTS.includes(exprEffect)) {
    for (const allele of [plant.petalEffect.a, plant.petalEffect.b] as const) {
      if (RARE_EFFECTS.includes(allele) && !isEffectFullyDiscovered(allele, discoveredEffects)) {
        return true;
      }
    }
  }

  // Rare hue buckets (purple, blue, gray)
  const exprHue = expressedHue(plant.petalHue);
  if (!RARE_BUCKETS.has(hueBucket(exprHue))) {
    const recHue = plant.petalHue.a === exprHue ? plant.petalHue.b : plant.petalHue.a;
    if (recHue !== exprHue) {
      const recBucket = hueBucket(recHue);
      if (RARE_BUCKETS.has(recBucket) && !isBucketFullyDiscovered(recBucket, discoveredColors)) {
        return true;
      }
    }
  }

  return false;
}
