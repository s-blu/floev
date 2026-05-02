import { UPGRADES, POT_COLORS, POT_SHAPES, POT_EFFECTS, MAX_POT_COUNT, SHOWCASE_MAX_SLOTS, BUFFS, type BuffId, type BuffReqKind } from '../model/shop'
import { state, handleBuyUpgrade, handleBuyPotColor, handleBuyPotShape, handleBuyPotEffect, handleBuyExtraPot, handleBuyExtraShowcaseSlot, handleRedeemBuff } from './ui'
import { hasUpgrade, hasPotColor, hasPotShape, hasPotEffect, getExtraPotPrice, canBuyExtraPot, canBuyExtraShowcaseSlot, getShowcaseSlotPrice, isBuffMaxed, getNextBuffLevel, canFulfillRequirements, plantMatchesReq, getBuffDef } from '../engine/shop_engine'
import { renderPotShopPreview } from '../engine/renderer/pot_renderer'
import { renderPlantSVG } from '../engine/renderer/renderer'
import { t } from '../model/i18n'
import { COIN_ICON } from './icons'
import { getBuffLevel } from '../engine/game_params'
import type { Plant } from '../model/plant'

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
  body.innerHTML = renderExtraPotsSection() + renderShowcaseSection() + renderUpgradesSection() + renderBuffsSection() + renderDecoSection()
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

// ─── Buffs section ────────────────────────────────────────────────────────────

function reqLabel(req: BuffReqKind): string {
  switch (req.kind) {
    case 'any':             return t.buffReqAny
    case 'rarity_min':      return t.buffReqRarityMin(req.min)
    case 'effect':          return t.buffReqEffect(req.effect)
    case 'effect_or':       return t.buffReqEffectOr(req.effects)
    case 'petal_count':     return t.buffReqPetalCount(req.count)
    case 'shape':           return t.buffReqShape(req.shape)
    case 'shape_or':        return t.buffReqShapeOr(req.shapes)
    case 'color_bucket':    return t.buffReqColorBucket(req.bucket)
    case 'color_bucket_or': return t.buffReqColorOr(req.buckets)
    case 'coin_value_min':  return t.buffReqCoinMin(req.min)
    case 'combined':        return t.buffReqCombined(req.predicates.map(p => reqLabel(p)))
  }
}

function renderBuffsSection(): string {
  const items = BUFFS.map(def => {
    const unlockReq = def.unlock_required
    if (unlockReq && !hasUpgrade(state, unlockReq)) return ''

    const currentLevel = getBuffLevel(state, def.id)
    const maxLevel = def.levels.length
    const maxed = isBuffMaxed(state, def.id)
    const nextLevelDef = !maxed ? def.levels[currentLevel] : null
    const effectPct = Math.round((def.levels[Math.max(0, currentLevel - 1)]?.value ?? 0) * 100)

    const levelBadge = currentLevel > 0
      ? `<span class="buff-level-badge">${t.buffLevelLabel(currentLevel, maxLevel)}</span>`
      : `<span class="buff-level-badge buff-level-badge--none">${t.buffNotYetLabel}</span>`

    const currentEffect = currentLevel > 0
      ? `<span class="shop-item-desc">${t.buffDesc[def.id]?.(effectPct)}</span>`
      : `<span class="shop-item-desc">${t.buffDesc[def.id]?.(Math.round((def.levels[0]?.value ?? 0) * 100))}</span>`

    let actionArea: string
    if (maxed) {
      actionArea = `<span class="shop-item-owned-badge">${t.buffMaxed}</span>`
    } else if (nextLevelDef) {
      const reqSummary = nextLevelDef.requirements.map(r =>
        `${r.count}× ${reqLabel(r.req)}`
      ).join(', ')
      actionArea = `
        <div class="buff-action-area">
          <span class="buff-req-summary">${reqSummary}</span>
          <button class="shop-buy-btn" data-action="redeem-buff" data-id="${def.id}">
            ${t.buffRedeemBtn}
          </button>
        </div>`
    } else {
      actionArea = ''
    }

    return `
      <div class="shop-item">
        <span class="shop-item-icon">${def.icon}</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${t.buffTitle[def.id]}</span>
          ${currentEffect}
          ${levelBadge}
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>`
  }).join('')

  if (!items.trim()) return ''

  return `
    <div class="shop-section">
      <p class="shop-section-label">${t.shopSectionBuffs}</p>
      <div class="shop-items-list">${items}</div>
    </div>`
}

