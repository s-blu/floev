import { getPhaseProgress, RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { expressedColor, expressedShape, expressedGradient, expressedNumber, expressedCenter } from '../engine/genetic.utils';
import { calcRarity } from '../engine/rarity';
import { renderPlantSVG } from '../engine/renderer/renderer';
import type { Pot } from '../model/plant';
import { state, handlePlantSeed, handleBreedSelect, handleRemove } from './ui';
import { t } from '../model/i18n';

// ─── Rarity icon map (same as encyclopedia) ───────────────────────────────────
const RARITY_ICON: Record<number, string> = {
  0: '▪', 1: '●', 2: '♦', 3: '★', 4: '👑',
};

const CENTER_ICONS: Record<string, string> = { dot: '·', disc: '◉', stamen: '✾' };

// ─── Plant name helper ────────────────────────────────────────────────────────
/**
 * Returns the catalog entry number for a plant, or null if not yet in the catalog.
 * Used to show "Blüte 3" instead of "Blüte" as phase label.
 */
function getPlantName(plantId: string): string {
  const allSorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered);
  const idx = allSorted.findIndex(e => e.plant.id === plantId);
  if (idx === -1) return t.phaseBloom('Blüte'); // freshly bloomed, not yet indexed
  return t.catalogEntryName(idx + 1);
}

// ─── Pots ─────────────────────────────────────────────────────────────────────
export function renderPots(breedSelA: number | null, breedSelB: number | null): void {
  const row = document.getElementById('pots-row');
  if (!row) return;
  row.innerHTML = '';

  for (const pot of state.pots) {
    const isSel = breedSelA === pot.id || breedSelB === pot.id;
    const isBlooming = pot.plant?.phase === 4;

    const card = document.createElement('div');
    card.className = [
      'pot-card',
      isSel ? 'selected' : '',
      isBlooming ? 'blooming' : '',
    ].filter(Boolean).join(' ');

    // Rarity dot – top-right corner, only when blooming
    const rarityDot = isBlooming && pot.plant
      ? renderRarityDot(pot)
      : '';

    const traitHtml = isBlooming && pot.plant
      ? renderTraitInfo(pot)
      : '';

    const btns = renderPotButtons(pot, isBlooming, isSel);
    const progressHtml = renderPlantProgress(pot);

    card.innerHTML = `
      <div class="pot-card-header">
        ${rarityDot}
      </div>
      <div class="plant-view">${renderPlantSVG(pot.plant, 100, 130)}</div>
      ${progressHtml}
      ${traitHtml}
      <div class="btn-row">${btns}</div>`;

    row.appendChild(card);
  }

  row.onclick = (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const potId = Number(btn.dataset.pot);
    if (action === 'plant') handlePlantSeed(potId);
    if (action === 'breed-select') handleBreedSelect(potId);
    if (action === 'remove') handleRemove(potId);
  };
}

function renderRarityDot(pot: Pot): string {
  if (!pot.plant) return '';
  const rarity = calcRarity(pot.plant);
  const color = RARITY_COLORS[rarity];
  const icon = RARITY_ICON[rarity];
  const label = RARITY_LABELS[rarity];
  return `<span class="pot-rarity-dot" style="color:${color}" title="${label}">${icon}</span>`;
}

function renderPlantProgress(pot: Pot): string {
  const prog = getPhaseProgress(pot);

  let phaseLabel: string;
  if (!pot.plant) {
    phaseLabel = t.phaseEmpty;
  } else if (pot.plant.phase === 1) {
    phaseLabel = t.phaseSeed;
  } else if (pot.plant.phase === 2) {
    phaseLabel = t.phaseSprout;
  } else if (pot.plant.phase === 3) {
    phaseLabel = t.phaseBud;
  } else {
    // Phase 4: show the plant's name from the catalog
    phaseLabel = getPlantName(pot.plant.id);
  }

  const isGrowing = pot.plant && pot.plant.phase > 0 && pot.plant.phase < 4;
  return `
    <span class="phase-label">${phaseLabel}${isGrowing ? ' ' + Math.round(prog * 100) + '%' : ''}</span>
    ${isGrowing
      ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.round(prog * 100)}%"></div></div>`
      : ''}`;
}

function renderPotButtons(pot: Pot, isBlooming: boolean, isSel: boolean): string {
  let btns = '';
  if (!pot.plant) {
    btns += `<button class="btn-sm" data-action="plant" data-pot="${pot.id}">${t.btnPlant}</button>`;
  }
  if (isBlooming) {
    btns += `<button class="btn-sm" data-action="breed-select" data-pot="${pot.id}">${isSel ? t.btnBreedDeselect : t.btnBreedSelect}</button>`;
  }
  if (pot.plant) {
    btns += `<button class="btn-sm danger" data-action="remove" data-pot="${pot.id}">${t.btnRemove}</button>`;
  }
  return btns;
}

function renderTraitInfo(pot: Pot): string {
  if (!pot?.plant) return '';
  const pc = expressedColor(pot.plant.petalHue, pot.plant.petalLightness);
  const shape = expressedShape(pot.plant.petalShape);
  const hasGrad = expressedGradient(pot.plant.gradientColor) !== null;
  const count = Math.round(expressedNumber(pot.plant.petalCount));
  const center = expressedCenter(pot.plant.centerType);

  return `
    <div class="trait-row">
      <span class="trait-pill" style="background:hsl(${Math.round(pc.h)},40%,88%);color:hsl(${Math.round(pc.h)},55%,30%)">${count}× ${shape}</span>
      <span class="trait-pill">${CENTER_ICONS[center] ?? center}</span>
      ${hasGrad ? `<span class="trait-pill">${t.traitGradient}</span>` : ''}
    </div>`;
}
