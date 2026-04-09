import type { GameState, BreedEstimate, CatalogEntry, Rarity } from '../model/plant'
import { expressedColor, expressedShape, expressedGradient, expressedNumber, expressedCenter, colorBucket } from "../engine/genetic.utils"
import { renderPlantSVG } from '../engine/renderer/renderer'
import { renderBloomSVG } from '../engine/renderer/encyclopedia.renderer'
import {
  getPhaseProgress,
  advancePhases,
  plantSeed,
  removePlant,
  placeSeedInEmptyPot,
  saveState,
  PHASE_LABELS,
  RARITY_LABELS,
  RARITY_COLORS,
} from '../engine/game'
import { breedPlants, computeBreedEstimate } from '../engine/breed'

// ─── State ────────────────────────────────────────────────────────────────────

let state: GameState
let breedSelA: number | null = null
let breedSelB: number | null = null
let breedEstimate: BreedEstimate | null = null

/** Track which ancestry <details> are open so state survives rerenders */
const openAncestryIds = new Set<string>()

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export function initUI(gameState: GameState): void {
  state = gameState
  bindStaticEvents()
  render()
  setInterval(tick, 2000)
}

function tick(): void {
  const changed = advancePhases(state, plant => {
    showMsg(`Eine neue Blüte ist aufgegangen! (Gen. ${plant.generation})`)
  })
  if (changed) saveState(state)
  render()
}

// ─── Top-level render ────────────────────────────────────────────────────────

export function render(): void {
  renderPots()
  renderBreedPanel()
  renderCatalog()
}

// ─── Message bar ──────────────────────────────────────────────────────────────

export function showMsg(text: string): void {
  const el = document.getElementById('msg')
  if (el) el.textContent = text
}

// ─── Pots ─────────────────────────────────────────────────────────────────────

