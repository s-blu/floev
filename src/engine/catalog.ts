import type { CatalogEntry, GameState, Plant } from '../model/plant';
import { expressedColor, expressedShape, expressedCenter, expressedNumber } from './genetic/genetic_utils';


// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color = expressedColor(plant.petalHue, plant.petalLightness)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)

  const count = Math.round(expressedNumber(plant.petalCount))

  // FIXME center color seems not right and gradient is missing?
  return `${count}-${shape}-${center}-${color.h}-${color.s}-${color.l}-${plant.hasGradient}`
}

export function getCatalogEntryForPlant(state: GameState, plant: Plant): CatalogEntry | null {
  console.log("getCatalogEntryForPlant", plant.id)
  if (!plant) return null;
  const key = catalogKey(plant)
  console.log(key, state.catalog, state.catalog.find(e => e.key === key))

  return state.catalog.find(e => e.key === key) ?? null;
}