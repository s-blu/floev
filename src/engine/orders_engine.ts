// ─── Order book engine ────────────────────────────────────────────────────────

import type { Plant, GameState } from '../model/plant'
import type { Order, OrderRequirement, OrderTrait, OrderBookState } from '../model/orders'
import { ORDER_REWARD_EASY, ORDER_REWARD_MEDIUM, ORDER_REWARD_HARD } from '../model/orders'
import { hasUpgrade } from './shop_engine'
import {
  expressedShape,
  expressedCenter,
  expressedEffect,
  expressedLightness,
  expressedPetalCount,
  expressedHue,
  hueBucket,
} from './genetic/genetic_utils'
import { isHomozygous } from './genetic/genetic_utils'
import { uid } from './genetic/genetic_utils'

// ─── Effective date (3 AM cutoff) ────────────────────────────────────────────

export function getEffectiveDate(): string {
  const now = new Date()
  if (now.getHours() < 3) {
    now.setDate(now.getDate() - 1)
  }
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Requirement pools ────────────────────────────────────────────────────────

const EASY_POOL: OrderRequirement[] = [
  { trait: 'petalShape',  op: 'eq',  value: 'round',       difficulty: 'easy' },
  { trait: 'petalShape',  op: 'eq',  value: 'lanzett',     difficulty: 'easy' },
  { trait: 'petalShape',  op: 'eq',  value: 'tropfen',     difficulty: 'easy' },
  { trait: 'colorBucket', op: 'eq',  value: 'red',         difficulty: 'easy' },
  { trait: 'colorBucket', op: 'eq',  value: 'pink',        difficulty: 'easy' },
  { trait: 'colorBucket', op: 'eq',  value: 'blue',        difficulty: 'easy' },
  { trait: 'colorBucket', op: 'eq',  value: 'yellowgreen', difficulty: 'easy' },
  { trait: 'colorBucket', op: 'eq',  value: 'purple',      difficulty: 'easy' },
  { trait: 'petalCount',  op: 'gte', value: 5,             difficulty: 'easy' },
  { trait: 'centerType',  op: 'eq',  value: 'dot',         difficulty: 'easy' },
  { trait: 'centerType',  op: 'eq',  value: 'disc',        difficulty: 'easy' },
]

const MEDIUM_POOL: OrderRequirement[] = [
  { trait: 'petalCount',    op: 'gte', value: 8,          difficulty: 'medium' },
  { trait: 'petalCount',    op: 'eq',  value: 3,          difficulty: 'medium' },
  { trait: 'petalLightness', op: 'eq', value: 30,         difficulty: 'medium' },
  { trait: 'petalLightness', op: 'eq', value: 60,         difficulty: 'medium' },
  { trait: 'petalLightness', op: 'eq', value: 90,         difficulty: 'medium' },
  { trait: 'petalEffect',   op: 'eq',  value: 'bicolor',  difficulty: 'medium' },
  { trait: 'petalEffect',   op: 'eq',  value: 'gradient', difficulty: 'medium' },
]

const HARD_POOL: OrderRequirement[] = [
  { trait: 'centerType',    op: 'eq',  value: 'stamen',   difficulty: 'hard' },
  { trait: 'petalShape',  op: 'eq', value: 'wavy',        difficulty: 'hard' },
  { trait: 'petalShape',  op: 'eq', value: 'zickzack',    difficulty: 'hard' },
  { trait: 'petalEffect', op: 'eq', value: 'shimmer',     difficulty: 'hard' },
  { trait: 'homozygous',  op: 'eq', value: true,          difficulty: 'hard' },
]

// ─── Seeded pseudo-random (deterministic per date) ────────────────────────────

function seededRng(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  // Avalanche mixing: small input differences (e.g. consecutive dates) otherwise
  // produce seeds differing by 1, causing nearly identical RNG sequences.
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b) | 0
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b) | 0
  h ^= h >>> 16
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5
    return ((h >>> 0) / 0xFFFFFFFF)
  }
}

function pickRng<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ─── Order generation ─────────────────────────────────────────────────────────

