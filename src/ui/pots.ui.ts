import { renderPlantSVG } from '../engine/renderer/renderer';
import { getPhaseProgress, RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { isHomozygous } from '../engine/genetic.utils';
import { state, handlePlantSeed, handleRemove, handleBreedSelect, handleSelfPollinate } from './ui';
import { t } from '../model/i18n';
import type { Pot } from '../model/plant';

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
  // Look up catalog entry for this plant to get its rarity
  const entry = state.catalog.find(e => e.plant.id === pot.plant!.id);
  return entry?.rarity ?? 0;
}

export function renderPots(selA: number | null, selB: number | null): void {
  const container = document.getElementById('pots-row');
  if (!container) return;

  container.innerHTML = '';

  for (const pot of state.pots) {
    container.appendChild(buildPotCard(pot, selA, selB));
  }
}

function buildPotCard(pot: Pot, selA: number | null, selB: number | null): HTMLElement {
  const card = document.createElement('div');
  const isSelected = pot.id === selA || pot.id === selB;
  const isBlooming = pot.plant?.phase === 4;

  card.className = [
    'pot-card',
    isSelected ? 'selected' : '',
    isBlooming && !isSelected ? 'blooming' : '',
  ].filter(Boolean).join(' ');

  // ── Rarity dot + homozygous badge (top-right corner) ──
  let headerHtml = '';
  if (pot.plant?.phase === 4) {
    const r = rarity(pot);
    const homozyg = isHomozygous(pot.plant);
    headerHtml = `
      <div class="pot-card-header">
        ${homozyg
          ? `<span class="pot-homozygous-badge" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`
          : ''}
        <span class="pot-rarity-dot" style="color:${RARITY_COLORS[r]}" title="${RARITY_LABELS[r]}">${RARITY_ICON[r]}</span>
      </div>`;
  } else {
    headerHtml = `<div class="pot-card-header"></div>`;
  }

  // ── Plant SVG ──
  const plantHtml = `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130)}</div>`;

  // ── Phase label ──
  const labelHtml = `<p class="phase-label">${PHASE_LABEL(pot)}</p>`;

  // ── Progress bar (only for growing phases) ──
  let progressHtml = '';
  if (pot.plant && pot.plant.phase < 4) {
    const pct = Math.round(getPhaseProgress(pot) * 100);
    progressHtml = `
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>`;
  }

  // ── Action buttons ──
  let buttonsHtml = '';
  if (!pot.plant) {
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm" data-action="plant" data-pot="${pot.id}">${t.btnPlant}</button>
      </div>`;
  } else if (pot.plant.phase === 4) {
    const isBreedSelected = pot.id === selA || pot.id === selB;
    buttonsHtml = `
      <div class="btn-row">
        <button class="btn-sm${isBreedSelected ? ' selected' : ''}" data-action="breed-select" data-pot="${pot.id}">
          ${isBreedSelected ? t.btnBreedDeselect : t.btnBreedSelect}
        </button>
        <button class="btn-sm danger" data-action="remove" data-pot="${pot.id}">${t.btnRemove}</button>
      </div>
      <div class="btn-row">
        <button class="btn-sm selfpollinate" data-action="selfpollinate" data-pot="${pot.id}" title="${t.selfPollinateTitle}">
          ${t.selfPollinateBtn}
        </button>
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
    if (action === 'plant')          handlePlantSeed(potId);
    else if (action === 'remove')    handleRemove(potId);
    else if (action === 'breed-select') handleBreedSelect(potId);
    else if (action === 'selfpollinate') handleSelfPollinate(potId);
  });

  return card;
}
