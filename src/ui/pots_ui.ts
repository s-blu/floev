import { renderPlantSVG } from '../engine/renderer/renderer';
import { getPhaseProgress, RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { state, handlePlantSeed, handleRemove, handleSell, handleBreedSelect, handleSelfPollinate, openAlleleIds, hasUpgrade, openPotDesignIds } from './ui';
import { t } from '../model/i18n';
import type { Pot } from '../model/plant';
import { coinValueForScore } from '../engine/game';
import { attachPotDesignRing, showAlleleOverlay, showPotDesignRing } from './pots_overlay_ui';
import { getCatalogEntryForPlant } from '../engine/catalog';

const RARITY_ICON: Record<number, string> = {
  0: '▪', 1: '●', 2: '♦', 3: '★', 4: '👑',
};

const PHASE_LABEL = (pot: Pot): string => {
  if (!pot.plant) return t.phaseEmpty;
  switch (pot.plant.phase) {
    case 1: return t.phaseSeed;
    case 2: return t.phaseSprout;
    case 3: return t.phaseBud;
    case 4: return t.phaseBloom(`${RARITY_LABELS[rarity(pot)]} · Gen. ${pot.plant.generation}`);
    default: return '';
  }
};

function rarity(pot: Pot): number {
  if (!pot.plant) return 0;
  const entry = getCatalogEntryForPlant(state, pot.plant)
  return entry?.rarity ?? 0;
}

export function renderPots(selA: number | null, selB: number | null): void {
  const container = document.getElementById('pots-row');
  if (!container) return;

  container.innerHTML = '';
  for (const pot of state.pots) {
    const card = buildPotCard(pot, selA, selB);
    container.appendChild(card);
    // Restore overlay if it was open before this re-render
    if (openAlleleIds.has(pot.id) && pot.plant?.phase === 4) {
      showAlleleOverlay(pot.id, card, /* silent */ true);
    }
  }
}

function buildPotCard(pot: Pot, selA: number | null, selB: number | null): HTMLElement {
  const card = document.createElement('div');
  const isSelected = pot.id === selA || pot.id === selB;
  const isBlooming = pot.plant?.phase === 4;
  const r = rarity(pot);

  card.className = [
    'pot-card',
    isSelected ? 'selected' : '',
    isBlooming && !isSelected ? 'blooming' : '',
    isBlooming ? `rarity-${r}` : ''
  ].filter(Boolean).join(' ');

  // ── Header: badges anchored top-left / top-right ──
  const hasCosmetics = (state.unlockedPotColors?.length ?? 0) > 0 || (state.unlockedPotShapes?.length ?? 0) > 0
  let headerHtml = '<div class="pot-card-header">';
  if (isBlooming && pot.plant) {
    const homozyg = isHomozygous(pot.plant);
    if (homozyg) {
      headerHtml += `<span class="pot-homozygous-badge" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`;
    }
    headerHtml += `<span class="pot-rarity-dot" style="color:${RARITY_COLORS[r]}" title="${RARITY_LABELS[r]}">${RARITY_ICON[r]}</span>`;
  }
  if (hasCosmetics) {
    headerHtml += `<button class="pot-design-btn" data-action="pot-design" data-pot="${pot.id}" title="Topf-Design ändern">🎨</button>`;
  }
  headerHtml += '</div>';

  // ── Plant view — magnifier button only for blooming plants with lupe upgrade ──
  let plantHtml: string;
  const lupePurchased = hasUpgrade(state, 'unlock_lupe');
  if (isBlooming && pot.plant) {
    plantHtml = `
      <div class="plant-view plant-view--interactive">
        ${renderPlantSVG(pot.plant, 100, 130, pot.design)}
        ${lupePurchased ? `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>` : ''}
      </div>`;
  } else {
    plantHtml = `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130, pot.design)}</div>`;
  }

  // ── Phase label ──
  const labelHtml = `<p class="phase-label">${PHASE_LABEL(pot)}</p>`;

  // ── Progress bar ──
  let progressHtml = '';
  if (pot.plant && pot.plant.phase < 4) {
    const pct = Math.round(getPhaseProgress(pot) * 100);
    progressHtml = `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  }

  // ── Action buttons — single row ──
  let buttonsHtml = '';
  if (!pot.plant) {
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm" data-action="plant" data-pot="${pot.id}">${t.btnPlant}</button>
      </div>`;
  } else if (isBlooming) {
    const isBreedSelected = pot.id === selA || pot.id === selB;
    const entry = getCatalogEntryForPlant(state, pot.plant)
    const coinVal = coinValueForScore(entry?.rarityScore ?? 1);
    const selfPurchased = hasUpgrade(state, 'unlock_selfpollinate');
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm btn-breed${isBreedSelected ? ' selected' : ''}" data-action="breed-select" data-pot="${pot.id}">
          ${isBreedSelected ? t.btnBreedDeselect : t.btnBreedSelect}
        </button>
        ${selfPurchased ? `<button class="btn-sm btn-icon" data-action="selfpollinate" data-pot="${pot.id}" title="${t.selfPollinateTitle}">↺</button>` : ''}
        <button class="btn-sm btn-icon btn-sell" data-action="sell" data-pot="${pot.id}" title="${t.btnSellTitle}">🪙${coinVal}</button>
      </div>`;
  } else {
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm danger" data-action="remove" data-pot="${pot.id}">${t.btnRemove}</button>
      </div>`;
  }

  card.innerHTML = headerHtml + plantHtml + labelHtml + progressHtml + buttonsHtml;

  // ── Event delegation ──
  card.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.dataset.action;
    const potId = Number(btn.dataset.pot);
    if      (action === 'plant')          handlePlantSeed(potId);
    else if (action === 'remove')         handleRemove(potId);
    else if (action === 'sell')           handleSell(potId);
    else if (action === 'breed-select')   handleBreedSelect(potId);
    else if (action === 'selfpollinate')  handleSelfPollinate(potId);
    else if (action === 'allele-inspect') showAlleleOverlay(potId, card);
    else if (action === 'pot-design')     showPotDesignRing(potId, card);
  });

  // Restore design ring if it was open before this re-render
  if (openPotDesignIds.has(pot.id)) {
    attachPotDesignRing(pot.id, card, true);
  }

  return card;
}


