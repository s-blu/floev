// ─── Core colour type ────────────────────────────────────────────────────────

export interface HSLColor {
  h: number  // 0–360
  s: number  // 0–100
  l: number  // 0–100
}

// ─── Plant ────────────────────────────────────────────────────────────────────

export type PetalShape = 'round' | 'pointed' | 'wavy'
export type CenterType = 'dot' | 'disc' | 'stamen'

/** Growth phase of a plant: 1=Seed, 2=Sprout, 3=Bud, 4=Bloom */
export type PlantPhase = 1 | 2 | 3 | 4

// ─── Allele system ────────────────────────────────────────────────────────────

/**
 * A pair of alleles for a single trait.
 * `a` comes from parent 1, `b` from parent 2.
 * The expressed phenotype is always the more dominant allele.
 * For numeric traits (stemHeight, petalCount) the expressed value
 * is the average — but both alleles are inherited discretely.
 */
export interface AllelePair<T> {
  a: T
  b: T
}

// ─── Dominance helpers ────────────────────────────────────────────────────────

/**
 * Dominance order for petal shape.
 * Lower index = more dominant.
 */
export const PETAL_SHAPE_DOMINANCE: PetalShape[] = ['round', 'pointed', 'wavy']

/**
 * Dominance order for center type.
 * Lower index = more dominant.
 */
export const CENTER_TYPE_DOMINANCE: CenterType[] = ['dot', 'disc', 'stamen']

/**
 * Hue ranges that define colour "allele buckets" for dominance checks.
 * Order = dominance (index 0 is most dominant).
 * White/cream is detected by low saturation (s < 20), not by hue.
 * Black is detected by very low lightness (l < 18).
 */
export type ColorBucket =
  | 'white'   // s < 20, l > 75  — dominant
  | 'yellow'  // h 45–70
  | 'red'     // h 340–360 or 0–20
  | 'purple'  // h 270–330
  | 'blue'    // h 190–269
  | 'gray'    // s < 20 or l < 18 (includes near-black)

export const COLOR_BUCKET_DOMINANCE: ColorBucket[] = [
  'white', 'yellow', 'red', 'purple', 'blue', 'gray',
]

/** Classify an HSLColor into a dominance bucket */
export function colorBucket(c: HSLColor): ColorBucket {
  if (c.s < 20 && c.l > 75) return 'white'
  if (c.s < 22 || c.l < 18) return 'gray'
  const h = c.h
  if (h >= 45 && h <= 70)  return 'yellow'
  if (h >= 340 || h <= 20) return 'red'
  if (h >= 270 && h <= 330) return 'purple'
  if (h >= 190 && h <= 269) return 'blue'
  // Fallback — treat remaining hues by proximity to known buckets
  if (h > 20 && h < 45)  return 'red'    // orange-red
  if (h > 70 && h < 190) return 'yellow' // yellow-green
  return 'blue'
}

/** Return the more dominant of two HSLColors */
export function dominantColor(a: HSLColor, b: HSLColor): HSLColor {
  const ia = COLOR_BUCKET_DOMINANCE.indexOf(colorBucket(a))
  const ib = COLOR_BUCKET_DOMINANCE.indexOf(colorBucket(b))
  return ia <= ib ? a : b
}

/** Return the more dominant of two petal shapes */
export function dominantShape(a: PetalShape, b: PetalShape): PetalShape {
  const ia = PETAL_SHAPE_DOMINANCE.indexOf(a)
  const ib = PETAL_SHAPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}

/** Return the more dominant of two center types */
export function dominantCenter(a: CenterType, b: CenterType): CenterType {
  const ia = CENTER_TYPE_DOMINANCE.indexOf(a)
  const ib = CENTER_TYPE_DOMINANCE.indexOf(b)
  return ia <= ib ? a : b
}

// ─── Expressed phenotype helpers ─────────────────────────────────────────────

/** The color that is actually displayed (dominant allele wins) */
export function expressedColor(pair: AllelePair<HSLColor>): HSLColor {
  return dominantColor(pair.a, pair.b)
}

/** The shape that is actually displayed */
export function expressedShape(pair: AllelePair<PetalShape>): PetalShape {
  return dominantShape(pair.a, pair.b)
}

/** The center type that is actually displayed */
export function expressedCenter(pair: AllelePair<CenterType>): CenterType {
  return dominantCenter(pair.a, pair.b)
}

/** Numeric traits use the average of both alleles (incomplete dominance) */
export function expressedNumber(pair: AllelePair<number>): number {
  return (pair.a + pair.b) / 2
}

/** Gradient: no-gradient is dominant. Gradient only shows if BOTH alleles carry it. */
export function expressedGradient(pair: AllelePair<HSLColor | null>): HSLColor | null {
  if (pair.a !== null && pair.b !== null) return pair.a  // both carry it → show
  return null
}

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  /** Unique identifier */
  id: string

  // Numeric traits — incomplete dominance, expressed = average of alleles
  stemHeight: AllelePair<number>   // each allele: 0.35–1.0
  petalCount: AllelePair<number>   // each allele: 3–8 (integer)

  // Discrete traits — full dominance hierarchy
  petalShape:  AllelePair<PetalShape>
  petalColor:  AllelePair<HSLColor>
  centerType:  AllelePair<CenterType>
  centerColor: AllelePair<HSLColor>

  /**
   * Gradient: expressed only when BOTH alleles carry a gradient color.
   * No-gradient is dominant — a single null allele suppresses it.
   */
  gradientColor: AllelePair<HSLColor | null>

  phase: PlantPhase
  /** Number of breeding generations from initial random plants */
  generation: number
}

// ─── Pot ─────────────────────────────────────────────────────────────────────

export interface Pot {
  id: number
  plant: Plant | null
  /** Date.now() when current phase started — used for offline progress */
  phaseStart: number | null
}

// ─── Catalog entry ───────────────────────────────────────────────────────────

export type Rarity = 0 | 1 | 2 | 3 | 4  // 0=common … 3=legendary

export interface CatalogEntry {
  /** Deduplication key derived from plant traits */
  key: string
  plant: Plant
  /** Internal 1–100 rarity score */
  rarityScore: number
  /** Bucketed rarity for display */
  rarity: Rarity
  discovered: number  // Date.now()
}

// ─── Breeding estimate ───────────────────────────────────────────────────────

/** Statistical estimate shown in the breeding UI (does NOT include rare jumps) */
export interface BreedEstimate {
  /** Most likely hue */
  midH: number
  /** Approximate low-end hue */
  minH: number
  /** Approximate high-end hue */
  maxH: number
  avgS: number
  avgL: number
  minP: number
  maxP: number
  likelyShape: PetalShape
  /** 0–100% chance of a gradient appearing */
  gradPct: number
}

// ─── Persisted game state ────────────────────────────────────────────────────

export interface GameState {
  pots: Pot[]
  catalog: CatalogEntry[]
  lastSave: number
}
