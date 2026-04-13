import type { GameState } from '../model/plant'
import type { Achievement } from '../model/achievements'
import { HIDDEN_REVEAL_THRESHOLD } from '../model/achievements'
import { getAchievements } from './achievement_defs'

// ─── Which achievements are currently "visible" ───────────────────────────────
//
// For each groupKey: show the achievement with the LOWEST stackIndex that is
// not yet unlocked. Exception: hidden achievements are also shown if their
// progress >= HIDDEN_REVEAL_THRESHOLD.

export interface VisibleAchievement {
  achievement: Achievement
  progress: { current: number; total: number }
  unlocked: boolean
  newlyUnlocked: boolean   // set by checkAchievements for toast
}

export function getVisibleAchievements(state: GameState): VisibleAchievement[] {
  const all = getAchievements()
  const unlocked = new Set(state.achievements.unlocked)

  // Group by groupKey, sorted by stackIndex
  const groups = new Map<string, Achievement[]>()
  for (const a of all) {
    if (!groups.has(a.groupKey)) groups.set(a.groupKey, [])
    groups.get(a.groupKey)!.push(a)
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.stackIndex - b.stackIndex)
  }

const result: VisibleAchievement[] = []

  for (const [, stack] of groups) {
    // Emit every unlocked achievement in this stack individually
    for (const a of stack) {
      if (!unlocked.has(a.id)) continue
      result.push({
        achievement: a,
        progress: a.progress(state.catalog),
        unlocked: true,
        newlyUnlocked: false,
      })
    }

    // Then show the next in-progress candidate (first non-unlocked)
    const candidate = stack.find(a => !unlocked.has(a.id))
    if (!candidate) continue
    const prog = candidate.progress(state.catalog)
    const fraction = prog.total > 0 ? prog.current / prog.total : 0

    if (!candidate.hidden || fraction >= HIDDEN_REVEAL_THRESHOLD) {
      result.push({
        achievement: candidate,
        progress: prog,
        unlocked: false,
        newlyUnlocked: false,
      })
    }
  }

  return result
}

// ─── Check for newly completed achievements ────────────────────────────────────
// Returns list of newly unlocked achievements (for toast notifications + coin reward)

export function checkAchievements(state: GameState): Achievement[] {
  const all = getAchievements()
  const unlocked = new Set(state.achievements.unlocked)
  const rewarded = new Set(state.achievements.rewarded)
  const newly: Achievement[] = []

  for (const a of all) {
    if (unlocked.has(a.id)) continue
    const prog = a.progress(state.catalog)
    if (prog.current >= prog.total) {
      state.achievements.unlocked.push(a.id)
      unlocked.add(a.id)
      if (!rewarded.has(a.id)) {
        state.coins += a.reward
        state.achievements.rewarded.push(a.id)
        rewarded.add(a.id)
        newly.push(a)
      }
    }
  }

  return newly
}
