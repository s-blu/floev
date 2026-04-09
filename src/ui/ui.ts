import type { GameState, BreedEstimate, CatalogEntry, Rarity } from '../model/plant'
import { expressedColor, expressedShape, expressedGradient, expressedNumber, expressedCenter } from "../engine/genetic.utils"
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
import { calcRarity } from '../engine/rarity'

// ─── State ────────────────────────────────────────────────────────────────────

let state: GameState
let breedSelA: number | null = null
let breedSelB: number | null = null
let breedEstimate: BreedEstimate | null = null

const openAncestryIds = new Set<string>()
let entryIndex = new Map<string, number>()

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

const CENTER_ICONS: Record<string, string> = { dot: '·', disc: '◉', stamen: '✾' }

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
      const center = expressedCenter(pot.plant.centerType)
      const rarity = calcRarity(pot.plant)
      const rarityColor = RARITY_COLORS[rarity]
      const rarityLabel = RARITY_LABELS[rarity]

      traitHtml = `
        <div class="trait-row">
          <span class="trait-pill" style="background:hsl(${Math.round(pc.h)},40%,88%);color:hsl(${Math.round(pc.h)},55%,30%)">${count}× ${shape}</span>
          <span class="trait-pill">${CENTER_ICONS[center] ?? center}</span>
          ${hasGrad ? '<span class="trait-pill">〜</span>' : ''}
        </div>
        <div class="trait-row">
          <span class="trait-pill rarity-pill" style="background:${rarityColor}22;color:${rarityColor};border:0.5px solid ${rarityColor}66">${rarityLabel}</span>
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

  // Slot A — with X button if plant is selected
  if (potA?.plant) {
    slotA.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potA.plant, 66, 86)}
        <button class="breed-slot-remove" data-remove="a" title="Entfernen">×</button>
      </div>`
  } else {
    slotA.innerHTML = '<span>Elter 1</span>'
  }

  // Slot B — with X button if plant is selected
  if (potB?.plant) {
    slotB.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potB.plant, 66, 86)}
        <button class="breed-slot-remove" data-remove="b" title="Entfernen">×</button>
      </div>`
  } else {
    slotB.innerHTML = '<span>Elter 2</span>'
  }

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

  // X-button listeners on breed slots
  slotA.onclick = (e) => {
    if ((e.target as HTMLElement).closest('[data-remove="a"]')) {
      breedSelA = null; breedEstimate = null; render()
    }
  }
  slotB.onclick = (e) => {
    if ((e.target as HTMLElement).closest('[data-remove="b"]')) {
      breedSelB = null; breedEstimate = null; render()
    }
  }
}

// ─── Estimate formatting ──────────────────────────────────────────────────────

const SHAPE_DE: Record<string, string> = { round: 'Rund', pointed: 'Spitz', wavy: 'Wellig' }
const CENTER_DE: Record<string, string> = { dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubbl.' }

function probBars<T extends string>(items: { [k: string]: T | number }[], labelKey: string, valueKey: string, labelMap: Record<string, string>): string {
  return items.map((item) => {
    const label = labelMap[(item as Record<string, string>)[labelKey]] ?? (item as Record<string, string>)[labelKey]
    const pct = item[valueKey] as number
    return `<div class="prob-entry">
      <span class="prob-label">${label}</span>
      <span class="prob-bar-wrap"><span class="prob-bar" style="width:${pct}%"></span></span>
      <span class="prob-pct">${pct}%</span>
    </div>`
  }).join('')
}

function formatEstimate(e: BreedEstimate): string {
  const sw = (h: number) =>
    `<span class="swatch" style="background:hsl(${Math.round(h)},${Math.round(e.avgS)}%,${Math.round(e.avgL)}%)"></span>`

  const shapeBars = e.shapeProbs.map(x =>
    `<div class="prob-entry">
      <span class="prob-label">${SHAPE_DE[x.shape] ?? x.shape}</span>
      <span class="prob-bar-wrap"><span class="prob-bar" style="width:${x.pct}%"></span></span>
      <span class="prob-pct">${x.pct}%</span>
    </div>`
  ).join('')

  const centerBars = e.centerProbs.map(x =>
    `<div class="prob-entry">
      <span class="prob-label">${CENTER_DE[x.center] ?? x.center}</span>
      <span class="prob-bar-wrap"><span class="prob-bar" style="width:${x.pct}%"></span></span>
      <span class="prob-pct">${x.pct}%</span>
    </div>`
  ).join('')

  return `
    <div class="est-row">${sw(e.minH)}${sw(e.midH)}${sw(e.maxH)}<span>Farbbereich (ca.)</span></div>
    <div class="est-row" style="margin-bottom:4px">Blätter: ${e.minP}–${e.maxP}</div>
    <div class="prob-group">
      <div class="prob-group-label">Blütenform</div>
      ${shapeBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">Blütenmitte</div>
      ${centerBars}
    </div>
    ${e.gradPct > 0 ? `<div class="est-grad">✦ Farbverlauf: ~${e.gradPct}%</div>` : ''}
    <div class="est-note">Ohne seltene Mutationen.</div>`
}

// ─── Catalog helpers ──────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  round: 'Rund', pointed: 'Spitz', wavy: 'Wellig',
}

const CENTER_LABELS: Record<string, string> = {
  dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubblätter',
}

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

  const groups: Record<Rarity, CatalogEntry[]> = { 4: [], 3: [], 2: [], 1: [], 0: [] }
  for (const entry of state.catalog) {
    groups[entry.rarity].push(entry)
  }
  for (const r of [4, 3, 2, 1, 0] as Rarity[]) {
    groups[r].sort((a, b) => a.discovered - b.discovered)
  }

  const allSorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered)
  entryIndex = new Map<string, number>()
  allSorted.forEach((e, i) => entryIndex.set(e.plant.id, i + 1))

  container.innerHTML = ''

  for (const rarity of [4, 3, 2, 1, 0] as Rarity[]) {
    const entries = groups[rarity]
    if (entries.length === 0) continue

    const heading = document.createElement('div')
    heading.className = 'catalog-section-heading'
    heading.innerHTML = `
      <span class="rarity-dot" style="background:${RARITY_COLORS[rarity]}"></span>
      <span class="rarity-line"></span>
      <span class="rarity-name" style="color:${RARITY_COLORS[rarity]}">${RARITY_LABELS[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="catalog-section-count">${entries.length}</span>`
    container.appendChild(heading)

    const grid = document.createElement('div')
    grid.className = 'catalog-rarity-group'
    for (const entry of entries) {
      const num = entryIndex.get(entry.plant.id) ?? 0
      grid.appendChild(buildEncyclopediaEntry(entry, num))
    }
    container.appendChild(grid)
  }

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

  const hslMain = `hsl(${Math.round(pc.h)},${Math.round(pc.s)}%,${Math.round(pc.l)}%)`
  const swatchStyle = hasGrad
    ? `background: linear-gradient(135deg, ${hslMain}, hsl(${Math.round(grad!.h)},${Math.round(grad!.s)}%,${Math.round(grad!.l)}%))`
    : `background: ${hslMain}`

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

  let ancestryHtml = ''
  if (plant.parentIds) {
    const isOpen = openAncestryIds.has(plant.id)
    const renderParentSlot = (e: CatalogEntry | null, id: string) => {
      const num = e ? (entryIndex.get(e.plant.id) ?? '?') : '?'
      const name = e ? `Blüte ${num}` : 'Unbekannt'
      const thumb = e
        ? `<div class="enc-parent-thumb" title="Gen. ${e.plant.generation}">${renderBloomSVG(e.plant, 38, 38)}</div>`
        : `<div class="enc-parent-thumb enc-parent-unknown" title="Elter unbekannt (${id})"><span>?</span></div>`
      return `<div class="enc-parent-slot">${thumb}<span class="enc-parent-name">${name}</span></div>`
    }
    ancestryHtml = `
      <details class="enc-ancestry" data-id="${plant.id}"${isOpen ? ' open' : ''}>
        <summary>Stammbaum</summary>
        <div class="enc-parents-row">
          ${renderParentSlot(parentA, plant.parentIds[0])}
          <span class="enc-parent-cross">×</span>
          ${renderParentSlot(parentB, plant.parentIds[1])}
        </div>
      </details>`
  }

  el.innerHTML = `
    <div class="enc-bloom">${renderBloomSVG(plant, 80, 80)}</div>
    <div class="enc-body">
      <div class="enc-entry-num">Nr. ${num}</div>
      <div class="enc-entry-name" style="font-family: var(--font-serif, Georgia, serif)">Blüte ${num}</div>
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
          <span class="enc-meta-label">Gen.</span>
          <span class="enc-meta-value">${plant.generation}</span>
        </div>
      </div>
      <div class="enc-discovered">${formatDate(entry.discovered)}</div>
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
