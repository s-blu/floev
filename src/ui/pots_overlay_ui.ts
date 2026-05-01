import { dominantShape, dominantCenter, dominantHue, dominantLightness, dominantEffect } from '../engine/genetic/dominance_utils';
import { isHomozygous, hueBucket } from '../engine/genetic/genetic_utils';
import { RARE_SHAPES, RARE_EFFECTS } from "../model/genetic_model";
import { hasPotColor, hasPotShape, hasPotEffect, hasUpgrade } from '../engine/shop_engine';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY, PALETTE_S } from '../model/genetic_model';
import {
  buildDiscoveredShapeCounts, buildDiscoveredShapeCenters, buildDiscoveredShapeEffects,
  buildDiscoveredColors, isShapeFullyDiscovered, isStamenFullyDiscovered,
  isEffectFullyDiscovered, isBucketFullyDiscovered, RARE_BUCKETS,
} from '../engine/discovery_utils';

import { t } from '../model/i18n';
import type { ChromaticL } from '../model/plant';
import { POT_COLORS, POT_SHAPES, POT_EFFECTS } from '../model/shop';
import { buildFamilySwatchStyle } from './swatch_utils';
import { openAlleleIds, state, handleSetPotDesign, handleSetShowcasePotDesign, openPotDesignIds } from './ui'
import { formatDate } from './ui';
import { SHOWCASE_POT_BASE_ID } from '../model/shop';


