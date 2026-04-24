import { getPhaseProgress, PHASE_DURATION_MS } from '../engine/game';
import { state, handlePlantSeed, handleRemove, handleSell, handleBreedSelect, handleSelfPollinate, handleMoveToShowcase, openAlleleIds, hasUpgrade, openPotDesignIds } from './ui';
import { t } from '../model/i18n';
import type { Pot } from '../model/plant';
import { coinValueForScore } from '../engine/game';
import { calcCoinScore, getRarityForPot } from '../engine/rarity';
import { attachPotDesignRing, showAlleleOverlay, showPotDesignRing } from './pots_overlay_ui';
import { buildPlantViewForPot, buildPotHeader, getBloomingLabel } from './pots_utils';

const SELL_CONFIRM_TIMEOUT_MS = 2500;
const sellPendingPots = new Set<number>();
const sellPendingTimers = new Map<number, ReturnType<typeof setTimeout>>();

function armSellButton(potId: number, btn: HTMLElement): void {
  cancelSellPending(potId);
  sellPendingPots.add(potId);
  btn.classList.add('sell-pending');
  btn.title = t.btnSellConfirmTitle;
  const timer = setTimeout(() => {
    sellPendingPots.delete(potId);
    sellPendingTimers.delete(potId);
    const el = document.querySelector<HTMLElement>(`[data-action="sell"][data-pot="${potId}"]`);
    if (el) {
      el.classList.remove('sell-pending');
      el.title = t.btnSellTitle;
    }
  }, SELL_CONFIRM_TIMEOUT_MS);
  sellPendingTimers.set(potId, timer);
}

function cancelSellPending(potId: number): void {
  const timer = sellPendingTimers.get(potId);
  if (timer !== undefined) clearTimeout(timer);
  sellPendingTimers.delete(potId);
  sellPendingPots.delete(potId);
}

const PHASE_LABEL = (pot: Pot): string => {
  if (!pot.plant) return t.phaseEmpty;
  switch (pot.plant.phase) {
    case 1: return t.phaseSeed;
    case 2: return t.phaseSprout;
    case 3: return t.phaseBud;
    case 4: return t.phaseBloom(`${t.rarity[rarity(pot)]} · Gen. ${pot.plant.generation}`);
    default: return '';
  }
};

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
  const r = getRarityForPot(state, pot);

  card.className = [
    'pot-card',
    isSelected ? 'selected' : '',
    isBlooming && !isSelected ? 'blooming' : '',
    isBlooming ? `rarity-${r}` : ''
  ].filter(Boolean).join(' ');

  let headerHtml = buildPotHeader(pot, state)
  let plantHtml = buildPlantViewForPot(pot, state)

  // ── Phase label + progress ──
  let progressHtml = '';
  let labelHtml: string;
  if (pot.plant && pot.plant.phase < 4) {
    const progress = getPhaseProgress(pot);
    const pct = (progress * 100).toFixed(2);
    const currentPhaseRemainingMs = PHASE_DURATION_MS[pot.plant.phase] * (1 - progress);
    const laterPhasesMs = Object.entries(PHASE_DURATION_MS)
      .filter(([p]) => Number(p) > pot.plant!.phase)
      .reduce((sum, [, dur]) => sum + dur, 0);
    const remainingMs = currentPhaseRemainingMs + laterPhasesMs;
    const remainingMin = Math.ceil(remainingMs / 60_000);
    const timeLabel = remainingMin < 1 ? t.phaseAlmostDone : t.phaseTimeLeft(remainingMin);
    labelHtml = `<p class="phase-label">${PHASE_LABEL(pot)} · <span class="phase-pct">${timeLabel}</span></p>`;
    progressHtml = `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  } else if (isBlooming && pot.plant) {
    labelHtml = getBloomingLabel(pot, state)
  } else {
    labelHtml = `<p class="phase-label">${PHASE_LABEL(pot)}</p>`;
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
    const coinVal = coinValueForScore(calcCoinScore(pot.plant));
    const selfPurchased = hasUpgrade(state, 'unlock_selfpollinate');
    const showcasePurchased = hasUpgrade(state, 'unlock_showcase');
    const showcaseHasSpace = showcasePurchased && state.showcase.some(p => !p.plant);
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm btn-breed${isBreedSelected ? ' selected' : ''}" data-action="breed-select" data-pot="${pot.id}">
          ${isBreedSelected ? t.btnBreedDeselect : t.btnBreedSelect}
        </button>
        ${selfPurchased ? `<button class="btn-sm btn-icon" data-action="selfpollinate" data-pot="${pot.id}" title="${t.selfPollinateTitle}">↺</button>` : ''}
        ${showcaseHasSpace ? `<button class="btn-sm btn-icon" data-action="showcase" data-pot="${pot.id}" title="${t.btnMoveToShowcaseTitle}">${t.btnMoveToShowcase}</button>` : ''}
        <button class="btn-sm btn-icon btn-sell${sellPendingPots.has(pot.id) ? ' sell-pending' : ''}" data-action="sell" data-pot="${pot.id}" title="${sellPendingPots.has(pot.id) ? t.btnSellConfirmTitle : t.btnSellTitle}">🪙${coinVal}</button>
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
    else if (action === 'sell') {
      if (sellPendingPots.has(potId)) {
        cancelSellPending(potId);
        handleSell(potId);
      } else {
        armSellButton(potId, btn);
      }
    }
    else if (action === 'breed-select')   handleBreedSelect(potId);
    else if (action === 'selfpollinate')  handleSelfPollinate(potId);
    else if (action === 'showcase')       handleMoveToShowcase(potId);
    else if (action === 'allele-inspect') showAlleleOverlay(potId, card);
    else if (action === 'pot-design')     showPotDesignRing(potId, card);
  });

  // Restore design ring if it was open before this re-render
  if (openPotDesignIds.has(pot.id)) {
    attachPotDesignRing(pot.id, card, true);
  }

  return card;
}


