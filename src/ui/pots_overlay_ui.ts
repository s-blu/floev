import { dominantShape, dominantCenter, dominantHue, dominantLightness } from '../engine/genetic/dominance_utils';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { hasPotColor, hasPotShape } from '../engine/shop_engine';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S } from '../model/genetic_model';
import { de as t } from '../model/i18n/de';
import type { ChromaticL } from '../model/plant';
import { POT_COLORS, POT_SHAPES } from '../model/shop';
import { openAlleleIds, state, handleSetPotDesign, openPotDesignIds } from './ui';


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

  const pot = state.pots.find(p => p.id === potId);
  if (!pot?.plant) return;
  const plant = pot.plant;

  const [hA, hB] = [plant.petalHue.a, plant.petalHue.b];
  const [lA, lB] = [plant.petalLightness.a, plant.petalLightness.b];

  const shapeA = plant.petalShape.a;
  const shapeB = plant.petalShape.b;
  const shapeValue = shapeA === shapeB
    ? shapeA
    : `${dominantShape(shapeA, shapeB)} · ${shapeA === dominantShape(shapeA, shapeB) ? shapeB : shapeA}`;

  const centerA = plant.centerType.a;
  const centerB = plant.centerType.b;
  const centerValue = centerA === centerB
    ? centerA
    : `${dominantCenter(centerA, centerB)} · ${centerA === dominantCenter(centerA, centerB) ? centerB : centerA}`;

  // Gradient alleles
  const gA = plant.hasGradient.a;
  const gB = plant.hasGradient.b;
  const gradientValue = renderGradientChipPair(gA, gB);

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
    </div>
    <div class="allele-overlay-row">
      <span class="allele-overlay-label">${t.alleleOverlayGradient}</span>
      <span class="allele-chips-row">${gradientValue}</span>
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

function renderGradientChipPair(a: boolean, b: boolean): string {
  const chip = (val: boolean, isDom: boolean) => {
    const bg = val ? 'linear-gradient(135deg, hsl(50,90%,88%), hsl(50,90%,40%))' : 'var(--bg3)';
    const label = val ? '✦ aktiv' : '○ inaktiv';
    const domLabel = isDom ? t.estAlleleDominant : t.estAlleleRecessive;
    // Gradient is expressed only when BOTH are true — no dominance, both matter equally
    return `<span
      class="allele-chip allele-chip--dom"
      style="background:${bg};border:0.5px solid var(--border2)"
      title="${label} — ${domLabel}"
    ></span>`;
  };

  if (a === b) {
    const bg = a
      ? 'linear-gradient(135deg, hsl(50,90%,88%), hsl(50,90%,40%))'
      : 'var(--bg3)';
    const expressed = a ? '✦ beide aktiv → Verlauf' : '○ beide inaktiv';
    return `<span
      class="allele-chip allele-chip--dom"
      style="background:${bg};border:0.5px solid var(--border2)"
      title="${expressed}"
    ></span>`;
  }

  // a ≠ b: one true, one false → not expressed (recessive-recessive rule)
  return chip(a, true) + chip(b, false);
}

// ─── Pot design overlay (new mockup design) ───────────────────────────────────
//
// Layout:
//   • Semi-circular color ring around the top of the pot card
//   • Labeled shape buttons at the bottom (above the pot action buttons)
//   • Close (×) button top-right
//   • Transparent full-card backdrop to catch mis-clicks

export function showPotDesignRing(potId: number, card: HTMLElement): void {
  // Toggle
  const existing = card.querySelector('.pot-design-overlay-new')
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

  // ── Shape buttons ──
  const shapeButtons = unlockedShapes.map(s => {
    const isActive = s.id === activeShape
    return `<button
      class="pdo-shape-btn${isActive ? ' pdo-shape-btn--active' : ''}"
      data-pdo-shape="${s.id}"
    >${s.label}</button>`
  }).join('')

  const overlay = document.createElement('div')
  overlay.className = 'pot-design-overlay-new'
  overlay.innerHTML = `
    <button class="pdo-close" data-pdo-action="close" title="Schließen">×</button>
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
    btn.title = c.label
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
      handleSetPotDesign(potId, { colorId: color })
      // Update active state visually
      overlay.querySelectorAll('[data-pdo-color]').forEach(b => b.classList.remove('pdo-color-swatch--active'))
      el.classList.add('pdo-color-swatch--active')
      return
    }
    if (shape) {
      handleSetPotDesign(potId, { shape: shape as 'standard' | 'conic' | 'belly' })
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
    positionColorSwatches(overlay, card, unlockedColors)
  })

  if (!silent) {
    const closeOnOutside = (e: MouseEvent) => {
      if (!card.contains(e.target as Node)) {
        const o = card.querySelector('.pot-design-overlay-new')
        if (o) { o.remove(); openPotDesignIds.delete(potId) }
        document.removeEventListener('click', closeOnOutside)
      }
    }
    setTimeout(() => document.addEventListener('click', closeOnOutside), 0)
  }
}

function positionColorSwatches(overlay: HTMLElement, card: HTMLElement, colors: typeof POT_COLORS): void {
  const swatches = overlay.querySelectorAll<HTMLElement>('[data-pdo-color]')
  const cardW = card.offsetWidth
  const cardH = card.offsetHeight

  // Center of card (origin for the ring)
  const cx = cardW / 2
  const cy = cardH / 2

  // Radius of the ring — just large enough to arc around the flower
  const radius = Math.min(cardW * 0.54, cardH * 0.48)

  const n = swatches.length
  // Spread across the top half: from 200° to 340° (bottom-left to bottom-right via top)
  // i.e. the swatches arc over the top of the card
  const startAngle = 200  // degrees, measured from right (CSS convention)
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


// ─── Allele overlay helpers ───────────────────────────────────────────────────
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
