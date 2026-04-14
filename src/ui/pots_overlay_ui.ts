import { dominantShape, dominantCenter, dominantHue, dominantLightness } from '../engine/genetic/dominance_utils';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { hasPotColor, hasPotShape } from '../engine/shop_engine';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S } from '../model/genetic_model';
import { de as t } from '../model/i18n/de';
import type { ChromaticL } from '../model/plant';
import { POT_COLORS, POT_SHAPES } from '../model/shop';
import { openAlleleIds, state, handleSetPotDesign } from './ui';

export function showAlleleOverlay(potId: number, card: HTMLElement, silent = false): void {
  // Toggle when triggered by user click; skip toggle on silent restore
  if (!silent) {
    const existing = card.querySelector('.allele-overlay');
    if (existing) {
      existing.remove();
      openAlleleIds.delete(potId);
      return;
    }
  }

  const pot = state.pots.find(p => p.id === potId);
  if (!pot?.plant) return;
  const plant = pot.plant;

  const [hA, hB] = [plant.petalHue.a, plant.petalHue.b];
  const [lA, lB] = [plant.petalLightness.a, plant.petalLightness.b];

  // Shape: dominant first, collapse if identical
  const shapeA = plant.petalShape.a;
  const shapeB = plant.petalShape.b;
  const shapeValue = shapeA === shapeB
    ? shapeA
    : `${dominantShape(shapeA, shapeB)} · ${shapeA === dominantShape(shapeA, shapeB) ? shapeB : shapeA}`;

  // Center: dominant first, collapse if identical
  const centerA = plant.centerType.a;
  const centerB = plant.centerType.b;
  const centerValue = centerA === centerB
    ? centerA
    : `${dominantCenter(centerA, centerB)} · ${centerA === dominantCenter(centerA, centerB) ? centerB : centerA}`;

  const homozyg = isHomozygous(plant);

  const overlay = document.createElement('div');
  overlay.className = 'allele-overlay';
  overlay.dataset.pot = String(potId);
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
    </div>`;

  overlay.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).dataset.action === 'close-overlay') {
      overlay.remove();
      openAlleleIds.delete(potId);
    }
    e.stopPropagation();
  });

  const closeOnOutside = (e: MouseEvent) => {
    if (!card.contains(e.target as Node)) {
      overlay.remove();
      openAlleleIds.delete(potId);
      document.removeEventListener('click', closeOnOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 0);

  openAlleleIds.add(potId);
  card.appendChild(overlay);
}
// ─── Pot design overlay ───────────────────────────────────────────────────────
const openPotDesignIds = new Set<number>();
export function showPotDesignOverlay(potId: number, card: HTMLElement): void {
  // Toggle
  const existing = card.querySelector('.pot-design-overlay');
  if (existing) {
    existing.remove();
    openPotDesignIds.delete(potId);
    return;
  }

  const pot = state.pots.find(p => p.id === potId);
  if (!pot) return;

  const activeColor = pot.design?.colorId ?? 'terracotta';
  const activeShape = pot.design?.shape ?? 'standard';

  // Color swatches — only unlocked ones
  const colorSwatches = POT_COLORS
    .filter(c => hasPotColor(state, c.id))
    .map(c => {
      const active = c.id === activeColor;
      return `<button
        class="pod-swatch${active ? ' pod-swatch--active' : ''}"
        data-pod-color="${c.id}"
        title="${c.label}"
        style="background:${c.body};border-color:${active ? '#1D9E75' : c.rim}"
      ></button>`;
    }).join('');

  // Shape buttons — only unlocked ones
  const shapeButtons = POT_SHAPES
    .filter(s => hasPotShape(state, s.id))
    .map(s => {
      const active = s.id === activeShape;
      return `<button
        class="pod-shape${active ? ' pod-shape--active' : ''}"
        data-pod-shape="${s.id}"
      >${s.label}</button>`;
    }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'pot-design-overlay';
  overlay.innerHTML = `
    <button class="pot-design-overlay-close" data-pod-close>×</button>
    <div class="pod-title">Topf-Design</div>
    ${colorSwatches ? `<div class="pod-swatches">${colorSwatches}</div>` : ''}
    ${shapeButtons ? `<div class="pod-shapes">${shapeButtons}</div>` : ''}
  `;

  overlay.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (el.dataset.podClose !== undefined) {
      overlay.remove(); openPotDesignIds.delete(potId); return;
    }
    if (el.dataset.podColor) {
      handleSetPotDesign(potId, { colorId: el.dataset.podColor });
    }
    if (el.dataset.podShape) {
      handleSetPotDesign(potId, { shape: el.dataset.podShape as 'standard' | 'conic' | 'belly' });
    }
    e.stopPropagation();
  });

  const closeOnOutside = (e: MouseEvent) => {
    if (!card.contains(e.target as Node)) {
      overlay.remove();
      openPotDesignIds.delete(potId);
      document.removeEventListener('click', closeOnOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 0);

  openPotDesignIds.add(potId);
  card.appendChild(overlay);
}// ─── Allele overlay ───────────────────────────────────────────────────────────
function hueToCSS(h: number, l: ChromaticL): string {
  if (h === ACHROMATIC_HUE_WHITE) return 'hsl(0,0%,97%)';
  if (h === ACHROMATIC_HUE_GRAY_DARK) return 'hsl(0,0%,15%)';
  if (h === ACHROMATIC_HUE_GRAY_MID) return 'hsl(0,0%,45%)';
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)';
  return `hsl(${Math.round(h)},${PALETTE_S}%,${l}%)`;
}
function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE) return 'weiß';
  if (h === ACHROMATIC_HUE_GRAY_DARK) return 'dunkelgrau';
  if (h === ACHROMATIC_HUE_GRAY_MID) return 'grau';
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hellgrau';
  return `${Math.round(h)}°`;
}
function lightnessLabel(l: ChromaticL): string {
  return l === 30 ? 'dunkel' : l === 60 ? 'mittel' : 'hell';
}
/**
 * Renders a pair of allele chips where:
 *   dominant allele → wider chip (22 px)
 *   recessive allele → narrower chip (12 px)
 * Size communicates dominance; no border difference needed.
 */

export function renderChipPair(
  aVal: number | ChromaticL,
  bVal: number | ChromaticL,
  isHue: boolean,
  lA: ChromaticL,
  lB: ChromaticL
): string {
  // Identical alleles → single chip, no dominance distinction needed
  if (aVal === bVal) {
    const bg = isHue
      ? hueToCSS(aVal as number, lA)
      : `hsl(0,0%,${(aVal as ChromaticL) === 30 ? 25 : (aVal as ChromaticL) === 60 ? 52 : 88}%)`;
    return `<span class="allele-chip allele-chip--dom" style="background:${bg}"></span>`;
  }

  const isDomA = isHue
    ? dominantHue(aVal as number, bVal as number) === aVal
    : dominantLightness(aVal as ChromaticL, bVal as ChromaticL) === aVal;

  // Always render dominant chip first
  const chips = isDomA
    ? [{ val: aVal, l: lA, isDom: true }, { val: bVal, l: lB, isDom: false }]
    : [{ val: bVal, l: lB, isDom: true }, { val: aVal, l: lA, isDom: false }];

  return chips.map(chip => {
    const bg = isHue
      ? hueToCSS(chip.val as number, chip.l)
      : `hsl(0,0%,${(chip.val as ChromaticL) === 30 ? 25 : (chip.val as ChromaticL) === 60 ? 52 : 88}%)`;
    const label = isHue ? hueLabel(chip.val as number) : lightnessLabel(chip.val as ChromaticL);
    const domLabel = chip.isDom ? t.estAlleleDominant : t.estAlleleRecessive;
    return `<span
      class="allele-chip ${chip.isDom ? 'allele-chip--dom' : 'allele-chip--rec'}"
      style="background:${bg}"
      title="${label} — ${domLabel}"
    ></span>`;
  }).join('');
}

