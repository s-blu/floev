// ─── Research book UI ─────────────────────────────────────────────────────────

import type { Plant, ChromaticL } from '../model/plant'
import type { ResearchTask, ResearchTaskSpec } from '../model/research'
import { state } from './ui'
import { t } from '../model/i18n'
import { hasUpgrade } from '../engine/shop_engine'
import { initResearchBook, getDiscoveredTraits, specHasUnknownTrait, type DiscoveredTraits } from '../engine/research_engine'
import { getEffectiveDate } from '../engine/orders_engine'
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer'
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY } from '../model/genetic_model'

// ─── Panel open state (persisted in localStorage) ────────────────────────────

const PANEL_OPEN_KEY = 'researchBookPanelOpen'

function loadPanelOpen(): boolean {
  const stored = localStorage.getItem(PANEL_OPEN_KEY)
  return stored === null ? true : stored === 'true'
}

function savePanelOpen(value: boolean): void {
  localStorage.setItem(PANEL_OPEN_KEY, String(value))
}

let panelOpen = loadPanelOpen()

// ─── Preview plant builder ────────────────────────────────────────────────────

const BUCKET_HUE: Record<string, number> = {
  white:       ACHROMATIC_HUE_WHITE,
  yellowgreen: 60,
  red:         5,
  blue:        200,
  purple:      270,
  pink:        310,
  gray:        ACHROMATIC_HUE_GRAY,
}

const PREVIEW_SIZE = 80

function previewPlantForResearch(spec: ResearchTaskSpec): Plant {
  const hue       = BUCKET_HUE[spec.colorBucket] ?? ACHROMATIC_HUE_WHITE
  const lightness = (spec.colorBucket === 'white' ? 90 : spec.lightness) as ChromaticL
  return {
    id:             'research-preview',
    petalShape:     { a: spec.shape,      b: spec.shape },
    petalCount:     { a: spec.petalCount, b: spec.petalCount },
    centerType:     { a: spec.centerType, b: spec.centerType },
    petalHue:       { a: hue,             b: hue },
    petalLightness: { a: lightness,       b: lightness },
    petalEffect:    { a: spec.effect,     b: spec.effect },
    stemHeight:     { a: 0.5,             b: 0.5 },
    stem:           { a: 'two-leaved-stem', b: 'two-leaved-stem' },
    phase:          4,
    generation:     1,
  }
}

// ─── Trait badge helpers ──────────────────────────────────────────────────────

function traitBadge(label: string, unknown: boolean, extraClass = ''): string {
  const cls = `research-trait-tag${unknown ? ' research-trait-tag--unknown' : ''}${extraClass ? ` ${extraClass}` : ''}`
  return `<span class="${cls}">${unknown ? t.researchUnknownTrait : label}</span>`
}

function buildTraitBadges(spec: ResearchTaskSpec, discovered: DiscoveredTraits): string {
  const shapeUnknown  = !discovered.shapes.has(spec.shape)
  const colorUnknown  = !discovered.colorBuckets.has(spec.colorBucket)
  const centerUnknown = !discovered.centerTypes.has(spec.centerType)
  const effectUnknown = !discovered.effects.has(spec.effect)

  const shapeName  = t.shapeLabels[spec.shape]  ?? spec.shape
  const colorName  = t.colorBucketLabels[spec.colorBucket] ?? spec.colorBucket
  const lightnessName = spec.colorBucket !== 'white' ? (t.lightnessLabels[spec.lightness] ?? String(spec.lightness)) : ''
  const colorLabel = lightnessName ? `${lightnessName} (${colorName})` : colorName
  const centerName = t.centerTypeLabels[spec.centerType] ?? spec.centerType
  const effectName = t.effectLabels[spec.effect] ?? spec.effect

  const parts = [
    traitBadge(t.researchBadgeShape(shapeName), shapeUnknown),
    traitBadge(t.researchBadgeCount(spec.petalCount), false),
    traitBadge(t.researchBadgeColor(colorLabel), colorUnknown),
    traitBadge(t.researchBadgeCenter(centerName), centerUnknown),
    traitBadge(t.researchBadgeEffect(effectName), effectUnknown),
  ]
  return parts.join('')
}

