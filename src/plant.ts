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

export interface Plant {
  /** Unique identifier */
  id: string
  /** Normalised stem height: 0.25–1.0 */
  stemHeight: number
  /** Number of petals: 3–8 */
  petalCount: number
  petalShape: PetalShape
  /** Main petal colour (all petals share this base) */
  petalColor: HSLColor
  /**
   * Optional radial gradient endpoint colour.
   * Null on most plants — only ~6–8% chance on random plants,
   * ~25% when a parent has a gradient.
   */
  gradientColor: HSLColor | null
  centerType: CenterType
  /**
   * Center colour — always a light warm or neutral tone
   * (white, pale yellow, soft orange, or light green).
   * Fully inheritable and breedable.
   */
  centerColor: HSLColor
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

export type Rarity = 0 | 1 | 2 | 3   // 0=common … 3=legendary

export interface CatalogEntry {
  /** Deduplication key derived from plant traits */
  key: string
  plant: Plant
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
