import { dominantShape, dominantCenter, dominantHue, dominantLightness, dominantEffect } from '../engine/genetic/dominance_utils';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { RARE_SHAPES, RARE_EFFECTS } from "../model/genetic_model";
import { hasPotColor, hasPotShape, hasUpgrade } from '../engine/shop_engine';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S } from '../model/genetic_model';
import { t } from '../model/i18n';
import type { ChromaticL } from '../model/plant';
import { POT_COLORS, POT_SHAPES } from '../model/shop';
import { buildFamilySwatchStyle } from './swatch_utils';
import { openAlleleIds, state, handleSetPotDesign, handleSetShowcasePotDesign, openPotDesignIds } from './ui'
import { SHOWCASE_POT_BASE_ID } from '../model/shop';


// FIXME make overlay transparent not blurred
// FIXME place placeholder element to ing to always have same form no matter how many colors
// FIXME make ring more compact

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
  const GRAY_HUES = [ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT];
  const rareMarker = `<span class="allele-rare-indicator" title="${t.rareCarrierTitle}">${t.rareCarrierBadge}</span>`;

  const shapeA = plant.petalShape.a;
  const shapeB = plant.petalShape.b;
  const domShape = dominantShape(shapeA, shapeB);
  const recShape = shapeA === domShape ? shapeB : shapeA;
  const shapeRareMarker = showRareRadar && shapeA !== shapeB && RARE_SHAPES.includes(recShape) ? rareMarker : '';
  const shapeValue = shapeA === shapeB
    ? shapeA
    : `${domShape} · ${recShape}${shapeRareMarker}`;

  const centerA = plant.centerType.a;
  const centerB = plant.centerType.b;
  const domCenter = dominantCenter(centerA, centerB);
  const recCenter = centerA === domCenter ? centerB : centerA;
  const centerRareMarker = showRareRadar && centerA !== centerB && recCenter === 'stamen' ? rareMarker : '';
  const centerValue = centerA === centerB
    ? centerA
    : `${domCenter} · ${recCenter}${centerRareMarker}`;

  const effectA = plant.petalEffect.a;
  const effectB = plant.petalEffect.b;
  const effectLabel = (e: string) => e === 'none' ? '–' : ((t.effectLabels as Record<string, string>)[e] ?? e);
  const domEff = dominantEffect(effectA, effectB);
  const recEff = effectA === domEff ? effectB : effectA;
  const effRareMarker = showRareRadar && effectA !== effectB && RARE_EFFECTS.includes(recEff) ? rareMarker : '';
  const effectValue = effectA === effectB
    ? effectLabel(effectA)
    : `${effectLabel(domEff)} · ${effectLabel(recEff)}${effRareMarker}`;

  const domHue = dominantHue(hA, hB);
  const recHue = hA === domHue ? hB : hA;
  const hueRareMarker = showRareRadar && hA !== hB && GRAY_HUES.includes(recHue) ? rareMarker : '';

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

  const activeColor = pot.design?.colorId ?? 'terracotta'
  const activeShape = pot.design?.shape ?? 'standard'

  const unlockedColors = POT_COLORS.filter(c => hasPotColor(state, c.id))
  const unlockedShapes = POT_SHAPES.filter(s => hasPotShape(state, s.id))
  if (unlockedColors.length === 0 && unlockedShapes.length === 0) return

  // ── Shape buttons ──
  const shapeButtons = unlockedShapes.map(s => {
    const isActive = s.id === activeShape
    return `<button
      class="pdo-shape-btn${isActive ? ' pdo-shape-btn--active' : ''}"
      data-pdo-shape="${s.id}"
    >${t.potShapeLabels[s.id]}</button>`
  }).join('')

  const overlay = document.createElement('div')
  overlay.className = 'pot-design-overlay-new'
  overlay.innerHTML = `
    <button class="pdo-close" data-pdo-action="close" title="${t.helpClose}">×</button>
    ${unlockedShapes.length > 0 ? `
    <div class="pdo-shapes-row">
      ${shapeButtons}
    </div>` : ''}
  `

  // ── Color swatches positioned in a half-ring ──
  // We use absolute positioning calculated after mounting
  const swatchContainer = document.createElement('div')
  swatchContainer.className = 'pdo-color-ring'
  unlockedColors.forEach((c, i) => {
    const btn = document.createElement('button')
    btn.className = `pdo-color-swatch${c.id === activeColor ? ' pdo-color-swatch--active' : ''}`
    btn.dataset.pdoColor = c.id
    btn.title = t.potColorLabels[c.id]
    btn.style.setProperty('--swatch-bg', c.body)
    btn.style.setProperty('--swatch-rim', c.rim)
    btn.dataset.index = String(i)
    btn.dataset.total = String(unlockedColors.length)
    overlay.appendChild(btn)
  })

  overlay.appendChild(swatchContainer)

  overlay.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    const action = el.dataset.pdoAction
    const color = el.dataset.pdoColor
    const shape = el.dataset.pdoShape

    if (action === 'close') {
      overlay.remove()
      openPotDesignIds.delete(potId)
      return
    }
    if (color) {
      setDesign(potId, { colorId: color })
      // Update active state visually
      overlay.querySelectorAll('[data-pdo-color]').forEach(b => b.classList.remove('pdo-color-swatch--active'))
      el.classList.add('pdo-color-swatch--active')
      return
    }
    if (shape) {
      setDesign(potId, { shape: shape as 'standard' | 'conic' | 'belly' })
      overlay.querySelectorAll('[data-pdo-shape]').forEach(b => b.classList.remove('pdo-shape-btn--active'))
      el.classList.add('pdo-shape-btn--active')
      return
    }
    e.stopPropagation()
  })

  openPotDesignIds.add(potId)
  card.appendChild(overlay)

  // Position color swatches in a half-ring after mount
  requestAnimationFrame(() => {
    positionColorSwatches(overlay, card)
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

function positionColorSwatches(overlay: HTMLElement, card: HTMLElement): void {
  const swatches = overlay.querySelectorAll<HTMLElement>('[data-pdo-color]')
  const cardW = card.offsetWidth

  const visualArea = card.querySelector<HTMLElement>('.pot-visual-area')
  const visualAreaH = visualArea?.offsetHeight ?? card.offsetHeight * 0.72

  // Center ring on plant center (plant is bottom-aligned in visual area)
  const cx = cardW / 2
  const cy = visualAreaH * 0.55

  // Compact radius — stays close to the plant
  const radius = Math.min(cardW * 0.42, visualAreaH * 0.38)

  const n = swatches.length
  // Arc from 200° to 340° over the top of the plant
  const startAngle = 200
  const endAngle = 340
  const swatchSize = 22

  swatches.forEach((btn, i) => {
    const frac = n === 1 ? 0.5 : i / (n - 1)
    const deg = startAngle + frac * (endAngle - startAngle)
    const rad = (deg * Math.PI) / 180
    const x = cx + Math.cos(rad) * radius - swatchSize / 2
    const y = cy + Math.sin(rad) * radius - swatchSize / 2

    btn.style.position = 'absolute'
    btn.style.left = `${x}px`
    btn.style.top = `${y}px`
    btn.style.width = `${swatchSize}px`
    btn.style.height = `${swatchSize}px`
  })
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
  if (h === ACHROMATIC_HUE_GRAY_DARK) return 'hsl(0,0%,15%)';
  if (h === ACHROMATIC_HUE_GRAY_MID) return 'hsl(0,0%,45%)';
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)';
  return `hsl(${Math.round(h)},${PALETTE_S}%,${l}%)`;
}
function groupHueBg(h: number, isDom: boolean): string {
  if (h === ACHROMATIC_HUE_WHITE || h === ACHROMATIC_HUE_GRAY_DARK ||
      h === ACHROMATIC_HUE_GRAY_MID || h === ACHROMATIC_HUE_GRAY_LIGHT) {
    return hueToCSS(h, 60);
  }
  const dir = isDom ? 'to right' : 'to bottom';
  return buildFamilySwatchStyle({h, s: PALETTE_S, l: 0}, dir)
}
function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE) return t.alleleHueWhite;
  if (h === ACHROMATIC_HUE_GRAY_DARK) return t.alleleHueGrayDark;
  if (h === ACHROMATIC_HUE_GRAY_MID) return t.alleleHueGrayMid;
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return t.alleleHueGrayLight;
  return `${Math.round(h)}°`;
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
