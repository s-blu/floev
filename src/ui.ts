import type { GameState, BreedEstimate } from './plant'
import { expressedColor, expressedShape, expressedGradient, expressedNumber } from './plant'
import { renderPlantSVG } from './renderer'
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
} from './game'
import { breedPlants, computeBreedEstimate } from './genetics'

// ─── State ────────────────────────────────────────────────────────────────────

let state: GameState
let breedSelA: number | null = null
let breedSelB: number | null = null
let breedEstimate: BreedEstimate | null = null

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

// ─── Catalog ──────────────────────────────────────────────────────────────────

function renderCatalog(): void {
  const grid = document.getElementById('catalog-grid')
  const count = document.getElementById('catalog-count')
  if (!grid || !count) return

  count.textContent = String(state.catalog.length)

  if (state.catalog.length === 0) {
    grid.innerHTML = '<span class="empty-hint">Noch keine Entdeckungen.</span>'
    return
  }

  grid.innerHTML = ''
  for (const entry of state.catalog) {
    const el = document.createElement('div')
    el.className = 'catalog-entry'
    el.style.borderColor = RARITY_COLORS[entry.rarity]
    el.title = `Seltenheit: ${entry.rarityScore}/100`
    el.innerHTML = `
      <div>${renderPlantSVG(entry.plant, 60, 72)}</div>
      <div class="catalog-footer">
        <span class="rarity-dot" style="background:${RARITY_COLORS[entry.rarity]}"></span>
        <span class="catalog-label">${RARITY_LABELS[entry.rarity]}</span>
      </div>`
    grid.appendChild(el)
  }
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

  breedSelA = null
  breedSelB = null
  breedEstimate = null
  showMsg(`Samen gezüchtet! Generation ${child.generation}.`)
  saveState(state)
  render()
}

// ─── Static event bindings ───────────────────────────────────────────────────

function bindStaticEvents(): void {
  document.getElementById('breed-btn')?.addEventListener('click', handleBreed)
}
