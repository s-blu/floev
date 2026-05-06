// ─── Research book model ──────────────────────────────────────────────────────

import type { PetalShape, PetalCount, CenterType, PetalEffect, Plant } from './plant'
import type { ColorBucket } from './genetic_model'

export interface ResearchTaskSpec {
  shape:       PetalShape
  petalCount:  PetalCount
  colorBucket: ColorBucket
  lightness:   number        // ChromaticL (30 | 60 | 90) or 100 for white
  centerType:  CenterType
  effect:      PetalEffect
}

export interface ResearchTask {
  id:              string
  spec:            ResearchTaskSpec
  difficulty:      1 | 2 | 3
  completedToday:  boolean
  completedByPlant?: Plant
}

export interface ResearchBookState {
  tasks:             ResearchTask[]
  lastEffectiveDate: string   // "YYYY-MM-DD"
}