// ─── Buff redeem overlay ──────────────────────────────────────────────────────

let _buffOverlayId: BuffId | null = null
let _buffSelectedPotIds: number[] = []
let _buffSelectedSeedIds: string[] = []

export function initBuffShop(): void {
  const body = document.getElementById('shop-sidebar-body')
  body?.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-action="redeem-buff"]') as HTMLElement | null
    if (!el) return
    const id = el.dataset.id as BuffId
    if (id) openBuffRedeemOverlay(id)
  })
}

function openBuffRedeemOverlay(id: BuffId): void {
  document.getElementById('buff-redeem-overlay')?.remove()
  _buffOverlayId = id
  _buffSelectedPotIds = []
  _buffSelectedSeedIds = []

  const def = getBuffDef(id)
  if (!def) return
  const nextLevel = getNextBuffLevel(state, id)
  const levelDef = def.levels[nextLevel - 1]
  if (!levelDef) return

  const overlay = document.createElement('div')
  overlay.id = 'buff-redeem-overlay'
  overlay.className = 'dialog-overlay'
  overlay.innerHTML = buildOverlayHtml(def.id, nextLevel, levelDef.requirements)
  document.body.appendChild(overlay)

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBuffOverlay() })
  document.getElementById('buff-redeem-cancel')?.addEventListener('click', closeBuffOverlay)
  document.getElementById('buff-redeem-confirm')?.addEventListener('click', confirmBuffRedeem)
  overlay.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-buff-pot]') as HTMLElement | null
    if (el) toggleBuffPotSelection(Number(el.dataset.buffPot), id)
    const sel = (e.target as HTMLElement).closest('[data-buff-seed]') as HTMLElement | null
    if (sel) toggleBuffSeedSelection(sel.dataset.buffSeed!, id)
  })
}

function buildOverlayHtml(id: BuffId, nextLevel: number, requirements: import('../model/shop').BuffRequirement[]): string {
  const needsPot  = requirements.some(r => r.source === 'pot')
  const needsSeed = requirements.some(r => r.source === 'seed_drawer')

  const reqRows = requirements.map(r => {
    const label = `${r.count}× ${reqLabel(r.req)} (${r.source === 'pot' ? t.buffReqSourcePot : t.buffReqSourceSeed})`
    return `<li class="buff-req-row" data-req-source="${r.source}">${label}</li>`
  }).join('')

  const bloomingPots = state.pots.filter(p => p.plant && p.plant.phase === 4)
  const potCards = needsPot ? bloomingPots.map(pot => {
    const svg = renderPlantSVG(pot.plant, 60, 72, pot.design)
    return `<button class="buff-plant-card" data-buff-pot="${pot.id}" title="Topf ${pot.id + 1}">${svg}</button>`
  }).join('') : ''

  const seedCards = needsSeed ? state.seeds.map(seed => {
    const svg = renderPlantSVG(seed, 60, 72)
    return `<button class="buff-plant-card" data-buff-seed="${seed.id}">${svg}</button>`
  }).join('') : ''

  return `
    <div class="dialog-box dialog-box--wide">
      <p class="dialog-title">${t.buffRedeemTitle(t.buffTitle[id], nextLevel)}</p>
      <ul class="buff-req-list">${reqRows}</ul>
      ${needsPot ? `
        <p class="buff-pick-hint">${t.buffRedeemPickHint(requirements.filter(r => r.source === 'pot').reduce((s, r) => s + r.count, 0))}</p>
        <div class="buff-plant-grid" id="buff-pot-grid">${bloomingPots.length ? potCards : '<p class="buff-no-plants">Keine blühenden Pflanzen vorhanden.</p>'}</div>
      ` : ''}
      ${needsSeed ? `
        <p class="buff-pick-hint">${t.buffRedeemSeedHint(requirements.filter(r => r.source === 'seed_drawer').reduce((s, r) => s + r.count, 0))}</p>
        <div class="buff-plant-grid" id="buff-seed-grid">${state.seeds.length ? seedCards : '<p class="buff-no-plants">Keine Samen in der Schublade.</p>'}</div>
      ` : ''}
      <p class="buff-progress-hint" id="buff-progress-hint"></p>
      <div class="dialog-actions">
        <button class="btn" id="buff-redeem-cancel">${t.buffRedeemCancel}</button>
        <button class="btn btn-confirm" id="buff-redeem-confirm" disabled>${t.buffRedeemConfirm}</button>
      </div>
    </div>`
}

