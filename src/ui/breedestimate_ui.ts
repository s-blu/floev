import { dominantHue } from '../engine/genetic/dominance_utils';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY_DARK, ACHROMATIC_HUE_GRAY_MID, ACHROMATIC_HUE_GRAY_LIGHT } from '../model/genetic_model';
import { de as t } from '../model/i18n/de';
import type { Plant, BreedEstimate } from '../model/plant';


// ─── Hue helpers ─────────────────────────────────────────────────────────────
function hueToCSS(h: number, s: number, l: number): string {
  if (h === ACHROMATIC_HUE_WHITE) return 'hsl(0,0%,97%)';
  if (h === ACHROMATIC_HUE_GRAY_DARK) return 'hsl(0,0%,15%)';
  if (h === ACHROMATIC_HUE_GRAY_MID) return 'hsl(0,0%,45%)';
  if (h === ACHROMATIC_HUE_GRAY_LIGHT) return 'hsl(0,0%,72%)';
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`;
}

// ─── Colour probability bars ──────────────────────────────────────────────────
/**
 * Computes the probability distribution over expressed hue values from
 * the four possible allele combinations of both parents.
 * Returns entries sorted by descending probability, showing only hues > 0%.
 */
function hueProbs(
  plantA: Plant, plantB: Plant, avgS: number, avgL: number
): { h: number; pct: number; css: string; label: string; }[] {
  const alleles = [
    [plantA.petalHue.a, plantB.petalHue.a],
    [plantA.petalHue.a, plantB.petalHue.b],
    [plantA.petalHue.b, plantB.petalHue.a],
    [plantA.petalHue.b, plantB.petalHue.b],
  ] as [number, number][];

  const counts = new Map<number, number>();
  for (const [a, b] of alleles) {
    const expressed = dominantHue(a, b);
    counts.set(expressed, (counts.get(expressed) ?? 0) + 1);
  }

  const result: { h: number; pct: number; css: string; label: string; }[] = [];
  for (const [h, count] of counts) {
    result.push({
      h,
      pct: Math.round((count / 4) * 100),
      css: hueToCSS(h, avgS, avgL),
      label: "",
    });
  }
  return result.filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct);
}

// ─── Lightness probability bars ───────────────────────────────────────────────
function lightnessProbs(
  plantA: Plant, plantB: Plant
): { l: number; pct: number; label: string; }[] {
  const alleles = [
    [plantA.petalLightness.a, plantB.petalLightness.a],
    [plantA.petalLightness.a, plantB.petalLightness.b],
    [plantA.petalLightness.b, plantB.petalLightness.a],
    [plantA.petalLightness.b, plantB.petalLightness.b],
  ] as [number, number][];

  const DOMINANCE = [30, 60, 90];
  const counts = new Map<number, number>();
  for (const [a, b] of alleles) {
    const expressed = DOMINANCE.indexOf(a) <= DOMINANCE.indexOf(b) ? a : b;
    counts.set(expressed, (counts.get(expressed) ?? 0) + 1);
  }

  const result: { l: number; pct: number; label: string; }[] = [];
  for (const [l, count] of counts) {
    result.push({
      l,
      pct: Math.round((count / 4) * 100),
      label: "",
    });
  }
  return result.filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct);
}

// ─── Probability bar renderer ─────────────────────────────────────────────────
const SHAPE_DE: Record<string, string> = {
  round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
};
const CENTER_DE: Record<string, string> = {
  dot: t.centerDot, disc: t.centerDisc, stamen: t.centerStamen,
};
function renderBar(label: string, pct: number, swatchCss?: string): string {
  const barClass = pct > 49 ? 'high' : pct > 29 ? 'middle' : 'low';
  const swatch = swatchCss
    ? `<span class="prob-swatch" style="background:${swatchCss}"></span>`
    : '';
  return `<div class="prob-entry">
    ${swatch}
    <span class="prob-label">${label}</span>
    <span class="prob-bar-wrap"><span class="prob-bar ${barClass}" style="width:${pct}%"></span></span>
    <span class="prob-pct">${pct}%</span>
  </div>`;
}

// ─── Gradient swatch: L90 → L30 of the expected hue ─────────────────────────
function gradientSwatchCSS(avgH: number, avgS: number): string {
  if (avgS === 0) {
    return `linear-gradient(to right, hsl(0,0%,90%), hsl(0,0%,18%))`;
  }
  return `linear-gradient(to right, hsl(${Math.round(avgH)},${Math.round(avgS)}%,90%), hsl(${Math.round(avgH)},${Math.round(avgS)}%,30%))`;
}

// ─── Estimate formatter ───────────────────────────────────────────────────────
export function formatEstimate(e: BreedEstimate, plantA: Plant, plantB: Plant): string {
  const colorBars = hueProbs(plantA, plantB, e.avgS, e.avgL)
    .map(x => renderBar(x.label, x.pct, x.css))
    .join('');

  const lightBars = lightnessProbs(plantA, plantB)
    .map(x => {
      const lCss = `hsl(0,0%,${x.l === 30 ? 25 : x.l === 60 ? 52 : 88}%)`;
      return renderBar(x.label, x.pct, lCss);
    })
    .join('');

  const shapeBars = e.shapeProbs
    .map(x => renderBar(SHAPE_DE[x.shape] ?? x.shape, x.pct))
    .join('');

  const centerBars = e.centerProbs
    .map(x => renderBar(CENTER_DE[x.center] ?? x.center, x.pct))
    .join('');

  const gradSwatch = gradientSwatchCSS(e.midH, e.avgS);

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
    ${e.gradPct > 0
      ? `<div class="est-grad">
           <span class="prob-swatch" style="background:${gradSwatch};width:36px"></span>
           ${t.estGradient(e.gradPct)}
         </div>`
      : ''}
    <div class="est-note">${t.estNoMutNote}</div>`;
}
