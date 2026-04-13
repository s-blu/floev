import { CENTER_COLORS } from '../model/genetic_model';
import type { Plant } from '../model/plant';
import { expressedColor, expressedShape, expressedCenter, expressedNumber, expressedCenterColor } from './genetic/genetic_utils';


// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color = expressedColor(plant.petalHue, plant.petalLightness)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)

  const centerCol = expressedCenterColor(plant.centerColor);
  const centerColIndex = CENTER_COLORS.findIndex(cc => cc.h === centerCol.h && cc.l === centerCol.l && cc.s === centerCol.s)
  const count = Math.round(expressedNumber(plant.petalCount))

  return `${count}-${shape}-${center}-${centerColIndex}-${color.h}-${color.s}-${color.l}`
}
