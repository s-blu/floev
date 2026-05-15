import { state, render } from './ui'
import { t } from '../model/i18n'
import { hasUpgrade, hasPotColor, hasPotEffect } from '../engine/shop_engine'
import { saveState } from '../engine/game'
import {
  getVisibleCollections,
  getOrCreateInstance,
  getEligiblePots,
  fillSlot,
  clearSlot,
  checkAllCollectionCompletions,
  addFavorite,
  removeFavorite,
  MAX_FAVORITES,
} from '../engine/collections_engine'
import { getCollectionDef } from '../engine/collection_defs'
import type { CollectionDef, CollectionInstanceState, SlotCriteria, PlanterDesign } from '../model/collections'
import { renderBloomSVG, renderPlantNoPotSVG } from '../engine/renderer/encyclopedia_renderer'
import { renderBlumenkastenSVG } from '../engine/renderer/pot_renderer'
import { POT_COLORS, POT_EFFECTS } from '../model/shop'
import { gardenSettings } from '../model/garden_settings'
import { EFFECT_ICONS } from './pots_overlay_ui'
import { addNotification } from './notification_log'

// ─── Sub-section open state ───────────────────────────────────────────────────

const IN_PROGRESS_OPEN_KEY = 'collInProgressOpen'
const DONE_OPEN_KEY        = 'collDoneOpen'

let planterDesignOverlayOpenForId: string | null = null

function updatePlanterSVG(collId: string): void {
  const instance = getOrCreateInstance(state, collId)
  document.querySelectorAll<HTMLElement>(`.coll-bk-planter[data-collid="${collId}"]`).forEach(el => {
    el.innerHTML = renderBlumenkastenSVG(instance.planterDesign)
  })
}

function openPlanterDesignOverlay(card: HTMLElement, collId: string): void {
  card.querySelector('.coll-bk-design-overlay')?.remove()

  const unlockedColors  = POT_COLORS.filter(c => hasPotColor(state, c.id))
  const unlockedEffects = POT_EFFECTS.filter(e => hasPotEffect(state, e.id))
  if (unlockedColors.length <= 1 && unlockedEffects.length <= 1) return

  planterDesignOverlayOpenForId = collId

  const instance   = getOrCreateInstance(state, collId)
  const activeColorId  = instance.planterDesign?.colorId  ?? gardenSettings.defaultDesign.colorId
  const activeEffectId = instance.planterDesign?.effectId ?? gardenSettings.defaultDesign.effectId ?? 'none'
  const activeBodyColor = POT_COLORS.find(c => c.id === activeColorId)?.body ?? '#b8724a'

  const colorSwatches = unlockedColors.map(c => `<button
    class="pdo-color-swatch${c.id === activeColorId ? ' pdo-color-swatch--active' : ''}"
    data-pdo-color="${c.id}" title="${t.potColorLabels[c.id]}"
    style="--swatch-bg:${c.body};--swatch-rim:${c.rim}"></button>`).join('')

  const effectButtons = unlockedEffects.map(e => `<button
    class="pdo-effect-btn${e.id === activeEffectId ? ' pdo-effect-btn--active' : ''}"
    data-pdo-effect="${e.id}" title="${t.potEffectLabels[e.id]}"
    style="color:${activeBodyColor}"
    >${EFFECT_ICONS[e.id] ?? e.id}</button>`).join('')

  const overlay = document.createElement('div')
  overlay.className = 'coll-bk-design-overlay'
  overlay.innerHTML = `
    <button class="pdo-close" data-bk-close title="${t.helpClose}">×</button>
    ${unlockedColors.length > 1  ? `<div class="coll-bk-design-swatches">${colorSwatches}</div>` : ''}
    ${unlockedEffects.length > 1 ? `<div class="coll-bk-design-effects">${effectButtons}</div>`  : ''}
  `

  overlay.addEventListener('click', e => {
    e.stopPropagation()
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-bk-close],[data-pdo-color],[data-pdo-effect]')
    if (!el) return

    if ('bkClose' in el.dataset) {
      overlay.remove()
      planterDesignOverlayOpenForId = null
      return
    }

    const inst = getOrCreateInstance(state, collId)
    const cur: PlanterDesign = {
      colorId:  inst.planterDesign?.colorId  ?? gardenSettings.defaultDesign.colorId,
      effectId: inst.planterDesign?.effectId ?? gardenSettings.defaultDesign.effectId ?? 'none',
    }

    if (el.dataset.pdoColor) {
      cur.colorId = el.dataset.pdoColor
      inst.planterDesign = cur
      saveState(state)
      overlay.querySelectorAll('[data-pdo-color]').forEach(b => b.classList.remove('pdo-color-swatch--active'))
      el.classList.add('pdo-color-swatch--active')
      const newBody = POT_COLORS.find(c => c.id === cur.colorId)?.body ?? '#b8724a'
      overlay.querySelectorAll<HTMLElement>('[data-pdo-effect]').forEach(b => { b.style.color = newBody })
      updatePlanterSVG(collId)
    }

    if (el.dataset.pdoEffect) {
      cur.effectId = el.dataset.pdoEffect
      inst.planterDesign = cur
      saveState(state)
      overlay.querySelectorAll('[data-pdo-effect]').forEach(b => b.classList.remove('pdo-effect-btn--active'))
      el.classList.add('pdo-effect-btn--active')
      updatePlanterSVG(collId)
    }
  })

  card.appendChild(overlay)
  setTimeout(() => {
    const closeOnOutside = (ev: MouseEvent) => {
      if (!card.contains(ev.target as Node)) {
        overlay.remove()
        planterDesignOverlayOpenForId = null
        document.removeEventListener('click', closeOnOutside)
      }
    }
    document.addEventListener('click', closeOnOutside)
  }, 0)
}

