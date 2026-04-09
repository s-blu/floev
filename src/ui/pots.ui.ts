import { getPhaseProgress, PHASE_LABELS, RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { expressedColor, expressedShape, expressedGradient, expressedNumber, expressedCenter } from '../engine/genetic.utils';
import { calcRarity } from '../engine/rarity';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { Pot } from '../model/plant';
import { state, handlePlantSeed, handleBreedSelect, handleRemove } from './ui';

// ─── Pots ─────────────────────────────────────────────────────────────────────
const CENTER_ICONS: Record<string, string> = { dot: '·', disc: '◉', stamen: '✾' };
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

    let traitHtml = '';
    if (isBlooming && pot.plant) {
      traitHtml = renderTraitInfo(pot, traitHtml);
    }

    let btns = renderPotButtons(pot, isBlooming, isSel);
    let progressHtml = renderPlantProgress(pot)

    card.innerHTML = `
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

function renderPlantProgress(pot: Pot) {

  const prog = getPhaseProgress(pot);
  const phaseLabel = PHASE_LABELS[pot.plant?.phase ?? 0];

  return `<span class="phase-label">${phaseLabel}${pot.plant && pot.plant.phase > 0 && pot.plant.phase < 4 ? ' ' + Math.round(prog * 100) + '%' : ''}</span>
      ${pot.plant && pot.plant.phase > 0 && pot.plant.phase < 4
      ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.round(prog * 100)}%"></div></div>`
      : ''}`
}

function renderPotButtons(pot: Pot, isBlooming: boolean, isSel: boolean) {
  let btns = '';
  if (!pot.plant) {
    btns += `<button class="btn-sm" data-action="plant" data-pot="${pot.id}">Pflanzen</button>`;
  }
  if (isBlooming) {
    btns += `<button class="btn-sm" data-action="breed-select" data-pot="${pot.id}">${isSel ? 'Abwählen' : 'Züchten'}</button>`;
  }
  if (pot.plant) {
    btns += `<button class="btn-sm danger" data-action="remove" data-pot="${pot.id}">✕</button>`;
  }
  return btns;
}

function renderTraitInfo(pot: Pot, traitHtml: string): string {
  if (!pot?.plant) return '';
  const pc = expressedColor(pot.plant.petalColor);
  const shape = expressedShape(pot.plant.petalShape);
  const hasGrad = expressedGradient(pot.plant.gradientColor) !== null;
  const count = Math.round(expressedNumber(pot.plant.petalCount));
  const center = expressedCenter(pot.plant.centerType);
  const rarity = calcRarity(pot.plant);
  const rarityColor = RARITY_COLORS[rarity];
  const rarityLabel = RARITY_LABELS[rarity];

  traitHtml = `
        <div class="trait-row">
          <span class="trait-pill" style="background:hsl(${Math.round(pc.h)},40%,88%);color:hsl(${Math.round(pc.h)},55%,30%)">${count}× ${shape}</span>
          <span class="trait-pill">${CENTER_ICONS[center] ?? center}</span>
          ${hasGrad ? '<span class="trait-pill">〜</span>' : ''}
        </div>
        <div class="trait-row">
          <span class="trait-pill rarity-pill" style="background:${rarityColor}22;color:${rarityColor};border:0.5px solid ${rarityColor}66">${rarityLabel}</span>
        </div>`;
  return traitHtml;
}

