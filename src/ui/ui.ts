import type { GameState, BreedEstimate } from '../model/plant'
import {
  advancePhases,
  saveState,
} from '../engine/game'
import {
  moveToShowcase,
  moveFromShowcase,
  swapGardenPots,
  swapShowcasePots
} from '../engine/showcase_engine'
import {
  addSeedToStorage,
  removeSeedFromStorage,
  moveSeedToSlot,
  sellSeedFromStorage
} from '../engine/seed_storage_engine'
import {
  plantSeed,
  removePlant,
  sellPlant,
  placeSeedInEmptyPot,
  placeSeedInSpecificPot
} from '../engine/pot_engine'
import { breedPlants, selfPollinateePlant } from '../engine/breed'
import { buyUpgrade, buyPotColor, buyPotShape, setPotDesign, setShowcasePotDesign, hasUpgrade, buyExtraPot, buyExtraShowcaseSlot } from '../engine/shop_engine'
import { renderPots } from './pots_ui'
import { renderShowcase } from './showcase_ui'
import { renderBreedPanel } from './breedpanel_ui'
import { renderCatalog } from './catalog_ui'
import { renderShopSidebar } from '../ui/shop_ui'
import { t } from '../model/i18n/index'
import { checkAchievements } from '../engine/achievements'
import { renderAchievements, queueAchievementToast, initAchievementsPanel } from './achievements_ui'
import { addNotification } from './notification_log'
import { renderOrderBook } from './orders_ui'
import { applyOrdersOnSell, initOrderBook } from '../engine/orders_engine'
import { SURPLUS_SEED_CHANCE, SELF_POLLINATE_SURPLUS_SEED_CHANCE, MAX_SEED_STORAGE, MAX_SURPLUS_SEEDS_PER_PLANT, SEED_CRAFT_COOLDOWN_MS, MULTI_SEED_COUNT_MIN, MULTI_SEED_COUNT_MAX } from '../model/genetic_model'
import { renderSeedDrawer } from './seeds_ui'
import { COIN_ICON } from './icons'
import { renderSeedIcon } from '../engine/renderer/seed_renderer'



interface BreedState {
  breedSelA: number | null,
  breedSelB: number | null,
  breedEstimate: BreedEstimate | null
}

// ─── State ────────────────────────────────────────────────────────────────────

export let state: GameState
export const openAlleleIds = new Set<number>()
export const openPotDesignIds = new Set<number>()
export const breedState: BreedState = {
  breedSelA: null, breedSelB: null, breedEstimate: null
}
export let swapGardenPotId: number | null = null
export let swapShowcasePotId: number | null = null

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export function initUI(gameState: GameState): void {
  state = gameState
  initOrderBook(state)
  bindStaticEvents()
  initAchievementsPanel()
  render()
  checkAndInformAch(gameState)
  setInterval(tick, 2000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })
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
  renderShowcase()
  renderBreedPanel()
  renderCatalog()
  renderCoins()
  renderShopSidebar()
  renderOrderBook()
  renderSeedDrawer()
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

export function handleBuyExtraPot(): void {
  if (buyExtraPot(state)) {
    checkAchAndSave(state)
    render()
  }
}

export function handleSetPotDesign(potId: number, partial: { colorId?: string; shape?: 'standard' | 'conic' | 'belly' }): void {
  setPotDesign(state, potId, partial)
  saveState(state)
  render()
}

export function handleSetShowcasePotDesign(potId: number, partial: { colorId?: string; shape?: 'standard' | 'conic' | 'belly' }): void {
  setShowcasePotDesign(state, potId, partial)
  saveState(state)
  render()
}

export function handleBuyExtraShowcaseSlot(): void {
  if (buyExtraShowcaseSlot(state)) {
    checkAchAndSave(state)
    render()
  }
}

export { hasUpgrade }

// ─── Coins display ────────────────────────────────────────────────────────────

