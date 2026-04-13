import type { CatalogEntry } from './plant'

// ─── Achievement types ────────────────────────────────────────────────────────

export interface Achievement {
  id:         string
  groupKey:   string        // Groups stacked achievements together
  stackIndex: number        // 0 = shown first; next unlocks when this is done
  hidden:     boolean       // If true: only show when progress >= REVEAL_THRESHOLD
  title:      string
  desc:       string
  reward:     number        // Coins awarded on completion
  progress:   (catalog: CatalogEntry[]) => { current: number; total: number }
}

export interface AchievementState {
  unlocked:  Set<string>    // achievement ids that have been completed
  rewarded:  Set<string>    // ids where reward has been paid out (avoids double-pay)
}

// Fraction of progress at which a hidden achievement becomes visible
export const HIDDEN_REVEAL_THRESHOLD = 0.7