const EFFECT_ICONS: Record<string, string> = {
  none:     `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="2.5" fill="currentColor"/></svg>`,
  glossy:   `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="2.5" fill="currentColor"/><path d="M4.5 5.5 Q9 3.5 13.5 8.5" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  stripes:  `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="2.5" fill="currentColor" opacity="0.25"/><rect x="2" y="2" width="14" height="4" rx="1.5" fill="currentColor"/><rect x="2" y="8" width="14" height="4" fill="currentColor"/><rect x="2" y="14" width="14" height="2" rx="1" fill="currentColor"/></svg>`,
  diagonal: `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="2.5" fill="currentColor" opacity="0.25"/><line x1="2" y1="9" x2="9" y2="2" stroke="currentColor" stroke-width="4" stroke-linecap="square"/><line x1="2" y1="16" x2="16" y2="2" stroke="currentColor" stroke-width="4" stroke-linecap="square"/><line x1="9" y1="16" x2="16" y2="9" stroke="currentColor" stroke-width="4" stroke-linecap="square"/></svg>`,
  dots:     `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="2.5" fill="currentColor" opacity="0.2"/><circle cx="6" cy="6" r="2.5" fill="currentColor"/><circle cx="12" cy="6" r="2.5" fill="currentColor"/><circle cx="6" cy="12" r="2.5" fill="currentColor"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>`,
}

export function showAlleleOverlay(potId: number, card: HTMLElement, silent = false): void {
  if (!silent) {
    const existing = card.querySelector('.allele-overlay');
    if (existing) {
      existing.remove();
      openAlleleIds.delete(potId);
      return;
    }
  }

  const pot = state.pots.find(p => p.id === potId) ?? state.showcase.find(p => p.id === potId);
  if (!pot?.plant) return;
  const plant = pot.plant;

  const [hA, hB] = [plant.petalHue.a, plant.petalHue.b];
  const [lA, lB] = [plant.petalLightness.a, plant.petalLightness.b];

  const showRareRadar = hasUpgrade(state, 'unlock_rare_radar');
  const rareMarker = `<span class="allele-rare-indicator" title="${t.rareCarrierTitle}">${t.rareCarrierBadge}</span>`;

  // Precompute discovery sets once for all per-allele checks
  const discoveredCounts  = showRareRadar ? buildDiscoveredShapeCounts(state.catalog)  : new Set<string>();
  const discoveredCenters = showRareRadar ? buildDiscoveredShapeCenters(state.catalog) : new Set<string>();
  const discoveredEffects = showRareRadar ? buildDiscoveredShapeEffects(state.catalog) : new Set<string>();
  const discoveredColors  = showRareRadar ? buildDiscoveredColors(state.catalog)       : new Set<string>();

  const PETAL_SHAPE_LABELS: Record<string, string> = {
    round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
  };
  const shapeLabel = (s: string) => PETAL_SHAPE_LABELS[s] ?? s;
  const centerLabel = (c: string) => (t.centerTypeLabels as Record<string, string>)[c] ?? c;

  const shapeA = plant.petalShape.a;
  const shapeB = plant.petalShape.b;
  const domShape = dominantShape(shapeA, shapeB);
  const recShape = shapeA === domShape ? shapeB : shapeA;
  const shapeRareMarker = showRareRadar && shapeA !== shapeB
    && RARE_SHAPES.includes(recShape)
    && !isShapeFullyDiscovered(recShape, discoveredCounts, discoveredCenters, discoveredEffects)
    ? rareMarker : '';
  const shapeValue = shapeA === shapeB
    ? shapeLabel(shapeA)
    : `${shapeLabel(domShape)} · ${shapeLabel(recShape)}${shapeRareMarker}`;

  const centerA = plant.centerType.a;
  const centerB = plant.centerType.b;
  const domCenter = dominantCenter(centerA, centerB);
  const recCenter = centerA === domCenter ? centerB : centerA;
  const centerRareMarker = showRareRadar && centerA !== centerB
    && recCenter === 'stamen'
    && !isStamenFullyDiscovered(discoveredCenters)
    ? rareMarker : '';
  const centerValue = centerA === centerB
    ? centerLabel(centerA)
    : `${centerLabel(domCenter)} · ${centerLabel(recCenter)}${centerRareMarker}`;

  const effectA = plant.petalEffect.a;
  const effectB = plant.petalEffect.b;
  const effectLabel = (e: string) => e === 'none' ? '–' : ((t.effectLabels as Record<string, string>)[e] ?? e);
  const domEff = dominantEffect(effectA, effectB);
  const recEff = effectA === domEff ? effectB : effectA;
  const effRareMarker = showRareRadar && effectA !== effectB
    && RARE_EFFECTS.includes(recEff)
    && !isEffectFullyDiscovered(recEff, discoveredEffects)
    ? rareMarker : '';
  const effectValue = effectA === effectB
    ? effectLabel(effectA)
    : `${effectLabel(domEff)} · ${effectLabel(recEff)}${effRareMarker}`;

  const domHue = dominantHue(hA, hB);
  const recHue = hA === domHue ? hB : hA;
  const recHueBucket = hueBucket(recHue);
  const hueRareMarker = showRareRadar && hA !== hB
    && RARE_BUCKETS.has(recHueBucket)
    && !isBucketFullyDiscovered(recHueBucket, discoveredColors)
    ? rareMarker : '';

  // Petal count alleles (rounded)
  const pcA = Math.round(plant.petalCount.a);
  const pcB = Math.round(plant.petalCount.b);
  const petalCountValue = pcA === pcB
    ? `${pcA}`
    : `∅ ${((pcA + pcB) / 2).toFixed(1)} (${pcA} / ${pcB})`;

  // Stem height alleles
  const shA = Math.round(plant.stemHeight.a * 100);
  const shB = Math.round(plant.stemHeight.b * 100);
  const stemValue = `${Math.round((shA + shB) / 2)}% (${shA} / ${shB})`;

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
      <span class="allele-chips-row">${renderChipPair(hA, hB, true, lA, lB, true)}${hueRareMarker}</span>
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
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayEffect}</span>
      <span class="allele-overlay-value">${effectValue}</span>
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayPetalCount}</span>
      <span class="allele-overlay-value">${petalCountValue}</span>
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayStemHeight}</span>
      <span class="allele-overlay-value">${stemValue}</span>
    </div>
    ${pot.phaseStart != null ? `
    <div class="allele-overlay-row date">
      <span class="allele-overlay-label">${t.alleleOverlayBloomedAt}</span>
      <span class="allele-overlay-value">${formatDate(pot.phaseStart)}</span>
    </div>` : ''}`;

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

const potDesignCloseHandlers = new Map<number, (e: MouseEvent) => void>()

// ─── Pot design overlay (new mockup design) ───────────────────────────────────
//
// Layout:
//   • Semi-circular color ring around the top of the pot card
//   • Labeled shape buttons at the bottom (above the pot action buttons)
//   • Close (×) button top-right
//   • Transparent full-card backdrop to catch mis-clicks

export function showPotDesignRing(potId: number, card: HTMLElement): void {
  if (card.querySelector('.pot-design-overlay-new')) return
  attachPotDesignRing(potId, card, false)
}

export function attachPotDesignRing(potId: number, card: HTMLElement, silent: boolean): void {
  const pot = state.pots.find(p => p.id === potId) ?? state.showcase.find(p => p.id === potId)
  if (!pot) return
  const isShowcasePot = potId >= SHOWCASE_POT_BASE_ID
  const setDesign = isShowcasePot ? handleSetShowcasePotDesign : handleSetPotDesign

  const activeColor  = pot.design?.colorId  ?? 'terracotta'
  const activeShape  = pot.design?.shape    ?? 'standard'
  const activeEffect = pot.design?.effectId ?? 'none'

  const unlockedColors  = POT_COLORS.filter(c  => hasPotColor(state,  c.id))
  const unlockedShapes  = POT_SHAPES.filter(s  => hasPotShape(state,  s.id))
  const unlockedEffects = POT_EFFECTS.filter(e => hasPotEffect(state, e.id))
  if (unlockedColors.length === 0 && unlockedShapes.length === 0 && unlockedEffects.length <= 1) return

  // ── Shape buttons ──
  const shapeButtons = unlockedShapes.map(s => {
    const isActive = s.id === activeShape
    return `<button
      class="pdo-shape-btn${isActive ? ' pdo-shape-btn--active' : ''}"
      data-pdo-shape="${s.id}"
    >${t.potShapeLabels[s.id]}</button>`
  }).join('')

  // ── Color swatches ──
  const colorSwatches = unlockedColors.map(c => {
    const isActive = c.id === activeColor
    return `<button
      class="pdo-color-swatch${isActive ? ' pdo-color-swatch--active' : ''}"
      data-pdo-color="${c.id}"
      title="${t.potColorLabels[c.id]}"
      style="--swatch-bg:${c.body};--swatch-rim:${c.rim}"
    ></button>`
  }).join('')

  // ── Effect buttons ──
  const effectButtons = unlockedEffects.map(e => {
    const isActive = e.id === activeEffect
    return `<button
      class="pdo-effect-btn${isActive ? ' pdo-effect-btn--active' : ''}"
      data-pdo-effect="${e.id}"
      title="${t.potEffectLabels[e.id]}"
    >${EFFECT_ICONS[e.id] ?? e.id}</button>`
  }).join('')

  const overlay = document.createElement('div')
  overlay.className = 'pot-design-overlay-new'
  overlay.innerHTML = `
    <button class="pdo-close" data-pdo-action="close" title="${t.helpClose}">×</button>
    ${unlockedColors.length > 0 ? `<div class="pdo-color-col">${colorSwatches}</div>` : ''}
    ${unlockedEffects.length > 1 ? `<div class="pdo-effect-col">${effectButtons}</div>` : ''}
    ${unlockedShapes.length > 0 ? `<div class="pdo-shapes-row">${shapeButtons}</div>` : ''}
  `

  overlay.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-pdo-action],[data-pdo-color],[data-pdo-shape],[data-pdo-effect]') ?? e.target as HTMLElement
    const action = el.dataset.pdoAction
    const color  = el.dataset.pdoColor
    const shape  = el.dataset.pdoShape
    const effect = el.dataset.pdoEffect

    if (action === 'close') {
      overlay.remove()
      openPotDesignIds.delete(potId)
      return
    }
    if (color) {
      setDesign(potId, { colorId: color })
      overlay.querySelectorAll('[data-pdo-color]').forEach(b => b.classList.remove('pdo-color-swatch--active'))
      el.classList.add('pdo-color-swatch--active')
      return
    }
    if (shape) {
      setDesign(potId, { shape })
      overlay.querySelectorAll('[data-pdo-shape]').forEach(b => b.classList.remove('pdo-shape-btn--active'))
      el.classList.add('pdo-shape-btn--active')
      return
    }
    if (effect) {
      setDesign(potId, { effectId: effect })
      overlay.querySelectorAll('[data-pdo-effect]').forEach(b => b.classList.remove('pdo-effect-btn--active'))
      el.classList.add('pdo-effect-btn--active')
      return
    }
    e.stopPropagation()
  })

  openPotDesignIds.add(potId)
  card.appendChild(overlay)

  requestAnimationFrame(() => {
    positionShapesRow(overlay, card)
  })

  const prevHandler = potDesignCloseHandlers.get(potId)
  if (prevHandler) document.removeEventListener('click', prevHandler)

  const closeOnOutside = (e: MouseEvent) => {
    if (!card.contains(e.target as Node)) {
      const o = card.querySelector('.pot-design-overlay-new')
      if (o) { o.remove(); openPotDesignIds.delete(potId) }
      document.removeEventListener('click', closeOnOutside)
      potDesignCloseHandlers.delete(potId)
    }
  }
  potDesignCloseHandlers.set(potId, closeOnOutside)
  if (silent) {
    document.addEventListener('click', closeOnOutside)
  } else {
    setTimeout(() => document.addEventListener('click', closeOnOutside), 0)
  }
}


