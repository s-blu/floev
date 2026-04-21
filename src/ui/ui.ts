import type { GameState, BreedEstimate } from '../model/plant'
import {
  advancePhases,
  plantSeed,
  removePlant,
  sellPlant,
  placeSeedInEmptyPot,
  saveState,
} from '../engine/game'
import { breedPlants, selfPollinateePlant } from '../engine/breed'
import { buyUpgrade, buyPotColor, buyPotShape, setPotDesign, hasUpgrade } from '../engine/shop_engine'
import { renderPots } from './pots_ui'
import { renderBreedPanel } from './breedpanel_ui'
import { renderCatalog } from './catalog_ui'
import { renderShopSidebar } from '../ui/shop_ui'
import { t } from '../model/i18n/index'
import { checkAchievements } from '../engine/achievements'
import { renderAchievements, queueAchievementToast, initAchievementsPanel } from './achievements_ui'



interface BreedState {
  breedSelA: number | null,
  breedSelB: number | null,
  breedEstimate: BreedEstimate | null
}

// ─── State ────────────────────────────────────────────────────────────────────

export let state: GameState
export const openAncestryIds = new Set<string>()
export const openAlleleIds = new Set<number>()
export const openPotDesignIds = new Set<number>()  
export const breedState: BreedState = {
  breedSelA: null, breedSelB: null, breedEstimate: null
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export function initUI(gameState: GameState): void {
  state = gameState
  bindStaticEvents()
  initAchievementsPanel()
  render()
  checkAndInformAch(gameState)
  setInterval(tick, 2000)
}

function tick(): void {
  const changed = advancePhases(state, plant => {
    showMsg(t.msgNewBloom(plant.generation))
  })
  if (changed) checkAchAndSave(state)
  render()
}

// ─── Top-level render ────────────────────────────────────────────────────────

export function render(): void {
  renderPots(breedState.breedSelA, breedState.breedSelB)
  renderBreedPanel()
  renderCatalog()
  renderCoins()
  renderShopSidebar()
}

// ─── Shop action handlers ─────────────────────────────────────────────────────

export function handleBuyUpgrade(id: string): void {
  if (buyUpgrade(state, id as Parameters<typeof buyUpgrade>[1])) {
    checkAchAndSave(state)
    render()
  }
}

export function handleBuyPotColor(colorId: string): void {
  if (buyPotColor(state, colorId)) {
    checkAchAndSave(state)
    render()
  }
}

export function handleBuyPotShape(shape: string): void {
  if (buyPotShape(state, shape)) {
    checkAchAndSave(state)
    render()
  }
}

export function handleSetPotDesign(potId: number, partial: { colorId?: string; shape?: 'standard' | 'conic' | 'belly' }): void {
  setPotDesign(state, potId, partial)
  saveState(state)
  render()
}

export { hasUpgrade }

// ─── Coins display ────────────────────────────────────────────────────────────

export function renderCoins(): void {
  const el = document.getElementById('coin-badge')
  if (!el) return
  const next = `🪙 ${state.coins}`
  if (el.textContent !== next) {
    el.textContent = next
    el.classList.remove('pop')
    void (el as HTMLElement).offsetWidth // reflow to restart animation
    el.classList.add('pop')
  }
}

// ─── Message bar ──────────────────────────────────────────────────────────────

export function showMsg(text: string): void {
  const el = document.getElementById('msg')
  if (el) el.textContent = text
}

// ─── Action handlers ──────────────────────────────────────────────────────────

export function handlePlantSeed(potId: number): void {
  if (plantSeed(state, potId)) {
    showMsg(t.msgSeedPlanted)
    checkAchAndSave(state)
    render()
  }
}

export function handleRemove(potId: number): void {
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }
  if (removePlant(state, potId)) {
    showMsg(t.msgPotCleared)
    checkAchAndSave(state)
    render()
  }
}

export function handleSell(potId: number): void {
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }

  // Find the sell button position before the plant is removed
  const sellBtn = document.querySelector(`[data-action="sell"][data-pot="${potId}"]`) as HTMLElement | null;

  const reward = sellPlant(state, potId)
  if (reward >= 0) {
    showMsg(t.msgSold(reward))
    if (sellBtn) spawnCoinFly(sellBtn, reward)
    checkAchAndSave(state)
    render()
  }
}

function spawnCoinFly(fromEl: HTMLElement, amount: number): void {
  const rect = fromEl.getBoundingClientRect()
  const coin = document.createElement('div')
  coin.className = 'coin-fly'
  coin.textContent = `+${amount} 🪙`
  coin.style.left = `${rect.left + rect.width / 2}px`
  coin.style.top  = `${rect.top}px`
  document.body.appendChild(coin)
  coin.addEventListener('animationend', () => coin.remove())
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

export function handleSelfPollinate(potId: number): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant || pot.plant.phase < 4) return

  // Show confirmation dialog
  showSelfPollinateDialog(potId)
}

function showSelfPollinateDialog(potId: number): void {
  // Remove any existing dialog
  document.getElementById('selfpollinate-dialog')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'selfpollinate-dialog'
  overlay.className = 'dialog-overlay'
  overlay.innerHTML = `
    <div class="dialog-box">
      <p class="dialog-title">${t.selfPollinateConfirmTitle}</p>
      <p class="dialog-text">${t.selfPollinateConfirmText}</p>
      <p class="dialog-warning">⚠ ${t.selfPollinateWarning}</p>
      <div class="dialog-actions">
        <button class="btn" id="selfpollinate-cancel">${t.selfPollinateCancel}</button>
        <button class="btn btn-confirm" id="selfpollinate-confirm">${t.selfPollinateConfirm}</button>
      </div>
    </div>`

  document.body.appendChild(overlay)

  document.getElementById('selfpollinate-cancel')?.addEventListener('click', () => {
    overlay.remove()
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })

  document.getElementById('selfpollinate-confirm')?.addEventListener('click', () => {
    overlay.remove()
    executeSelfPollinate(potId)
  })
}

function executeSelfPollinate(potId: number): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant) return

  const child = selfPollinateePlant(pot.plant)
  child.selfed = true

  // Clear the parent from breeding selection if needed
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }

  // Remove parent plant (it is consumed)
  removePlant(state, potId)

  // Place child seed
  const placed = placeSeedInEmptyPot(state, child)
  if (placed === null) {
    showMsg(t.breedNoSpace)
    checkAchAndSave(state)
    render()
    return
  }

  showMsg(t.selfPollinateSuccess(child.generation))
  checkAchAndSave(state)
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
    showMsg(t.breedNoSpace)
    return
  }

  showMsg(t.breedSuccess(child.generation))
  checkAchAndSave(state)
  render()
}

function checkAndInformAch(state: GameState): void {
  const newly = checkAchievements(state)
  if (newly.length > 0) queueAchievementToast(newly)
  renderAchievements()
}

function checkAchAndSave(state: GameState) {
  checkAndInformAch(state)
  saveState(state)
}

// ─── Static event bindings ───────────────────────────────────────────────────

function bindStaticEvents(): void {
  document.getElementById('breed-btn')?.addEventListener('click', handleBreed)
}
