import { computeBreedEstimate } from '../engine/breed';
import { renderPlantSVG } from '../engine/renderer/renderer';
import type { BreedEstimate } from '../model/plant';
import { state, render, breedState } from './ui';
import { t } from '../model/i18n';
import { isHomozygous } from '../engine/genetic.utils';
import {
  ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK,
  ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT, PALETTE_S,
} from '../engine/genetics';
import type { Plant } from '../model/plant';

// ─── Breeding panel ───────────────────────────────────────────────────────────

export function renderBreedPanel(): void {
  const slotA    = document.getElementById('breed-a');
  const slotB    = document.getElementById('breed-b');
  const preview  = document.getElementById('breed-preview');
  const btn      = document.getElementById('breed-btn') as HTMLButtonElement | null;
  if (!slotA || !slotB || !preview || !btn) return;

  const potA = breedState.breedSelA !== null ? state.pots.find(p => p.id === breedState.breedSelA) : null;
  const potB = breedState.breedSelB !== null ? state.pots.find(p => p.id === breedState.breedSelB) : null;

  if (potA?.plant) {
    const homoA = isHomozygous(potA.plant);
    slotA.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potA.plant, 66, 86)}
        ${homoA ? `<span class="breed-slot-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>` : ''}
        <button class="breed-slot-remove" data-remove="a" title="${t.breedSlotRemoveTitle}">×</button>
      </div>`;
  } else {
    slotA.innerHTML = `<span>${t.breedParent1}</span>`;
  }

  if (potB?.plant) {
    const homoB = isHomozygous(potB.plant);
    slotB.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potB.plant, 66, 86)}
        ${homoB ? `<span class="breed-slot-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>` : ''}
        <button class="breed-slot-remove" data-remove="b" title="${t.breedSlotRemoveTitle}">×</button>
      </div>`;
  } else {
    slotB.innerHTML = `<span>${t.breedParent2}</span>`;
  }

  const hasEmptyPot = state.pots.some(p => !p.plant);

  if (potA?.plant && potB?.plant) {
    if (!breedState.breedEstimate) {
      breedState.breedEstimate = computeBreedEstimate(potA.plant, potB.plant);
    }
    preview.innerHTML = formatEstimate(breedState.breedEstimate, potA.plant, potB.plant);
    btn.disabled = !hasEmptyPot;
  } else {
    preview.textContent = t.breedPrompt;
    btn.disabled = true;
    breedState.breedEstimate = null;
  }

  const hint = document.querySelector('.breed-hint') as HTMLElement | null;
  if (hint) {
    if (potA?.plant && potB?.plant && !hasEmptyPot) {
      hint.textContent = t.breedHintNoSpace;
      hint.style.color = '#A32D2D';
    } else {
      hint.textContent = t.breedHint;
      hint.style.color = '';
    }
  }

  slotA.onclick = (e) => {
    if ((e.target as HTMLElement).closest('[data-remove="a"]')) {
      breedState.breedSelA = null; breedState.breedEstimate = null; render();
    }
  };
  slotB.onclick = (e) => {
    if ((e.target as HTMLElement).closest('[data-remove="b"]')) {
      breedState.breedSelB = null; breedState.breedEstimate = null; render();
    }
  };
}

// ─── Hue helpers ─────────────────────────────────────────────────────────────

function hueToCSS(h: number, s: number, l: number): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'hsl(0,0%,97%)'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'hsl(0,0%,15%)'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'hsl(0,0%,45%)'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)'
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
}

function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'weiß'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'dunkelgrau'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'grau'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hellgrau'
  if (h <= 35 || h > 345)              return 'Rot'
  if (h <= 60)                         return 'Gelb'
  if (h <= 155)                        return 'Grün'
  if (h <= 200)                        return 'Türkis'
  if (h <= 240)                        return 'Blau'
  if (h <= 275)                        return 'Lila'
  if (h <= 345)                        return 'Pink'
  return `${Math.round(h)}°`
}

// ─── Colour probability bars ──────────────────────────────────────────────────

/**
 * Computes the probability distribution over expressed hue values from
 * the four possible allele combinations of both parents.
 * Returns entries sorted by descending probability, showing only hues > 0%.
 */
function hueProbs(
  plantA: Plant, plantB: Plant, avgS: number, avgL: number,
): { h: number; pct: number; css: string; label: string }[] {
  const alleles = [
    [plantA.petalHue.a, plantB.petalHue.a],
    [plantA.petalHue.a, plantB.petalHue.b],
    [plantA.petalHue.b, plantB.petalHue.a],
    [plantA.petalHue.b, plantB.petalHue.b],
  ] as [number, number][]

  // Count expressed hue per combination (dominant wins)
  const counts = new Map<number, number>()
  for (const [a, b] of alleles) {
    const expressed = _dominantHue(a, b)
    counts.set(expressed, (counts.get(expressed) ?? 0) + 1)
  }

  const result: { h: number; pct: number; css: string; label: string }[] = []
  for (const [h, count] of counts) {
    result.push({
      h,
      pct: Math.round((count / 4) * 100),
      css: hueToCSS(h, avgS, avgL),
      label: hueLabel(h),
    })
  }
  return result.filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct)
}

// ─── Lightness probability bars ───────────────────────────────────────────────

function lightnessProbs(
  plantA: Plant, plantB: Plant,
): { l: number; pct: number; label: string }[] {
  const alleles = [
    [plantA.petalLightness.a, plantB.petalLightness.a],
    [plantA.petalLightness.a, plantB.petalLightness.b],
    [plantA.petalLightness.b, plantB.petalLightness.a],
    [plantA.petalLightness.b, plantB.petalLightness.b],
  ] as [number, number][]

  // Dominance: 30 > 60 > 90 (lower L wins)
  const DOMINANCE = [30, 60, 90]
  const counts = new Map<number, number>()
  for (const [a, b] of alleles) {
    const expressed = DOMINANCE.indexOf(a) <= DOMINANCE.indexOf(b) ? a : b
    counts.set(expressed, (counts.get(expressed) ?? 0) + 1)
  }

  const L_LABEL: Record<number, string> = { 30: 'dunkel', 60: 'mittel', 90: 'hell' }
  const result: { l: number; pct: number; label: string }[] = []
  for (const [l, count] of counts) {
    result.push({
      l,
      pct: Math.round((count / 4) * 100),
      label: L_LABEL[l] ?? String(l),
    })
  }
  return result.filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct)
}

// ─── Probability bar renderer ─────────────────────────────────────────────────

const SHAPE_DE: Record<string, string> = {
  round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
};
const CENTER_DE: Record<string, string> = {
  dot: t.centerDot, disc: t.centerDisc, stamen: t.centerStamen,
};

function renderBar(label: string, pct: number, swatchCss?: string): string {
  const barClass = pct > 49 ? 'high' : pct > 29 ? 'middle' : 'low'
  const swatch = swatchCss
    ? `<span class="prob-swatch" style="background:${swatchCss}"></span>`
    : ''
  return `<div class="prob-entry">
    ${swatch}
    <span class="prob-label">${label}</span>
    <span class="prob-bar-wrap"><span class="prob-bar ${barClass}" style="width:${pct}%"></span></span>
    <span class="prob-pct">${pct}%</span>
  </div>`
}

// ─── Estimate formatter ───────────────────────────────────────────────────────

function formatEstimate(e: BreedEstimate, plantA: Plant, plantB: Plant): string {
  // Colour probability bars
  const colorBars = hueProbs(plantA, plantB, e.avgS, e.avgL)
    .map(x => renderBar(x.label, x.pct, x.css))
    .join('')

  // Lightness probability bars
  const lightBars = lightnessProbs(plantA, plantB)
    .map(x => {
      const lCss = `hsl(0,0%,${x.l === 30 ? 25 : x.l === 60 ? 52 : 88}%)`
      return renderBar(x.label, x.pct, lCss)
    })
    .join('')

  const shapeBars = e.shapeProbs
    .map(x => renderBar(SHAPE_DE[x.shape] ?? x.shape, x.pct))
    .join('')

  const centerBars = e.centerProbs
    .map(x => renderBar(CENTER_DE[x.center] ?? x.center, x.pct))
    .join('')

  return `
    <div class="est-row" style="margin-bottom:4px">${t.estPetals(e.minP, e.maxP)}</div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupColor}</div>
      ${colorBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupLightness}</div>
      ${lightBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupShape}</div>
      ${shapeBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupCenter}</div>
      ${centerBars}
    </div>
    ${e.gradPct > 0 ? `<div class="est-grad">${t.estGradient(e.gradPct)}</div>` : ''}
    <div class="est-note">${t.estNoMutNote}</div>`
}

// ─── Internal dominantHue helper ─────────────────────────────────────────────
// Mirrors genetic.utils logic inline to avoid a circular import in this module.
import { COLOR_BUCKET_DOMINANCE, PALETTE_HUE_RANGES } from '../engine/genetic.utils';
const _W  = ACHROMATIC_HUE_WHITE;
const _GD = ACHROMATIC_HUE_GRAY_DARK;
const _GM = ACHROMATIC_HUE_GRAY_MID;
const _GL = ACHROMATIC_HUE_GRAY_LIGHT;

function _hueBucket(h: number): string {
  if (h === _W)  return 'white'
  if (h === _GD || h === _GM || h === _GL) return 'gray'
  if (PALETTE_HUE_RANGES.yellow(h)) return 'yellow'
  if (PALETTE_HUE_RANGES.red(h))    return 'red'
  if (PALETTE_HUE_RANGES.green(h))  return 'green'
  if (PALETTE_HUE_RANGES.blue(h))   return 'blue'
  if (PALETTE_HUE_RANGES.purple(h)) return 'purple'
  if (PALETTE_HUE_RANGES.pink(h))   return 'pink'
  return 'blue'
}

function _dominantHue(a: number, b: number): number {
  const ia = COLOR_BUCKET_DOMINANCE.indexOf(_hueBucket(a) as any)
  const ib = COLOR_BUCKET_DOMINANCE.indexOf(_hueBucket(b) as any)
  return ia <= ib ? a : b
}
