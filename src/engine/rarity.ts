import { expressedCenter, expressedColor, expressedGradient, expressedNumber, expressedShape, colorBucket, Plant, CenterType, PetalShape, Rarity } from "../model/plant"

// ─── Rarity ──────────────────────────────────────────────────────────────────

const SHAPE_SCORE: Record<PetalShape, number> = { round: 0, pointed: 12, wavy: 30 }
const COLOR_SCORE: Record<string, number> = {
  white: 0, yellow: 5, red: 12, purple: 20, blue: 27, gray: 30,
}
const CENTER_SCORE: Record<CenterType, number> = { dot: 0, disc: 8, stamen: 20 }

export function calcRarityScore(plant: Plant): number {
  const shape  = expressedShape(plant.petalShape)
  const color  = expressedColor(plant.petalColor)
  const center = expressedCenter(plant.centerType)
  const grad   = expressedGradient(plant.gradientColor)
  const count  = Math.round(expressedNumber(plant.petalCount))
  const stem   = expressedNumber(plant.stemHeight)

  let score = 0
  score += SHAPE_SCORE[shape]
  score += COLOR_SCORE[colorBucket(color)] ?? 0
  score += CENTER_SCORE[center]
  score += grad !== null ? 20 : 0

  if (count >= 7) score += 5
  if (stem > 0.85) score += 5

  return Math.min(100, Math.max(1, score))
}

export function calcRarity(plant: Plant): Rarity {
  const score = calcRarityScore(plant)
  if (score >= 90) return 4  // legendary
  if (score >= 75) return 3  // epic
  if (score >= 50) return 2  // rare
  if (score >= 22) return 1  // uncommon
  return 0                   // common
}