function loadBool(key: string, defaultVal: boolean): boolean {
  const stored = localStorage.getItem(key)
  return stored === null ? defaultVal : stored === 'true'
}

let inProgressOpen = loadBool(IN_PROGRESS_OPEN_KEY, true)
let doneOpen       = loadBool(DONE_OPEN_KEY, true)

function expandSection(key: 'inProgress' | 'done'): void {
  if (key === 'inProgress') {
    inProgressOpen = true
    localStorage.setItem(IN_PROGRESS_OPEN_KEY, 'true')
  } else {
    doneOpen = true
    localStorage.setItem(DONE_OPEN_KEY, 'true')
  }
}

// ─── Criteria label ───────────────────────────────────────────────────────────

function criteriaLabel(criteria: SlotCriteria): string {
  const parts: string[] = []
  if (criteria.shape)       parts.push(t.shapeLabels[criteria.shape] ?? criteria.shape)
  if (criteria.colorBucket) parts.push(t.colorBucketLabels[criteria.colorBucket] ?? criteria.colorBucket)
  if (criteria.hue !== undefined) {
    const hueName = (t.colorLabel as Record<number, { hueName: string }>)[criteria.hue]?.hueName
    parts.push(hueName ?? String(criteria.hue))
  }
  if (criteria.lightness)   parts.push((t.lightnessLabels as Record<number, string>)[criteria.lightness] ?? String(criteria.lightness))
  if (criteria.centerType)  parts.push(t.centerTypeLabels[criteria.centerType] ?? criteria.centerType)
  if (criteria.effect && criteria.effect !== 'none') parts.push(t.effectLabels[criteria.effect] ?? criteria.effect)
  if (criteria.petalCount)  parts.push(`${criteria.petalCount}`)
  if (criteria.minRarity !== undefined) {
    const stars = ['▪','●','♦','★','👑']
    parts.push(`≥${stars[criteria.minRarity] ?? criteria.minRarity}`)
  }
  return parts.length > 0 ? parts.join(' · ') : t.collCriteriaAny
}

// ─── Slot fill dialog ─────────────────────────────────────────────────────────

let activeDialog: HTMLElement | null = null

function closeDialog(): void {
  activeDialog?.remove()
  activeDialog = null
}