// ─── Task card builder ────────────────────────────────────────────────────────

function buildTaskCard(task: ResearchTask, index: number): HTMLElement {
  const card = document.createElement('div')
  const discovered = getDiscoveredTraits(state)
  const hasUnknown = !task.completedToday && specHasUnknownTrait(task.spec, discovered)

  card.className = [
    'order-card',
    task.completedToday ? 'order-card--done' : '',
    hasUnknown        ? 'order-card--grayed' : '',
  ].filter(Boolean).join(' ')

  const previewHtml = task.completedToday
    ? renderBloomSVG(task.completedByPlant!, PREVIEW_SIZE, PREVIEW_SIZE, 'res')
    : hasUnknown
      ? `<div class="research-preview-unknown">🔬</div>`
      : renderBloomSVG(previewPlantForResearch(task.spec), PREVIEW_SIZE, PREVIEW_SIZE, 'res')

  const badgesHtml = buildTraitBadges(task.spec, discovered)

  card.innerHTML = `
    <div class="order-card-preview">${previewHtml}</div>
    <div class="order-card-body">
      <div class="order-card-header">
        <span class="order-card-label">${t.researchTaskLabel(index + 1)}</span>
        ${task.completedToday
          ? `<span class="order-done-badge">${t.researchTaskDone}</span>`
          : ''}
      </div>
      <div class="order-req-tags">${badgesHtml}</div>
      ${hasUnknown && !task.completedToday
        ? `<p class="research-grayed-hint">${t.researchTaskGrayedHint}</p>`
        : ''}
    </div>`

  return card
}

// ─── Panel render ─────────────────────────────────────────────────────────────

export function renderResearchPanel(): void {
  const panel = document.getElementById('research-book-panel')
  if (!panel) return

  const hasBook = hasUpgrade(state, 'unlock_research_book')
  panel.style.display = hasBook ? '' : 'none'
  if (!hasBook) return

  const isDailyReset = !!state.researchBook
    && state.researchBook.lastEffectiveDate !== getEffectiveDate()
  if (isDailyReset) {
    panelOpen = true
    savePanelOpen(true)
  }

  initResearchBook(state)

  const tasks = state.researchBook!.tasks

  const summary = panel.querySelector('.research-collapsed-summary') as HTMLElement | null
  if (summary) {
    const done = tasks.filter(t => t.completedToday).length
    summary.textContent = `${done}/3`
    summary.style.display = panelOpen ? 'none' : ''
  }

  const chevron = panel.querySelector('.research-chevron') as HTMLElement | null
  if (chevron) chevron.textContent = panelOpen ? '▴' : '▾'

  panel.classList.toggle('order-panel--open', panelOpen)

  const body = panel.querySelector('.research-body') as HTMLElement | null
  if (!body) return
  if (!panelOpen) return

  body.innerHTML = ''

  const pointsBadge = document.createElement('div')
  pointsBadge.className = 'research-points-badge'
  pointsBadge.textContent = t.researchPointsBadge(state.researchPoints ?? 0)
  body.appendChild(pointsBadge)

  for (let i = 0; i < tasks.length; i++) {
    body.appendChild(buildTaskCard(tasks[i], i))
  }
}

// ─── Panel initialisation ─────────────────────────────────────────────────────

export function initResearchPanel(): void {
  const panel = document.getElementById('research-book-panel')
  if (!panel) return

  const toggle = panel.querySelector('.research-toggle-btn')
  toggle?.addEventListener('click', () => {
    panelOpen = !panelOpen
    savePanelOpen(panelOpen)
    renderResearchPanel()
  })
}
