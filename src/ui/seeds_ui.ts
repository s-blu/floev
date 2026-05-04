import { state, handlePlantSeedFromStorage, handleMoveSeedToSlot, handleSellSeed, handleSetSlotLabel } from './ui'
import { COIN_ICON, CENTER_TYPE_ICONS, renderEffectSwatch, renderPetalShapeSvg } from './icons'
import { t } from '../model/i18n'
import { SEEDS_PER_SLOT, PETAL_SHAPES, CENTER_TYPES } from '../model/genetic_model'
import { getSeedSlotCount, getSeedCapacity } from '../engine/seed_storage_engine'
import type { ColorBucket } from '../model/genetic_model'
import type { PetalShape, CenterType } from '../model/plant'
import { renderSeedSvg, renderSeedIcon } from '../engine/renderer/seed_renderer'
import { SEED_SELL_VALUE } from '../model/genetic_model'
import {
  buildDiscoveredShapeCounts, buildDiscoveredShapeCenters, buildDiscoveredShapeEffects,
  PETAL_COUNTS, DISPLAY_EFFECTS,
} from '../engine/discovery_utils'
import { expressedColor, colorBucket } from '../engine/genetic/genetic_utils'

// ─── Mark symbols ─────────────────────────────────────────────────────────────

const MARK_EMOJIS = ['❤️', '⭐', '🔥', '💎', '✨', '🌿', '🏆', '❓']
const MARK_ALPHANUM = ['1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
const MARK_SYMBOLS = [...MARK_EMOJIS, ...MARK_ALPHANUM]

// ─── State ────────────────────────────────────────────────────────────────────

let drawerOpen = false
let targetPotId: number | null = null
let selectedSeedId: string | null = null
let labelEditMode = false
let editingSlotIdx: number | null = null

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

// ─── Label helpers ────────────────────────────────────────────────────────────

const BUCKET_ORDER: ColorBucket[] = ['red', 'yellowgreen', 'pink', 'purple', 'blue', 'gray', 'white']

const BUCKET_REPR_COLORS: Record<string, string> = {
  red: 'hsl(5,85%,60%)', yellowgreen: 'hsl(90,70%,55%)', pink: 'hsl(320,80%,68%)',
  purple: 'hsl(270,70%,62%)', blue: 'hsl(210,80%,60%)', gray: 'hsl(0,0%,62%)', white: 'hsl(0,0%,95%)',
}

function getDiscoveredOptions(catalog: typeof state.catalog) {
  const discoveredCounts  = buildDiscoveredShapeCounts(catalog)
  const discoveredCenters = buildDiscoveredShapeCenters(catalog)
  const discoveredEffects = buildDiscoveredShapeEffects(catalog)

  const shapes = PETAL_SHAPES.filter(s =>
    PETAL_COUNTS.some(c  => discoveredCounts.has(`${s}_${c}`)) ||
    CENTER_TYPES.some(ct => discoveredCenters.has(`${s}_${ct}`)) ||
    DISPLAY_EFFECTS.some(ef => discoveredEffects.has(`${s}_${ef}`))
  )
  const centers = CENTER_TYPES.filter(ct =>
    PETAL_SHAPES.some(s => discoveredCenters.has(`${s}_${ct}`))
  )
  const effects = DISPLAY_EFFECTS.filter(ef =>
    PETAL_SHAPES.some(s => discoveredEffects.has(`${s}_${ef}`))
  )
  const buckets = BUCKET_ORDER.filter(b =>
    catalog.some(e => colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === b)
  )
  return { shapes, centers, effects, buckets }
}

function renderTagIcon(key: string): string {
  const [cat, val] = key.split(':')
  switch (cat) {
    case 'bucket': {
      const c = BUCKET_REPR_COLORS[val] ?? '#888'
      const border = val === 'white' ? 'border:0.5px solid #bbb;' : ''
      return `<span class="seed-tag-icon seed-tag-icon--bucket" style="background:${c};${border}" title="${t.colorBucketLabels[val] ?? val}"></span>`
    }
    case 'shape':
      return `<span class="seed-tag-icon seed-tag-icon--svg" title="${t.shapeLabels[val] ?? val}">${renderPetalShapeSvg(val as PetalShape, 9, 11, '#1a1a1a', '#1a1a1a')}</span>`
    case 'center':
      return `<span class="seed-tag-icon seed-tag-icon--svg" title="${t.centerTypeLabels[val] ?? val}">${CENTER_TYPE_ICONS[val as CenterType] ?? ''}</span>`
    case 'effect':
      return `<span class="seed-tag-icon seed-tag-icon--effect" title="${t.effectLabels[val] ?? val}">${renderEffectSwatch(val)}</span>`
    case 'mark':
      return `<span class="seed-tag-icon seed-tag-icon--mark" title="${val}">${val}</span>`
    default: return ''
  }
}

function renderSlotLabel(labels: string[]): string {
  if (labels.length === 0) return ''
  return `<div class="seed-slot-label">${labels.map(renderTagIcon).join('')}</div>`
}

function renderPickerIcon(key: string): string {
  const [cat, val] = key.split(':')
  switch (cat) {
    case 'bucket': {
      const c = BUCKET_REPR_COLORS[val] ?? '#888'
      const border = val === 'white' ? 'border:0.5px solid #bbb;' : ''
      return `<span class="seed-picker-icon seed-picker-icon--bucket" style="background:${c};${border}"></span>`
    }
    case 'shape':
      return `<span class="seed-picker-icon seed-picker-icon--svg">${renderPetalShapeSvg(val as PetalShape, 16, 18)}</span>`
    case 'center':
      return `<span class="seed-picker-icon seed-picker-icon--svg">${CENTER_TYPE_ICONS[val as CenterType] ?? ''}</span>`
    case 'effect':
      return `<span class="seed-picker-icon seed-picker-icon--effect">${renderEffectSwatch(val)}</span>`
    case 'mark':
      return `<span class="seed-picker-icon seed-picker-icon--mark">${val}</span>`
    default: return ''
  }
}

function renderLabelPicker(slotIdx: number): string {
  const currentLabels = state.seedSlotLabels[slotIdx] ?? []
  const { shapes, centers, effects, buckets } = getDiscoveredOptions(state.catalog)
  const atMax = currentLabels.length >= 2

  function item(key: string, title: string): string {
    const selected = currentLabels.includes(key)
    const disabled = atMax && !selected
    let cls = 'seed-label-picker-item'
    if (selected) cls += ' seed-label-picker-item--selected'
    if (disabled) cls += ' seed-label-picker-item--disabled'
    return `<button class="${cls}" data-label-key="${key}" title="${title}"${disabled ? ' disabled' : ''}>${renderPickerIcon(key)}</button>`
  }

  const sections = [
    buckets.length ? `<div class="seed-label-picker-section">
      <span class="seed-label-picker-section-title">${t.seedLabelCategoryBucket}</span>
      <div class="seed-label-picker-items">${buckets.map(b => item(`bucket:${b}`, t.colorBucketLabels[b] ?? b)).join('')}</div>
    </div>` : '',
    shapes.length ? `<div class="seed-label-picker-section">
      <span class="seed-label-picker-section-title">${t.seedLabelCategoryShape}</span>
      <div class="seed-label-picker-items">${shapes.map(s => item(`shape:${s}`, t.shapeLabels[s] ?? s)).join('')}</div>
    </div>` : '',
    centers.length ? `<div class="seed-label-picker-section">
      <span class="seed-label-picker-section-title">${t.seedLabelCategoryCenter}</span>
      <div class="seed-label-picker-items">${centers.map(ct => item(`center:${ct}`, t.centerTypeLabels[ct] ?? ct)).join('')}</div>
    </div>` : '',
    effects.length ? `<div class="seed-label-picker-section">
      <span class="seed-label-picker-section-title">${t.seedLabelCategoryEffect}</span>
      <div class="seed-label-picker-items">${effects.map(ef => item(`effect:${ef}`, t.effectLabels[ef] ?? ef)).join('')}</div>
    </div>` : '',
    `<div class="seed-label-picker-section">
      <span class="seed-label-picker-section-title">${t.seedLabelCategoryMark}</span>
      <div class="seed-label-picker-items">${MARK_SYMBOLS.map(m => item(`mark:${m}`, m)).join('')}</div>
    </div>`,
  ].filter(Boolean).join('')

  return `<div class="seed-label-picker">
    <div class="seed-label-picker-header">
      <span class="seed-label-picker-title">${t.seedLabelPickerTitle} <span class="seed-label-picker-hint">${t.seedLabelMaxHint}</span></span>
      <div class="seed-label-picker-actions">
        ${currentLabels.length > 0 ? `<button class="btn-sm btn-ghost" data-label-clear="1">${t.seedLabelPickerClear}</button>` : ''}
        <button class="btn-sm" data-label-done="1">${t.seedLabelPickerDone}</button>
      </div>
    </div>
    ${sections || `<p class="seed-label-picker-empty">${t.seedDrawerEmpty}</p>`}
  </div>`
}

function toggleSlotLabel(slotIdx: number, key: string): void {
  const current = [...(state.seedSlotLabels[slotIdx] ?? [])]
  const idx = current.indexOf(key)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < 2) {
    current.push(key)
  }
  handleSetSlotLabel(slotIdx, current)
  renderSeedDrawerBody()
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSeedDrawer(): void {
  document.getElementById('seed-drawer-close-btn')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-overlay')?.addEventListener('click', closeSeedDrawer)
  document.getElementById('seed-drawer-btn')?.addEventListener('click', () => openSeedDrawer(null))

  document.getElementById('seed-drawer-body')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Label-edit mode toggle (always check first)
    if (target.closest('[data-label-toggle]')) {
      if (labelEditMode) {
        labelEditMode = false
        editingSlotIdx = null
      } else {
        labelEditMode = true
        selectedSeedId = null
        editingSlotIdx = null
      }
      renderSeedDrawerBody()
      return
    }

    // Plant-select mode: clicking a seed plants it
    if (targetPotId !== null) {
      const seedEl = target.closest('[data-seed-id]') as HTMLElement | null
      if (seedEl) {
        handlePlantSeedFromStorage(targetPotId, seedEl.dataset.seedId!)
        closeSeedDrawer()
      }
      return
    }

    // Label-edit mode
    if (labelEditMode) {
      const pickerItem = target.closest('[data-label-key]') as HTMLElement | null
      if (pickerItem && editingSlotIdx !== null) {
        toggleSlotLabel(editingSlotIdx, pickerItem.dataset.labelKey!)
        return
      }

      const pickerClear = target.closest('[data-label-clear]')
      if (pickerClear && editingSlotIdx !== null) {
        handleSetSlotLabel(editingSlotIdx, [])
        renderSeedDrawerBody()
        return
      }

      const pickerDone = target.closest('[data-label-done]')
      if (pickerDone) {
        editingSlotIdx = null
        renderSeedDrawerBody()
        return
      }

      const slotEl = target.closest('[data-slot-idx]') as HTMLElement | null
      if (slotEl) {
        const idx = parseInt(slotEl.dataset.slotIdx!, 10)
        editingSlotIdx = editingSlotIdx === idx ? null : idx
        renderSeedDrawerBody()
        return
      }

      editingSlotIdx = null
      renderSeedDrawerBody()
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
  labelEditMode = false
  editingSlotIdx = null
  drawerOpen = true
  document.getElementById('seed-drawer')?.classList.add('seed-drawer--open')
  document.getElementById('seed-overlay')?.classList.add('seed-overlay--visible')
  renderSeedDrawerBody()
}

export function closeSeedDrawer(): void {
  targetPotId = null
  selectedSeedId = null
  labelEditMode = false
  editingSlotIdx = null
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

  const capacity = `<span class="seed-drawer-capacity">${t.seedDrawerCapacity(seeds.length, getSeedCapacity(state))}</span>`

  const labelBtn = !isSelectMode
    ? `<button class="seed-label-edit-btn${labelEditMode ? ' seed-label-edit-btn--active' : ''}" data-label-toggle="1">${t.seedLabelEditBtn}</button>`
    : ''

  let hintText = ''
  if (isSelectMode)   hintText = t.selectSeedToPlant
  else if (labelEditMode) hintText = t.seedLabelEditHint
  else if (isMoveMode)    hintText = t.seedMoveHint
  const hintCls = [
    'seed-drawer-mode-hint',
    isMoveMode   ? 'seed-drawer-mode-hint--move'  : '',
    labelEditMode ? 'seed-drawer-mode-hint--label' : '',
    !hintText    ? 'seed-drawer-mode-hint--hidden' : '',
  ].filter(Boolean).join(' ')
  const hint = `<p class="${hintCls}">${hintText || '&nbsp;'}</p>`

  const slots = Array.from({ length: getSeedSlotCount(state) }, (_, slotIdx) => {
    const slotStart = slotIdx * SEEDS_PER_SLOT
    const slotIds = layout.slice(slotStart, slotStart + SEEDS_PER_SLOT).filter(id => id !== '')
    const slotSeeds = slotIds.map(id => seedById.get(id)).filter(Boolean) as typeof seeds
    const count = slotSeeds.length
    const isEmpty = count === 0
    const basePositions = SLOT_BASE_POSITIONS[Math.min(count, 5)]
    const slotLabels = state.seedSlotLabels[slotIdx] ?? []
    const isEditing = labelEditMode && editingSlotIdx === slotIdx

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
    if (isEmpty)  slotCls += ' seed-slot--empty'
    if (isMoveMode && count < SEEDS_PER_SLOT) slotCls += ' seed-slot--droppable'
    if (labelEditMode) slotCls += ' seed-slot--editable'
    if (isEditing)     slotCls += ' seed-slot--editing'

    return `<div class="${slotCls}" data-slot-idx="${slotIdx}"><div class="seed-slot-inner">${seedItems}</div>${renderSlotLabel(slotLabels)}</div>`
  }).join('')

  const sellZone = isMoveMode
    ? `<div class="seed-sell-zone-row"><button class="btn-sm btn-sell" data-sell-zone="1">${COIN_ICON}${SEED_SELL_VALUE} ${t.seedSellZone}</button></div>`
    : ''

  const picker = labelEditMode && editingSlotIdx !== null
    ? renderLabelPicker(editingSlotIdx)
    : ''

  body.innerHTML = `
    ${hint}
    <div class="seed-drawer-header-row">${capacity}${sellZone}${labelBtn}</div>
    ${seeds.length === 0
      ? `<p class="seed-drawer-empty">${t.seedDrawerEmpty}</p>`
      : `<div class="seed-slots-grid">${slots}</div>`
    }
    ${picker}`
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
