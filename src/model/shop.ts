// ─── Shop model ───────────────────────────────────────────────────────────────

export type UpgradeId =
  | 'unlock_lupe'
  | 'unlock_selfpollinate'
  | 'unlock_rare_radar'
  | 'unlock_discovery_index'
  | 'unlock_pot_10'
  | 'unlock_pot_11'
  | 'unlock_pot_12'

export interface Upgrade {
  id: UpgradeId
  price: number
  icon: string
}

export const UPGRADES: Upgrade[] = [
  { id: 'unlock_lupe',          price:  40, icon: '🔍' },
  { id: 'unlock_selfpollinate', price:  60, icon: '↺'  },
  { id: 'unlock_rare_radar',       price:  50, icon: '✦'  },
  { id: 'unlock_discovery_index', price:  80, icon: '📊' },
  { id: 'unlock_pot_10',          price:  50, icon: '🪴' },
  { id: 'unlock_pot_11',        price: 120, icon: '🪴' },
  { id: 'unlock_pot_12',        price: 250, icon: '🪴' },
]

// ─── Pot cosmetics ────────────────────────────────────────────────────────────

export type PotShape = 'standard' | 'conic' | 'belly'

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
]

export const POT_SHAPES: PotShapeDef[] = [
  { id: 'standard', free: true, price:  0 },
  { id: 'conic',               price: 45 },
  { id: 'belly',               price: 45 },
]

// ─── Active pot design (stored in GameState) ──────────────────────────────────

export interface PotDesign {
  colorId: string
  shape: PotShape
}

export const DEFAULT_POT_DESIGN: PotDesign = {
  colorId: 'terracotta',
  shape: 'standard',
}