function openSlotFillDialog(collectionId: string, slotIndex: number, criteria: SlotCriteria): void {
  closeDialog()
  const eligiblePotIds = getEligiblePots(criteria, state)
  const dialog = document.createElement('div')
  dialog.className = 'coll-dialog-overlay'
  dialog.innerHTML = `
    <div class="coll-dialog">
      <p class="coll-dialog-title">${t.collFillDialogTitle}</p>
      ${eligiblePotIds.length === 0
        ? `<p class="coll-dialog-empty">${t.collFillDialogEmpty}</p>`
        : `<div class="coll-dialog-blooms">${eligiblePotIds.map(potId => {
            const plant = state.pots.find(p => p.id === potId)?.plant
            if (!plant) return ''
            return `<button class="coll-dialog-bloom-btn" data-potid="${potId}">
              ${renderBloomSVG(plant, 60, 60, 'coll')}
            </button>`
          }).join('')}</div>
          <p class="coll-dialog-warning">${t.collFillWarning}</p>`
      }
      <button class="coll-dialog-cancel">${t.collFillCancel}</button>
    </div>`

  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target === dialog || target.closest('.coll-dialog-cancel')) {
      closeDialog()
      return
    }
    const btn = target.closest<HTMLElement>('.coll-dialog-bloom-btn')
    if (!btn) return
    const potId = Number(btn.dataset.potid)
    if (fillSlot(state, collectionId, slotIndex, potId)) {
      const completed = checkAllCollectionCompletions(state)
      for (const id of completed) {
        const title = (t.collectionDefs as Record<string, { title: string; desc: string }>)[id]?.title ?? id
        addNotification(t.collCompletedToast(title))
      }
      if (completed.length > 0) expandSection('done')
      saveState(state)
      closeDialog()
      render()
    }
  })

  document.body.appendChild(dialog)
  activeDialog = dialog
}

// ─── Herbarium slot positions (x%, y%, rotation°, size px) per slot count ──────

type SlotPos = { x: number; y: number; rot: number; size: number; z?: number }

const HERBARIUM_POSITIONS: Record<number, SlotPos[]> = {
  2: [
    { x:  6, y:  8, rot: -14, size: 68 },
    { x: 48, y: 38, rot:  10, size: 72 },
  ],
  3: [
    { x:  5, y:  5, rot: -16, size: 76 },
    { x: 48, y:  4, rot:  12, size: 74 },
    { x: 24, y: 52, rot:  -5, size: 78 },
  ],
  4: [
    { x:  12, y:  10, rot: -15, size: 62 },
    { x: 50, y:  12, rot:  13, size: 56 },
    { x:  8, y: 50, rot:  10, size: 58 },
    { x: 55, y: 55, rot: -11, size: 64 },
  ],
  5: [
    { x:  6, y:  6, rot: -13, size: 58 },
    { x: 55, y:  4, rot:  11, size: 58 },
    { x: 30, y: 30, rot:  -4, size: 60 },
    { x:  6, y: 62, rot:   8, size: 62 },
    { x: 60, y: 61, rot: -10, size: 56 },
  ],
}

// ─── Blumenkasten slot positions (cx%, z-index) ──────────────────────────────
// All plants render at the same fixed size (BK_W × BK_H) so the plant's own
// stemHeight gene determines how tall it looks — exactly as in its pot.
// Height variation across slots comes from plant genetics, not slot data.

const BK_W = 100  // same as pot view — viewBox renders plants at identical size
const BK_H = 130

const BK_EMPTY_W = 56
const BK_EMPTY_H = 68

const BK_BOX_TOP = 32  // px — distance from frame bottom to top of wooden planter box (::after height 40 - bottom -8)
const BK_RAISE   = 38  // px — how much odd-index slots are raised above the baseline

type BkSlotPos = { cx: number; z: number; y?: number }

