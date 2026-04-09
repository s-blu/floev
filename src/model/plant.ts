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

export interface AllelePair<T> {
  a: T
  b: T
}

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string
  stemHeight: AllelePair<number>   // each allele: 0.35–1.0
  petalCount: AllelePair<number>   // each allele: 3–8 (integer)
  petalShape:  AllelePair<PetalShape>
  petalColor:  AllelePair<HSLColor>
  centerType:  AllelePair<CenterType>
  centerColor: AllelePair<HSLColor>
  gradientColor: AllelePair<HSLColor | null>
  phase: PlantPhase
  generation: number
  parentIds?: [string, string]
}

// ─── Pot ─────────────────────────────────────────────────────────────────────

export interface Pot {
  id: number
  plant: Plant | null
  phaseStart: number | null
}

// ─── Catalog entry ───────────────────────────────────────────────────────────

export type Rarity = 0 | 1 | 2 | 3 | 4  // 0=common … 4=legendary

export interface CatalogEntry {
  key: string
  plant: Plant
  rarityScore: number
  rarity: Rarity
  discovered: number
}

// ─── Breeding estimate ───────────────────────────────────────────────────────

export interface BreedEstimate {
  midH: number
  minH: number
  maxH: number
  avgS: number
  avgL: number
  minP: number
  maxP: number
  likelyShape: PetalShape
  /** Probability distribution for petal shapes, sorted desc */
  shapeProbs: { shape: PetalShape; pct: number }[]
  /** Probability distribution for center types, sorted desc */
  centerProbs: { center: CenterType; pct: number }[]
  gradPct: number
}

// ─── Persisted game state ────────────────────────────────────────────────────

export interface GameState {
  pots: Pot[]
  catalog: CatalogEntry[]
  lastSave: number
}
