import { state, render } from './ui'
import { t } from '../model/i18n'
import { hasUpgrade } from '../engine/shop_engine'
import { saveState } from '../engine/game'
import {
  getVisibleCollections,
  getOrCreateInstance,
  getEligiblePots,
  fillSlot,
  checkAllCollectionCompletions,
  moveToDisplay,
  moveFromDisplay,
  COLLECTIONS_DISPLAY_SLOTS,
} from '../engine/collections_engine'
import { getCollectionDef } from '../engine/collection_defs'
import type { CollectionDef, CollectionInstanceState, SlotCriteria } from '../model/collections'
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer'
import { addNotification } from './notification_log'

// ─── Panel open state ─────────────────────────────────────────────────────────

const PANEL_OPEN_KEY = 'collectionsPanelOpen'

function loadPanelOpen(): boolean {
  const stored = localStorage.getItem(PANEL_OPEN_KEY)
  return stored === null ? true : stored === 'true'
}

let panelOpen = loadPanelOpen()

// ─── Criteria label ───────────────────────────────────────────────────────────

function criteriaLabel(criteria: SlotCriteria): string {
  const parts: string[] = []
  if (criteria.shape)       parts.push(t.shapeLabels[criteria.shape] ?? criteria.shape)
  if (criteria.colorBucket) parts.push(t.colorBucketLabels[criteria.colorBucket] ?? criteria.colorBucket)
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
        const def = getCollectionDef(id)
        const title = (t.collectionDefs as Record<string, { title: string; desc: string }>)[id]?.title ?? id
        addNotification(t.collCompletedToast(title))
        if (def && state.collections) {
          const freeSlot = state.collections.displaySlots.findIndex(s => s === null)
          if (freeSlot >= 0) moveToDisplay(state, id, freeSlot)
        }
      }
      saveState(state)
      closeDialog()
      render()
    }
  })

  document.body.appendChild(dialog)
  activeDialog = dialog
}

// ─── Herbarium slot positions (x%, y%, rotation°, size px) per slot count ─────