const BLUMENKASTEN_POSITIONS: Record<number, BkSlotPos[]> = {
  5: [
    { cx: 13, z: 3,        },
    { cx: 29, z: 1, y: BK_RAISE },
    { cx: 48, z: 2,        },
    { cx: 66, z: 2, y: BK_RAISE },
    { cx: 82, z: 3,        },
  ],
  6: [
    { cx: 10, z: 3,        },
    { cx: 25, z: 1, y: BK_RAISE },
    { cx: 40, z: 2,        },
    { cx: 56, z: 1, y: BK_RAISE },
    { cx: 70, z: 2,        },
    { cx: 85, z: 3, y: BK_RAISE },
  ],
  7: [
    { cx:  9, z: 3,        },
    { cx: 22, z: 1, y: BK_RAISE },
    { cx: 35, z: 2,        },
    { cx: 50, z: 3, y: BK_RAISE },
    { cx: 63, z: 1,        },
    { cx: 76, z: 2, y: BK_RAISE },
    { cx: 88, z: 3,        },
  ],
  8: [
    { cx:  8, z: 3,        },
    { cx: 19, z: 1, y: BK_RAISE },
    { cx: 31, z: 2,        },
    { cx: 43, z: 1, y: BK_RAISE },
    { cx: 54, z: 3,        },
    { cx: 65, z: 2, y: BK_RAISE },
    { cx: 76, z: 2,        },
    { cx: 87, z: 3, y: BK_RAISE },
  ],
}

function buildBkSlotHtml(
  def: CollectionDef,
  instance: CollectionInstanceState,
  i: number,
): string {
  const positions = BLUMENKASTEN_POSITIONS[def.slots.length] ?? BLUMENKASTEN_POSITIONS[7]
  const pos = positions[i] ?? { cx: 10 + i * 15, z: 1 }
  const criteria = def.slots[i]
  const slotState = instance.slots[i]
  const yOffset = pos.y ?? 0
  const left = `calc(${pos.cx}% - ${BK_W / 2}px)`

  if (slotState.plant) {
    return `<div class="coll-bk-plant" style="left:${left};z-index:${pos.z};bottom:0px">
      <div class="coll-slot coll-slot--filled" style="width:${BK_W}px;height:${BK_H}px">
        ${renderPlantNoPotSVG(slotState.plant, BK_W, BK_H)}
        <button class="coll-slot-remove" data-action="clear-slot" data-collid="${def.id}" data-slotidx="${i}">×</button>
      </div>
    </div>`
  }

  const candidateCount = getEligiblePots(criteria, state).length
  const disabled = candidateCount === 0 ? 'disabled' : ''
  const badgeClass = candidateCount === 0 ? 'coll-slot-badge coll-slot-badge--zero' : 'coll-slot-badge'
  const emptyLeft = `calc(${pos.cx}% - ${BK_EMPTY_W / 2}px)`
  return `<div class="coll-bk-plant coll-bk-plant--empty" style="left:${emptyLeft};z-index:10;bottom:${BK_BOX_TOP + yOffset}px">
    <button class="coll-slot coll-slot--empty coll-slot--bk-empty" data-action="fill-slot"
        data-collid="${def.id}" data-slotidx="${i}" title="${t.collSlotFill}" ${disabled}
        style="width:${BK_EMPTY_W}px;height:${BK_EMPTY_H}px">
      <span class="coll-slot-label">${criteriaLabel(criteria)}</span>
      <span class="${badgeClass}">${candidateCount}</span>
    </button>
  </div>`
}

// ─── Collection card ──────────────────────────────────────────────────────────

