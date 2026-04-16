import { dominantShape, dominantCenter, dominantHue, dominantLightness } from '../engine/genetic/dominance_utils';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { hasPotColor, hasPotShape } from '../engine/shop_engine';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S } from '../model/genetic_model';
import { de as t } from '../model/i18n/de';
import type { ChromaticL } from '../model/plant';
import { POT_COLORS, POT_SHAPES } from '../model/shop';
import { openAlleleIds, state, handleSetPotDesign, openPotDesignIds } from './ui';

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
// ─── Pot design ring ──────────────────────────────────────────────────────────

export function showPotDesignRing(potId: number, card: HTMLElement): void {
  // Toggle
  const existing = card.querySelector('.pot-design-ring')
  if (existing) {
    existing.remove()
    openPotDesignIds.delete(potId)
    return
  }
  attachPotDesignRing(potId, card, false)
}

export function attachPotDesignRing(potId: number, card: HTMLElement, silent: boolean): void {
  const pot = state.pots.find(p => p.id === potId)
  if (!pot) return

  const activeColor = pot.design?.colorId ?? 'terracotta'
  const activeShape = pot.design?.shape ?? 'standard'

  const unlockedColors = POT_COLORS.filter(c => hasPotColor(state, c.id))
  const unlockedShapes = POT_SHAPES.filter(s => hasPotShape(state, s.id))
  if (unlockedColors.length === 0 && unlockedShapes.length === 0) return

  const ring = document.createElement('div')
  ring.className = 'pot-design-ring'

  // ── Outer ring: Farben ──
  const colorItems = unlockedColors.map(c => {
    const active = c.id === activeColor
    return `<button
      class="pdr-color${active ? ' pdr-color--active' : ''}"
      data-pdr-color="${c.id}"
      title="${c.label}"
      style="background:${c.body};outline-color:${active ? '#1D9E75' : 'transparent'}"
    ></button>`
  }).join('')

  // ── Inner ring: Formen ──
  const SHAPE_ICONS: Record<string, string> = { standard: '▭', conic: '▽', belly: '◎' }
  const shapeItems = unlockedShapes.map(s => {
    const active = s.id === activeShape
    return `<button
      class="pdr-shape${active ? ' pdr-shape--active' : ''}"
      data-pdr-shape="${s.id}"
      title="${s.label}"
    >${SHAPE_ICONS[s.id] ?? s.label[0]}</button>`
  }).join('')

  ring.innerHTML = `
    <div class="pdr-outer">${colorItems}</div>
    <div class="pdr-inner">${shapeItems}</div>
  `

  ring.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    if (el.dataset.pdrColor) {
      handleSetPotDesign(potId, { colorId: el.dataset.pdrColor })
      return
    }
    if (el.dataset.pdrShape) {
      handleSetPotDesign(potId, { shape: el.dataset.pdrShape as 'standard' | 'conic' | 'belly' })
      return
    }
    e.stopPropagation()
  })

  const closeOnOutside = (e: MouseEvent) => {
    if (!card.contains(e.target as Node)) {
      const r = card.querySelector('.pot-design-ring')
      if (r) { r.remove(); openPotDesignIds.delete(potId) }
      document.removeEventListener('click', closeOnOutside)
    }
  }
  if (!silent) setTimeout(() => document.addEventListener('click', closeOnOutside), 0)

  openPotDesignIds.add(potId)
  card.appendChild(ring)

  requestAnimationFrame(() => {
    // ring ist jetzt 100% × 100% des card + inset -18px
    const cardW = card.offsetWidth
    const cardH = card.offsetHeight
    
    const colorBtns = ring.querySelectorAll<HTMLElement>('.pdr-color')
    const outerR = cardW / 2 + 10
    colorBtns.forEach((btn, i) => {
      const angle = (i / colorBtns.length) * Math.PI * 2 - Math.PI / 2
      btn.style.left = `${cardW / 2 + 18 + Math.cos(angle) * outerR - 9}px`
      btn.style.top  = `${cardH / 2 + Math.sin(angle) * outerR - 9}px`
    })

    const shapeBtns = ring.querySelectorAll<HTMLElement>('.pdr-shape')
    const innerR = cardW / 2 - 4
    shapeBtns.forEach((btn, i) => {
      const angle = (i / shapeBtns.length) * Math.PI * 2 - Math.PI / 2
      btn.style.left = `${cardW / 2 + 18 + Math.cos(angle) * innerR - 11}px`
      btn.style.top  = `${cardH / 2 + Math.sin(angle) * innerR - 11}px`
    })
  })
}


// ─── Allele overlay ───────────────────────────────────────────────────────────
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