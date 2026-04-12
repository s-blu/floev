// ─── Core colour type ────────────────────────────────────────────────────────

export interface HSLColor {
  h: number  // 0–360
  s: number  // 0–100
  l: number  // 0–100
}

// ─── Plant ────────────────────────────────────────────────────────────────────

export type PetalShape = 'round' | 'lanzett' | 'tropfen' | 'wavy' | 'zickzack'
export type CenterType = 'dot' | 'disc' | 'stamen'

/** Growth phase of a plant: 1=Seed, 2=Sprout, 3=Bud, 4=Bloom */
export type PlantPhase = 1 | 2 | 3 | 4

// ─── Allele system ────────────────────────────────────────────────────────────

export interface AllelePair<T> {
  a: T
  b: T
}

// ─── Petal colour — H and L are inherited independently ──────────────────────
//
// S is always 90 for chromatic colours (fixed palette) and 0 for achromatic,
// so it carries no independent genetic information and is not a separate locus.
//
// petalHue:        which colour family  (e.g. purple, red, green …)
// petalLightness:  how dark/light       (30 = dark | 60 = mid | 90 = light)
//
// Achromatic exception: white (s=0, l=100) and grays (s=0, l∈{0,40,70}) are
// encoded as special sentinel values in petalHue — see ACHROMATIC_HUE_* in
// genetics.ts.  When an achromatic hue is expressed, petalLightness is ignored.

export const CHROMATIC_L = [30, 60, 90] as const
export type ChromaticL = typeof CHROMATIC_L[number]  // 30 | 60 | 90

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string
  stemHeight:      AllelePair<number>       // each allele: 0.35–1.0
  petalCount:      AllelePair<number>       // each allele: 3–8 (integer)
  petalShape:      AllelePair<PetalShape>
  /** Hue locus — which colour family (or achromatic sentinel). */
  petalHue:        AllelePair<number>
  /** Lightness locus — 30 | 60 | 90. Dominance: 30 > 60 > 90. */
  petalLightness:  AllelePair<ChromaticL>
  centerType:      AllelePair<CenterType>
  centerColor:     AllelePair<HSLColor>
  gradientColor:   AllelePair<HSLColor | null>
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
