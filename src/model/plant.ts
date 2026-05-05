// ─── Core value types ─────────────────────────────────────────────────────────

import { Rarity } from "./rarity_model"
import type { OrderBookState } from "./orders"
import type { ResearchBookState } from "./research"
import type { PotShape } from "./shop"

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

export type StemTypes   = "two-leaved-stem"
export type PetalShape  = 'round' | 'lanzett' | 'tropfen' | 'wavy' | 'zickzack'
export type CenterType  = 'dot' | 'disc' | 'stamen'
export type PetalCount  = 3 | 5 | 8
export type PlantPhase  = 1 | 2 | 3 | 4
export type PetalEffect = 'none' | 'bicolor' | 'gradient' | 'shimmer' | 'iridescent'

// ─── Plant ────────────────────────────────────────────────────────────────────

export interface Plant {
  id: string

  // Numeric loci (continuous, incomplete dominance → average)
  stemHeight:     AllelePair<number>
  stem:           AllelePair<StemTypes>
  petalCount:     AllelePair<PetalCount>

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
  surplusSeedsProduced?: number  // how many surplus seeds this plant has contributed to
  breedCooldownUntil?: number    // timestamp until which the plant cannot breed or craft seeds
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
  colorId:   string
  shape:     PotShape
  effectId?: string
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
  unlockedPotColors:   string[]   // purchased pot color ids
  unlockedPotShapes:   string[]   // purchased pot shape ids
  unlockedPotEffects:  string[]   // purchased pot effect ids
  seeds:           Plant[]        // stored seeds in Saatenschublade
  seedLayout:      string[]       // fixed-length position map: seedId or '' per slot position
  seedSlotLabels:  string[][]     // per-slot label keys, each up to 2 entries
  extraSeedRows?:  number         // number of purchased extra slot rows (0–3)
  lastSave:   number
  orderBook?: OrderBookState
  researchBook?: ResearchBookState
  researchPoints?: number
  migrationVersion?: number
  pendingMigrationNotice?: { lostCatalogEntries: number; compensation: number }
  buffs?: Record<string, number>
}


// ─── Breed estimate ───────────────────────────────────────────────────────────

export interface BreedEstimate {
  // Colour spread (sampled)
  midH: number
  minH: number
  maxH: number
  avgS: number
  avgL: number

  // Petal count probabilities
  petalCountProbs: { count: PetalCount; pct: number }[]
  /** @deprecated use petalCountProbs instead */
  minP: PetalCount
  /** @deprecated use petalCountProbs instead */
  maxP: PetalCount

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