function positionShapesRow(overlay: HTMLElement, card: HTMLElement): void {
  const shapesRow = overlay.querySelector<HTMLElement>('.pdo-shapes-row')
  if (!shapesRow) return
  const visualArea = card.querySelector<HTMLElement>('.pot-visual-area')
  if (!visualArea) return
  shapesRow.style.position = 'absolute'
  shapesRow.style.top = `${visualArea.offsetHeight + 6}px`
  shapesRow.style.left = '0'
  shapesRow.style.right = '0'
}


// ─── Allele overlay helpers ───────────────────────────────────────────────────
function hueToCSS(h: number, l: ChromaticL): string {
  if (h === ACHROMATIC_HUE_WHITE) return 'hsl(0,0%,97%)';
  if (h === ACHROMATIC_HUE_GRAY)  return `hsl(0,0%,${l}%)`;
  return `hsl(${Math.round(h)},${PALETTE_S}%,${l}%)`;
}
function groupHueBg(h: number, isDom: boolean): string {
  if (h === ACHROMATIC_HUE_WHITE) return hueToCSS(h, 60);
  const dir = isDom ? 'to right' : 'to bottom';
  if (h === ACHROMATIC_HUE_GRAY) return buildFamilySwatchStyle({h: 0, s: 0, l: 0}, dir);
  return buildFamilySwatchStyle({h, s: PALETTE_S, l: 0}, dir)
}
function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE) return t.alleleHueWhite;
  if (h === ACHROMATIC_HUE_GRAY)  return t.alleleHueGray;
  return (t.colorLabel as any)[h]?.hueName ?? `${Math.round(h)}°`;
}
function lightnessLabel(l: ChromaticL): string {
  return l === 30 ? t.helpLightnessDark : l === 60 ? t.helpLightnessMid : t.helpLightnessLight;
}

