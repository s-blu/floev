import type { PetalShape, CenterType, PetalCount, PetalEffect, ChromaticL, Plant } from './plant'
import type { ColorBucket, PaletteHue } from './genetic_model'

export type VesselType = 'herbarium' | 'vase' | 'blumenkasten' | 'strauss'

export interface SlotCriteria {
  shape?:       PetalShape
  colorBucket?: ColorBucket
  hue?:         PaletteHue
  lightness?:   ChromaticL
  petalCount?:  PetalCount
  centerType?:  CenterType
  effect?:      PetalEffect
  minRarity?:   number
}

export type CollectionUnlockCondition =
  | { type: 'catalog_size'; threshold: number }
  | { type: 'after_collection'; collectionId: string }
  | { type: 'catalog_has'; criteria: SlotCriteria }
  | { type: 'catalog_has_any'; criteriaList: SlotCriteria[] }

export interface CollectionDef {
  id:               string
  vessel:           VesselType
  slots:            SlotCriteria[]
  unlockCondition?: CollectionUnlockCondition
  freeForm?:        boolean
}

export interface CollectionSlotState {
  plant: Plant | null
}

export interface PlanterDesign {
  colorId:  string
  effectId: string
}

export interface CollectionInstanceState {
  collectionId:  string
  slots:         CollectionSlotState[]
  completedAt?:  number
  planterDesign?: PlanterDesign
  activeSize?:   number
}

export interface CollectionsState {
  instances: CollectionInstanceState[]
  favorites: string[]
}
