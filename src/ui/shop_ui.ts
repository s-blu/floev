import { UPGRADES, POT_COLORS, POT_SHAPES } from '../model/shop'
import { state, handleBuyUpgrade, handleBuyPotColor, handleBuyPotShape, handleSetPotDesign } from './ui'
import { hasUpgrade, hasPotColor, hasPotShape } from '../engine/shop_engine'

// ─── Shop sidebar ─────────────────────────────────────────────────────────────

let sidebarOpen = false

export function initShop(): void {
  const btn = document.getElementById('shop-open-btn')
  btn?.addEventListener('click', toggleShop)
}

function toggleShop(): void {
  sidebarOpen = !sidebarOpen
  const sidebar = document.getElementById('shop-sidebar')
  const overlay = document.getElementById('shop-overlay')
  if (!sidebar || !overlay) return
  sidebar.classList.toggle('shop-sidebar--open', sidebarOpen)
  overlay.classList.toggle('shop-overlay--visible', sidebarOpen)
  if (sidebarOpen) renderShopSidebar()
}

export function closeShop(): void {
  sidebarOpen = false
  document.getElementById('shop-sidebar')?.classList.remove('shop-sidebar--open')
  document.getElementById('shop-overlay')?.classList.remove('shop-overlay--visible')
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderShopSidebar(): void {
  if (!sidebarOpen) return
  const body = document.getElementById('shop-sidebar-body')
  if (!body) return
  body.innerHTML = renderUpgradesSection() + renderDecoSection()
  bindEvents(body)
}

// ─── Upgrades section ─────────────────────────────────────────────────────────

function renderUpgradesSection(): string {
  const items = UPGRADES.map(u => {
    const owned = hasUpgrade(state, u.id)
    const canAfford = state.coins >= u.price
    const disabled = owned || !canAfford
    return `
      <div class="shop-item ${owned ? 'shop-item--owned' : ''} ${!owned && !canAfford ? 'shop-item--locked' : ''}">
        <span class="shop-item-icon">${owned ? '✓' : u.icon}</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${u.title}</span>
          <span class="shop-item-desc">${u.desc}</span>
        </div>
        <div class="shop-item-action">
          ${owned
            ? `<span class="shop-item-owned-badge">Gekauft</span>`
            : `<button class="shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}"
                 data-action="buy-upgrade" data-id="${u.id}" ${disabled ? 'disabled' : ''}>
                 🪙 ${u.price}
               </button>`
          }
        </div>
      </div>`
  }).join('')

  return `
    <div class="shop-section">
      <p class="shop-section-label">Upgrades</p>
      <div class="shop-items-list">${items}</div>
    </div>`
}

// ─── Deco section ─────────────────────────────────────────────────────────────

function renderDecoSection(): string {
  const activeColor = state.potDesign?.colorId ?? 'terracotta'
  const activeShape = state.potDesign?.shape ?? 'standard'

  // ── Color swatches ──
  const colorSwatches = POT_COLORS.map(c => {
    const owned = hasPotColor(state, c.id)
    const active = c.id === activeColor
    const canAfford = state.coins >= c.price
    return `
      <button
        class="pot-swatch ${active ? 'pot-swatch--active' : ''} ${!owned ? 'pot-swatch--locked' : ''}"
        data-action="${owned ? 'set-color' : 'buy-color'}"
        data-id="${c.id}"
        title="${c.label}${owned ? '' : ` — 🪙 ${c.price}`}"
        style="--swatch-body: ${c.body}; --swatch-rim: ${c.rim}"
        ${!owned && !canAfford ? 'disabled' : ''}
      >
        <span class="pot-swatch-dot" style="background:${c.body};border-color:${c.rim}"></span>
        ${!owned ? `<span class="pot-swatch-price">🪙${c.price}</span>` : ''}
        ${active ? `<span class="pot-swatch-check">✓</span>` : ''}
      </button>`
  }).join('')

  // ── Shape cards ──
  const shapeCards = POT_SHAPES.map(s => {
    const owned = hasPotShape(state, s.id)
    const active = s.id === activeShape
    const canAfford = state.coins >= s.price
    return `
      <button
        class="pot-shape-card ${active ? 'pot-shape-card--active' : ''} ${!owned ? 'pot-shape-card--locked' : ''}"
        data-action="${owned ? 'set-shape' : 'buy-shape'}"
        data-id="${s.id}"
        ${!owned && !canAfford ? 'disabled' : ''}
      >
        <span class="pot-shape-preview">${renderPotShapeSVG(s.id, activeColor)}</span>
        <span class="pot-shape-label">${s.label}</span>
        ${!owned ? `<span class="pot-shape-price">🪙 ${s.price}</span>` : ''}
        ${active ? `<span class="pot-shape-active-dot"></span>` : ''}
      </button>`
  }).join('')

  return `
    <div class="shop-section">
      <p class="shop-section-label">Topf-Design</p>
      <p class="shop-subsection-label">Farbe</p>
      <div class="pot-color-grid">${colorSwatches}</div>
      <p class="shop-subsection-label" style="margin-top:12px">Form</p>
      <div class="pot-shape-row">${shapeCards}</div>
    </div>`
}

// ─── Pot shape mini SVG preview ───────────────────────────────────────────────

function renderPotShapeSVG(shape: string, colorId: string): string {
  const COLORS: Record<string, { body: string; rim: string }> = {
    terracotta: { body: '#b8724a', rim: '#c8855a' },
    cream:      { body: '#e8dfc8', rim: '#f0e8d4' },
    slate:      { body: '#6b7280', rim: '#7d8795' },
    sage:       { body: '#7a9e7e', rim: '#8db592' },
    blush:      { body: '#c4867a', rim: '#d49a8e' },
    cobalt:     { body: '#3d5a8a', rim: '#4a6ea0' },
    obsidian:   { body: '#2a2825', rim: '#3a3835' },
    gold:       { body: '#c9963a', rim: '#dba84a' },
  }
  const c = COLORS[colorId] ?? COLORS.terracotta
  const w = 36, h = 32
  const rimH = 4, potH = 18

  let potPath = ''
  if (shape === 'conic') {
    const topX = 8, topW = 20, botX = 4, botW = 28
    potPath = `<path d="M${topX},${rimH} L${topX + topW},${rimH} L${botX + botW},${rimH + potH} L${botX},${rimH + potH} Z" fill="${c.body}"/>`
  } else if (shape === 'belly') {
    potPath = `
      <rect x="6" y="${rimH}" width="24" height="${potH}" rx="3" fill="${c.body}"/>
      <ellipse cx="${w / 2}" cy="${rimH + potH * 0.5}" rx="14" ry="${potH * 0.36}" fill="${c.body}"/>`
  } else {
    potPath = `<rect x="6" y="${rimH}" width="24" height="${potH}" rx="3" fill="${c.body}"/>`
  }

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    ${potPath}
    <rect x="4" y="0" width="28" height="${rimH}" rx="2" fill="${c.rim}"/>
  </svg>`
}

// ─── Event binding ────────────────────────────────────────────────────────────

function bindEvents(body: HTMLElement): void {
  body.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
    if (!btn) return
    const action = btn.dataset.action
    const id = btn.dataset.id ?? ''

    if (action === 'buy-upgrade')  handleBuyUpgrade(id)
    else if (action === 'buy-color')   handleBuyPotColor(id)
    else if (action === 'set-color')   handleSetPotDesign({ colorId: id })
    else if (action === 'buy-shape')   handleBuyPotShape(id)
    else if (action === 'set-shape')   handleSetPotDesign({ shape: id as 'standard' | 'conic' | 'belly' })
  })
}
