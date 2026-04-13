// ─── Core value types ─────────────────────────────────────────────────────────

export interface HSLColor {
  h: number
  s: number
  l: number
}

export interface AllelePair<T> {
  a: T
  b: T
}

/** The three discrete lightness levels used as alleles. */
export type ChromaticL = 30 | 60 | 90

export type PetalShape = 'round' | 'lanzett' | 'tropfen' | 'wavy' | 'zickzack'
export type CenterType = 'dot' | 'disc' | 'stamen'
export type PlantPhase = 1 | 2 | 3 | 4
export type Rarity     = 0 | 1 | 2 | 3 | 4

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string

  // Numeric loci (continuous, incomplete dominance → average)
  stemHeight:     AllelePair<number>
  petalCount:     AllelePair<number>

  // Discrete loci (Mendelian dominance)
  petalShape:     AllelePair<PetalShape>
  centerType:     AllelePair<CenterType>

  // Colour loci (two independent Mendelian loci)
  petalHue:       AllelePair<number>       // palette hue value or achromatic sentinel
  petalLightness: AllelePair<ChromaticL>   // 30 | 60 | 90

  // Gradient locus — expressed only when BOTH alleles are true.
  // The gradient is always monochrome: L90 near center → L60 mid → L30 at tips.
  hasGradient:    AllelePair<boolean>

  // Center colour (full HSLColor pair, legacy — not yet refactored to loci)
  centerColor:    AllelePair<HSLColor>

  // Runtime state
  phase:      PlantPhase
  generation: number
  parentIds?: [string, string]   // [parentA.id, parentB.id]; absent for wild plants
  selfed?:    boolean            // true when produced by self-pollination
}

// ─── Game state ───────────────────────────────────────────────────────────────

export interface Pot {
  id:         number
  plant:      Plant | null
  phaseStart: number | null
}

export interface CatalogEntry {
  key:         string
  plant:       Plant
  rarityScore: number
  rarity:      Rarity
  discovered:  number
}

export interface GameState {
  pots:     Pot[]
  catalog:  CatalogEntry[]
  coins:    number
  achievements: {
    unlocked: string[]   // achievement ids
    rewarded: string[]   // ids where coins were already paid
  }
  lastSave: number
}


// ─── Breed estimate ───────────────────────────────────────────────────────────

export interface BreedEstimate {
  // Colour spread (sampled)
  midH: number
  minH: number
  maxH: number
  avgS: number
  avgL: number

  // Petal count range
  minP: number
  maxP: number

  // Discrete trait probabilities
  likelyShape: PetalShape
  shapeProbs:  { shape: PetalShape; pct: number }[]
  centerProbs: { center: CenterType; pct: number }[]

  // Gradient probability
  gradPct: number

  // Hidden allele chips — both raw hue alleles of each parent, for display
  parentAHues:      [number, number]
  parentBHues:      [number, number]
  parentALightness: [number, number]
  parentBLightness: [number, number]
}
