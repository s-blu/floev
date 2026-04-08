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

  /**
   * IDs of both parent plants, set when bred.
   * Absent on generation-0 (random) plants.
   */
  parentIds?: [string, string]
}

// ─── Pot ─────────────────────────────────────────────────────────────────────

export interface Pot {
  id: number
  plant: Plant | null
  /** Date.now() when current phase started — used for offline progress */
  phaseStart: number | null
}

// ─── Catalog entry ───────────────────────────────────────────────────────────

export type Rarity = 0 | 1 | 2 | 3 | 4  // 0=common … 4=legendary

export interface CatalogEntry {
  /** Deduplication key derived from plant traits */
  key: string
  plant: Plant
  /** Internal 1–100 rarity score */
  rarityScore: number
  /** Bucketed rarity for display */
  rarity: Rarity
  /** Unix timestamp (ms) when first discovered — use for both date and time display */
  discovered: number
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
