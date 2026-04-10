import type {
  Plant, HSLColor, PetalShape, CenterType, PlantPhase,
} from '../model/plant'
import type { ColorBucket } from "./genetic.utils"
import { expressedColor, expressedShape, expressedCenter, expressedNumber } from "./genetic.utils"

// ─── Constants ───────────────────────────────────────────────────────────────

export const PETAL_SHAPES: PetalShape[] = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack']

const SHAPE_ALLELE_POOL: PetalShape[] = [
  ...Array(35).fill('round'),
  ...Array(25).fill('lanzett'),
  ...Array(18).fill('tropfen'),
  ...Array(14).fill('wavy'),
  ...Array(8).fill('zickzack'),
]

export function randomPetalShapeAllele(): PetalShape {
  return SHAPE_ALLELE_POOL[Math.floor(Math.random() * SHAPE_ALLELE_POOL.length)]
}
export const CENTER_TYPES: CenterType[] = ['dot', 'disc', 'stamen']

export const MUTATION_CHANCE = 0.04

const GRADIENT_ALLELE_CHANCE_RANDOM = 0.28
export const GRADIENT_ALLELE_KEEP_CHANCE = 0.55
export const MIN_STEM_HEIGHT = 0.35

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Color palette ────────────────────────────────────────────────────────────
/**
 * All petal colors are drawn from a fixed palette:
 *
 *   Normal colors:  14 hues × 3 lightness steps = 42 distinct colors
 *     Hues (×20°):  0, 20, 40, 60, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340
 *     Saturation:   fixed at 90%
 *     Lightness:    30, 50, 70
 *
 *   Special colors (not in normal pool, only via specific allele entries):
 *     White:  { h:0, s:0, l:100 }  — häufig (eigener Allel-Slot)
 *     Grays:  { h:0, s:0, l:0  }   — sehr selten
 *             { h:0, s:0, l:40 }   — sehr selten
 *             { h:0, s:0, l:70 }   — sehr selten
 *
 * quantizeColor() maps any incoming color to the nearest palette slot.
 * Gray/white inputs (s < 10) are snapped to the special gray/white colors.
 */

const PALETTE_HUES = [0, 20, 40, 60, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340] as const
const PALETTE_S = 90
const PALETTE_L = [30, 50, 90] as const

// Special achromatic colors (s=0)
export const COLOR_WHITE:  HSLColor = { h: 0, s: 0, l: 100 }
export const COLOR_GRAY_DARK:  HSLColor = { h: 0, s: 0, l: 0 }
export const COLOR_GRAY_MID:   HSLColor = { h: 0, s: 0, l: 40 }
export const COLOR_GRAY_LIGHT: HSLColor = { h: 0, s: 0, l: 70 }

/**
 * Snaps any color to the nearest fixed palette entry.
 * - Achromatic inputs (s < 10): snapped to the nearest gray/white.
 * - Chromatic inputs: hue → nearest palette hue, s → 90, l → nearest of {30,50,70}.
 */
export function quantizeColor(h: number, s: number, l: number): HSLColor {
  // Achromatic: snap to white or one of the three grays
  if (s < 10) {
    if (l >= 85) return COLOR_WHITE
    if (l >= 55) return COLOR_GRAY_LIGHT
    if (l >= 20) return COLOR_GRAY_MID
    return COLOR_GRAY_DARK
  }

  // Chromatic: snap hue to nearest palette entry (circular distance)
  let bestHue = PALETTE_HUES[0]
  let bestDist = Infinity
  for (const ph of PALETTE_HUES) {
    const d = Math.min(Math.abs(h - ph), 360 - Math.abs(h - ph))
    if (d < bestDist) { bestDist = d; bestHue = ph }
  }

  // Snap lightness to nearest of {30, 50, 70}
  let bestL = PALETTE_L[0]
  let bestLDist = Infinity
  for (const pl of PALETTE_L) {
    const d = Math.abs(l - pl)
    if (d < bestLDist) { bestLDist = d; bestL = pl }
  }

  return { h: bestHue, s: PALETTE_S, l: bestL }
}

export function randomGradient(baseH: number, _baseS: number, baseL: number): HSLColor {
  // Pick a hue ≥30° away from base, snap to palette
  const offsetH = (baseH + 40 + Math.random() * 140) % 360
  // Gradient is typically darker than the base petal
  const targetL = baseL <= 30 ? 30 : baseL - 20
  return quantizeColor(offsetH, PALETTE_S, targetL)
}

