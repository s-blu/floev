import { state, handlePlantSeedFromStorage } from './ui'
import { t } from '../model/i18n'
import { SAATENSCHUBLADE_SLOTS, SEEDS_PER_SLOT, MAX_SEED_STORAGE } from '../model/genetic_model'
import { renderSeedSvg } from '../engine/renderer/seed_renderer'

// ─── State ────────────────────────────────────────────────────────────────────

let drawerOpen = false
let targetPotId: number | null = null

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSeedDrawer(): void {
  document.getElementById('seed-drawer-close-btn')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-overlay')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-drawer-btn')?.addEventListener('click', () => openSeedDrawer(null))

  document.getElementById('seed-drawer-body')?.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-seed-id]') as HTMLElement | null
    if (!el || targetPotId === null) return
    const seedId = el.dataset.seedId!
    handlePlantSeedFromStorage(targetPotId, seedId)
    closeSeedDrawer()
  })
}

// ─── Open / Close ─────────────────────────────────────────────────────────────

export function openSeedDrawer(potId: number | null): void {
  targetPotId = potId
  drawerOpen = true
  document.getElementById('seed-drawer')?.classList.add('seed-drawer--open')
  document.getElementById('seed-overlay')?.classList.add('seed-overlay--visible')
  renderSeedDrawerBody()
}

export function closeSeedDrawer(): void {
  targetPotId = null
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
  const isSelectMode = targetPotId !== null

  const title = isSelectMode
    ? `<p class="seed-drawer-mode-hint">${t.selectSeedToPlant}</p>`
    : ''

  const capacity = `<span class="seed-drawer-capacity">${t.seedDrawerCapacity(seeds.length, MAX_SEED_STORAGE)}</span>`

  const slots = Array.from({ length: SAATENSCHUBLADE_SLOTS }, (_, slotIdx) => {
    const slotSeeds = seeds.slice(slotIdx * SEEDS_PER_SLOT, (slotIdx + 1) * SEEDS_PER_SLOT)
    const isEmpty = slotSeeds.length === 0

    const seedItems = slotSeeds.map(seed =>
      `<span class="seed-item${isSelectMode ? ' seed-item--selectable' : ''}" data-seed-id="${seed.id}" title="${isSelectMode ? t.selectSeedToPlant : ''}">${renderSeedSvg(seed, 32)}</span>`
    ).join('')

    return `<div class="seed-slot${isEmpty ? ' seed-slot--empty' : ''}">${seedItems}</div>`
  }).join('')

  body.innerHTML = `
    ${title}
    <div class="seed-drawer-header-row">${capacity}</div>
    ${seeds.length === 0
      ? `<p class="seed-drawer-empty">${t.seedDrawerEmpty}</p>`
      : `<div class="seed-slots-grid">${slots}</div>`
    }`
}

export function updateSeedDrawerButton(): void {
  const btn = document.getElementById('seed-drawer-btn')
  if (!btn) return
  const hasUpgrade = state.upgrades.includes('unlock_seed_drawer')
  btn.style.display = hasUpgrade ? '' : 'none'
  if (hasUpgrade) btn.textContent = t.seedDrawerButton(state.seeds.length)
}

export function renderSeedDrawer(): void {
  updateSeedDrawerButton()
  if (drawerOpen) renderSeedDrawerBody()
}
