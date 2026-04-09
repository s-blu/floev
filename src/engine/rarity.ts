import { Plant, CenterType, PetalShape, Rarity, HSLColor } from "../model/plant"
import { expressedCenter, expressedColor, expressedGradient, expressedNumber, expressedShape, colorBucket } from "./genetic.utils"

// ─── Rarity ──────────────────────────────────────────────────────────────────

const SHAPE_SCORE: Record<PetalShape, number> = { round: 0, pointed: 12, wavy: 30 }
const COLOR_SCORE: Record<string, number> = {
  white: 0, yellow: 5, red: 12, purple: 20, blue: 27, gray: 30,
}
const CENTER_SCORE: Record<CenterType, number> = { dot: 0, disc: 8, stamen: 20 }

/**
 * Center color score — ordered from häufig (niedrig) to selten (hoch):
 *  Helles Gelb / Creme  → 0   (häufigste randomCenterColor-Ausgabe)
 *  Kräftiges Gelb       → 5
 *  Grün                 → 12
 *  Kräftiges Orange     → 22  (seltenst — nur 12% Chance bei randomCenterColor)
 *
 * Hue-Bereiche:
 *   Orange:       h 15–40,  s > 60
 *   Gelb (satt):  h 41–65,  s > 55
 *   Grün:         h 66–160
 *   Sonst (hell): → 0
 */
function centerColorScore(c: HSLColor): number {
  if (c.l > 78) return 0                             // hell / Creme
  const h = c.h
  if (h >= 15 && h <= 40 && c.s > 60) return 22     // kräftiges Orange — seltenst
  if (h >= 66 && h <= 160) return 12                 // Grün
  if (h >= 41 && h <= 65 && c.s > 55) return 5      // kräftiges Gelb
  return 0
}

export function calcRarityScore(plant: Plant): number {
  const shape  = expressedShape(plant.petalShape)
  const color  = expressedColor(plant.petalColor)
  const center = expressedCenter(plant.centerType)
  const cc     = expressedColor(plant.centerColor)
  const grad   = expressedGradient(plant.gradientColor)
  const count  = Math.round(expressedNumber(plant.petalCount))
  const stem   = expressedNumber(plant.stemHeight)

  let score = 0
  score += SHAPE_SCORE[shape]
  score += COLOR_SCORE[colorBucket(color)] ?? 0
  score += CENTER_SCORE[center]
  score += centerColorScore(cc)
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