export function renderCoins(): void {
  const el = document.getElementById('coin-badge')
  if (!el) return
  const next = `${COIN_ICON} ${state.coins}`
  if (el.innerHTML !== next) {
    el.innerHTML = next
    el.classList.remove('pop')
    void (el as HTMLElement).offsetWidth // reflow to restart animation
    el.classList.add('pop')
  }
}

// ─── Message bar ──────────────────────────────────────────────────────────────

export function showMsg(text: string): void {
  addNotification(text)
}

// ─── Action handlers ──────────────────────────────────────────────────────────

export function handlePlantSeed(potId: number): void {
  if (plantSeed(state, potId)) {
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

export function handleMoveToShowcase(potId: number): void {
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }
  if (moveToShowcase(state, potId)) {
    checkAchAndSave(state)
    render()
  }
}

export function handleMoveFromShowcase(showcasePotId: number): void {
  if (moveFromShowcase(state, showcasePotId)) {
    checkAchAndSave(state)
    render()
  }
}

export function handleSwapGardenPot(potId: number): void {
  if (swapGardenPotId === null) {
    swapGardenPotId = potId
    render()
    return
  }
  if (swapGardenPotId === potId) {
    swapGardenPotId = null
    render()
    return
  }
  if (breedState.breedSelA === swapGardenPotId || breedState.breedSelA === potId) {
    breedState.breedSelA = null; breedState.breedEstimate = null
  }
  if (breedState.breedSelB === swapGardenPotId || breedState.breedSelB === potId) {
    breedState.breedSelB = null; breedState.breedEstimate = null
  }
  swapGardenPots(state, swapGardenPotId, potId)
  swapGardenPotId = null
  checkAchAndSave(state)
  render()
}

export function handleSwapShowcasePot(potId: number): void {
  if (swapShowcasePotId === null) {
    swapShowcasePotId = potId
    render()
    return
  }
  if (swapShowcasePotId === potId) {
    swapShowcasePotId = null
    render()
    return
  }
  swapShowcasePots(state, swapShowcasePotId, potId)
  swapShowcasePotId = null
  checkAchAndSave(state)
  render()
}

export function handleSell(potId: number): void {
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }

  const pot = state.pots.find(p => p.id === potId)
  const sellBtn = document.querySelector(`[data-action="sell"][data-pot="${potId}"]`) as HTMLElement | null

  // Capture plant before it is removed, then check orders
  const plant = pot?.plant ?? null
  const bonus = plant ? applyOrdersOnSell(state, plant) : 0

  const reward = sellPlant(state, potId)
  if (reward >= 0) {
    state.coins += bonus
    const total = reward + bonus
    showMsg(bonus > 0 ? t.msgSoldWithBonus(total, bonus) : t.msgSold(total))
    if (sellBtn) spawnCoinFly(sellBtn, total)
    checkAchAndSave(state)
    render()
  }
}

export function handleSellSeed(seedId: string, fromEl: HTMLElement): void {
  const reward = sellSeedFromStorage(state, seedId)
  if (reward >= 0) {
    showMsg(t.msgSeedSold(reward))
    spawnCoinFly(fromEl, reward)
    checkAchAndSave(state)
    render()
  }
}

function spawnSeedFly(fromEl: HTMLElement): void {
  const rect = fromEl.getBoundingClientRect()
  const el = document.createElement('div')
  el.className = 'seed-fly'
  el.innerHTML = renderSeedIcon(18)
  el.style.left = `${rect.left + rect.width / 2}px`
  el.style.top  = `${rect.top}px`
  document.body.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}

function spawnCoinFly(fromEl: HTMLElement, amount: number): void {
  const rect = fromEl.getBoundingClientRect()
  const coin = document.createElement('div')
  coin.className = 'coin-fly'
  coin.innerHTML = `+${amount} ${COIN_ICON}`
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
  if (isOnCooldown(pot.plant)) return

  showSelfPollinateDialog(potId)
}

