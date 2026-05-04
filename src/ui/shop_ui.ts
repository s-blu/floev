import { UPGRADES, POT_COLORS, POT_SHAPES, POT_EFFECTS, MAX_POT_COUNT, SHOWCASE_MAX_SLOTS } from '../model/shop'
import { state, handleBuyUpgrade, handleBuyPotColor, handleBuyPotShape, handleBuyPotEffect, handleBuyExtraPot, handleBuyExtraShowcaseSlot, handleBuyExtraSeedRow } from './ui'
import { hasUpgrade, hasPotColor, hasPotShape, hasPotEffect, getExtraPotPrice, canBuyExtraPot, canBuyExtraShowcaseSlot, getShowcaseSlotPrice, canBuyExtraSeedRow } from '../engine/shop_engine'
import { getSeedSlotCount } from '../engine/seed_storage_engine'
import { MAX_EXTRA_SEED_ROWS, SEEDS_PER_SLOT, EXTRA_SEED_ROW_PRICE } from '../model/genetic_model'
import { renderPotShopPreview } from '../engine/renderer/pot_renderer'
import { t } from '../model/i18n'
import { COIN_ICON } from './icons'

// ─── Shop sidebar ─────────────────────────────────────────────────────────────

let sidebarOpen = false

let _eventsInitialized = false

export function initShop(): void {
  const btn = document.getElementById('shop-open-btn')
  btn?.addEventListener('click', toggleShop)

  // Bind events once on the stable container, not on re-renders
  const body = document.getElementById('shop-sidebar-body')
  if (body && !_eventsInitialized) {
    body.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
      if (!el) return
      const action = el.dataset.action
      const id = el.dataset.id ?? ''
      if      (action === 'buy-upgrade')   handleBuyUpgrade(id)
      else if (action === 'buy-color')     handleBuyPotColor(id)
      else if (action === 'buy-shape')     handleBuyPotShape(id)
      else if (action === 'buy-effect')    handleBuyPotEffect(id)
      else if (action === 'buy-extra-pot')          handleBuyExtraPot()
      else if (action === 'buy-extra-showcase-slot') handleBuyExtraShowcaseSlot()
      else if (action === 'buy-extra-seed-row')      handleBuyExtraSeedRow()
    })
    _eventsInitialized = true
  }
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
  body.innerHTML =  renderExtraPotsSection() + renderShowcaseSection() + renderSeedSlotsSection() + renderUpgradesSection() +  renderDecoSection()
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
          <span class="shop-item-title">${t.upgradeTitle[u.id]}</span>
          <span class="shop-item-desc">${t.upgradeDesc[u.id]}</span>
        </div>
        <div class="shop-item-action">
          ${owned
            ? `<span class="shop-item-owned-badge">${t.shopItemOwned}</span>`
            : `<button class="shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}"
                 data-action="buy-upgrade" data-id="${u.id}" ${disabled ? 'disabled' : ''}>
                 ${COIN_ICON} ${u.price}
               </button>`
          }
        </div>
      </div>`
  }).join('')

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionUpgrades}</p>
      <div class="shop-items-list">${items}</div>
    </div>`
}

// ─── Extra pots section ───────────────────────────────────────────────────────

function renderExtraPotsSection(): string {
  const potCount   = state.pots.length
  const atMax      = !canBuyExtraPot(state)
  const price      = getExtraPotPrice(state)
  const canAfford  = state.coins >= price

  const actionArea = atMax
    ? `<span class="shop-item-owned-badge">${t.shopPotsMax}</span>`
    : `<button
         class="shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}"
         data-action="buy-extra-pot"
         ${!canAfford ? 'disabled' : ''}>
         ${COIN_ICON} ${price}
       </button>`

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionPots}</p>
      <div class="shop-item">
        <span class="shop-item-icon">🪴</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${t.shopPotsTitle}</span>
          <span class="shop-item-desc">${t.shopPotsDesc(potCount, MAX_POT_COUNT)}</span>
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>
    </div>`
}

// ─── Showcase section ─────────────────────────────────────────────────────────

function renderShowcaseSection(): string {
  if (!hasUpgrade(state, 'unlock_showcase')) return ''

  const slotCount  = state.showcase.length
  const atMax      = !canBuyExtraShowcaseSlot(state)
  const price      = getShowcaseSlotPrice(state)
  const canAfford  = state.coins >= price

  const actionArea = atMax
    ? `<span class="shop-item-owned-badge">${t.shopShowcaseSlotsMax}</span>`
    : `<button
         class="shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}"
         data-action="buy-extra-showcase-slot"
         ${!canAfford ? 'disabled' : ''}>
         ${COIN_ICON} ${price}
       </button>`

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionShowcase}</p>
      <div class="shop-item">
        <span class="shop-item-icon">🪟</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${t.upgradeTitle['unlock_showcase']}</span>
          <span class="shop-item-desc">${t.shopShowcaseSlotsDesc(slotCount, SHOWCASE_MAX_SLOTS)}</span>
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>
    </div>`
}

