import { state, handlePlantSeedFromStorage, handleMoveSeedToSlot, handleSellSeed } from './ui'
import { t } from '../model/i18n'
import { SAATENSCHUBLADE_SLOTS, SEEDS_PER_SLOT, MAX_SEED_STORAGE } from '../model/genetic_model'
import { renderSeedSvg, renderSeedIcon } from '../engine/renderer/seed_renderer'
import { SEED_SELL_VALUE } from '../model/genetic_model'

// ─── State ────────────────────────────────────────────────────────────────────

let drawerOpen = false
let targetPotId: number | null = null
let selectedSeedId: string | null = null

// ─── Seed position helpers ────────────────────────────────────────────────────

const SLOT_BASE_POSITIONS: { x: number; y: number }[][] = [
  [],
  [{ x: 0.50, y: 0.50 }],
  [{ x: 0.32, y: 0.50 }, { x: 0.68, y: 0.50 }],
  [{ x: 0.25, y: 0.35 }, { x: 0.75, y: 0.35 }, { x: 0.50, y: 0.72 }],
  [{ x: 0.27, y: 0.30 }, { x: 0.73, y: 0.30 }, { x: 0.27, y: 0.70 }, { x: 0.73, y: 0.70 }],
  [{ x: 0.20, y: 0.28 }, { x: 0.50, y: 0.20 }, { x: 0.80, y: 0.28 }, { x: 0.30, y: 0.72 }, { x: 0.70, y: 0.72 }],
]

function seedJitter(id: string): { dx: number; dy: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return {
    dx: ((h & 0xff) / 255 - 0.5) * 12,
    dy: (((h >> 8) & 0xff) / 255 - 0.5) * 10,
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSeedDrawer(): void {
  document.getElementById('seed-drawer-close-btn')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-overlay')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-drawer-btn')?.addEventListener('click', () => openSeedDrawer(null))

  document.getElementById('seed-drawer-body')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Plant-select mode: clicking a seed plants it
    if (targetPotId !== null) {
      const seedEl = target.closest('[data-seed-id]') as HTMLElement | null
      if (seedEl) {
        handlePlantSeedFromStorage(targetPotId, seedEl.dataset.seedId!)
        closeSeedDrawer()
      }
      return
    }

    // Move mode: seed is selected – click on a slot or sell zone to act
    if (selectedSeedId !== null) {
      const slotEl = target.closest('[data-slot-idx]') as HTMLElement | null
      const seedEl = target.closest('[data-seed-id]') as HTMLElement | null
      const sellZone = target.closest('[data-sell-zone]') as HTMLElement | null

      // Clicking the selected seed again → deselect
      if (seedEl?.dataset.seedId === selectedSeedId) {
        selectedSeedId = null
        renderSeedDrawerBody()
        return
      }

      if (sellZone) {
        const seedToSell = selectedSeedId
        selectedSeedId = null
        handleSellSeed(seedToSell, sellZone)
        renderSeedDrawerBody()
        return
      }

      if (slotEl) {
        const slotIdx = parseInt(slotEl.dataset.slotIdx!, 10)
        handleMoveSeedToSlot(selectedSeedId, slotIdx)
        selectedSeedId = null
        renderSeedDrawerBody()
        return
      }

      // Click outside any slot → deselect
      selectedSeedId = null
      renderSeedDrawerBody()
      return
    }

    // Normal mode: click a seed to pick it up
    const seedEl = target.closest('[data-seed-id]') as HTMLElement | null
    if (seedEl) {
      selectedSeedId = seedEl.dataset.seedId!
      renderSeedDrawerBody()
    }
  })
}

// ─── Open / Close ─────────────────────────────────────────────────────────────

export function openSeedDrawer(potId: number | null): void {
  targetPotId = potId
  selectedSeedId = null
  drawerOpen = true
  document.getElementById('seed-drawer')?.classList.add('seed-drawer--open')
  document.getElementById('seed-overlay')?.classList.add('seed-overlay--visible')
  renderSeedDrawerBody()
}

