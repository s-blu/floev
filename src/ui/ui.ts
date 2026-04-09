import type { GameState, BreedEstimate } from '../model/plant'
import {
  advancePhases,
  plantSeed,
  removePlant,
  placeSeedInEmptyPot,
  saveState,
} from '../engine/game'
import { breedPlants } from '../engine/breed'
import { renderPots } from './pots.ui'
import { renderBreedPanel } from './breedpanel.ui'
import { renderCatalog } from './catalog.ui'

interface BreedState {
  breedSelA: number | null,
  breedSelB: number | null,
  breedEstimate: BreedEstimate | null
}

// ─── State ────────────────────────────────────────────────────────────────────

export let state: GameState
export const openAncestryIds = new Set<string>()
export const breedState: BreedState = {
  breedSelA: null, breedSelB: null, breedEstimate: null
}


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
  renderPots(breedState.breedSelA, breedState.breedSelB)
  renderBreedPanel()
  renderCatalog()
}

// ─── Message bar ──────────────────────────────────────────────────────────────

export function showMsg(text: string): void {
  const el = document.getElementById('msg')
  if (el) el.textContent = text
}

// ─── Action handlers ──────────────────────────────────────────────────────────

export function handlePlantSeed(potId: number): void {
  if (plantSeed(state, potId)) {
    showMsg('Samen gepflanzt!')
    saveState(state)
    render()
  }
}

export function handleRemove(potId: number): void {
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }
  if (removePlant(state, potId)) {
    showMsg('Topf geleert.')
    saveState(state)
    render()
  }
}

export function handleBreedSelect(potId: number): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return

  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  else if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }
  else if (breedState.breedSelA === null) { breedState.breedSelA = potId }
  else if (breedState.breedSelB === null) { breedState.breedSelB = potId }

  render()
}

function handleBreed(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
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
