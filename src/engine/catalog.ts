import type { CatalogEntry, GameState, Plant } from '../model/plant';
import { expressedColor, expressedShape, expressedCenter, expressedPetalCount, expressedStem, expressedEffect } from './genetic/genetic_utils';
import { calcRarityScore, calcRarity } from './rarity';
import { t } from '../model/i18n'
import { checkResearchOnCatalog } from './research_engine'


// ─── Catalog key ──────────────────────────────────────────────────────────────

export function catalogKey(plant: Plant): string {
  const color = expressedColor(plant.petalHue, plant.petalLightness)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const petalEffect = expressedEffect(plant.petalEffect);

  const count = expressedPetalCount(plant.petalCount)
  const stem = expressedStem(plant.stem)

  return `${count}-${shape}-${center}-${stem}-${color.h}-${color.s}-${color.l}-${petalEffect}`
}

export function getCatalogEntryForPlant(state: GameState, plant: Plant): CatalogEntry | null {
  if (!plant) return null;
  const key = catalogKey(plant)

  return state.catalog.find(e => e.key === key) ?? null;
}

export function addToCatalog(state: GameState, plant: Plant): { isNew: boolean; researchTaskIndex: number } {
  const key = catalogKey(plant)
  if (state.catalog.find(e => e.key === key)) return { isNew: false, researchTaskIndex: -1 }
  const rarityScore = calcRarityScore(plant)
  const entry: CatalogEntry = {
    key,
    plant: structuredClone(plant),
    plantname: getPlantName(plant),
    rarityScore,
    rarity: calcRarity(plant),
    discovered: Date.now(),
  }
  state.catalog.push(entry)
  state.catalog.sort((a, b) => b.rarityScore - a.rarityScore)
  const researchTaskIndex = checkResearchOnCatalog(state, plant)
  return { isNew: true, researchTaskIndex }
}

export function getPlantName(plant: Plant) {
  const count = expressedPetalCount(plant.petalCount);
  const shape = expressedShape(plant.petalShape);

  return t.petalNames[shape]?.[count]
}