function renderPots(): void {
  const row = document.getElementById('pots-row')
  if (!row) return
  row.innerHTML = ''

  for (const pot of state.pots) {
    const isSel = breedSelA === pot.id || breedSelB === pot.id
    const isBlooming = pot.plant?.phase === 4

    const card = document.createElement('div')
    card.className = [
      'pot-card',
      isSel ? 'selected' : '',
      isBlooming ? 'blooming' : '',
    ].filter(Boolean).join(' ')

    const prog = getPhaseProgress(pot)
    const phaseLabel = PHASE_LABELS[pot.plant?.phase ?? 0]

    let traitHtml = ''
    if (isBlooming && pot.plant) {
      const pc = expressedColor(pot.plant.petalColor)
      const shape = expressedShape(pot.plant.petalShape)
      const hasGrad = expressedGradient(pot.plant.gradientColor) !== null
      const count = Math.round(expressedNumber(pot.plant.petalCount))
      traitHtml = `
        <div class="trait-row">
          <span class="trait-pill" style="background:hsl(${Math.round(pc.h)},40%,88%);color:hsl(${Math.round(pc.h)},55%,30%)">${count}×</span>
          <span class="trait-pill">${shape}</span>
          ${hasGrad ? '<span class="trait-pill">verlauf</span>' : ''}
        </div>`
    }

    let btns = ''
    if (!pot.plant) {
      btns += `<button class="btn-sm" data-action="plant" data-pot="${pot.id}">Pflanzen</button>`
    }
    if (isBlooming) {
      btns += `<button class="btn-sm" data-action="breed-select" data-pot="${pot.id}">${isSel ? 'Abwählen' : 'Züchten'}</button>`
    }
    if (pot.plant) {
      btns += `<button class="btn-sm danger" data-action="remove" data-pot="${pot.id}">✕</button>`
    }

    card.innerHTML = `
      <div class="plant-view">${renderPlantSVG(pot.plant, 100, 130)}</div>
      <span class="phase-label">${phaseLabel}${pot.plant && pot.plant.phase > 0 && pot.plant.phase < 4 ? ' ' + Math.round(prog * 100) + '%' : ''}</span>
      ${pot.plant && pot.plant.phase > 0 && pot.plant.phase < 4
        ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.round(prog * 100)}%"></div></div>`
        : ''
      }
      ${traitHtml}
      <div class="btn-row">${btns}</div>`

    row.appendChild(card)
  }

  row.onclick = (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!btn) return
    const action = btn.dataset.action
    const potId = Number(btn.dataset.pot)
    if (action === 'plant') handlePlantSeed(potId)
    if (action === 'breed-select') handleBreedSelect(potId)
    if (action === 'remove') handleRemove(potId)
  }
}

// ─── Breeding panel ───────────────────────────────────────────────────────────

function renderBreedPanel(): void {
  const slotA = document.getElementById('breed-a')
  const slotB = document.getElementById('breed-b')
  const preview = document.getElementById('breed-preview')
  const btn = document.getElementById('breed-btn') as HTMLButtonElement | null
  if (!slotA || !slotB || !preview || !btn) return

  const potA = breedSelA !== null ? state.pots.find(p => p.id === breedSelA) : null
  const potB = breedSelB !== null ? state.pots.find(p => p.id === breedSelB) : null

  slotA.innerHTML = potA?.plant
    ? renderPlantSVG(potA.plant, 66, 86)
    : '<span>Elter 1</span>'
  slotB.innerHTML = potB?.plant
    ? renderPlantSVG(potB.plant, 66, 86)
    : '<span>Elter 2</span>'

  const hasEmptyPot = state.pots.some(p => !p.plant)

  if (potA?.plant && potB?.plant) {
    if (!breedEstimate) {
      breedEstimate = computeBreedEstimate(potA.plant, potB.plant)
    }
    preview.innerHTML = formatEstimate(breedEstimate)
    btn.disabled = !hasEmptyPot
  } else {
    preview.textContent = 'Wähle zwei blühende Pflanzen aus.'
    btn.disabled = true
    breedEstimate = null
  }

  const hint = document.querySelector('.breed-hint') as HTMLElement | null
  if (hint) {
    if (potA?.plant && potB?.plant && !hasEmptyPot) {
      hint.textContent = 'Kein freier Topf — entferne zuerst eine Pflanze.'
      hint.style.color = '#A32D2D'
    } else {
      hint.textContent = 'Ergebnis landet in einem leeren Topf'
      hint.style.color = ''
    }
  }
}

function formatEstimate(e: BreedEstimate): string {
  const sw = (h: number) =>
    `<span class="swatch" style="background:hsl(${Math.round(h)},${Math.round(e.avgS)}%,${Math.round(e.avgL)}%)"></span>`
  return `
    <div class="est-row">${sw(e.minH)}${sw(e.midH)}${sw(e.maxH)}<span>Farbbereich (ca.)</span></div>
    <div>Blätter: ${e.minP}–${e.maxP} · <em>${e.likelyShape}</em></div>
    ${e.gradPct > 0 ? `<div class="est-grad">Verlauf: ~${e.gradPct}% Chance</div>` : ''}
    <div class="est-note">Seltene Mutationen nicht eingerechnet.</div>`
}

// ─── Catalog helpers ──────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  round: 'Rund', pointed: 'Spitz', wavy: 'Wellig',
}

const CENTER_LABELS: Record<string, string> = {
  dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubblätter',
}

// Rarity badge background/text pairs
const RARITY_BADGE_STYLES: Record<Rarity, { bg: string; color: string }> = {
  0: { bg: '#F1EFE8', color: '#5F5E5A' },
  1: { bg: '#E1F5EE', color: '#0F6E56' },
  2: { bg: '#E6F1FB', color: '#185FA5' },
  3: { bg: '#EEEDFE', color: '#3C3489' },
  4: { bg: '#FAEEDA', color: '#854F0B' },
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

function renderCatalog(): void {
  const container = document.getElementById('catalog-grid')
  const count = document.getElementById('catalog-count')
  if (!container || !count) return

  // Snapshot open ancestry details before clearing DOM
  container.querySelectorAll<HTMLDetailsElement>('.enc-ancestry[data-id]').forEach(el => {
    const id = el.dataset.id!
    if (el.open) openAncestryIds.add(id)
    else openAncestryIds.delete(id)
  })

  count.textContent = String(state.catalog.length)

  if (state.catalog.length === 0) {
    container.innerHTML = '<span class="empty-hint">Noch keine Entdeckungen.</span>'
    return
  }

  // Group by rarity (4→0), within each group sort by discovery order (= index = name number)
  const groups: Record<Rarity, CatalogEntry[]> = { 4: [], 3: [], 2: [], 1: [], 0: [] }
  for (const entry of state.catalog) {
    groups[entry.rarity].push(entry)
  }
  for (const r of [4, 3, 2, 1, 0] as Rarity[]) {
    groups[r].sort((a, b) => a.discovered - b.discovered)
  }

  // Build a global index map: sort all entries by discovered time to assign "Blüte N"
  const allSorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered)
  const entryIndex = new Map<string, number>()
  allSorted.forEach((e, i) => entryIndex.set(e.plant.id, i + 1))

  container.innerHTML = ''

  for (const rarity of [4, 3, 2, 1, 0] as Rarity[]) {
    const entries = groups[rarity]
    if (entries.length === 0) continue

    // Section heading: dot + rarity lines (Variante B style) + count (Variante A)
    const heading = document.createElement('div')
    heading.className = 'catalog-section-heading'
    heading.innerHTML = `
      <span class="rarity-dot" style="background:${RARITY_COLORS[rarity]}"></span>
      <span class="rarity-line"></span>
      <span class="rarity-name" style="color:${RARITY_COLORS[rarity]}">${RARITY_LABELS[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="catalog-section-count">${entries.length}</span>`
    container.appendChild(heading)

    // 2-column grid wrapper
    const grid = document.createElement('div')
    grid.className = 'catalog-rarity-group'
    for (const entry of entries) {
      const num = entryIndex.get(entry.plant.id) ?? 0
      grid.appendChild(buildEncyclopediaEntry(entry, num))
    }
    container.appendChild(grid)
  }

  // Re-attach toggle listeners to persist open state
  container.querySelectorAll<HTMLDetailsElement>('.enc-ancestry[data-id]').forEach(el => {
    el.addEventListener('toggle', () => {
      const id = el.dataset.id!
      if (el.open) openAncestryIds.add(id)
      else openAncestryIds.delete(id)
    })
  })
}

function buildEncyclopediaEntry(entry: CatalogEntry, num: number): HTMLElement {
  const plant = entry.plant
  const pc = expressedColor(plant.petalColor)
  const grad = expressedGradient(plant.gradientColor)
  const shape = expressedShape(plant.petalShape)
  const center = expressedCenter(plant.centerType)
  const count = Math.round(expressedNumber(plant.petalCount))
  const hasGrad = grad !== null

  // Color swatch: flat or gradient
  const hslMain = `hsl(${Math.round(pc.h)},${Math.round(pc.s)}%,${Math.round(pc.l)}%)`
  const swatchStyle = hasGrad
    ? `background: linear-gradient(135deg, ${hslMain}, hsl(${Math.round(grad!.h)},${Math.round(grad!.s)}%,${Math.round(grad!.l)}%))`
    : `background: ${hslMain}`

  // Find parent entries in catalog if available
  const parentA = plant.parentIds
    ? state.catalog.find(e => e.plant.id === plant.parentIds![0])
    : null
  const parentB = plant.parentIds
    ? state.catalog.find(e => e.plant.id === plant.parentIds![1])
    : null

  const badge = RARITY_BADGE_STYLES[entry.rarity]

  const el = document.createElement('div')
  el.className = 'enc-entry'
  el.style.borderLeftColor = RARITY_COLORS[entry.rarity]

  // Build ancestry HTML
  let ancestryHtml = ''
  if (plant.parentIds) {
    const isOpen = openAncestryIds.has(plant.id)
    const renderParentThumb = (e: CatalogEntry | null, id: string) => {
      if (e) {
        return `<div class="enc-parent-thumb" title="Gen. ${e.plant.generation}">${renderBloomSVG(e.plant, 38, 38)}</div>`
      }
      return `<div class="enc-parent-thumb enc-parent-unknown" title="Elter unbekannt (${id})"><span>?</span></div>`
    }
    ancestryHtml = `
      <details class="enc-ancestry" data-id="${plant.id}"${isOpen ? ' open' : ''}>
        <summary>Stammbaum (Gen. ${plant.generation - 1})</summary>
        <div class="enc-parents-row">
          ${renderParentThumb(parentA, plant.parentIds[0])}
          <span class="enc-parent-cross">×</span>
          ${renderParentThumb(parentB, plant.parentIds[1])}
        </div>
      </details>`
  }

  el.innerHTML = `
    <div class="enc-bloom">${renderBloomSVG(plant, 80, 80)}</div>
    <div class="enc-body">
      <div class="enc-entry-num">Nr. ${num}</div>
      <div class="enc-entry-name">Blüte ${num}</div>
      <span class="enc-rarity-badge" style="background:${badge.bg};color:${badge.color}">${RARITY_LABELS[entry.rarity]}</span>
      <div class="enc-meta">
        <div class="enc-meta-row">
          <span class="enc-meta-label">Blätter</span>
          <span class="enc-meta-value">${count} · ${SHAPE_LABELS[shape] ?? shape}</span>
        </div>
        <div class="enc-meta-row">
          <span class="enc-meta-label">Mitte</span>
          <span class="enc-meta-value">${CENTER_LABELS[center] ?? center}</span>
        </div>
        <div class="enc-meta-row">
          <span class="enc-meta-label">Farbe</span>
          <span class="enc-meta-value">
            <span class="enc-color-swatch" style="${swatchStyle}"></span>
          </span>
        </div>
        <div class="enc-meta-row">
          <span class="enc-meta-label">Generation</span>
          <span class="enc-meta-value">Gen. ${plant.generation}</span>
        </div>
      </div>
      <div class="enc-discovered">Entdeckt ${formatDate(entry.discovered)}</div>
      ${ancestryHtml}
    </div>`

  return el
}

// ─── Action handlers ──────────────────────────────────────────────────────────

function handlePlantSeed(potId: number): void {
  if (plantSeed(state, potId)) {
    showMsg('Samen gepflanzt!')
    saveState(state)
    render()
  }
}

function handleRemove(potId: number): void {
  if (breedSelA === potId) { breedSelA = null; breedEstimate = null }
  if (breedSelB === potId) { breedSelB = null; breedEstimate = null }
  if (removePlant(state, potId)) {
    showMsg('Topf geleert.')
    saveState(state)
    render()
  }
}

function handleBreedSelect(potId: number): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return

  if (breedSelA === potId) { breedSelA = null; breedEstimate = null }
  else if (breedSelB === potId) { breedSelB = null; breedEstimate = null }
  else if (breedSelA === null) { breedSelA = potId }
  else if (breedSelB === null) { breedSelB = potId }

  render()
}

function handleBreed(): void {
  if (breedSelA === null || breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedSelA)
  const potB = state.pots.find(p => p.id === breedSelB)
  if (!potA?.plant || !potB?.plant) return

  const child = breedPlants(potA.plant, potB.plant)
  const placed = placeSeedInEmptyPot(state, child)
  if (placed === null) {
    showMsg('Kein leerer Topf! Entferne zuerst eine Pflanze.')
    return
  }

  showMsg(`Samen gezüchtet! Generation ${child.generation}.`)
  saveState(state)
  render()
}

// ─── Static event bindings ───────────────────────────────────────────────────

function bindStaticEvents(): void {
  document.getElementById('breed-btn')?.addEventListener('click', handleBreed)
}
