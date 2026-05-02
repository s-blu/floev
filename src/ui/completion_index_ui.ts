import { t } from '../model/i18n';
import { expressedShape, expressedColor, expressedEffect, expressedCenter, colorBucket } from '../engine/genetic/genetic_utils';
import {
  PETAL_SHAPES, PALETTE_HUES_BUCKETS, PALETTE_L, PALETTE_S, CENTER_TYPES,
} from '../model/genetic_model';
import type { CatalogEntry, PetalShape, PetalEffect, CenterType } from '../model/plant';
import type { ColorBucket } from '../model/genetic_model';
import {
  buildFoundBaseColorCells, buildFoundEffectCells, PETAL_COUNTS, DISPLAY_EFFECTS,
} from '../engine/discovery_utils';
import { SECRET_BUCKETS, BUCKET_ORDER } from './discovery_index_ui';
import { CENTER_TYPE_ICONS, renderEffectSwatch, renderHueSwatchStrip } from './icons';

// ─── Navigation state ─────────────────────────────────────────────────────────

let navShape: PetalShape | null = null;
let navHue: number | null = null;

// ─── Persistence ──────────────────────────────────────────────────────────────

const PANEL_OPEN_KEY = 'ci_panel_open';

function loadPanelOpen(): boolean {
  try { return localStorage.getItem(PANEL_OPEN_KEY) === 'true'; } catch { return false; }
}

function savePanelOpen(v: boolean): void {
  try { localStorage.setItem(PANEL_OPEN_KEY, String(v)); } catch { /* */ }
}

// ─── Catalog sets ─────────────────────────────────────────────────────────────

interface CatalogSets {
  knownShapes:  Set<PetalShape>;
  knownBuckets: Set<ColorBucket>;
  knownHues:    Set<number>;
  knownEffects: Set<PetalEffect>;
  knownCenters: Set<CenterType>;
  baseColorCells: Set<string>;
  effectCells:    Set<string>;
}

function buildCatalogSets(catalog: CatalogEntry[]): CatalogSets {
  const knownShapes  = new Set<PetalShape>();
  const knownBuckets = new Set<ColorBucket>();
  const knownHues    = new Set<number>();
  const knownEffects = new Set<PetalEffect>();
  const knownCenters = new Set<CenterType>();

  for (const e of catalog) {
    knownShapes.add(expressedShape(e.plant.petalShape));
    const color = expressedColor(e.plant.petalHue, e.plant.petalLightness);
    knownHues.add(color.h);
    knownBuckets.add(colorBucket(color));
    const effect = expressedEffect(e.plant.petalEffect);
    if (effect !== 'none') knownEffects.add(effect);
    knownCenters.add(expressedCenter(e.plant.centerType));
  }

  return {
    knownShapes, knownBuckets, knownHues, knownEffects, knownCenters,
    baseColorCells: buildFoundBaseColorCells(catalog),
    effectCells:    buildFoundEffectCells(catalog),
  };
}

// ─── Cell / total helpers ─────────────────────────────────────────────────────

const CELLS_PER_SWATCH = PETAL_COUNTS.length * CENTER_TYPES.length; // 18