// Positions are % of frame width/height. Size in px.
// Frame is ~180px tall; card column is ~140px wide inside border.
const HERBARIUM_POSITIONS: Record<number, { x: number; y: number; rot: number; size: number }[]> = {
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

function getSlotPositions(count: number) {
  return HERBARIUM_POSITIONS[count] ?? HERBARIUM_POSITIONS[5]
}

// ─── Collection card ──────────────────────────────────────────────────────────

function buildCollectionCard(def: CollectionDef, instance: CollectionInstanceState): HTMLElement {
  const card = document.createElement('div')
  const isComplete = instance.completedAt !== undefined
  card.className = `coll-card${isComplete ? ' coll-card--complete' : ''}`

  const defs = t.collectionDefs as Record<string, { title: string; desc: string }>
  const info = defs[def.id] ?? { title: def.id, desc: '' }
  const positions = getSlotPositions(def.slots.length)

  const slotsHtml = def.slots.map((criteria, i) => {
    const slotState = instance.slots[i]
    const pos = positions[i] ?? { x: 10 + i * 20, y: 30, rot: 0, size: 72 }
    const baseStyle = `left:${pos.x}%;top:${pos.y}%;width:${pos.size}px;height:${pos.size}px`

    if (slotState.plant) {
      return `<div class="coll-slot coll-slot--filled" style="${baseStyle};transform:rotate(${pos.rot}deg)">
        ${renderBloomSVG(slotState.plant, pos.size, pos.size, 'coll')}
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

  card.innerHTML = `
    <div class="coll-card-header">
      <span class="coll-card-title">${info.title}</span>
      ${isComplete ? `<span class="coll-card-badge">${t.collCompleted}</span>` : ''}
    </div>
    <p class="coll-card-desc">${info.desc}</p>
    <div class="coll-herbarium-frame coll-herbarium-frame--slots-${def.slots.length}">
      ${slotsHtml}
    </div>`

  card.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action="fill-slot"]')
    if (!btn) return
    const collId = btn.dataset.collid!
    const slotIdx = Number(btn.dataset.slotidx)
    const collDef = getCollectionDef(collId)
    if (!collDef) return
    openSlotFillDialog(collId, slotIdx, collDef.slots[slotIdx])
  })

  return card
}

// ─── Display area ─────────────────────────────────────────────────────────────

function buildDisplayArea(): HTMLElement {
  const area = document.createElement('div')
  area.className = 'coll-display-area'

  const displaySlots = state.collections?.displaySlots ?? []
  const defs = t.collectionDefs as Record<string, { title: string; desc: string }>

  const slotsHtml = Array.from({ length: COLLECTIONS_DISPLAY_SLOTS }, (_, i) => {
    const collId = displaySlots[i] ?? null
    if (!collId) {
      return `<div class="coll-display-slot coll-display-slot--empty"></div>`
    }
    const instance = state.collections?.instances.find(inst => inst.collectionId === collId)
    const def = getCollectionDef(collId)
    if (!instance || !def) return ''
    const title = defs[collId]?.title ?? collId
    const flowersHtml = instance.slots.map((s, si) => {
      if (!s.plant) return ''
      const rotation = [-8, 5, -4, 7, -6][si % 5]
      return `<div class="coll-display-flower" style="transform:rotate(${rotation}deg)">
        ${renderBloomSVG(s.plant, 48, 48, 'coll-disp')}
      </div>`
    }).join('')
    return `<div class="coll-display-slot">
      <div class="coll-display-flowers">${flowersHtml}</div>
      <span class="coll-display-label">${title}</span>
      <button class="coll-display-remove-btn" data-action="remove-display" data-slotidx="${i}" title="${t.collMoveFromDisplay}">×</button>
    </div>`
  }).join('')

  // Completed but not displayed (Lager)
  const displayedIds = new Set(displaySlots.filter(Boolean) as string[])
  const storedCollections = (state.collections?.instances ?? [])
    .filter(i => i.completedAt !== undefined && !displayedIds.has(i.collectionId))

  const lagerHtml = storedCollections.length > 0
    ? `<div class="coll-lager">
        <p class="coll-lager-title">${t.collLagerTitle}</p>
        <div class="coll-lager-items">
          ${storedCollections.map(inst => {
            const title = defs[inst.collectionId]?.title ?? inst.collectionId
            const hasFreeSlot = displaySlots.some(s => s === null)
            return `<div class="coll-lager-item">
              <span>${title}</span>
              ${hasFreeSlot
                ? `<button class="btn-sm" data-action="move-to-display" data-collid="${inst.collectionId}">${t.collMoveToDisplay}</button>`
                : ''}
            </div>`
          }).join('')}
        </div>
      </div>`
    : ''

  area.innerHTML = `
    <p class="coll-display-title">${t.collDisplayTitle}</p>
    <div class="coll-display-slots">${slotsHtml}</div>
    ${lagerHtml}`

  area.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const removeBtn = target.closest<HTMLElement>('[data-action="remove-display"]')
    if (removeBtn) {
      const slotIdx = Number(removeBtn.dataset.slotidx)
      moveFromDisplay(state, slotIdx)
      saveState(state)
      render()
      return
    }
    const moveBtn = target.closest<HTMLElement>('[data-action="move-to-display"]')
    if (moveBtn) {
      const collId = moveBtn.dataset.collid!
      const freeSlot = (state.collections?.displaySlots ?? []).findIndex(s => s === null)
      if (freeSlot >= 0) {
        moveToDisplay(state, collId, freeSlot)
        saveState(state)
        render()
      }
    }
  })

  return area
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderCollections(): void {
  const panel = document.getElementById('collections-panel')
  if (!panel) return

  const hasFeature = hasUpgrade(state, 'unlock_collections')
  panel.style.display = hasFeature ? '' : 'none'
  if (!hasFeature) return

  const body = panel.querySelector<HTMLElement>('.collections-body')
  if (!body) return
  body.innerHTML = ''

  const visible = getVisibleCollections(state)

  if (visible.length === 0) {
    body.innerHTML = `<p class="coll-empty-hint">${t.collLockedUntil(3)}</p>`
    return
  }

  const grid = document.createElement('div')
  grid.className = 'coll-grid'
  for (const def of visible) {
    const instance = getOrCreateInstance(state, def.id)
    grid.appendChild(buildCollectionCard(def, instance))
  }
  body.appendChild(grid)

  // Only show display area if any collection is completed
  const hasCompleted = (state.collections?.instances ?? []).some(i => i.completedAt !== undefined)
  if (hasCompleted) {
    body.appendChild(buildDisplayArea())
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initCollectionsPanel(): void {
  const panel = document.getElementById('collections-panel')
  if (!panel) return

  if (panelOpen) panel.classList.add('coll-panel--open')

  panel.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.coll-toggle-btn')
    if (!btn) return
    panelOpen = !panelOpen
    localStorage.setItem(PANEL_OPEN_KEY, String(panelOpen))
    panel.classList.toggle('coll-panel--open', panelOpen)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeDialog) closeDialog()
  })
}
