import { dominantHue } from '../engine/genetic/dominance_utils';
import { ACHROMATIC_HUE_WHITE, ACHROMATIC_HUE_GRAY } from '../model/genetic_model';
import { t } from '../model/i18n';
import type { Plant, BreedEstimate } from '../model/plant';
import { buildFamilySwatchStyle } from './swatch_utils';


// ─── Hue helpers ─────────────────────────────────────────────────────────────
function achromaticCSS(h: number): string | null {
  if (h === ACHROMATIC_HUE_WHITE) return 'background:hsl(0,0%,97%)';
  if (h === ACHROMATIC_HUE_GRAY)  return `background:${buildFamilySwatchStyle({ h: 0, s: 0, l: 0 })}`;
  return null;
}

// ─── Colour probability bars ──────────────────────────────────────────────────
/**
 * Computes the probability distribution over expressed hue values from
 * the four possible allele combinations of both parents.
 * Returns entries sorted by descending probability, showing only hues > 0%.
 */
function hueProbs(
  plantA: Plant, plantB: Plant, avgS: number
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
      css: achromaticCSS(h) ?? `background: ${buildFamilySwatchStyle({ h, s: avgS, l: 60 })}`,
      label: (t.colorLabel as any)[h]?.hueName ?? '',
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
    const expressed = DOMINANCE.indexOf(a) >= DOMINANCE.indexOf(b) ? a : b;
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
function renderBar(label: string, pct: number, swatchStyle?: string, swatchTitle?: string): string {
  const barClass = pct > 49 ? 'high' : pct > 29 ? 'middle' : 'low';
  const swatch = swatchStyle
    ? `<span class="prob-swatch" style="${swatchStyle}"${swatchTitle ? ` title="${swatchTitle}"` : ''}></span>`
    : '';
  return `<div class="prob-entry">
    ${swatch}
    <span class="prob-label">${label}</span>
    <span class="prob-bar-wrap"><span class="prob-bar ${barClass}" style="width:${pct}%"></span></span>
    <span class="prob-pct">${pct}%</span>
  </div>`;
}

// ─── Estimate formatter ───────────────────────────────────────────────────────
export function formatEstimate(e: BreedEstimate, plantA: Plant, plantB: Plant): string {
  const colorBars = hueProbs(plantA, plantB, e.avgS)
    .map(x => renderBar('', x.pct, x.css, x.label))
    .join('');

  const lightBars = lightnessProbs(plantA, plantB)
    .map(x => {
      const lCss = `background:hsl(0,0%,${x.l === 30 ? 25 : x.l === 60 ? 52 : 88}%)`;
      return renderBar(x.label, x.pct, lCss);
    })
    .join('');

  const shapeBars = e.shapeProbs
    .map(x => renderBar(SHAPE_DE[x.shape] ?? x.shape, x.pct))
    .join('');

  const centerBars = e.centerProbs
    .map(x => renderBar(CENTER_DE[x.center] ?? x.center, x.pct))
    .join('');

  const nonNoneEffects = e.effectProbs.filter(x => x.effect !== 'none');
  const effectBars = nonNoneEffects
    .map(x => renderBar(t.effectLabels[x.effect] ?? x.effect, x.pct))
    .join('');

  const petalCountBars = e.petalCountProbs
    .map(x => renderBar(`${x.count}`, x.pct))
    .join('');

  return `
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupColor}</div>
      ${colorBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupLightness}</div>
      ${lightBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupPetalCount}</div>
      ${petalCountBars}
    </div>
    ${nonNoneEffects.length > 0 ? `<div class="prob-group">
      <div class="prob-group-label">${t.estGroupEffect}</div>
      ${effectBars}
    </div>` : ''}
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupShape}</div>
      ${shapeBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">${t.estGroupCenter}</div>
      ${centerBars}
    </div>

    <div class="est-note">${t.estNoMutNote}</div>`;
}
