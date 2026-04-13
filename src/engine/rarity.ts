import { Plant, CenterType, PetalShape, Rarity, HSLColor } from "../model/plant"
import { expressedCenter, expressedColor, expressedGradient, expressedNumber, expressedShape, colorBucket, expressedCenterColor } from "./genetic/genetic_utils"
import { CENTER_COLORS } from "../model/genetic_model"

// ─── Rarity ──────────────────────────────────────────────────────────────────

const SHAPE_SCORE: Record<PetalShape, number> = { round: 0, lanzett: 8, tropfen: 16, wavy: 25, zickzack: 40 }

const COLOR_SCORE: Record<string, number> = {
  white: 0, yellow: 5, red: 12, pink: 16, purple: 20, blue: 27, green: 31, gray: 35,
}

const CENTER_SCORE: Record<CenterType, number> = { dot: 0, disc: 8, stamen: 20 }

function centerColorScore(c: HSLColor): number {
  const colorString = getColorString(c)
  switch (colorString) {
    case getColorString(CENTER_COLORS[0]): return 0
    case getColorString(CENTER_COLORS[1]): return 5
    case getColorString(CENTER_COLORS[2]): return 10
    case getColorString(CENTER_COLORS[3]): return 15
    default: return 0
  }
  function getColorString(col: HSLColor) {
    return `${col.h}-${col.s}-${col.l}`
  }
}

export function calcRarityScore(plant: Plant): number {
  const shape  = expressedShape(plant.petalShape)
  const color  = expressedColor(plant.petalHue, plant.petalLightness)
  const center = expressedCenter(plant.centerType)
  const cc     = expressedCenterColor(plant.centerColor)
  const hasGrad = expressedGradient(plant.hasGradient)
  const count  = Math.round(expressedNumber(plant.petalCount))
  const stem   = expressedNumber(plant.stemHeight)

  let score = 0
  score += SHAPE_SCORE[shape]
  score += COLOR_SCORE[colorBucket(color)] ?? 0
  score += CENTER_SCORE[center]
  score += centerColorScore(cc)
  score += hasGrad ? 20 : 0
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
