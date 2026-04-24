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

export type StemTypes = "two-leaved-stem"
export type PetalShape  = 'round' | 'lanzett' | 'tropfen' | 'wavy' | 'zickzack'
export type CenterType  = 'dot' | 'disc' | 'stamen'
export type PlantPhase  = 1 | 2 | 3 | 4
export type Rarity      = 0 | 1 | 2 | 3 | 4
export type PetalEffect = 'none' | 'bicolor' | 'gradient' | 'shimmer' | 'iridescent'

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string

  // Numeric loci (continuous, incomplete dominance → average)
  stemHeight:     AllelePair<number>
  stem:           AllelePair<StemTypes>
  petalCount:     AllelePair<number>

  // Discrete loci (Mendelian dominance)
  petalShape:     AllelePair<PetalShape>
  centerType:     AllelePair<CenterType>

  // Colour loci (two independent Mendelian loci)
  petalHue:       AllelePair<number>       // palette hue value or achromatic sentinel
  petalLightness: AllelePair<ChromaticL>   // 30 | 60 | 90

  // Effect locus — Mendelian dominance, none is most dominant (most common)
  petalEffect:    AllelePair<PetalEffect>

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
  design?:    PotDesign        // per-pot cosmetic override
}

export interface CatalogEntry {
  key:         string
  plant:       Plant
  plantname:   string
  rarityScore: number
  rarity:      Rarity
  discovered:  number
}

export interface PotDesign {
  colorId: string
  shape:   'standard' | 'conic' | 'belly'
}

export interface GameState {
  pots:     Pot[]
  showcase: Pot[]
  catalog:  CatalogEntry[]
  coins:    number
  achievements: {
    unlocked: string[]   // achievement ids
    rewarded: string[]   // ids where coins were already paid
  }
  // Shop
  upgrades:           string[]   // purchased upgrade ids
  unlockedPotColors:  string[]   // purchased pot color ids
  unlockedPotShapes:  string[]   // purchased pot shape ids
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

  // Effect probabilities (replaces gradPct)
  effectProbs: { effect: PetalEffect; pct: number }[]
  /** @deprecated kept for breedestimate_ui compatibility — use effectProbs instead */
  gradPct: number

  // Hidden allele chips — both raw hue alleles of each parent, for display
  parentAHues:      [number, number]
  parentBHues:      [number, number]
  parentALightness: [number, number]
  parentBLightness: [number, number]
}
