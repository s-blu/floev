import type { Plant } from '../model/plant';
import { expressedColor, expressedShape, expressedCenter, expressedNumber } from './genetic/genetic_utils';


// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color = expressedColor(plant.petalHue, plant.petalLightness)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count = Math.round(expressedNumber(plant.petalCount))
  return `${count}-${shape}-${center}-${color.h}-${color.s}-${color.l}`
}
