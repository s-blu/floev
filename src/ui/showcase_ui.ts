import { state, handleMoveFromShowcase, handleSwapShowcasePot, hasUpgrade, openAlleleIds, openPotDesignIds, swapShowcasePotId } from './ui'
import { t } from '../model/i18n'
import type { Pot } from '../model/plant'
import { type Rarity } from "../model/rarity_model"
import { getCatalogEntryForPlant } from '../engine/catalog'
import { showAlleleOverlay, showPotDesignRing, attachPotDesignRing } from './pots_overlay_ui'
import { buildPotVisualArea, buildPotSill } from './pots_utils'


function rarity(pot: Pot): Rarity {
  if (!pot.plant) return 0
  const entry = getCatalogEntryForPlant(state, pot.plant)
  return entry?.rarity ?? 0
}

export function renderShowcase(): void {
  const section = document.getElementById('showcase-section')
  if (!section) return

  const hasShowcase = hasUpgrade(state, 'unlock_showcase')
  section.style.display = hasShowcase ? '' : 'none'
  if (!hasShowcase) return

  const container = document.getElementById('showcase-row')
  if (!container) return

  container.innerHTML = ''
  for (const pot of state.showcase) {
    const card = buildShowcasePotCard(pot)
    container.appendChild(card)
    if (openAlleleIds.has(pot.id) && pot.plant) {
      showAlleleOverlay(pot.id, card, /* silent */ true)
    }
  }
}

function buildShowcasePotCard(pot: Pot): HTMLElement {
  const card = document.createElement('div')
  const isBlooming = !!pot.plant
  const isSwapSelected = pot.id === swapShowcasePotId
  const r = rarity(pot)

  card.className = [
    'pot-card',
    isSwapSelected ? 'swap-selected' : '',
    isBlooming ? 'blooming' : '',
    isBlooming ? `rarity-${r}` : '',
  ].filter(Boolean).join(' ')

  const swapBtnHtml = `<div class="pot-right-btns"><button class="pot-swap-btn${isSwapSelected ? ' active' : ''}" data-action="swap" data-pot="${pot.id}" title="${isSwapSelected ? t.btnSwapPotCancel : t.btnSwapPotTitle}">⇄</button></div>`
  const visualAreaHtml = buildPotVisualArea(pot, state, swapBtnHtml)
  const sillHtml = buildPotSill()

  // ── Buttons ──
  let buttonsHtml = ''
  if (isBlooming) {
    const hasFreePot = state.pots.some(p => !p.plant)
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm" data-action="move-from-showcase" data-pot="${pot.id}"
          ${!hasFreePot ? 'disabled' : ''}
          title="${!hasFreePot ? t.showcaseNoFreePot : t.btnMoveFromShowcaseTitle}">
          ${t.btnMoveFromShowcase}
        </button>
      </div>`
  }

  card.innerHTML = visualAreaHtml + sillHtml + `<div class="pot-below-sill">${buttonsHtml}</div>`

  card.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
    if (!btn) {
      if (swapShowcasePotId !== null) handleSwapShowcasePot(pot.id)
      return
    }
    const action = btn.dataset.action
    const potId = Number(btn.dataset.pot)
    if      (action === 'move-from-showcase') handleMoveFromShowcase(potId)
    else if (action === 'swap')               handleSwapShowcasePot(potId)
    else if (action === 'allele-inspect')     showAlleleOverlay(potId, card)
    else if (action === 'pot-design')         showPotDesignRing(potId, card)
  })

  if (openPotDesignIds.has(pot.id)) {
    attachPotDesignRing(pot.id, card, false)
  }

  return card
}