// ─── Seed slots section ───────────────────────────────────────────────────────

function renderSeedSlotsSection(): string {
  if (!hasUpgrade(state, 'unlock_seed_drawer')) return ''

  const currentRows = state.extraSeedRows ?? 0
  const currentSlots = getSeedSlotCount(state)
  const currentCapacity = currentSlots * SEEDS_PER_SLOT
  const atMax = !canBuyExtraSeedRow(state)
  const canAfford = state.coins >= EXTRA_SEED_ROW_PRICE

  const actionArea = atMax
    ? `<span class="shop-item-owned-badge">${t.shopSeedSlotsMax}</span>`
    : `<button
         class="shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}"
         data-action="buy-extra-seed-row"
         ${!canAfford ? 'disabled' : ''}>
         ${COIN_ICON} ${EXTRA_SEED_ROW_PRICE}
       </button>`

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionSeedSlots}</p>
      <div class="shop-item">
        <span class="shop-item-icon">🗄️</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${t.shopSeedSlotsTitle}</span>
          <span class="shop-item-desc">${t.shopSeedSlotsDesc(currentSlots, currentCapacity, MAX_EXTRA_SEED_ROWS - currentRows)}</span>
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>
    </div>`
}

// ─── Deco section ─────────────────────────────────────────────────────────────

function renderDecoSection(): string {
  // ── Color swatches ──
  const colorSwatches = POT_COLORS.map(c => {
    const owned = hasPotColor(state, c.id)
    const canAfford = state.coins >= c.price
    return `
      <button
        class="pot-swatch ${owned ? 'pot-swatch--owned' : ''} ${!owned && !canAfford ? 'pot-swatch--cant-afford' : ''}"
        data-action="${owned ? '' : 'buy-color'}"
        data-id="${c.id}"
        title="${t.potColorLabels[c.id]}${owned ? t.shopOwnedSuffix : ` — 🪙 ${c.price}`}"
        ${owned ? 'disabled' : (!canAfford ? 'disabled' : '')}
      >
        <span class="pot-swatch-dot" style="background:${c.body};border-color:${c.rim}"></span>
        ${owned
          ? `<span class="pot-swatch-check">✓</span>`
          : `<span class="pot-swatch-price">${COIN_ICON}${c.price}</span>`}
      </button>`
  }).join('')

  // ── Shape cards ──
  const shapeCards = POT_SHAPES.map(s => {
    const owned = hasPotShape(state, s.id)
    const canAfford = state.coins >= s.price
    return `
      <button
        class="pot-shape-card ${owned ? 'pot-shape-card--owned' : ''} ${!owned && !canAfford ? 'pot-shape-card--locked' : ''}"
        data-action="${owned ? '' : 'buy-shape'}"
        data-id="${s.id}"
        ${owned ? 'disabled' : (!canAfford ? 'disabled' : '')}
      >
        <span class="pot-shape-preview">${renderPotShopPreview(s.id, 'terracotta')}</span>
        <span class="pot-shape-label">${t.potShapeLabels[s.id]}</span>
        ${owned
          ? `<span class="pot-shape-price" style="color:var(--green)">✓</span>`
          : `<span class="pot-shape-price">${COIN_ICON} ${s.price}</span>`}
      </button>`
  }).join('')

  // ── Effect cards ──
  const effectCards = POT_EFFECTS.map(e => {
    const owned = hasPotEffect(state, e.id)
    const canAfford = state.coins >= e.price
    return `
      <button
        class="pot-shape-card ${owned ? 'pot-shape-card--owned' : ''} ${!owned && !canAfford ? 'pot-shape-card--locked' : ''}"
        data-action="${owned ? '' : 'buy-effect'}"
        data-id="${e.id}"
        ${owned ? 'disabled' : (!canAfford ? 'disabled' : '')}
      >
        <span class="pot-shape-preview">${renderPotShopPreview('standard', 'terracotta', e.id)}</span>
        <span class="pot-shape-label">${t.potEffectLabels[e.id]}</span>
        ${owned
          ? `<span class="pot-shape-price" style="color:var(--green)">✓</span>`
          : `<span class="pot-shape-price">${COIN_ICON} ${e.price}</span>`}
      </button>`
  }).join('')

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionDeco}</p>
      <p class="shop-subsection-label">${t.shopSubsectionColors}</p>
      <p class="shop-deco-hint">${t.shopDecoHint}</p>
      <div class="pot-color-grid">${colorSwatches}</div>
      <p class="shop-subsection-label" style="margin-top:12px">${t.shopSubsectionShapes}</p>
      <div class="pot-shape-row">${shapeCards}</div>
      <p class="shop-subsection-label" style="margin-top:12px">${t.shopSubsectionEffects}</p>
      <div class="pot-shape-row">${effectCards}</div>
    </div>`
}