function huesForBucket(bucket: ColorBucket): number[] {
  if (bucket === 'white') return [1];
  if (bucket === 'gray')  return [2];
  return [...((PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [])];
}

function lightnessesForHue(hue: number): readonly number[] {
  return hue === 1 ? [100] : (PALETTE_L as readonly number[]);
}

function totalCellsForHue(hue: number): number {
  return (lightnessesForHue(hue).length + DISPLAY_EFFECTS.length) * CELLS_PER_SWATCH;
}

function foundCellsForHue(shape: PetalShape, hue: number, sets: CatalogSets): number {
  let count = 0;
  for (const l of lightnessesForHue(hue))
    for (const cnt of PETAL_COUNTS)
      for (const center of CENTER_TYPES)
        if (sets.baseColorCells.has(`${shape}_${hue}_${l}_${cnt}_${center}`)) count++;
  for (const ef of DISPLAY_EFFECTS)
    for (const cnt of PETAL_COUNTS)
      for (const center of CENTER_TYPES)
        if (sets.effectCells.has(`${shape}_${hue}_${ef}_${cnt}_${center}`)) count++;
  return count;
}

const CELLS_PER_SHAPE = BUCKET_ORDER.reduce(
  (sum, b) => sum + huesForBucket(b).reduce((s, h) => s + totalCellsForHue(h), 0), 0
); // 1854

// ─── Status ───────────────────────────────────────────────────────────────────

function statusCls(found: number, total: number): string {
  if (found === 0)    return 'ci-status--empty';
  if (found >= total) return 'ci-status--complete';
  return 'ci-status--partial';
}

// ─── Hue display helpers ──────────────────────────────────────────────────────

function hueGroupName(hue: number): string {
  if (hue === 1) return t.colorBucketLabels['white'] ?? 'Weiß';
  if (hue === 2) return t.colorBucketLabels['gray']  ?? 'Grau';
  return (t.colorLabel as any)[hue]?.hueName ?? String(hue);
}

function swatchColorCss(hue: number, l: number): string {
  if (hue === 1) return 'hsl(0,0%,97%)';
  if (hue === 2) return `hsl(0,0%,${l}%)`;
  return `hsl(${hue},${PALETTE_S}%,${l}%)`;
}

function swatchColorName(hue: number, l: number): string {
  if (hue === 1) return (t.colorLabel as any)[1]?.['0']?.[100] ?? (t.colorBucketLabels['white'] ?? '');
  if (hue === 2) return (t.colorLabel as any)[2]?.[0]?.[l]    ?? '';
  return (t.colorLabel as any)[hue]?.[PALETTE_S]?.[l] ?? '';
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function renderProgressBar(found: number, total: number): string {
  const pct = total > 0 ? Math.round(found / total * 100) : 0;
  const doneCls = pct >= 100 ? ' ci-progress-fill--done' : '';
  return `<div class="ci-progress-row">
    <div class="ci-progress-bar"><div class="ci-progress-fill${doneCls}" style="width:${pct}%"></div></div>
    <span class="ci-progress-pct">${pct}%</span>
  </div>`;
}

// ─── Ebene 1: Shape list ──────────────────────────────────────────────────────

function renderShapeList(sets: CatalogSets): string {
  const totalFound = PETAL_SHAPES.reduce(
    (sum, shape) => sum + BUCKET_ORDER.reduce(
      (s, b) => s + huesForBucket(b).reduce((ss, h) => ss + foundCellsForHue(shape, h, sets), 0), 0
    ), 0
  );
  const totalCells = CELLS_PER_SHAPE * PETAL_SHAPES.length;
  const rows = PETAL_SHAPES.map(shape => {
    if (!sets.knownShapes.has(shape)) {
      return `<div class="ci-row ci-row--secret"><span class="ci-status ci-status--empty"></span><span class="ci-row-label ci-row-label--undiscovered">${t.completionIndexUndiscovered}</span></div>`;
    }
    const found = BUCKET_ORDER.reduce(
      (sum, b) => sum + huesForBucket(b).reduce((s, h) => s + foundCellsForHue(shape, h, sets), 0), 0
    );
    const cls  = statusCls(found, CELLS_PER_SHAPE);
    const name = t.shapeLabels[shape] ?? shape;
    return `
      <button class="ci-row ci-row--nav" data-ci-action="select-shape" data-ci-shape="${shape}">
        <span class="ci-status ${cls}"></span>
        <span class="ci-row-label">${name}</span>
        <span class="ci-row-counter">${found}/${CELLS_PER_SHAPE}</span>
        <span class="ci-row-arrow">›</span>
      </button>`;
  }).join('');
  return renderProgressBar(totalFound, totalCells) + rows;
}

// ─── Ebene 2: Hue list ────────────────────────────────────────────────────────

function renderHueList(shape: PetalShape, sets: CatalogSets): string {
  const shapeLabel = t.shapeLabels[shape] ?? shape;
  const shapeFound = BUCKET_ORDER.reduce(
    (sum, b) => sum + huesForBucket(b).reduce((s, h) => s + foundCellsForHue(shape, h, sets), 0), 0
  );
  const parts: string[] = [
    `<button class="ci-back-btn" data-ci-action="back-to-shapes">← ${shapeLabel}</button>`,
    renderProgressBar(shapeFound, CELLS_PER_SHAPE),
  ];

  for (const bucket of BUCKET_ORDER) {
    const bucketKnown = !SECRET_BUCKETS.has(bucket) || sets.knownBuckets.has(bucket);
    const bucketLabel = bucketKnown
      ? (t.colorBucketLabels[bucket] ?? bucket)
      : `<span class="ci-row-label--undiscovered">${t.completionIndexUndiscovered}</span>`;
    parts.push(`<div class="ci-bucket-header">${bucketLabel}</div>`);

    if (!bucketKnown) {
      parts.push(`<div class="ci-row ci-row--secret"><span class="ci-status ci-status--empty"></span><span class="ci-row-label ci-row-label--undiscovered">${t.completionIndexUndiscovered}</span></div>`);
      continue;
    }

    for (const hue of huesForBucket(bucket)) {
      if (!sets.knownHues.has(hue)) {
        parts.push(`<div class="ci-row ci-row--secret">
          <div class="di-mini-swatches"><span class="di-mini-swatch di-mini-swatch--effect"></span></div>
          <span class="ci-status ci-status--empty"></span>
          <span class="ci-row-label ci-row-label--undiscovered">${t.completionIndexUndiscovered}</span>
        </div>`);
        continue;
      }
      const found = foundCellsForHue(shape, hue, sets);
      const total = totalCellsForHue(hue);
      const cls   = statusCls(found, total);
      parts.push(`
        <button class="ci-row ci-row--nav" data-ci-action="select-hue" data-ci-hue="${hue}">
          ${renderHueSwatchStrip(hue)}
          <span class="ci-status ${cls}"></span>
          <span class="ci-row-label">${hueGroupName(hue)}</span>
          <span class="ci-row-counter">${found}/${total}</span>
          <span class="ci-row-arrow">›</span>
        </button>`);
    }
  }
  return parts.join('');
}

// ─── Ebene 3: Hue detail ──────────────────────────────────────────────────────

function renderMatrix(
  isCellFound: (cnt: number, center: CenterType) => boolean,
  sets: CatalogSets,
): string {
  const colHdrs = PETAL_COUNTS.map(c =>
    `<span class="ci-matrix-col-hdr">${c}</span>`
  ).join('');

  const rows = CENTER_TYPES.map(center => {
    const known = sets.knownCenters.has(center);
    const hdr   = known ? (CENTER_TYPE_ICONS[center] ?? center) : '?';
    const title = known ? (t.centerTypeLabels[center] ?? '') : '';
    const dots  = PETAL_COUNTS.map(cnt => {
      if (!known) return `<span class="ci-dot ci-dot--secret"></span>`;
      return `<span class="ci-dot ${isCellFound(cnt, center) ? 'ci-dot--found' : 'ci-dot--missing'}"></span>`;
    }).join('');
    return `<div class="ci-matrix-row">
      <span class="ci-matrix-row-hdr" title="${title}">${hdr}</span>${dots}
    </div>`;
  }).join('');

  return `<div class="ci-matrix">
    <div class="ci-matrix-col-headers"><span class="ci-matrix-corner"></span>${colHdrs}</div>
    ${rows}
  </div>`;
}

function renderSwatchBlock(
  iconHtml: string,
  label: string,
  found: number,
  isCellFound: (cnt: number, center: CenterType) => boolean,
  sets: CatalogSets,
): string {
  const cls = statusCls(found, CELLS_PER_SWATCH);
  return `
    <div class="ci-swatch-row">
      <div class="ci-swatch-header">
        ${iconHtml}
        <span class="ci-swatch-label">${label}</span>
        <span class="ci-status ${cls}"></span>
        <span class="ci-swatch-counter">${found}/${CELLS_PER_SWATCH}</span>
      </div>
      ${renderMatrix(isCellFound, sets)}
    </div>`;
}

function renderHueDetail(shape: PetalShape, hue: number, sets: CatalogSets): string {
  const shapeLabel = t.shapeLabels[shape] ?? shape;
  const hueName    = hueGroupName(hue);
  const hueFound   = foundCellsForHue(shape, hue, sets);
  const hueTotal   = totalCellsForHue(hue);
  const parts: string[] = [
    `<button class="ci-back-btn" data-ci-action="back-to-hues">← ${shapeLabel} › ${hueName}</button>`,
    renderProgressBar(hueFound, hueTotal),
  ];

  for (const l of lightnessesForHue(hue)) {
    const css  = swatchColorCss(hue, l);
    const name = swatchColorName(hue, l) || '?';
    let found = 0;
    for (const cnt of PETAL_COUNTS)
      for (const center of CENTER_TYPES)
        if (sets.baseColorCells.has(`${shape}_${hue}_${l}_${cnt}_${center}`)) found++;
    parts.push(renderSwatchBlock(
      `<div class="di-mini-swatches"><span class="di-mini-swatch di-mini-swatch--effect" style="background:${css}"></span></div>`,
      name,
      found,
      (cnt, center) => sets.baseColorCells.has(`${shape}_${hue}_${l}_${cnt}_${center}`),
      sets,
    ));
  }

  for (const ef of DISPLAY_EFFECTS) {
    const effectKnown = sets.knownEffects.has(ef);
    const label = effectKnown
      ? (t.effectLabels[ef] ?? ef)
      : `<span class="ci-row-label--undiscovered">${t.completionIndexUndiscovered}</span>`;
    const icon  = effectKnown
      ? renderEffectSwatch(ef)
      : `<div class="di-mini-swatches"><span class="di-mini-swatch di-mini-swatch--effect"></span></div>`;
    let found = 0;
    for (const cnt of PETAL_COUNTS)
      for (const center of CENTER_TYPES)
        if (sets.effectCells.has(`${shape}_${hue}_${ef}_${cnt}_${center}`)) found++;
    parts.push(renderSwatchBlock(
      icon,
      label,
      found,
      (cnt, center) => sets.effectCells.has(`${shape}_${hue}_${ef}_${cnt}_${center}`),
      sets,
    ));
  }

  return parts.join('');
}

// ─── Current view dispatch ────────────────────────────────────────────────────

function renderCurrentView(catalog: CatalogEntry[]): string {
  const sets = buildCatalogSets(catalog);
  if (navShape === null) return renderShapeList(sets);
  if (navHue   === null) return renderHueList(navShape, sets);
  return renderHueDetail(navShape, navHue, sets);
}

// ─── Event delegation ─────────────────────────────────────────────────────────

function attachNavListeners(panel: HTMLElement, catalog: CatalogEntry[]): void {
  panel.addEventListener('click', e => {
    const target = (e.target as HTMLElement).closest('[data-ci-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.ciAction;
    if      (action === 'select-shape')   { navShape = target.dataset.ciShape as PetalShape; navHue = null; }
    else if (action === 'select-hue')     { navHue = Number(target.dataset.ciHue); }
    else if (action === 'back-to-shapes') { navShape = null; navHue = null; }
    else if (action === 'back-to-hues')   { navHue = null; }
    else return;
    const body = panel.querySelector('.ci-body') as HTMLElement | null;
    if (body) body.innerHTML = renderCurrentView(catalog);
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function renderCompletionIndex(catalog: CatalogEntry[], open = false): HTMLElement {
  const el = document.createElement('details');
  el.className = 'ci-panel';
  el.id = 'completion-index';

  if (open || loadPanelOpen()) el.setAttribute('open', '');
  el.addEventListener('toggle', () => savePanelOpen(el.open));

  const sets       = buildCatalogSets(catalog);
  const totalCells = CELLS_PER_SHAPE * PETAL_SHAPES.length;
  const totalFound = PETAL_SHAPES.reduce(
    (sum, shape) => sum + BUCKET_ORDER.reduce(
      (s, b) => s + huesForBucket(b).reduce((ss, h) => ss + foundCellsForHue(shape, h, sets), 0), 0
    ), 0
  );
  const totalPct = totalCells > 0 ? Math.round(totalFound / totalCells * 100) : 0;

  el.innerHTML = `
    <summary class="ci-summary">
      <span class="ci-summary-title">${t.completionIndexTitle}</span>
      <span class="ci-summary-stats"><span class="ci-summary-pct">${totalPct}% · </span>${t.completionIndexSummary(totalFound, totalCells)}</span>
    </summary>
    <div class="ci-body">${renderCurrentView(catalog)}</div>`;

  attachNavListeners(el, catalog);
  return el;
}
