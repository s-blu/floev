import type { CatalogEntry, GameState, Plant } from '../model/plant';
import { expressedColor, expressedShape, expressedCenter, expressedNumber, expressedGradient } from './genetic/genetic_utils';


// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color = expressedColor(plant.petalHue, plant.petalLightness)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const petalEffect = expressedGradient(plant.hasGradient);

  const count = Math.round(expressedNumber(plant.petalCount))

  return `${count}-${shape}-${center}-${color.h}-${color.s}-${color.l}-${petalEffect}`
}

export function getCatalogEntryForPlant(state: GameState, plant: Plant): CatalogEntry | null {
  if (!plant) return null;
  const key = catalogKey(plant)

  return state.catalog.find(e => e.key === key) ?? null;
}