function buildCollectionCard(
  def: CollectionDef,
  instance: CollectionInstanceState,
  isFavorite: boolean,
): HTMLElement {
  const card = document.createElement('div')
  const isComplete = instance.completedAt !== undefined
  card.className = `coll-card${isComplete ? ' coll-card--complete' : ''}`

  const defs = t.collectionDefs as Record<string, { title: string; desc: string }>
  const info = defs[def.id] ?? { title: def.id, desc: '' }
  const isBlumenkasten = def.vessel === 'blumenkasten'

  const slotsHtml = def.slots.map((criteria, i) => {
    if (isBlumenkasten) return buildBkSlotHtml(def, instance, i)

    const positions = HERBARIUM_POSITIONS[def.slots.length] ?? HERBARIUM_POSITIONS[5]
    const slotState = instance.slots[i]
    const pos = positions[i] ?? { x: 10 + i * 20, y: 30, rot: 0, size: 72 }
    const zStyle = pos.z !== undefined ? `;z-index:${pos.z}` : ''
    const baseStyle = `left:${pos.x}%;top:${pos.y}%;width:${pos.size}px;height:${pos.size}px${zStyle}`

    if (slotState.plant) {
      return `<div class="coll-slot coll-slot--filled" style="${baseStyle};transform:rotate(${pos.rot}deg)">
        ${renderBloomSVG(slotState.plant, pos.size, pos.size, 'coll')}
        <button class="coll-slot-remove" data-action="clear-slot" data-collid="${def.id}" data-slotidx="${i}" style="transform:rotate(${-pos.rot}deg)">×</button>
      </div>`
    }
    const candidateCount = getEligiblePots(criteria, state).length
    const disabled = candidateCount === 0 ? 'disabled' : ''
    const badgeClass = candidateCount === 0 ? 'coll-slot-badge coll-slot-badge--zero' : 'coll-slot-badge'
    return `<button class="coll-slot coll-slot--empty" data-action="fill-slot"
        data-collid="${def.id}" data-slotidx="${i}" title="${t.collSlotFill}" ${disabled} style="${baseStyle}">
      <span class="coll-slot-label">${criteriaLabel(criteria)}</span>
      <span class="${badgeClass}">${candidateCount}</span>
    </button>`
  }).join('')

  const favCount = state.collections?.favorites.length ?? 0
  const canAdd = !isFavorite && favCount < MAX_FAVORITES
  const favTitle = isFavorite
    ? t.collRemoveFavorite
    : canAdd ? t.collAddFavorite : t.collFavoritesFull
  const favDisabled = !isFavorite && !canAdd ? 'disabled' : ''

  const frameClass = isBlumenkasten
    ? `coll-blumenkasten-frame coll-blumenkasten-frame--slots-${def.slots.length}`
    : `coll-herbarium-frame coll-herbarium-frame--slots-${def.slots.length}`

  card.innerHTML = `
    <div class="${frameClass}">
      ${slotsHtml}
      ${isBlumenkasten ? `<div class="coll-bk-planter" data-collid="${def.id}">${renderBlumenkastenSVG(instance.planterDesign)}</div>` : ''}
    </div>
    ${isBlumenkasten
      ? `<div class="coll-bk-hanging-sign">
          <span class="coll-bk-hanging-sign-title">${info.title}</span>
          ${info.desc ? `<span class="coll-bk-hanging-sign-desc">${info.desc}</span>` : ''}
        </div>`
      : `<div class="coll-herbarium-plaque">
          <span class="coll-herbarium-plaque-title">${info.title}</span>
          ${info.desc ? `<span class="coll-herbarium-plaque-desc">${info.desc}</span>` : ''}
        </div>`
    }
    <button class="coll-fav-btn${isFavorite ? ' coll-fav-btn--active' : ''}"
      data-action="toggle-fav" data-collid="${def.id}"
      title="${favTitle}" ${favDisabled}>${isFavorite ? '★' : '☆'}</button>
    ${isBlumenkasten ? `<button class="coll-bk-design-btn" data-action="open-planter-design" title="${t.collPlanterDesign}">✎</button>` : ''}`

  card.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    const clearBtn = target.closest<HTMLElement>('[data-action="clear-slot"]')
    if (clearBtn) {
      if (clearSlot(state, clearBtn.dataset.collid!, Number(clearBtn.dataset.slotidx))) {
        if (!isFavorite) expandSection('inProgress')
        saveState(state)
        render()
      }
      return
    }

    const fillBtn = target.closest<HTMLElement>('[data-action="fill-slot"]')
    if (fillBtn) {
      const collId = fillBtn.dataset.collid!
      const slotIdx = Number(fillBtn.dataset.slotidx)
      const collDef = getCollectionDef(collId)
      if (!collDef) return
      openSlotFillDialog(collId, slotIdx, collDef.slots[slotIdx])
      return
    }

    const favBtn = target.closest<HTMLElement>('[data-action="toggle-fav"]')
    if (favBtn) {
      const collId = favBtn.dataset.collid!
      const changed = isFavorite ? removeFavorite(state, collId) : addFavorite(state, collId)
      if (changed) {
        saveState(state)
        render()
      }
      return
    }

    if (target.closest('[data-action="open-planter-design"]')) {
      openPlanterDesignOverlay(card, def.id)
    }
  })

  if (isBlumenkasten && planterDesignOverlayOpenForId === def.id) {
    requestAnimationFrame(() => openPlanterDesignOverlay(card, def.id))
  }

  return card
}