function showSelfPollinateDialog(potId: number): void {
  // Remove any existing dialog
  document.getElementById('selfpollinate-dialog')?.remove()

  const sourceBtn = document.querySelector<HTMLElement>(`[data-action="sell"][data-pot="${potId}"]`)

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
    executeSelfPollinate(potId, sourceBtn)
  })
}

function executeSelfPollinate(potId: number, sourceBtn?: HTMLElement | null): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant) return

  const child = selfPollinateePlant(pot.plant)
  child.selfed = true

  if (
    hasUpgrade(state, 'unlock_seed_drawer') &&
    Math.random() < SELF_POLLINATE_SURPLUS_SEED_CHANCE &&
    state.seeds.length < MAX_SEED_STORAGE
  ) {
    const surplusSeed = selfPollinateePlant(pot.plant)
    surplusSeed.selfed = true
    addSeedToStorage(state, surplusSeed)
    showMsg(t.surplusSeedObtained)
    if (sourceBtn) spawnSeedFly(sourceBtn)
  }

  // Clear the parent from breeding selection if needed
  if (breedState.breedSelA === potId) { breedState.breedSelA = null; breedState.breedEstimate = null }
  if (breedState.breedSelB === potId) { breedState.breedSelB = null; breedState.breedEstimate = null }

  // Remove parent plant (it is consumed) and place child in the same pot
  removePlant(state, potId)
  pot.plant      = child
  pot.phaseStart = Date.now()

  checkAchAndSave(state)
  render()
}