function toggleBuffPotSelection(potId: number, id: BuffId): void {
  const idx = _buffSelectedPotIds.indexOf(potId)
  if (idx >= 0) {
    _buffSelectedPotIds.splice(idx, 1)
  } else {
    _buffSelectedPotIds.push(potId)
  }
  updateBuffOverlayState(id)
}

function toggleBuffSeedSelection(seedId: string, id: BuffId): void {
  const idx = _buffSelectedSeedIds.indexOf(seedId)
  if (idx >= 0) {
    _buffSelectedSeedIds.splice(idx, 1)
  } else {
    _buffSelectedSeedIds.push(seedId)
  }
  updateBuffOverlayState(id)
}

function updateBuffOverlayState(id: BuffId): void {
  const def = getBuffDef(id)
  if (!def) return
  const nextLevel = getNextBuffLevel(state, id)
  const levelDef = def.levels[nextLevel - 1]
  if (!levelDef) return

  const potPlants = _buffSelectedPotIds
    .map(pid => state.pots.find(p => p.id === pid)?.plant)
    .filter((p): p is Plant => !!p && p.phase === 4)
  const seedPlants = _buffSelectedSeedIds
    .map(sid => state.seeds.find(s => s.id === sid))
    .filter((p): p is Plant => !!p)

  const fulfilled = canFulfillRequirements(potPlants, seedPlants, levelDef.requirements)

  document.querySelectorAll<HTMLElement>('[data-buff-pot]').forEach(el => {
    const pid = Number(el.dataset.buffPot)
    el.classList.toggle('buff-plant-card--selected', _buffSelectedPotIds.includes(pid))
    const plant = state.pots.find(p => p.id === pid)?.plant
    const matchesAny = plant && levelDef.requirements.some(r => r.source === 'pot' && plantMatchesReq(plant, r.req))
    el.classList.toggle('buff-plant-card--ineligible', !matchesAny)
  })
  document.querySelectorAll<HTMLElement>('[data-buff-seed]').forEach(el => {
    const sid = el.dataset.buffSeed!
    el.classList.toggle('buff-plant-card--selected', _buffSelectedSeedIds.includes(sid))
    const seed = state.seeds.find(s => s.id === sid)
    const matchesAny = seed && levelDef.requirements.some(r => r.source === 'seed_drawer' && plantMatchesReq(seed, r.req))
    el.classList.toggle('buff-plant-card--ineligible', !matchesAny)
  })

  const total = _buffSelectedPotIds.length + _buffSelectedSeedIds.length
  const needed = levelDef.requirements.reduce((s, r) => s + r.count, 0)
  const hint = document.getElementById('buff-progress-hint')
  if (hint) hint.textContent = t.buffRedeemProgress(total, needed)

  const confirmBtn = document.getElementById('buff-redeem-confirm') as HTMLButtonElement | null
  if (confirmBtn) confirmBtn.disabled = !fulfilled
}

function confirmBuffRedeem(): void {
  if (!_buffOverlayId) return
  handleRedeemBuff(_buffOverlayId, [..._buffSelectedPotIds], [..._buffSelectedSeedIds])
  closeBuffOverlay()
  renderShopSidebar()
}

function closeBuffOverlay(): void {
  document.getElementById('buff-redeem-overlay')?.remove()
  _buffOverlayId = null
  _buffSelectedPotIds = []
  _buffSelectedSeedIds = []
}
