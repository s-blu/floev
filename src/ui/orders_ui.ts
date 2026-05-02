// ─── Order book UI ────────────────────────────────────────────────────────────

import type { Order, OrderRequirement } from '../model/orders'
import type { Plant, PetalShape, CenterType, ChromaticL, PetalEffect, PetalCount } from '../model/plant'
import { state } from './ui'
import { t } from '../model/i18n'
import { hasUpgrade } from '../engine/shop_engine'
import {
  initOrderBook,
  canRefreshOrders,
  refreshOrders,
  toggleOrderPin,
  matchingOrderIndices,
} from '../engine/orders_engine'
import { saveState } from '../engine/game'
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer'
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY } from '../model/genetic_model'

// ─── Panel open state (persisted in localStorage) ────────────────────────────

const PANEL_OPEN_KEY = 'orderBookPanelOpen'

function loadPanelOpen(): boolean {
  const stored = localStorage.getItem(PANEL_OPEN_KEY)
  return stored === null ? true : stored === 'true'
}

function savePanelOpen(value: boolean): void {
  localStorage.setItem(PANEL_OPEN_KEY, String(value))
}

let panelOpen = loadPanelOpen()

// ─── Refresh button confirm state ─────────────────────────────────────────────

const REFRESH_CONFIRM_TIMEOUT_MS = 2500

let refreshPending = false
let refreshPendingTimer: ReturnType<typeof setTimeout> | undefined

function armRefreshButton(btn: HTMLButtonElement): void {
  cancelRefreshPending()
  refreshPending = true
  btn.classList.add('order-refresh-btn--pending')
  btn.textContent = t.orderBookRefreshConfirmBtn
  refreshPendingTimer = setTimeout(() => {
    refreshPending = false
    refreshPendingTimer = undefined
    const el = document.querySelector<HTMLButtonElement>('.order-refresh-btn')
    if (el) {
      el.classList.remove('order-refresh-btn--pending')
      el.textContent = t.orderBookRefreshBtn
    }
  }, REFRESH_CONFIRM_TIMEOUT_MS)
}

function cancelRefreshPending(): void {
  if (refreshPendingTimer !== undefined) clearTimeout(refreshPendingTimer)
  refreshPendingTimer = undefined
  refreshPending = false
}

// ─── Order preview plant ──────────────────────────────────────────────────────

const BUCKET_HUE: Record<string, number> = {
  white:       ACHROMATIC_HUE_WHITE,
  yellowgreen: 60,
  red:         0,
  blue:        200,
  purple:      250,
  pink:        310,
  gray:        ACHROMATIC_HUE_GRAY,
}

const PREVIEW_RENDER_SIZE = 80

function previewPlantForOrder(order: Order): Plant {
  let shape: PetalShape   = 'round'
  let count: PetalCount   = 3
  let center: CenterType  = 'dot'
  let hue                 = ACHROMATIC_HUE_WHITE
  let lightness: ChromaticL = 90
  let effect: PetalEffect = 'none'
  let lightnessExplicit   = false

  for (const req of order.requirements) {
    switch (req.trait) {
      case 'petalShape':    shape   = req.value as PetalShape;   break
      case 'colorBucket':  hue     = BUCKET_HUE[req.value as string] ?? ACHROMATIC_HUE_WHITE; break
      case 'petalLightness': lightness = req.value as ChromaticL; lightnessExplicit = true; break
      case 'petalCount':   if (req.op === 'gte') count = req.value as PetalCount; break
      case 'centerType':   center  = req.value as CenterType;    break
      case 'petalEffect':  effect  = req.value as PetalEffect;   break
    }
  }

  if (hue >= 0 && !lightnessExplicit) lightness = 60
  if (lightnessExplicit && hue < 0) hue = 350

  return {
    id: 'order-preview',
    petalShape:     { a: shape,    b: shape },
    petalCount:     { a: count,    b: count },
    centerType:     { a: center,   b: center },
    petalHue:       { a: hue,      b: hue },
    petalLightness: { a: lightness, b: lightness },
    petalEffect:    { a: effect,   b: effect },
    stemHeight:     { a: 0.5,      b: 0.5 },
    stem:           { a: 'two-leaved-stem', b: 'two-leaved-stem' },
    phase:          4,
    generation:     1,
  }
}

// ─── Requirement label ────────────────────────────────────────────────────────

function requirementLabel(req: OrderRequirement): string {
  switch (req.trait) {
    case 'petalShape':
      return t.orderReqShape(t.shapeLabels[req.value as string] ?? String(req.value))
    case 'colorBucket':
      return t.orderReqColor(t.colorBucketLabels[req.value as string] ?? String(req.value))
    case 'petalLightness':
      return t.orderReqLightness(t.lightnessLabels[req.value as number] ?? String(req.value))
    case 'petalCount':
      if (req.op === 'gte') return t.orderReqCountGte(req.value as number)
      if (req.op === 'lte') return t.orderReqCountLte(req.value as number)
      return t.orderReqCountGte(req.value as number)
    case 'centerType':
      return t.orderReqCenter(t.centerTypeLabels[req.value as string] ?? String(req.value))
    case 'petalEffect':
      return t.orderReqEffect(t.effectLabels[req.value as string] ?? String(req.value))
    case 'homozygous':
      return t.orderReqHomozygous
  }
}