// ─── Sub-section ──────────────────────────────────────────────────────────────

function buildSubSection(
  key: 'inProgress' | 'done',
  title: string,
  defs: CollectionDef[],
): HTMLElement {
  const isOpen = key === 'inProgress' ? inProgressOpen : doneOpen
  const section = document.createElement('div')
  section.className = 'coll-subsection'

  const grid = document.createElement('div')
  grid.className = 'coll-grid'
  const favoriteIds = state.collections?.favorites ?? []
  for (const def of defs) {
    const instance = getOrCreateInstance(state, def.id)
    grid.appendChild(buildCollectionCard(def, instance, favoriteIds.includes(def.id)))
  }

  const header = document.createElement('div')
  header.className = 'ach-section-header coll-subsection-header'
  const chevronClass = `ach-chevron${isOpen ? '' : ' coll-subsection-arrow--closed'}`
  header.innerHTML = `
    <p class="section-title" style="margin-bottom:0">${title}</p>
    <button class="ach-toggle-btn coll-subsection-toggle">
      <span class="${chevronClass}">▾</span>
    </button>`
  section.appendChild(header)

  const body = document.createElement('div')
  body.className = `coll-subsection-body${isOpen ? ' coll-subsection-body--open' : ''}`
  body.appendChild(grid)
  section.appendChild(body)

  header.addEventListener('click', () => {
    if (key === 'inProgress') {
      inProgressOpen = !inProgressOpen
      localStorage.setItem(IN_PROGRESS_OPEN_KEY, String(inProgressOpen))
    } else {
      doneOpen = !doneOpen
      localStorage.setItem(DONE_OPEN_KEY, String(doneOpen))
    }
    const open = key === 'inProgress' ? inProgressOpen : doneOpen
    header.querySelector('.ach-chevron')?.classList.toggle('coll-subsection-arrow--closed', !open)
    body.classList.toggle('coll-subsection-body--open', open)
  })

  return section
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderCollections(): void {
  const panel = document.getElementById('collections-panel')
  if (!panel) return

  const hasFeature = hasUpgrade(state, 'unlock_collections')
  panel.style.display = hasFeature ? '' : 'none'
  if (!hasFeature) return

  const favSection = panel.querySelector<HTMLElement>('.coll-favorites')
  const body = panel.querySelector<HTMLElement>('.collections-body')
  if (!favSection || !body) return

  const visible = getVisibleCollections(state)
  const favoriteIds = state.collections?.favorites ?? []

  // ── Favorites (always visible) ──
  favSection.innerHTML = ''
  const favDefs = favoriteIds
    .map(id => getCollectionDef(id))
    .filter((d): d is CollectionDef => d !== undefined)

  if (favDefs.length > 0) {
    const grid = document.createElement('div')
    grid.className = 'coll-grid'
    for (const def of favDefs) {
      const instance = getOrCreateInstance(state, def.id)
      grid.appendChild(buildCollectionCard(def, instance, true))
    }
    favSection.appendChild(grid)
  }

  // ── Collapsable body: In Arbeit + Abgeschlossen ──
  body.innerHTML = ''

  if (visible.length === 0) {
    body.innerHTML = `<p class="coll-empty-hint">${t.collLockedUntil(3)}</p>`
    return
  }

  const nonFav = visible.filter(def => !favoriteIds.includes(def.id))
  const inProgress = nonFav.filter(def => getOrCreateInstance(state, def.id).completedAt === undefined)
  const done       = nonFav.filter(def => getOrCreateInstance(state, def.id).completedAt !== undefined)

  if (inProgress.length > 0) body.appendChild(buildSubSection('inProgress', t.collInProgressTitle, inProgress))
  if (done.length > 0)       body.appendChild(buildSubSection('done', t.collDoneTitle, done))
  if (nonFav.length === 0) {
    const hint = document.createElement('p')
    hint.className = 'coll-empty-hint'
    hint.textContent = t.collFavoritesFull
    body.appendChild(hint)
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initCollectionsPanel(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeDialog) closeDialog()
  })
}
