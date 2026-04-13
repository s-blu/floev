import type { Achievement } from '../model/achievements'
import { getVisibleAchievements } from '../engine/achievements'
import { state, showMsg } from './ui'
import { t } from '../model/i18n'

// ─── Toast queue ──────────────────────────────────────────────────────────────

const toastQueue: Achievement[] = []
let toastActive = false

export function queueAchievementToast(achievements: Achievement[]): void {
  toastQueue.push(...achievements)
  if (!toastActive) drainToastQueue()
}

function drainToastQueue(): void {
  if (toastQueue.length === 0) { toastActive = false; return }
  toastActive = true
  const a = toastQueue.shift()!
  showAchievementToast(a, () => {
    setTimeout(drainToastQueue, 300)
  })
}

function showAchievementToast(a: Achievement, onDone: () => void): void {
  document.getElementById('achievement-toast')?.remove()

  const el = document.createElement('div')
  el.id = 'achievement-toast'
  el.className = 'ach-toast'
  el.innerHTML = `
    <span class="ach-toast-icon">🏅</span>
    <div class="ach-toast-body">
      <span class="ach-toast-title">${t.achUnlocked}</span>
      <span class="ach-toast-name">${a.title}</span>
    </div>
    <span class="ach-toast-reward">+${a.reward} 🪙</span>`

  document.body.appendChild(el)

  // Animate in
  requestAnimationFrame(() => el.classList.add('ach-toast--visible'))

  setTimeout(() => {
    el.classList.remove('ach-toast--visible')
    el.classList.add('ach-toast--hiding')
    setTimeout(() => { el.remove(); onDone() }, 400)
  }, 3200)
}

// ─── Panel render ─────────────────────────────────────────────────────────────

let panelOpen = false

export function renderAchievements(): void {
  const panel = document.getElementById('achievements-panel')
  if (!panel) return

  const visible = getVisibleAchievements(state)
  const totalUnlocked = state.achievements.unlocked.length
  const totalAll = visible.length  // only count visible for the header

  // Update header counter
  const counter = panel.querySelector('.ach-header-count')
  if (counter) counter.textContent = `${totalUnlocked} / ${totalAll}`

  const body = panel.querySelector('.ach-body')
  if (!body) return

  if (!panelOpen) return  // Don't rerender collapsed panel content

  renderAchievementBody(body as HTMLElement, visible)
}

function renderAchievementBody(body: HTMLElement, visible: ReturnType<typeof getVisibleAchievements>): void {
  // Split: unlocked vs in-progress
  const inProgress = visible.filter(v => !v.unlocked)
  const done = visible.filter(v => v.unlocked)

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
    for (const v of done) {
      section.appendChild(buildAchievementCard(v))
    }
    body.appendChild(section)
  }
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
        ? `<span class="ach-card-reward ach-card-reward--done">+${a.reward} 🪙</span>`
        : `<span class="ach-card-reward">${a.reward} 🪙</span>`
      }
    </div>`

  return el
}

// ─── Panel initialisation (called once from main) ─────────────────────────────

export function initAchievementsPanel(): void {
  const panel = document.getElementById('achievements-panel')
  if (!panel) return

  const header = panel.querySelector('.ach-header')
  if (!header) return

  header.addEventListener('click', () => {
    panelOpen = !panelOpen
    panel.classList.toggle('ach-panel--open', panelOpen)

    if (panelOpen) {
      const body = panel.querySelector('.ach-body') as HTMLElement | null
      const visible = getVisibleAchievements(state)
      if (body) renderAchievementBody(body, visible)
    }
  })
}
