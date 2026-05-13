import { state, render } from './ui'
import { t } from '../model/i18n'
import { hasUpgrade } from '../engine/shop_engine'
import { saveState } from '../engine/game'
import {
  getVisibleCollections,
  getOrCreateInstance,
  getEligiblePots,
  fillSlot,
  clearSlot,
  checkAllCollectionCompletions,
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
        const title = (t.collectionDefs as Record<string, { title: string; desc: string }>)[id]?.title ?? id
        addNotification(t.collCompletedToast(title))
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

  card.innerHTML = `
    <div class="coll-herbarium-frame coll-herbarium-frame--slots-${def.slots.length}">
      ${slotsHtml}
    </div>
    <div class="coll-herbarium-plaque">
      <span class="coll-herbarium-plaque-title">${info.title}</span>
      ${info.desc ? `<span class="coll-herbarium-plaque-desc">${info.desc}</span>` : ''}
    </div>`

  card.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const clearBtn = target.closest<HTMLElement>('[data-action="clear-slot"]')
    if (clearBtn) {
      if (clearSlot(state, clearBtn.dataset.collid!, Number(clearBtn.dataset.slotidx))) {
        saveState(state)
        render()
      }
      return
    }
    const btn = target.closest<HTMLElement>('[data-action="fill-slot"]')
    if (!btn) return
    const collId = btn.dataset.collid!
    const slotIdx = Number(btn.dataset.slotidx)
    const collDef = getCollectionDef(collId)
    if (!collDef) return
    openSlotFillDialog(collId, slotIdx, collDef.slots[slotIdx])
  })

  return card
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
