// ─── Order book model ─────────────────────────────────────────────────────────

import type { ColorBucket } from './genetic_model'
import type { PetalShape, CenterType, PetalEffect, ChromaticL } from './plant'

export type OrderTrait =
  | 'petalShape'
  | 'colorBucket'
  | 'petalCount'
  | 'petalLightness'
  | 'centerType'
  | 'petalEffect'
  | 'homozygous'

export type OrderOp = 'eq' | 'gte' | 'lte'

export type OrderDifficulty = 'easy' | 'medium' | 'hard'

export interface OrderRequirement {
  trait:      OrderTrait
  op:         OrderOp
  value:      PetalShape | ColorBucket | CenterType | PetalEffect | ChromaticL | number | boolean
  difficulty: OrderDifficulty
}

export interface Order {
  id:             string
  requirements:   OrderRequirement[]
  reward:         number
  pinned:         boolean
  completedToday: boolean
}

export interface OrderBookState {
  orders:            Order[]   // always exactly 3
  lastEffectiveDate: string    // "2026-04-25" — before 3 AM counts as previous day
  dailyRefreshUsed:  boolean
}

// ─── Reward values per difficulty ────────────────────────────────────────────

export const ORDER_REWARD_EASY   = 10
export const ORDER_REWARD_MEDIUM = 15
export const ORDER_REWARD_HARD   = 30
