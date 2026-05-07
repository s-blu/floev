import type { PetalShape, CenterType, PetalCount, PetalEffect, ChromaticL, Plant } from './plant'
import type { ColorBucket } from './genetic_model'

export type VesselType = 'herbarium' | 'vase' | 'blumenkasten' | 'strauss'

export interface SlotCriteria {
  shape?:       PetalShape
  colorBucket?: ColorBucket
  lightness?:   ChromaticL
  petalCount?:  PetalCount
  centerType?:  CenterType
  effect?:      PetalEffect
  minRarity?:   number
}

export type CollectionUnlockCondition =
  | { type: 'catalog_size'; threshold: number }
  | { type: 'after_collection'; collectionId: string }

export interface CollectionDef {
  id:              string
  vessel:          VesselType
  slots:           SlotCriteria[]
  unlockCondition: CollectionUnlockCondition
}

export interface CollectionSlotState {
  plant: Plant | null
}

export interface CollectionInstanceState {
  collectionId: string
  slots:        CollectionSlotState[]
  completedAt?: number
}

export interface CollectionsState {
  instances:    CollectionInstanceState[]
  displaySlots: (string | null)[]
}
