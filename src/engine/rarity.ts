import { Plant, CenterType, PetalShape, PetalEffect, GameState, Pot } from "../model/plant"
import { Rarity } from "../model/rarity_model"
import { getCatalogEntryForPlant } from "./catalog"
import { expressedCenter, expressedColor, expressedEffect, expressedNumber, expressedShape, colorBucket } from "./genetic/genetic_utils"

// ─── Rarity ──────────────────────────────────────────────────────────────────

const SHAPE_SCORE: Record<PetalShape, number> = {
  round: 0, lanzett: 8, tropfen: 16, wavy: 25, zickzack: 50,
}

const COLOR_SCORE: Record<string, number> = {
  white: 0, yellowgreen: 5, red: 12, pink: 16, purple: 20, blue: 27, gray: 35,
}

const CENTER_SCORE: Record<CenterType, number> = { dot: 0, disc: 8, stamen: 20 }

/**
 * Effect score — contributes to rarity.
 * Ordered to complement the dominance chain: rarer effects yield higher scores.
 * iridescent push clearly into epic/legendary territory.
 */
const EFFECT_SCORE: Record<PetalEffect, number> = {
  none:        0,
  bicolor:     8,
  gradient:   15,
  shimmer:    22,
  iridescent:  35,
}

export function calcRarityScore(plant: Plant): number {
  const shape  = expressedShape(plant.petalShape)
  const color  = expressedColor(plant.petalHue, plant.petalLightness)
  const center = expressedCenter(plant.centerType)
  const effect = expressedEffect(plant.petalEffect)
  const count  = Math.round(expressedNumber(plant.petalCount))

  let score = 0
  score += SHAPE_SCORE[shape]
  score += COLOR_SCORE[colorBucket(color)] ?? 0
  score += CENTER_SCORE[center]
  score += EFFECT_SCORE[effect]
  if (count >= 7) score += 5

  return Math.min(100, Math.max(1, score))
}

export function calcCoinScore(plant: Plant): number {
  const stem = expressedNumber(plant.stemHeight)
  let bonus = 0;

  if (stem > 0.85) bonus = 5;
  else if (stem > 0.7) bonus = 3
  else if (stem > 0.5) bonus = 1

  return Math.min(100, calcRarityScore(plant) + bonus)
}

export function calcRarity(plant: Plant): Rarity {
  const score = calcRarityScore(plant)
  if (score >= 90) return 4  // legendary
  if (score >= 75) return 3  // epic
  if (score >= 50) return 2  // rare
  if (score >= 22) return 1  // uncommon
  return 0                   // common
}

export function getRarityForPot(state: GameState, pot: Pot): Rarity {
  if (!pot.plant) return 0;
  const entry = getCatalogEntryForPlant(state, pot.plant)
  return entry?.rarity ?? 0;
}
