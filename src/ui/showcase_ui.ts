import { renderPlantSVG } from '../engine/renderer/renderer'
import { RARITY_COLORS } from '../engine/game'
import { isHomozygous } from '../engine/genetic/genetic_utils'
import { state, handleMoveFromShowcase, hasUpgrade, openAlleleIds, openPotDesignIds } from './ui'
import { t } from '../model/i18n'
import type { Pot, Rarity } from '../model/plant'
import { getCatalogEntryForPlant } from '../engine/catalog'
import { showAlleleOverlay, showPotDesignRing, attachPotDesignRing } from './pots_overlay_ui'

const RARITY_ICON: Record<number, string> = {
  0: '▪', 1: '●', 2: '♦', 3: '★', 4: '👑',
}

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
  const r = rarity(pot)

  card.className = [
    'pot-card',
    isBlooming ? 'blooming' : '',
    isBlooming ? `rarity-${r}` : '',
  ].filter(Boolean).join(' ')

  // ── Header ──
  const hasCosmetics = (state.unlockedPotColors?.length ?? 0) > 0 || (state.unlockedPotShapes?.length ?? 0) > 0
  let headerHtml = '<div class="pot-card-header">'
  if (isBlooming && pot.plant) {
    if (isHomozygous(pot.plant)) {
      headerHtml += `<span class="pot-homozygous-badge" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`
    }
    headerHtml += `<span class="pot-rarity-dot" style="color:${RARITY_COLORS[r]}" title="${t.rarity[r]}">${RARITY_ICON[r]}</span>`
  }
  if (hasCosmetics) {
    headerHtml += `<button class="pot-design-btn" data-action="pot-design" data-pot="${pot.id}" title="${t.potDesignBtnTitle}">🎨</button>`
  }
  headerHtml += '</div>'

  // ── Plant view ──
  const lupePurchased = hasUpgrade(state, 'unlock_lupe')
  let plantHtml: string
  if (isBlooming && pot.plant) {
    plantHtml = `
      <div class="plant-view plant-view--interactive">
        ${renderPlantSVG(pot.plant, 100, 130, pot.design)}
        ${lupePurchased ? `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>` : ''}
      </div>`
  } else {
    plantHtml = `<div class="plant-view">${renderPlantSVG(null, 100, 130, pot.design)}</div>`
  }

  // ── Label ──
  const labelHtml = isBlooming && pot.plant
    ? `<p class="phase-label">${t.rarity[r]} · Gen. ${pot.plant.generation}</p>`
    : `<p class="phase-label">${t.phaseEmpty}</p>`

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

  card.innerHTML = headerHtml + plantHtml + labelHtml + buttonsHtml

  card.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
    if (!btn) return
    const action = btn.dataset.action
    const potId = Number(btn.dataset.pot)
    if      (action === 'move-from-showcase') handleMoveFromShowcase(potId)
    else if (action === 'allele-inspect')     showAlleleOverlay(potId, card)
    else if (action === 'pot-design')         showPotDesignRing(potId, card)
  })

  if (openPotDesignIds.has(pot.id)) {
    attachPotDesignRing(pot.id, card, true)
  }

  return card
}
