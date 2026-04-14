import { renderPlantSVG } from '../engine/renderer/renderer';
import { getPhaseProgress, RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { dominantLightness } from "../engine/genetic/dominance_utils";
import { dominantHue } from "../engine/genetic/dominance_utils";
import { dominantShape, dominantCenter } from "../engine/genetic/dominance_utils";
import { PALETTE_S } from '../model/genetic_model';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT } from '../model/genetic_model';
import { state, handlePlantSeed, handleRemove, handleSell, handleBreedSelect, handleSelfPollinate, openAlleleIds, hasUpgrade } from './ui';
import { t } from '../model/i18n';
import type { Pot, ChromaticL } from '../model/plant';
import { coinValueForScore } from '../engine/game';

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
  const entry = state.catalog.find(e => e.plant.id === pot.plant!.id);
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
  let headerHtml = '<div class="pot-card-header">';
  if (isBlooming && pot.plant) {

    const homozyg = isHomozygous(pot.plant);
    if (homozyg) {
      headerHtml += `<span class="pot-homozygous-badge" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`;
    }
    headerHtml += `<span class="pot-rarity-dot" style="color:${RARITY_COLORS[r]}" title="${RARITY_LABELS[r]}">${RARITY_ICON[r]}</span>`;
  }
  headerHtml += '</div>';

  // ── Plant view — magnifier button only for blooming plants with lupe upgrade ──
  let plantHtml: string;
  const lupePurchased = hasUpgrade(state, 'unlock_lupe');
  if (isBlooming && pot.plant) {
    plantHtml = `
      <div class="plant-view plant-view--interactive">
        ${renderPlantSVG(pot.plant, 100, 130, state.potDesign)}
        ${lupePurchased ? `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>` : ''}
      </div>`;
  } else {
    plantHtml = `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130, state.potDesign)}</div>`;
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
    const entry = state.catalog.find(e => e.plant.id === pot.plant!.id);
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
  });

  return card;
}

// ─── Allele overlay ───────────────────────────────────────────────────────────

function hueToCSS(h: number, l: ChromaticL): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'hsl(0,0%,97%)'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'hsl(0,0%,15%)'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'hsl(0,0%,45%)'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)'
  return `hsl(${Math.round(h)},${PALETTE_S}%,${l}%)`
}

function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'weiß'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'dunkelgrau'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'grau'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hellgrau'
  return `${Math.round(h)}°`
}

function lightnessLabel(l: ChromaticL): string {
  return l === 30 ? 'dunkel' : l === 60 ? 'mittel' : 'hell'
}

/**
 * Renders a pair of allele chips where:
 *   dominant allele → wider chip (22 px)
 *   recessive allele → narrower chip (12 px)
 * Size communicates dominance; no border difference needed.
 */
function renderChipPair(
  aVal: number | ChromaticL,
  bVal: number | ChromaticL,
  isHue: boolean,
  lA: ChromaticL,
  lB: ChromaticL,
): string {
  // Identical alleles → single chip, no dominance distinction needed
  if (aVal === bVal) {
    const bg = isHue
      ? hueToCSS(aVal as number, lA)
      : `hsl(0,0%,${(aVal as ChromaticL) === 30 ? 25 : (aVal as ChromaticL) === 60 ? 52 : 88}%)`
    return `<span class="allele-chip allele-chip--dom" style="background:${bg}"></span>`
  }

  const isDomA = isHue
    ? dominantHue(aVal as number, bVal as number) === aVal
    : dominantLightness(aVal as ChromaticL, bVal as ChromaticL) === aVal

  // Always render dominant chip first
  const chips = isDomA
    ? [{ val: aVal, l: lA, isDom: true }, { val: bVal, l: lB, isDom: false }]
    : [{ val: bVal, l: lB, isDom: true }, { val: aVal, l: lA, isDom: false }]

  return chips.map(chip => {
    const bg = isHue
      ? hueToCSS(chip.val as number, chip.l)
      : `hsl(0,0%,${(chip.val as ChromaticL) === 30 ? 25 : (chip.val as ChromaticL) === 60 ? 52 : 88}%)`
    const label = isHue ? hueLabel(chip.val as number) : lightnessLabel(chip.val as ChromaticL)
    const domLabel = chip.isDom ? t.estAlleleDominant : t.estAlleleRecessive
    return `<span
      class="allele-chip ${chip.isDom ? 'allele-chip--dom' : 'allele-chip--rec'}"
      style="background:${bg}"
      title="${label} — ${domLabel}"
    ></span>`
  }).join('')
}

function showAlleleOverlay(potId: number, card: HTMLElement, silent = false): void {
  // Toggle when triggered by user click; skip toggle on silent restore
  if (!silent) {
    const existing = card.querySelector('.allele-overlay')
    if (existing) {
      existing.remove()
      openAlleleIds.delete(potId)
      return
    }
  }

  const pot = state.pots.find(p => p.id === potId)
  if (!pot?.plant) return
  const plant = pot.plant

  const [hA, hB] = [plant.petalHue.a, plant.petalHue.b]
  const [lA, lB] = [plant.petalLightness.a, plant.petalLightness.b]

  // Shape: dominant first, collapse if identical
  const shapeA = plant.petalShape.a
  const shapeB = plant.petalShape.b
  const shapeValue = shapeA === shapeB
    ? shapeA
    : `${dominantShape(shapeA, shapeB)} · ${shapeA === dominantShape(shapeA, shapeB) ? shapeB : shapeA}`

  // Center: dominant first, collapse if identical
  const centerA = plant.centerType.a
  const centerB = plant.centerType.b
  const centerValue = centerA === centerB
    ? centerA
    : `${dominantCenter(centerA, centerB)} · ${centerA === dominantCenter(centerA, centerB) ? centerB : centerA}`

  const homozyg = isHomozygous(plant)

  const overlay = document.createElement('div')
  overlay.className = 'allele-overlay'
  overlay.dataset.pot = String(potId)
  overlay.innerHTML = `
    <button class="allele-overlay-close" data-action="close-overlay">×</button>
    <div class="allele-overlay-title">
      ${t.alleleOverlayTitle}
      ${homozyg ? `<span class="allele-overlay-homo">${t.catalogHomozygousBadge}</span>` : ''}
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayHue}</span>
      <span class="allele-chips-row">${renderChipPair(hA, hB, true, lA, lB)}</span>
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayLight}</span>
      <span class="allele-chips-row">${renderChipPair(lA, lB, false, lA, lB)}</span>
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayShape}</span>
      <span class="allele-overlay-value">${shapeValue}</span>
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayCenter}</span>
      <span class="allele-overlay-value">${centerValue}</span>
    </div>`

  overlay.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).dataset.action === 'close-overlay') {
      overlay.remove()
      openAlleleIds.delete(potId)
    }
    e.stopPropagation()
  })

  const closeOnOutside = (e: MouseEvent) => {
    if (!card.contains(e.target as Node)) {
      overlay.remove()
      openAlleleIds.delete(potId)
      document.removeEventListener('click', closeOnOutside)
    }
  }
  setTimeout(() => document.addEventListener('click', closeOnOutside), 0)

  openAlleleIds.add(potId)
  card.appendChild(overlay)
}