function rewardForRequirements(reqs: OrderRequirement[]): number {
  return reqs.reduce((sum, r) => {
    if (r.difficulty === 'easy')   return sum + ORDER_REWARD_EASY
    if (r.difficulty === 'medium') return sum + ORDER_REWARD_MEDIUM
    return sum + ORDER_REWARD_HARD
  }, 0)
}

// petalEffect uses all hue-bucket colors, so lightness is irrelevant when an effect is active
const TRAIT_CONFLICTS: Partial<Record<OrderTrait, OrderTrait[]>> = {
  petalEffect:    ['petalLightness'],
  petalLightness: ['petalEffect'],
}

function addWithConflicts(used: Set<OrderTrait>, trait: OrderTrait): void {
  used.add(trait)
  for (const conflict of TRAIT_CONFLICTS[trait] ?? []) {
    used.add(conflict as OrderTrait)
  }
}

function pickWithoutTraitConflict(
  pool: OrderRequirement[],
  used: Set<OrderTrait>,
  rng: () => number,
): OrderRequirement | null {
  const available = pool.filter(r => !used.has(r.trait))
  if (available.length === 0) return null
  return pickRng(available, rng)
}

export function generateOrders(date: string): Order[] {
  const rng = seededRng(date)

  // Order 1: 1 easy requirement
  const req1a = pickWithoutTraitConflict(EASY_POOL, new Set<OrderTrait>(), rng)!

  // Order 2: one of —
  //   a) 2 easy requirements
  //   b) 1 easy + 1 medium requirement
  //   c) 1 hard requirement
  let reqs2: OrderRequirement[]
  const order2Variant = Math.floor(rng() * 3)
  if (order2Variant === 0) {
    const used2 = new Set<OrderTrait>()
    const req2a = pickWithoutTraitConflict(EASY_POOL, used2, rng)!
    addWithConflicts(used2, req2a.trait)
    const req2b = pickWithoutTraitConflict(EASY_POOL, used2, rng)!
    reqs2 = [req2a, req2b]
  } else if (order2Variant === 1) {
    const used2 = new Set<OrderTrait>()
    const req2a = pickWithoutTraitConflict(EASY_POOL, used2, rng)!
    addWithConflicts(used2, req2a.trait)
    const req2b = pickWithoutTraitConflict(MEDIUM_POOL, used2, rng) ?? pickWithoutTraitConflict(EASY_POOL, used2, rng)!
    reqs2 = [req2a, req2b]
  } else {
    reqs2 = [pickRng(HARD_POOL, rng)]
  }

  // Order 3: one of —
  //   a) 2 medium requirements
  //   b) 1 easy + 1 hard requirement
  let reqs3: OrderRequirement[]
  const order3Variant = Math.floor(rng() * 2)
  if (order3Variant === 0) {
    const used3 = new Set<OrderTrait>()
    const req3a = pickWithoutTraitConflict(MEDIUM_POOL, used3, rng)!
    addWithConflicts(used3, req3a.trait)
    const req3b = pickWithoutTraitConflict(MEDIUM_POOL, used3, rng) ?? pickWithoutTraitConflict(EASY_POOL, used3, rng)!
    reqs3 = [req3a, req3b]
  } else {
    const used3 = new Set<OrderTrait>()
    const req3a = pickWithoutTraitConflict(EASY_POOL, used3, rng)!
    addWithConflicts(used3, req3a.trait)
    const req3b = pickWithoutTraitConflict(HARD_POOL, used3, rng) ?? pickRng(HARD_POOL, rng)
    reqs3 = [req3a, req3b]
  }

  const orders: [OrderRequirement[], OrderRequirement[], OrderRequirement[]] = [
    [req1a],
    reqs2,
    reqs3,
  ]

  return orders.map(reqs => ({
    id:             uid(),
    requirements:   reqs,
    reward:         rewardForRequirements(reqs),
    pinned:         false,
    completedToday: false,
  }))
}

// ─── Requirement matching ────────────────────────────────────────────────────

