import type { Achievement } from '../model/achievements'
import { getVisibleAchievements } from '../engine/achievements'
import { state } from './ui'
import { t } from '../model/i18n'
import { getAchievements } from '../engine/achievement_defs'
import { COIN_ICON } from './icons'
import { addNotification } from './notification_log'

// ─── Achievement notifications ────────────────────────────────────────────────

export function queueAchievementToast(achievements: Achievement[]): void {
  for (const a of achievements) {
    addNotification(`🏅 ${t.achUnlocked}: ${a.title} — +${a.reward} ${COIN_ICON}`)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find the single in-progress achievement closest to completion (highest pct). */
function bestInProgress(visible: ReturnType<typeof getVisibleAchievements>) {
  return visible
    .filter(v => !v.unlocked)
    .reduce<ReturnType<typeof getVisibleAchievements>[0] | null>((best, v) => {
      const pct = v.progress.total > 0 ? v.progress.current / v.progress.total : 0
      if (!best) return v
      const bestPct = best.progress.total > 0 ? best.progress.current / best.progress.total : 0
      return pct >= bestPct ? v : best
    }, null)
}

// ─── Panel render ─────────────────────────────────────────────────────────────

let panelOpen = false

export function renderAchievements(): void {
  const panel = document.getElementById('achievements-panel')
  if (!panel) return

  const visible = getVisibleAchievements(state)
  const totalUnlocked = state.achievements.unlocked.length
  const totalAll = getAchievements()?.length

  // Header counter
  const counter = panel.querySelector('.ach-header-count')
  if (counter) counter.textContent = `${totalUnlocked} / ${totalAll}`

  // Collapsed preview: show best in-progress achievement
  const preview = panel.querySelector('.ach-collapsed-preview') as HTMLElement | null
  if (preview) {
    if (!panelOpen) {
      const best = bestInProgress(visible)
      preview.innerHTML = best ? buildCollapsedPreview(best) : ''
      preview.style.display = best ? '' : 'none'
    } else {
      preview.style.display = 'none'
    }
  }

  if (!panelOpen) return

  const body = panel.querySelector('.ach-body') as HTMLElement | null
  if (body) renderAchievementBody(body, visible)
}

function buildCollapsedPreview(v: ReturnType<typeof getVisibleAchievements>[0]): string {
  const { achievement: a, progress: prog } = v
  const pct = prog.total > 0 ? Math.min(1, prog.current / prog.total) : 0
  const pctPx = Math.round(pct * 100)
  const hasBar = prog.total > 1

  return `
    <div class="ach-preview-card">
      <div class="ach-preview-body">
        <span class="ach-preview-title">${a.title}</span>
        ${hasBar ? `
        <div class="ach-preview-progress">
          <div class="ach-progress-bar">
            <div class="ach-progress-fill" style="width:${pctPx}%"></div>
          </div>
          <span class="ach-progress-label">${prog.current}/${prog.total}</span>
        </div>` : `<span class="ach-preview-desc">${a.desc}</span>`}
      </div>
      <span class="ach-preview-reward">${a.reward} ${COIN_ICON}</span>
    </div>`
}

function renderAchievementBody(body: HTMLElement, visible: ReturnType<typeof getVisibleAchievements>): void {
  const inProgress = visible
    .filter(v => !v.unlocked)
    .sort((a, b) => {
      const pctA = a.progress.total > 0 ? a.progress.current / a.progress.total : 0
      const pctB = b.progress.total > 0 ? b.progress.current / b.progress.total : 0
      return pctB - pctA
    })
  const unlockedOrder = state.achievements.unlocked
  const done = visible
    .filter(v => v.unlocked)
    .sort((a, b) => unlockedOrder.indexOf(b.achievement.id) - unlockedOrder.indexOf(a.achievement.id))

  body.innerHTML = ''

  if (inProgress.length === 0 && done.length === 0) {
    body.innerHTML = `<p class="ach-empty">${t.achEmpty}</p>`
    return
  }

  if (inProgress.length > 0) {
    const section = document.createElement('div')
    section.className = 'ach-section'
    section.innerHTML = `<p class="ach-section-label">${t.achInProgress}</p>`
    for (const v of inProgress) {
      section.appendChild(buildAchievementCard(v))
    }
    body.appendChild(section)
  }

  if (done.length > 0) {
    const section = document.createElement('div')
    section.className = 'ach-section'
    section.innerHTML = `<p class="ach-section-label">${t.achCompleted}</p>`
    const iconsRow = document.createElement('div')
    iconsRow.className = 'ach-done-icons'
    for (const v of done) {
      iconsRow.appendChild(buildDoneIcon(v))
    }
    section.appendChild(iconsRow)
    body.appendChild(section)
  }
}

function buildDoneIcon(v: ReturnType<typeof getVisibleAchievements>[0]): HTMLElement {
  const { achievement: a } = v
  const el = document.createElement('div')
  el.className = 'ach-done-icon'
  el.title = `${a.title} — ${a.desc} (+${a.reward} 🪙)`
  el.innerHTML = `<span class="ach-done-icon-medal">🏅</span>`
  // Tooltip on hover via title; for better UX also show a small label below
  el.innerHTML = `
    <span class="ach-done-icon-medal">🏅</span>
    <span class="ach-done-icon-label">${a.title}</span>`
  return el
}

function buildAchievementCard(v: ReturnType<typeof getVisibleAchievements>[0]): HTMLElement {
  const { achievement: a, progress: prog, unlocked } = v
  const pct = prog.total > 0 ? Math.min(1, prog.current / prog.total) : 0
  const pctPx = Math.round(pct * 100)
  const isComplete = unlocked || pct >= 1

  const el = document.createElement('div')
  el.className = `ach-card${isComplete ? ' ach-card--done' : ''}`

  const progressHtml = prog.total > 1
    ? `<div class="ach-progress-row">
        <div class="ach-progress-bar">
          <div class="ach-progress-fill${isComplete ? ' ach-progress-fill--done' : ''}" style="width:${pctPx}%"></div>
        </div>
        <span class="ach-progress-label">${prog.current}/${prog.total}</span>
       </div>`
    : ''

  el.innerHTML = `
    <div class="ach-card-left">
      <span class="ach-card-icon">${isComplete ? '🏅' : '○'}</span>
    </div>
    <div class="ach-card-body">
      <div class="ach-card-title">${a.title}</div>
      <div class="ach-card-desc">${a.desc}</div>
      ${progressHtml}
    </div>
    <div class="ach-card-right">
      ${isComplete
        ? `<span class="ach-card-reward ach-card-reward--done">+${a.reward} ${COIN_ICON}</span>`
        : `<span class="ach-card-reward">${a.reward} ${COIN_ICON}</span>`
      }
    </div>`

  return el
}

// ─── Panel initialisation ─────────────────────────────────────────────────────

export function initAchievementsPanel(): void {
  const panel = document.getElementById('achievements-panel')
  if (!panel) return

  const toggle = panel.querySelector('.ach-toggle-btn')
  if (!toggle) return

  toggle.addEventListener('click', () => {
    panelOpen = !panelOpen
    panel.classList.toggle('ach-panel--open', panelOpen)

    const chevron = panel.querySelector('.ach-chevron') as HTMLElement | null
    if (chevron) chevron.textContent = panelOpen ? '▴' : '▾'

    const preview = panel.querySelector('.ach-collapsed-preview') as HTMLElement | null
    if (preview) preview.style.display = panelOpen ? 'none' : ''

    if (panelOpen) {
      const body = panel.querySelector('.ach-body') as HTMLElement | null
      const visible = getVisibleAchievements(state)
      if (body) renderAchievementBody(body, visible)
    }

    renderAchievements()
  })
}
