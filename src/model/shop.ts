// ─── Shop model ───────────────────────────────────────────────────────────────

export type UpgradeId =
  | 'unlock_lupe'
  | 'unlock_selfpollinate'
  | 'unlock_rare_radar'
  | 'unlock_discovery_index'
  | 'unlock_showcase'
  | 'unlock_order_book'
  | 'unlock_seed_drawer'
  | 'unlock_completion_index'
  | 'unlock_research_book'

export interface Upgrade {
  id: UpgradeId
  price: number
  icon: string
}

export const UPGRADES: Upgrade[] = [
  { id: 'unlock_lupe',             price:   20, icon: '🔍' },
  { id: 'unlock_order_book',       price:   40, icon: '📖' },
  { id: 'unlock_selfpollinate',    price:   50, icon: '↺'  },
  { id: 'unlock_rare_radar',       price:   50, icon: '✦'  },
  { id: 'unlock_discovery_index',  price:   80, icon: '📊' },
  { id: 'unlock_showcase',         price:  100, icon: '🪟' },
  { id: 'unlock_research_book',    price:  100, icon: '🔬' },
  { id: 'unlock_seed_drawer',      price:  300, icon: '🌱' },
  { id: 'unlock_completion_index', price: 1500, icon: '💯' },
]

// ─── Showcase ─────────────────────────────────────────────────────────────────

export const SHOWCASE_INITIAL_SLOTS        = 3
export const SHOWCASE_MAX_SLOTS            = 12
export const SHOWCASE_POT_BASE_ID          = 10000

// ─── Extra pot purchasing ─────────────────────────────────────────────────────

export const MAX_POT_COUNT          = 40
export const EXTRA_POT_BASE_PRICE   = 50
export const EXTRA_POT_PRICE_STEP   = 50

// ─── Pot cosmetics ────────────────────────────────────────────────────────────

export type PotShape = 'standard' | 'conic' | 'belly' | 'bowl' | 'urn' | 'tiny' | 'amphore' | 'offset'

export interface PotColorDef {
  id: string
  /** Main body color */
  body: string
  /** Rim color (slightly lighter) */
  rim: string
  /** Shadow stripe color */
  shadow: string
  /** Is this the default (free) color? */
  free?: boolean
  price: number
}

export interface PotShapeDef {
  id: PotShape
  price: number
  free?: boolean
}

export const POT_COLORS: PotColorDef[] = [
  { id: 'terracotta', body: '#b8724a', rim: '#c8855a', shadow: '#a86540', free: true, price: 0  },
  { id: 'cream',      body: '#e8dfc8', rim: '#f0e8d4', shadow: '#d4c9ae',             price: 25 },
  { id: 'slate',      body: '#6b7280', rim: '#7d8795', shadow: '#5a6170',             price: 25 },
  { id: 'sage',       body: '#7a9e7e', rim: '#8db592', shadow: '#6a8a6e',             price: 35 },
  { id: 'blush',      body: '#c4867a', rim: '#d49a8e', shadow: '#b07268',             price: 35 },
  { id: 'cobalt',     body: '#3d5a8a', rim: '#4a6ea0', shadow: '#304870',             price: 50 },
  { id: 'obsidian',   body: '#2a2825', rim: '#3a3835', shadow: '#1e1c1a',             price: 50 },
  { id: 'gold',       body: '#c9963a', rim: '#dba84a', shadow: '#b07e28',             price: 80 },
  { id: 'coral',      body: '#e05538', rim: '#f06848', shadow: '#c2432a',             price: 45 },
  { id: 'mint',       body: '#3db88a', rim: '#4ecc9c', shadow: '#2d9e74',             price: 45 },
  { id: 'lavender',   body: '#8878b8', rim: '#9a8acc', shadow: '#72649e',             price: 45 },
  { id: 'teal',       body: '#268888', rim: '#2e9e9e', shadow: '#1a7070',             price: 55 },
]

export const POT_SHAPES: PotShapeDef[] = [
  { id: 'standard', free: true, price:  0 },
  { id: 'conic',               price: 45 },
  { id: 'belly',               price: 45 },
  { id: 'bowl',                price: 45 },
  { id: 'urn',                 price: 60 },
  { id: 'tiny',                price: 35 },
  { id: 'amphore',             price: 70 },
  { id: 'offset',              price: 55 },
]

// ─── Pot effects ──────────────────────────────────────────────────────────────

export type PotEffect = 'none' | 'glossy' | 'stripes' | 'diagonal' | 'dots'

export interface PotEffectDef {
  id: PotEffect
  price: number
  free?: boolean
}

export const POT_EFFECTS: PotEffectDef[] = [
  { id: 'none',     free: true, price:  0 },
  { id: 'glossy',              price: 50 },
  { id: 'stripes',             price: 60 },
  { id: 'diagonal',            price: 60 },
  { id: 'dots',                price: 60 },
]

// ─── Active pot design (stored in GameState) ──────────────────────────────────

export interface PotDesign {
  colorId: string
  shape:    PotShape
  effectId?: string
}

export const DEFAULT_POT_DESIGN: PotDesign = {
  colorId: 'terracotta',
  shape: 'standard',
}

// ─── Permanent Buffs ──────────────────────────────────────────────────────────

export type BuffId = 'faster_growth' | 'seed_luck' | 'cooldown_reduction' | 'trade_skill'

export interface BuffLevel {
  value: number   // cumulative effect value (e.g. 0.10 = 10%)
  cost:  number   // research points required
}

export interface BuffDef {
  id: BuffId
  icon: string
  unlock_required?: UpgradeId
  levels: BuffLevel[]
}

// ─── Buff level generators ────────────────────────────────────────────────────
// FIXME extract me to buffs file
function fasterGrowthLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.10, cost: 2 }, { value: 0.15, cost: 3 }]
  let v = 0.15
  while (v < 0.75 - 0.001) {
    v = Math.round((v + 0.02) * 100) / 100
    levels.push({ value: Math.min(v, 0.75), cost: 3 })
  }
  return levels
}

function seedLuckLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.05, cost: 2 }]
  let v = 0.05
  while (v < 0.25 - 0.001) {
    v = Math.round((v + 0.02) * 100) / 100
    levels.push({ value: Math.min(v, 0.25), cost: 3 })
  }
  return levels
}

function cooldownReductionLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.20, cost: 2 }]
  let v = 0.20
  while (v < 0.60 - 0.001) {
    v = Math.round((v + 0.05) * 100) / 100
    levels.push({ value: Math.min(v, 0.60), cost: 3 })
  }
  return levels
}

function tradeSkillLevels(): BuffLevel[] {
  const levels: BuffLevel[] = [{ value: 0.10, cost: 2 }]
  let v = 0.10
  while (v < 0.30 - 0.001) {
    v = Math.round((v + 0.02) * 100) / 100
    levels.push({ value: Math.min(v, 0.30), cost: 3 })
  }
  return levels
}

export const BUFFS: BuffDef[] = [
  {
    id:     'faster_growth',
    icon:   '⚡',
    levels: fasterGrowthLevels(),
  },
  {
    id:               'seed_luck',
    icon:             '🍀',
    unlock_required:  'unlock_seed_drawer',
    levels:           seedLuckLevels(),
  },
  {
    id:               'cooldown_reduction',
    icon:             '⏱',
    unlock_required:  'unlock_seed_drawer',
    levels:           cooldownReductionLevels(),
  },
  {
    id:     'trade_skill',
    icon:   '💰',
    levels: tradeSkillLevels(),
  },
]