function randomCenterColor(): HSLColor {
  const r = Math.random()
  if (r < 0.12) {
    return { h: 20, s: 90, l: 50 }  // kräftiges Orange — selten
  } else if (r < 0.30) {
    return { h: 120, s: 70, l: 40 }  // Grün
  } else if (r < 0.55) {
    return { h: 60, s: 90, l: 50 }  // kräftiges Gelb
  } else {
    return { h: 60, s: 20, l: 90 }  // helles Gelb / Creme — häufig
  }
}

/** Generate a random HSLColor for a given dominance bucket */
export function randomColorForBucket(bucket: ColorBucket): HSLColor {
  switch (bucket) {
    case 'white':  return COLOR_WHITE
    case 'yellow': return quantizeColor(pick([40, 60]), PALETTE_S, pick([50, 70]))
    case 'red':    return quantizeColor(pick([0, 20, 340]), PALETTE_S, pick([30, 50]))
    case 'purple': return quantizeColor(pick([280, 300, 320]), PALETTE_S, pick([30, 50]))
    case 'blue':   return quantizeColor(pick([200, 220, 240, 260]), PALETTE_S, pick([30, 50]))
    case 'gray':   return pick([COLOR_GRAY_DARK, COLOR_GRAY_MID, COLOR_GRAY_LIGHT])
  }
}

/**
 * Allele pool for random petal colors.
 * White gets ~12% of allele slots → ~1.4% of plants express white phenotype
 * (needs both alleles; white is dominant so 1 allele already expresses it —
 *  actually white IS dominant, so single allele shows white).
 * Gray alleles are rare: ~3% combined, so expressed gray needs both → very rare.
 *
 * Normal chromatic colors: 42 palette entries, distributed across L levels.
 * L=70 (light, pastel) is most common, L=50 mid, L=30 (dark, saturated) rarest among chromatic.
 */
function buildPetalAllelePool(): HSLColor[] {
  const pool: HSLColor[] = []

  // White: häufig — eigene Slots
  for (let i = 0; i < 12; i++) pool.push(COLOR_WHITE)

  // Chromatic: L=70 häufig, L=50 mittel, L=30 selten
  for (const h of PALETTE_HUES) {
    for (let i = 0; i < 5; i++) pool.push({ h, s: PALETTE_S, l: 70 })
    for (let i = 0; i < 3; i++) pool.push({ h, s: PALETTE_S, l: 50 })
    for (let i = 0; i < 1; i++) pool.push({ h, s: PALETTE_S, l: 30 })
  }

  // Grays: sehr selten — je 1 Slot
  pool.push(COLOR_GRAY_DARK)
  pool.push(COLOR_GRAY_MID)
  pool.push(COLOR_GRAY_LIGHT)

  return pool
}

const PETAL_ALLELE_POOL = buildPetalAllelePool()

function randomPetalColor(): HSLColor {
  return PETAL_ALLELE_POOL[Math.floor(Math.random() * PETAL_ALLELE_POOL.length)]
}

// ─── Random plant ─────────────────────────────────────────────────────────────

export function randomPlant(): Plant {
  const colorA = randomPetalColor()
  const colorB = randomPetalColor()

  const gradA: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(colorA.h, colorA.s, colorA.l) : null
  const gradB: HSLColor | null = Math.random() < GRADIENT_ALLELE_CHANCE_RANDOM
    ? randomGradient(colorB.h, colorB.s, colorB.l) : null

  const stemA = MIN_STEM_HEIGHT + Math.random() * 0.65
  const stemB = MIN_STEM_HEIGHT + Math.random() * 0.65

  const countA = 3 + Math.floor(Math.random() * 6)
  const countB = 3 + Math.floor(Math.random() * 6)

  return {
    id: uid(),
    stemHeight: { a: stemA, b: stemB },
    petalCount: { a: countA, b: countB },
    petalShape:  { a: randomPetalShapeAllele(), b: randomPetalShapeAllele() },
    petalColor:  { a: colorA, b: colorB },
    gradientColor: { a: gradA, b: gradB },
    centerType:  { a: pick(CENTER_TYPES), b: pick(CENTER_TYPES) },
    centerColor: { a: randomCenterColor(), b: randomCenterColor() },
    phase: 1 as PlantPhase,
    generation: 0,
  }
}

// ─── Catalog key ──────────────────────────────────────────────────────────────
/**
 * Since colors are now fully quantized to a fixed palette,
 * h/s/l are already discrete — no bucketing needed beyond the exact values.
 */
export function catalogKey(plant: Plant): string {
  const color  = expressedColor(plant.petalColor)
  const shape  = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count  = Math.round(expressedNumber(plant.petalCount))
  return `${count}-${shape}-${center}-${color.h}-${color.s}-${color.l}`
}
