import { computeBreedEstimate } from '../engine/breed';
import { renderPlantSVG } from '../engine/renderer/renderer';
import type { BreedEstimate } from '../model/plant';
import { state, render, breedState } from './ui';
import { t } from '../model/i18n';
import {
  dominantHue, dominantLightness,
  isHomozygous,
} from '../engine/genetic.utils';
import {
  PALETTE_S,
} from '../engine/genetics';
import {
  ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK,
  ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT,
} from '../engine/genetics';
import type { Plant, ChromaticL } from '../model/plant';

// ─── Breeding panel ───────────────────────────────────────────────────────────
export function renderBreedPanel(): void {
  const slotA = document.getElementById('breed-a');
  const slotB = document.getElementById('breed-b');
  const preview = document.getElementById('breed-preview');
  const btn = document.getElementById('breed-btn') as HTMLButtonElement | null;
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

// ─── Allele chip helpers ──────────────────────────────────────────────────────

/** Convert a raw hue allele value to a displayable HSL string. */
function hueToColor(h: number, l: ChromaticL): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'hsl(0,0%,97%)'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'hsl(0,0%,15%)'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'hsl(0,0%,45%)'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)'
  return `hsl(${Math.round(h)},${PALETTE_S}%,${l}%)`
}

/** Human-readable label for a hue allele. */
function hueLabel(h: number): string {
  if (h === ACHROMATIC_HUE_WHITE)      return 'weiß'
  if (h === ACHROMATIC_HUE_GRAY_DARK)  return 'dunkelgrau'
  if (h === ACHROMATIC_HUE_GRAY_MID)   return 'grau'
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hellgrau'
  return `${Math.round(h)}°`
}

/**
 * Renders the two allele chips for one parent's hue locus.
 * The dominant allele gets the "expressed" marker; the other is dimmed.
 */
function renderHueAllelePair(hA: number, hB: number, lA: ChromaticL, lB: ChromaticL): string {
  const dominantIsA = dominantHue(hA, hB) === hA
  const chips = [
    { h: hA, l: lA, isDominant: dominantIsA },
    { h: hB, l: lB, isDominant: !dominantIsA },
  ]
  return chips.map(chip => {
    const bg = hueToColor(chip.h, chip.l)
    const border = chip.isDominant ? '2px solid var(--text)' : '1.5px solid var(--border2)'
    const opacity = chip.isDominant ? '1' : '0.45'
    const title = chip.isDominant
      ? `${hueLabel(chip.h)} — ${t.estAlleleDominant}`
      : `${hueLabel(chip.h)} — ${t.estAlleleRecessive}`
    return `<span class="allele-chip" style="background:${bg};border:${border};opacity:${opacity}" title="${title}"></span>`
  }).join('')
}

/**
 * Renders the two lightness allele chips for one parent.
 * 30 = dark, 60 = mid, 90 = light.
 */
function renderLightnessAllelePair(lA: ChromaticL, lB: ChromaticL): string {
  const dominantIsA = dominantLightness(lA, lB) === lA
  const chips = [
    { l: lA, isDominant: dominantIsA },
    { l: lB, isDominant: !dominantIsA },
  ]
  const lightLabel = (l: ChromaticL) => l === 30 ? 'dunkel' : l === 60 ? 'mittel' : 'hell'
  return chips.map(chip => {
    const bg = `hsl(0,0%,${chip.l === 30 ? 25 : chip.l === 60 ? 52 : 88}%)`
    const border = chip.isDominant ? '2px solid var(--text)' : '1.5px solid var(--border2)'
    const opacity = chip.isDominant ? '1' : '0.45'
    const title = chip.isDominant
      ? `${lightLabel(chip.l)} — ${t.estAlleleDominant}`
      : `${lightLabel(chip.l)} — ${t.estAlleleRecessive}`
    return `<span class="allele-chip lightness-chip" style="background:${bg};border:${border};opacity:${opacity}" title="${title}"></span>`
  }).join('')
}

function renderAlleleRow(plantA: Plant, plantB: Plant): string {
  const [hAa, hAb] = [plantA.petalHue.a, plantA.petalHue.b]
  const [hBa, hBb] = [plantB.petalHue.a, plantB.petalHue.b]
  const [lAa, lAb] = [plantA.petalLightness.a, plantA.petalLightness.b]
  const [lBa, lBb] = [plantB.petalLightness.a, plantB.petalLightness.b]

  return `
    <div class="allele-section">
      <div class="allele-section-label">${t.estHiddenAlleles}</div>
      <div class="allele-parents-row">
        <div class="allele-parent">
          <span class="allele-parent-label">${t.breedParent1}</span>
          <div class="allele-chips-row">
            ${renderHueAllelePair(hAa, hAb, lAa, lAb)}
            <span class="allele-sep">·</span>
            ${renderLightnessAllelePair(lAa, lAb)}
          </div>
        </div>
        <div class="allele-parent">
          <span class="allele-parent-label">${t.breedParent2}</span>
          <div class="allele-chips-row">
            ${renderHueAllelePair(hBa, hBb, lBa, lBb)}
            <span class="allele-sep">·</span>
            ${renderLightnessAllelePair(lBa, lBb)}
          </div>
        </div>
      </div>
    </div>`
}

// ─── Estimate formatting ──────────────────────────────────────────────────────
const SHAPE_DE: Record<string, string> = {
  round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
};
const CENTER_DE: Record<string, string> = {
  dot: t.centerDot, disc: t.centerDisc, stamen: t.centerStamen,
};

function formatEstimate(e: BreedEstimate, plantA: Plant, plantB: Plant): string {
  const sw = (h: number) =>
    `<span class="swatch" style="background:hsl(${Math.round(h)},${Math.round(e.avgS)}%,${Math.round(e.avgL)}%)"></span>`;

  const shapeBars = e.shapeProbs
    .map(x => renderProbabilityEntry(SHAPE_DE[x.shape] ?? x.shape, x))
    .join('');

  const centerBars = e.centerProbs
    .map(x => renderProbabilityEntry(CENTER_DE[x.center] ?? x.center, x))
    .join('');

  return `
    ${renderAlleleRow(plantA, plantB)}
    <div class="est-row">${sw(e.minH)}${sw(e.midH)}${sw(e.maxH)}<span>${t.estColorRange}</span></div>
    <div class="est-row" style="margin-bottom:4px">${t.estPetals(e.minP, e.maxP)}</div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupShape}</div>
      ${shapeBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupCenter}</div>
      ${centerBars}
    </div>
    ${e.gradPct > 0 ? `<div class="est-grad">${t.estGradient(e.gradPct)}</div>` : ''}
    <div class="est-note">${t.estNoMutNote}</div>`;
}

function renderProbabilityEntry(label: string, x: { pct: number }): string {
  return `<div class="prob-entry">
    <span class="prob-label">${label}</span>
    <span class="prob-bar-wrap"><span class="prob-bar ${x.pct > 49 ? 'high' : x.pct > 29 ? 'middle' : 'low'}" style="width:${x.pct}%"></span></span>
    <span class="prob-pct">${x.pct}%</span>
  </div>`;
}