function requirementMet(plant: Plant, req: OrderRequirement): boolean {
  switch (req.trait) {
    case 'petalShape':
      return expressedShape(plant.petalShape) === req.value

    case 'colorBucket':
      return hueBucket(expressedHue(plant.petalHue)) === req.value

    case 'petalCount': {
      const count = expressedPetalCount(plant.petalCount)
      if (req.op === 'gte') return count >= (req.value as number)
      if (req.op === 'lte') return count <= (req.value as number)
      return count === (req.value as number)
    }

    case 'petalLightness':
      return expressedLightness(plant.petalLightness) === req.value

    case 'centerType':
      return expressedCenter(plant.centerType) === req.value

    case 'petalEffect':
      return expressedEffect(plant.petalEffect) === req.value

    case 'homozygous':
      return isHomozygous(plant) === req.value
  }
}

export function plantMatchesOrder(plant: Plant, order: Order): boolean {
  return order.requirements.every(req => requirementMet(plant, req))
}

/** Returns which order indices (0-based) the plant satisfies. */
export function matchingOrderIndices(plant: Plant, orders: Order[]): number[] {
  return orders
    .map((order, i) => ({ order, i }))
    .filter(({ order }) => !order.completedToday && plantMatchesOrder(plant, order))
    .map(({ i }) => i)
}

// ─── Daily reset logic ───────────────────────────────────────────────────────

function resetDailyState(orderBook: OrderBookState, newDate: string): void {
  for (const order of orderBook.orders) {
    order.completedToday = false
  }
  orderBook.dailyRefreshUsed  = false
  orderBook.lastEffectiveDate = newDate
}

export function initOrderBook(state: GameState): void {
  const today = getEffectiveDate()
  if (!state.orderBook) {
    state.orderBook = {
      orders:            generateOrders(today),
      lastEffectiveDate: today,
      dailyRefreshUsed:  false,
    }
    return
  }
  if (state.orderBook.lastEffectiveDate !== today) {
    const wasCompleted = state.orderBook.orders.map(o => o.completedToday)
    resetDailyState(state.orderBook, today)
    const freshOrders = generateOrders(today)
    for (let i = 0; i < state.orderBook.orders.length; i++) {
      if (!state.orderBook.orders[i].pinned || wasCompleted[i]) {
        state.orderBook.orders[i] = freshOrders[i]
      }
    }
  }
}

export function canRefreshOrders(state: GameState): boolean {
  if (!state.orderBook) return false
  if (state.orderBook.dailyRefreshUsed) return false
  // At least one order must be unpinned and incomplete to refresh
  return state.orderBook.orders.some(o => !o.pinned && !o.completedToday)
}

export function refreshOrders(state: GameState): boolean {
  if (!canRefreshOrders(state)) return false
  const today = getEffectiveDate()
  // Use a different seed so the refresh gives different orders than initial
  const freshOrders = generateOrders(today + '-refresh')
  for (let i = 0; i < state.orderBook!.orders.length; i++) {
    if (!state.orderBook!.orders[i].pinned && !state.orderBook!.orders[i].completedToday) {
      state.orderBook!.orders[i] = { ...freshOrders[i], pinned: false, completedToday: false }
    }
  }
  state.orderBook!.dailyRefreshUsed = true
  return true
}

export function toggleOrderPin(state: GameState, orderIndex: number): void {
  const order = state.orderBook?.orders[orderIndex]
  if (!order || order.completedToday) return
  order.pinned = !order.pinned
}

// ─── Apply orders on sell ────────────────────────────────────────────────────

/** Checks plant against active orders, marks matches as completed, returns bonus coins. */
export function applyOrdersOnSell(state: GameState, plant: Plant): number {
  if (!hasUpgrade(state, 'unlock_order_book')) return 0
  if (!state.orderBook) return 0
  initOrderBook(state)

  let bonus = 0
  for (const order of state.orderBook.orders) {
    if (order.completedToday) continue
    if (plantMatchesOrder(plant, order)) {
      order.completedToday = true
      order.pinned = false
      bonus += order.reward
    }
  }
  return bonus
}