export function renderChipPair(
  aVal: number | ChromaticL,
  bVal: number | ChromaticL,
  isHue: boolean,
  lA: ChromaticL,
  lB: ChromaticL,
  stacked = false
): string {
  const chipBg = (val: number | ChromaticL, l: ChromaticL, isDom: boolean): string => {
    if (isHue && stacked) return groupHueBg(val as number, isDom);
    return isHue
      ? hueToCSS(val as number, l)
      : `hsl(0,0%,${(val as ChromaticL) === 30 ? 25 : (val as ChromaticL) === 60 ? 52 : 88}%)`;
  };

  // Identical alleles → single chip, no dominance distinction needed
  if (aVal === bVal) {
    return `<span class="allele-chip allele-chip--dom" style="background:${chipBg(aVal, lA, true)}"></span>`;
  }

  const isDomA = isHue
    ? dominantHue(aVal as number, bVal as number) === aVal
    : dominantLightness(aVal as ChromaticL, bVal as ChromaticL) === aVal;

  // Always render dominant chip first
  const chips = isDomA
    ? [{ val: aVal, l: lA, isDom: true }, { val: bVal, l: lB, isDom: false }]
    : [{ val: bVal, l: lB, isDom: true }, { val: aVal, l: lA, isDom: false }];

  return chips.map(chip => {
    const label = isHue ? hueLabel(chip.val as number) : lightnessLabel(chip.val as ChromaticL);
    const domLabel = chip.isDom ? t.estAlleleDominant : t.estAlleleRecessive;
    return `<span
      class="allele-chip ${chip.isDom ? 'allele-chip--dom' : 'allele-chip--rec'}"
      style="background:${chipBg(chip.val, chip.l, chip.isDom)}"
      title="${label} — ${domLabel}"
    ></span>`;
  }).join('');
}
