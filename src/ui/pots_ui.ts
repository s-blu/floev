import { getPhaseProgress, PHASE_DURATION_MS } from '../engine/game';
import { state, handlePlantSeed, handleRemove, handleSell, handleBreedSelect, handleSelfPollinate, handleMoveToShowcase, openAlleleIds, hasUpgrade, openPotDesignIds } from './ui';
import { openSeedDrawer } from './seeds_ui';
import { t } from '../model/i18n';
import type { Pot } from '../model/plant';
import { coinValueForScore } from '../engine/game';
import { calcCoinScore, getRarityForPot } from '../engine/rarity';
import { attachPotDesignRing, showAlleleOverlay, showPotDesignRing } from './pots_overlay_ui';
import { buildPotVisualArea, buildPotSill } from './pots_utils';

const SELL_CONFIRM_TIMEOUT_MS = 2500;
const sellPendingPots = new Set<number>();
const sellPendingTimers = new Map<number, ReturnType<typeof setTimeout>>();
const overflowOpenPots = new Set<number>();

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

function showOverflowMenu(potId: number, card: HTMLElement, selfPollinate: boolean, showcaseAvail: boolean): void {
  const wrap = card.querySelector('.overflow-wrap') as HTMLElement | null;
  if (!wrap) return;
  const menu = document.createElement('div');
  menu.className = 'overflow-menu';
  if (selfPollinate) {
    const b = document.createElement('button');
    b.className = 'btn-sm btn-icon';
    b.dataset.action = 'selfpollinate';
    b.dataset.pot = String(potId);
    b.title = t.selfPollinateTitle;
    b.textContent = '↺';
    menu.appendChild(b);
  }
  if (showcaseAvail) {
    const b = document.createElement('button');
    b.className = 'btn-sm btn-icon';
    b.dataset.action = 'showcase';
    b.dataset.pot = String(potId);
    b.title = t.btnMoveToShowcaseTitle;
    b.textContent = t.btnMoveToShowcase;
    menu.appendChild(b);
  }
  wrap.appendChild(menu);
  overflowOpenPots.add(potId);
}

function closeAllOverflowMenus(): void {
  document.querySelectorAll('.overflow-menu').forEach(m => m.remove());
  overflowOpenPots.clear();
}

const PHASE_LABEL = (pot: Pot): string => {
  if (!pot.plant) return t.phaseEmpty;
  switch (pot.plant.phase) {
    case 1: return t.phaseSeed;
    case 2: return t.phaseSprout;
    case 3: return t.phaseBud;
    case 4: return t.phaseBloom(`${t.rarity[getRarityForPot(state, pot)]} · Gen. ${pot.plant.generation}`);
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
    if (openAlleleIds.has(pot.id) && pot.plant?.phase === 4) {
      showAlleleOverlay(pot.id, card, /* silent */ true);
    }
    if (overflowOpenPots.has(pot.id) && pot.plant?.phase === 4) {
      const selfPurchased = hasUpgrade(state, 'unlock_selfpollinate');
      const showcasePurchased = hasUpgrade(state, 'unlock_showcase');
      const showcaseHasSpace = showcasePurchased && state.showcase.some(p => !p.plant);
      if (selfPurchased && showcaseHasSpace) {
        showOverflowMenu(pot.id, card, true, true);
      } else {
        overflowOpenPots.delete(pot.id);
      }
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

  const visualAreaHtml = buildPotVisualArea(pot, state);
  const sillHtml = buildPotSill();

  // ── Phase label + progress (growing plants only; blooming info is in side panel) ──
  let progressHtml = '';
  let belowSillContent = '';
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
    belowSillContent = `<p class="phase-label">${PHASE_LABEL(pot)} · <span class="phase-pct">${timeLabel}</span></p>`;
    progressHtml = `<div class="progress-row"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><button class="btn-sm btn-cancel-grow danger" data-action="remove" data-pot="${pot.id}" title="${t.btnRemove}">${t.btnRemove}</button></div>`;
  }

  // ── Action buttons — single row ──
  let buttonsHtml = '';
  if (!pot.plant) {
    const hasSeedDrawer = hasUpgrade(state, 'unlock_seed_drawer') && state.seeds.length > 0;
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm" data-action="plant" data-pot="${pot.id}">${t.btnPlant}</button>
        ${hasSeedDrawer ? `<button class="btn-sm" data-action="plant-from-storage" data-pot="${pot.id}">${t.plantFromStorage}</button>` : ''}
      </div>`;
  } else if (isBlooming) {
    const isBreedSelected = pot.id === selA || pot.id === selB;
    const coinVal = coinValueForScore(calcCoinScore(pot.plant));
    const selfPurchased = hasUpgrade(state, 'unlock_selfpollinate');
    const showcasePurchased = hasUpgrade(state, 'unlock_showcase');
    const showcaseHasSpace = showcasePurchased && state.showcase.some(p => !p.plant);
    const hasBothSecondary = selfPurchased && showcaseHasSpace;
    const secondaryHtml = hasBothSecondary
      ? `<div class="overflow-wrap"><button class="btn-sm btn-icon" data-action="overflow-toggle" data-pot="${pot.id}" data-selfpollinate="1" data-showcase="1" title="${t.btnOverflowTitle}">···</button></div>`
      : selfPurchased
        ? `<button class="btn-sm btn-icon" data-action="selfpollinate" data-pot="${pot.id}" title="${t.selfPollinateTitle}">↺</button>`
        : showcaseHasSpace
          ? `<button class="btn-sm btn-icon" data-action="showcase" data-pot="${pot.id}" title="${t.btnMoveToShowcaseTitle}">${t.btnMoveToShowcase}</button>`
          : '';
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm btn-breed${isBreedSelected ? ' selected' : ''}" data-action="breed-select" data-pot="${pot.id}">
          ${isBreedSelected ? t.btnBreedDeselect : t.btnBreedSelect}
        </button>
        ${secondaryHtml}
        <button class="btn-sm btn-icon btn-sell${sellPendingPots.has(pot.id) ? ' sell-pending' : ''}" data-action="sell" data-pot="${pot.id}" title="${sellPendingPots.has(pot.id) ? t.btnSellConfirmTitle : t.btnSellTitle}">🪙${coinVal}</button>
      </div>`;
  }

  const belowSillHtml = `<div class="pot-below-sill">${belowSillContent}${progressHtml}${buttonsHtml}</div>`;
  card.innerHTML = visualAreaHtml + sillHtml + belowSillHtml;

  // ── Event delegation ──
  card.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.dataset.action;
    const potId = Number(btn.dataset.pot);

    if (action !== 'overflow-toggle') closeAllOverflowMenus();

    if      (action === 'plant')                handlePlantSeed(potId);
    else if (action === 'plant-from-storage')  openSeedDrawer(potId);
    else if (action === 'remove')              handleRemove(potId);
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
    else if (action === 'overflow-toggle') {
      if (overflowOpenPots.has(potId)) {
        closeAllOverflowMenus();
      } else {
        closeAllOverflowMenus();
        showOverflowMenu(potId, card, !!btn.dataset.selfpollinate, !!btn.dataset.showcase);
      }
    }
    else if (action === 'allele-inspect') showAlleleOverlay(potId, card);
    else if (action === 'pot-design')     showPotDesignRing(potId, card);
  });

  // Restore design ring if it was open before this re-render
  if (openPotDesignIds.has(pot.id)) {
    attachPotDesignRing(pot.id, card, false);
  }

  return card;
}