function difficultyClass(req: OrderRequirement): string {
  return `order-req--${req.difficulty}`
}

// ─── Order card builder ───────────────────────────────────────────────────────

function buildOrderCard(order: Order, index: number): HTMLElement {
  const card = document.createElement('div')
  card.className = `order-card${order.completedToday ? ' order-card--done' : ''}`

  const previewSvg = renderBloomSVG(previewPlantForOrder(order), PREVIEW_RENDER_SIZE, PREVIEW_RENDER_SIZE, 'ord')

  const reqTags = order.requirements
    .map(r => `<span class="order-req-tag ${difficultyClass(r)}">${requirementLabel(r)}</span>`)
    .join('')

  card.innerHTML = `
    <div class="order-card-preview">${previewSvg}</div>
    <div class="order-card-body">
      <div class="order-card-header">
        <span class="order-card-label">${t.orderBookOrderLabel(index + 1)}</span>
        <div class="order-card-actions">
          ${order.completedToday
            ? `<span class="order-done-badge">${t.orderBookDoneLabel}</span>`
            : `<span class="order-reward">${t.orderBookReward(order.reward)}</span>`
          }
          ${!order.completedToday
            ? `<button class="order-pin-btn${order.pinned ? ' order-pin-btn--active' : ''}"
            title="${order.pinned ? t.orderBookUnpinTitle : t.orderBookPinTitle}"
            data-order-index="${index}">📌</button>`
            : ''
          }
        </div>
      </div>
      <div class="order-req-tags">${reqTags}</div>
    </div>`

  card.querySelector('.order-pin-btn')?.addEventListener('click', () => {
    toggleOrderPin(state, index)
    saveState(state)
    renderOrderBook()
  })

  return card
}

// ─── Panel render ─────────────────────────────────────────────────────────────

export function renderOrderBook(): void {
  const panel = document.getElementById('order-book-panel')
  if (!panel) return

  const hasBook = hasUpgrade(state, 'unlock_order_book')
  panel.style.display = hasBook ? '' : 'none'
  if (!hasBook) return

  initOrderBook(state)

  const orders = state.orderBook!.orders

  // Collapsed summary
  const summary = panel.querySelector('.order-collapsed-summary') as HTMLElement | null
  if (summary) {
    const done = orders.filter(o => o.completedToday).length
    summary.textContent = `${done}/3`
    summary.style.display = panelOpen ? 'none' : ''
  }

  const chevron = panel.querySelector('.order-chevron') as HTMLElement | null
  if (chevron) chevron.textContent = panelOpen ? '▴' : '▾'

  panel.classList.toggle('order-panel--open', panelOpen)

  const body = panel.querySelector('.order-body') as HTMLElement | null
  if (!body) return

  if (!panelOpen) return

  body.innerHTML = ''

  // Refresh button
  const canRefresh = canRefreshOrders(state)
  const refreshUsed = state.orderBook!.dailyRefreshUsed
  const refreshBtn = document.createElement('button')
  refreshBtn.className = `btn-sm order-refresh-btn${refreshUsed ? ' order-refresh-btn--used' : ''}${refreshPending && canRefresh ? ' order-refresh-btn--pending' : ''}`
  refreshBtn.textContent = refreshUsed
    ? t.orderBookRefreshUsed
    : refreshPending
      ? t.orderBookRefreshConfirmBtn
      : t.orderBookRefreshBtn
  refreshBtn.disabled = !canRefresh
  refreshBtn.addEventListener('click', () => {
    if (refreshPending) {
      cancelRefreshPending()
      if (refreshOrders(state)) {
        saveState(state)
        renderOrderBook()
      }
    } else {
      armRefreshButton(refreshBtn)
    }
  })
  body.appendChild(refreshBtn)

  // Order cards
  for (let i = 0; i < orders.length; i++) {
    body.appendChild(buildOrderCard(orders[i], i))
  }
}

// ─── Panel initialisation ────────────────────────────────────────────────────

export function initOrderBookPanel(): void {
  const panel = document.getElementById('order-book-panel')
  if (!panel) return

  const toggle = panel.querySelector('.order-toggle-btn')
  toggle?.addEventListener('click', () => {
    panelOpen = !panelOpen
    savePanelOpen(panelOpen)
    renderOrderBook()
  })
}

// ─── Pot badge helpers ───────────────────────────────────────────────────────

/** Returns 1-based order numbers (1, 2, 3) that the plant satisfies. */
export function getMatchingOrderNumbers(plant: import('../model/plant').Plant): number[] {
  if (!hasUpgrade(state, 'unlock_order_book') || !state.orderBook) return []
  return matchingOrderIndices(plant, state.orderBook.orders).map(i => i + 1)
}