export function closeSeedDrawer(): void {
  targetPotId = null
  selectedSeedId = null
  drawerOpen = false
  document.getElementById('seed-drawer')?.classList.remove('seed-drawer--open')
  document.getElementById('seed-overlay')?.classList.remove('seed-overlay--visible')
}

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderSeedDrawerBody(): void {
  if (!drawerOpen) return
  const body = document.getElementById('seed-drawer-body')
  if (!body) return

  const seeds = state.seeds
  const layout = state.seedLayout
  const seedById = new Map(seeds.map(s => [s.id, s]))
  const isSelectMode = targetPotId !== null
  const isMoveMode = !isSelectMode && selectedSeedId !== null

  const capacity = `<span class="seed-drawer-capacity">${t.seedDrawerCapacity(seeds.length, MAX_SEED_STORAGE)}</span>`

  const hintText = isSelectMode ? t.selectSeedToPlant : isMoveMode ? t.seedMoveHint : ''
  const hintCls = `seed-drawer-mode-hint${isMoveMode ? ' seed-drawer-mode-hint--move' : ''}${!hintText ? ' seed-drawer-mode-hint--hidden' : ''}`
  const hint = `<p class="${hintCls}">${hintText || '&nbsp;'}</p>`

  const slots = Array.from({ length: SAATENSCHUBLADE_SLOTS }, (_, slotIdx) => {
    const slotStart = slotIdx * SEEDS_PER_SLOT
    const slotIds = layout.slice(slotStart, slotStart + SEEDS_PER_SLOT).filter(id => id !== '')
    const slotSeeds = slotIds.map(id => seedById.get(id)).filter(Boolean) as typeof seeds
    const count = slotSeeds.length
    const isEmpty = count === 0
    const basePositions = SLOT_BASE_POSITIONS[Math.min(count, 5)]

    const seedItems = slotSeeds.map((seed, i) => {
      const base = basePositions[i] ?? { x: 0.5, y: 0.5 }
      const { dx, dy } = seedJitter(seed.id)
      const isSelected = seed.id === selectedSeedId

      const leftPct = base.x * 100
      const topPct  = base.y * 100

      let cls = 'seed-item'
      if (isSelectMode || isMoveMode) cls += ' seed-item--selectable'
      if (isSelected) cls += ' seed-item--selected'

      const title = isSelectMode ? t.selectSeedToPlant : ''

      return `<span class="${cls}" data-seed-id="${seed.id}" title="${title}" style="left:calc(${leftPct}% + ${dx}px - 16px);top:calc(${topPct}% + ${dy}px - 16px)">${renderSeedSvg(seed, 32)}</span>`
    }).join('')

    let slotCls = 'seed-slot'
    if (isEmpty) slotCls += ' seed-slot--empty'
    if (isMoveMode && count < SEEDS_PER_SLOT) slotCls += ' seed-slot--droppable'

    return `<div class="${slotCls}" data-slot-idx="${slotIdx}">${seedItems}</div>`
  }).join('')

  const sellZone = isMoveMode
    ? `<div class="seed-sell-zone-row"><button class="btn-sm btn-sell" data-sell-zone="1">🪙${SEED_SELL_VALUE} ${t.seedSellZone}</button></div>`
    : ''

  body.innerHTML = `
    ${hint}
    <div class="seed-drawer-header-row">${capacity}</div>
    ${seeds.length === 0
      ? `<p class="seed-drawer-empty">${t.seedDrawerEmpty}</p>`
      : `<div class="seed-slots-grid">${slots}</div>`
    }
    ${sellZone}`
}

export function updateSeedDrawerButton(): void {
  const btn = document.getElementById('seed-drawer-btn')
  if (!btn) return
  const hasUpgrade = state.upgrades.includes('unlock_seed_drawer')
  btn.style.display = hasUpgrade ? '' : 'none'
  if (hasUpgrade) btn.innerHTML = `${renderSeedIcon(14)} ${t.seedDrawerButton(state.seeds.length)}`
}

export function renderSeedDrawer(): void {
  updateSeedDrawerButton()
  if (drawerOpen) renderSeedDrawerBody()
}