export function formatCooldownRemaining(until: number): string {
  const ms = until - Date.now()
  if (ms <= 0) return ''
  const totalMin = Math.ceil(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatCooldownShort(until: number): string {
  const ms = until - Date.now()
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3_600_000)
  if (h >= 1) return `${h}h`
  return `${Math.ceil(ms / 60_000)}m`
}

export function isOnCooldown(plant: { breedCooldownUntil?: number }): boolean {
  return (plant.breedCooldownUntil ?? 0) > Date.now()
}

export function handleCraftSingleSeed(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
  if (!potA?.plant || !potB?.plant) return
  if (isOnCooldown(potA.plant) || isOnCooldown(potB.plant)) return
  if ((potA.plant.surplusSeedsProduced ?? 0) >= MAX_SURPLUS_SEEDS_PER_PLANT) return
  if ((potB.plant.surplusSeedsProduced ?? 0) >= MAX_SURPLUS_SEEDS_PER_PLANT) return
  if (state.seeds.length >= MAX_SEED_STORAGE) return

  executeCraftSingleSeed()
}

function executeCraftSingleSeed(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
  if (!potA?.plant || !potB?.plant) return

  const seed = breedPlants(potA.plant, potB.plant)
  addSeedToStorage(state, seed)

  potA.plant.surplusSeedsProduced = (potA.plant.surplusSeedsProduced ?? 0) + 1
  potB.plant.surplusSeedsProduced = (potB.plant.surplusSeedsProduced ?? 0) + 1
  const cooldownUntil = Date.now() + SEED_CRAFT_COOLDOWN_MS
  potA.plant.breedCooldownUntil = cooldownUntil
  potB.plant.breedCooldownUntil = cooldownUntil

  showMsg(t.craftSeedObtained(1))
  checkAchAndSave(state)
  render()
}

export function handleCraftMultipleSeeds(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
  if (!potA?.plant || !potB?.plant) return
  if (isOnCooldown(potA.plant) || isOnCooldown(potB.plant)) return
  if (state.seeds.length + MULTI_SEED_COUNT_MIN > MAX_SEED_STORAGE) return

  showCraftMultiSeedDialog()
}

function showCraftMultiSeedDialog(): void {
  document.getElementById('craft-multi-seed-dialog')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'craft-multi-seed-dialog'
  overlay.className = 'dialog-overlay'
  overlay.innerHTML = `
    <div class="dialog-box">
      <p class="dialog-title">${t.craftMultiSeedConfirmTitle}</p>
      <p class="dialog-text">${t.craftMultiSeedConfirmText}</p>
      <p class="dialog-warning">⚠ ${t.craftMultiSeedWarning}</p>
      <div class="dialog-actions">
        <button class="btn" id="craft-multi-seed-cancel">${t.craftMultiSeedCancel}</button>
        <button class="btn btn-confirm" id="craft-multi-seed-confirm">${t.craftMultiSeedConfirm}</button>
      </div>
    </div>`

  document.body.appendChild(overlay)
  document.getElementById('craft-multi-seed-cancel')?.addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  document.getElementById('craft-multi-seed-confirm')?.addEventListener('click', () => {
    overlay.remove()
    executeCraftMultipleSeeds()
  })
}

function executeCraftMultipleSeeds(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
  if (!potA?.plant || !potB?.plant) return

  const count = MULTI_SEED_COUNT_MIN + Math.floor(Math.random() * (MULTI_SEED_COUNT_MAX - MULTI_SEED_COUNT_MIN + 1))
  for (let i = 0; i < count; i++) {
    if (state.seeds.length >= MAX_SEED_STORAGE) break
    addSeedToStorage(state, breedPlants(potA.plant, potB.plant))
  }

  const potIdA = breedState.breedSelA
  const potIdB = breedState.breedSelB
  breedState.breedSelA = null
  breedState.breedSelB = null
  breedState.breedEstimate = null
  removePlant(state, potIdA)
  removePlant(state, potIdB)

  showMsg(t.craftSeedObtained(count))
  checkAchAndSave(state)
  render()
}

function handleBreed(): void {
  if (breedState.breedSelA === null || breedState.breedSelB === null) return
  const potA = state.pots.find(p => p.id === breedState.breedSelA)
  const potB = state.pots.find(p => p.id === breedState.breedSelB)
  if (!potA?.plant || !potB?.plant) return
  if (isOnCooldown(potA.plant) || isOnCooldown(potB.plant)) return

  const child = breedPlants(potA.plant, potB.plant)
  const placed = placeSeedInEmptyPot(state, child)
  if (placed === null) {
    showMsg(t.breedNoSpace)
    return
  }

  if (
    hasUpgrade(state, 'unlock_seed_drawer') &&
    Math.random() < SURPLUS_SEED_CHANCE &&
    state.seeds.length < MAX_SEED_STORAGE &&
    (potA.plant.surplusSeedsProduced ?? 0) < MAX_SURPLUS_SEEDS_PER_PLANT &&
    (potB.plant.surplusSeedsProduced ?? 0) < MAX_SURPLUS_SEEDS_PER_PLANT
  ) {
    const surplusSeed = breedPlants(potA.plant, potB.plant)
    addSeedToStorage(state, surplusSeed)
    potA.plant.surplusSeedsProduced = (potA.plant.surplusSeedsProduced ?? 0) + 1
    potB.plant.surplusSeedsProduced = (potB.plant.surplusSeedsProduced ?? 0) + 1
    showMsg(t.surplusSeedObtained)
    const breedBtn = document.getElementById('breed-btn')
    if (breedBtn) spawnSeedFly(breedBtn)
  }

  checkAchAndSave(state)
  render()
}

export function handleMoveSeedToSlot(seedId: string, targetSlotIdx: number): void {
  moveSeedToSlot(state, seedId, targetSlotIdx)
  saveState(state)
}

export function handleSetSlotLabel(slotIdx: number, labels: string[]): void {
  state.seedSlotLabels[slotIdx] = labels.slice(0, 2)
  saveState(state)
}

export function handlePlantSeedFromStorage(potId: number, seedId: string): void {
  const seed = removeSeedFromStorage(state, seedId)
  if (!seed) return
  if (!placeSeedInSpecificPot(state, seed, potId)) {
    state.seeds.push(seed)
    return
  }
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
}export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(t.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
}

