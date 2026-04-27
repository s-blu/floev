import { t } from '../model/i18n'

const STORAGE_KEY  = 'floev_notif_log'
const OPEN_KEY     = 'floev_notif_footer_open'
const MAX_ENTRIES  = 10
const TEXT_HIDE_MS = 5000

interface LogEntry {
  text:      string
  timestamp: number
}

let log: LogEntry[]  = []
let footerOpen       = false
let highlightTimer: ReturnType<typeof setTimeout> | null = null

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadLog(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) log = JSON.parse(raw)
  } catch { log = [] }
}

function saveLog(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function addNotification(text: string): void {
  log.unshift({ text, timestamp: Date.now() })
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES
  saveLog()
  setIdle(false)
  renderFooter()
  scheduleIdle()
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function renderFooter(): void {
  const footer  = document.getElementById('notification-footer')
  const latestEl = document.getElementById('notif-latest-text')
  const panel   = document.getElementById('notif-log-panel')
  if (!panel) return

  const isIdle = footer?.classList.contains('notif-footer--idle') ?? false
  footer?.classList.toggle('notif-footer--open', footerOpen)

  // Bar text: visible only when collapsed and not idle
  if (latestEl) {
    latestEl.textContent = (!footerOpen && !isIdle) ? (log[0]?.text ?? t.notifEmpty) : ''
    latestEl.hidden      = footerOpen
  }

  if (!footerOpen) {
    panel.hidden = true
    return
  }

  panel.hidden = false
  if (log.length === 0) {
    panel.innerHTML = `<div class="notif-log-empty">${t.notifEmpty}</div>`
    return
  }
  panel.innerHTML = log
    .map(e => `
      <div class="notif-log-entry">
        <span class="notif-log-time">${formatTime(e.timestamp)}</span>
        <span class="notif-log-text">${e.text}</span>
      </div>`)
    .join('')
}

function setIdle(idle: boolean): void {
  document.getElementById('notification-footer')?.classList.toggle('notif-footer--idle', idle)
}

function scheduleIdle(): void {
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => setIdle(true), TEXT_HIDE_MS)
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initNotificationFooter(initialMsg?: string): void {
  loadLog()
  if (initialMsg && log.length === 0) log.push({ text: initialMsg, timestamp: Date.now() })

  try { footerOpen = localStorage.getItem(OPEN_KEY) === 'true' } catch { /* empty */ }

  const footer = document.createElement('div')
  footer.id        = 'notification-footer'
  footer.className = 'notif-footer'
  footer.innerHTML = `
    <div class="notif-footer-bar" id="notif-footer-bar">
      <span class="notif-latest-text" id="notif-latest-text"></span>
      <span class="notif-chevron" id="notif-chevron">▴</span>
    </div>
    <div class="notif-log-panel" id="notif-log-panel" hidden></div>`
  document.body.appendChild(footer)

  document.getElementById('notif-footer-bar')?.addEventListener('click', () => {
    footerOpen = !footerOpen
    localStorage.setItem(OPEN_KEY, String(footerOpen))
    renderFooter()
  })

  // On load: old messages are already "stale", go idle immediately
  if (log.length > 0) setIdle(true)
  renderFooter()
}
