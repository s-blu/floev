import { t } from '../model/i18n';
import { expressedColor, colorBucket } from '../engine/genetic/genetic_utils';
import {
  PETAL_SHAPES, PALETTE_HUES_BUCKETS, PALETTE_S, PALETTE_L, CENTER_TYPES,
} from '../model/genetic_model';
import type { CatalogEntry } from '../model/plant';
import type { ColorBucket } from '../model/genetic_model';
import {
  buildDiscoveredShapeCounts, buildDiscoveredShapeCenters, buildDiscoveredShapeEffects,
  buildDiscoveredColors, buildDiscoveredShapeColors, getBucketKeys, PETAL_COUNTS, DISPLAY_EFFECTS,
} from '../engine/discovery_utils';
import { CENTER_TYPE_ICONS, renderEffectSwatch, renderBucketSwatchStrip } from './icons';

export const SECRET_BUCKETS = new Set<ColorBucket>(['purple', 'blue', 'gray']);
export const BUCKET_ORDER: ColorBucket[] = ['red', 'yellowgreen', 'pink', 'purple', 'blue', 'gray', 'white'];

// ─── Shape section (count / center / effect) — three responsive sub-grids ────

function renderShapeSection(catalog: CatalogEntry[]): string {
  const discoveredCounts  = buildDiscoveredShapeCounts(catalog);
  const discoveredCenters = buildDiscoveredShapeCenters(catalog);
  const discoveredEffects = buildDiscoveredShapeEffects(catalog);

  const discoveredShapes = new Set(
    PETAL_SHAPES.filter(s =>
      PETAL_COUNTS.some(c  => discoveredCounts.has(`${s}_${c}`))  ||
      CENTER_TYPES.some(ct => discoveredCenters.has(`${s}_${ct}`)) ||
      DISPLAY_EFFECTS.some(ef => discoveredEffects.has(`${s}_${ef}`))
    )
  );

  const SUBTITLE_ROW = 1;
  const HEADER_ROW   = 2;
  const DATA_ROW     = 3;

  function cell(cls: string, col: number, row: number, title = '', content = ''): string {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<span class="${cls}"${titleAttr} style="grid-column:${col};grid-row:${row}">${content}</span>`;
  }
  function dot(known: boolean, found: boolean, col: number, row: number, title: string): string {
    const cls = !known ? 'di-count-dot di-dot--secret' : found ? 'di-count-dot di-dot--found' : 'di-count-dot di-dot--missing';
    return cell(cls, col, row, known ? title : '');
  }
  function shapeLabels(): string {
    return PETAL_SHAPES.map((shape, si) => {
      const known = discoveredShapes.has(shape);
      const name  = known ? (t.shapeLabels[shape] ?? shape) : '?';
      const cls   = known ? 'di-shape-label' : 'di-shape-label di-shape-label--secret';
      return cell(cls, 1, DATA_ROW + si, '', name);
    }).join('');
  }

  // ── Count sub-grid ────────────────────────────────────────────────────────
  const nCounts = PETAL_COUNTS.length;
  const countGrid = `<div class="di-shape-grid" style="grid-template-columns:auto repeat(${nCounts}, 17px)">
    <span class="di-matrix-subtitle" style="grid-column:2/${2 + nCounts};grid-row:${SUBTITLE_ROW}">${t.discoveryIndexMatrixCount}</span>
    ${PETAL_COUNTS.map((c, i) => cell('di-col-header', 2 + i, HEADER_ROW, '', String(c))).join('')}
    ${shapeLabels()}
    ${PETAL_SHAPES.map((shape, si) => {
      const row   = DATA_ROW + si;
      const known = discoveredShapes.has(shape);
      const name  = known ? (t.shapeLabels[shape] ?? shape) : '?';
      return PETAL_COUNTS.map((c, i) => dot(known, discoveredCounts.has(`${shape}_${c}`), 2 + i, row, `${name}, ${c}`)).join('');
    }).join('')}
  </div>`;

  // ── Center sub-grid ───────────────────────────────────────────────────────
  const nCenters = CENTER_TYPES.length;
  const centerGrid = `<div class="di-shape-grid" style="grid-template-columns:auto repeat(${nCenters}, 17px)">
    <span class="di-matrix-subtitle" style="grid-column:2/${2 + nCenters};grid-row:${SUBTITLE_ROW}">${t.discoveryIndexMatrixCenter}</span>
    ${CENTER_TYPES.map((ct, i) => {
      const discovered = PETAL_SHAPES.some(s => discoveredCenters.has(`${s}_${ct}`));
      const content = discovered ? CENTER_TYPE_ICONS[ct] ?? ct : '?';
      const title   = discovered ? (t.centerTypeLabels[ct] ?? ct) : '';
      return cell('di-col-header', 2 + i, HEADER_ROW, title, content);
    }).join('')}
    ${shapeLabels()}
    ${PETAL_SHAPES.map((shape, si) => {
      const row   = DATA_ROW + si;
      const known = discoveredShapes.has(shape);
      const name  = known ? (t.shapeLabels[shape] ?? shape) : '?';
      return CENTER_TYPES.map((ct, i) => dot(known, discoveredCenters.has(`${shape}_${ct}`), 2 + i, row, `${name} · ${t.centerTypeLabels[ct] ?? ct}`)).join('');
    }).join('')}
  </div>`;

  // ── Effect sub-grid ───────────────────────────────────────────────────────
  const nEffects = DISPLAY_EFFECTS.length;
  const effectGrid = `<div class="di-shape-grid" style="grid-template-columns:auto repeat(${nEffects}, 17px)">
    <span class="di-matrix-subtitle" style="grid-column:2/${2 + nEffects};grid-row:${SUBTITLE_ROW}">${t.discoveryIndexMatrixEffect}</span>
    ${DISPLAY_EFFECTS.map((ef, i) => {
      const discovered = PETAL_SHAPES.some(s => discoveredEffects.has(`${s}_${ef}`));
      const content = discovered ? renderEffectSwatch(ef) : '?';
      const title   = discovered ? (t.effectLabels[ef] ?? ef) : '';
      return cell('di-col-header', 2 + i, HEADER_ROW, title, content);
    }).join('')}
    ${shapeLabels()}
    ${PETAL_SHAPES.map((shape, si) => {
      const row   = DATA_ROW + si;
      const known = discoveredShapes.has(shape);
      const name  = known ? (t.shapeLabels[shape] ?? shape) : '?';
      return DISPLAY_EFFECTS.map((ef, i) => dot(known, discoveredEffects.has(`${shape}_${ef}`), 2 + i, row, `${name} · ${t.effectLabels[ef] ?? ef}`)).join('');
    }).join('')}
  </div>`;

  return `<div class="di-block">
    <div class="di-block-title">${t.discoveryIndexSectionShapes}</div>
    <div class="di-shape-groups">
      ${countGrid}
      ${centerGrid}
      ${effectGrid}
    </div>
  </div>`;
}

// ─── Color bucket section ─────────────────────────────────────────────────────

function colorSwatchHtml(cssColor: string, name: string, found: boolean): string {
  if (found) {
    return `<span class="di-swatch" style="background:${cssColor}" title="${name}"></span>`;
  }
  return `<span class="di-swatch di-swatch--missing" title="?"></span>`;
}

function renderBucketHueGroups(bucket: ColorBucket, discoveredColors: Set<string>): string {
  if (bucket === 'white') {
    const css = 'hsl(0,0%,97%)';
    const name = (t.colorLabel as any)[1]?.['0']?.[100] ?? (t.colorBucketLabels['white'] ?? '');
    return `<div class="di-hue-group-row"><div class="di-swatches">${colorSwatchHtml(css, name, discoveredColors.has('1_100'))}</div></div>`;
  }

  if (bucket === 'gray') {
    const grayShades = [
      { key: '2_30',  css: 'hsl(0,0%,30%)', name: (t.colorLabel as any)[2]?.[0]?.[30] ?? '' },
      { key: '2_60',  css: 'hsl(0,0%,60%)', name: (t.colorLabel as any)[2]?.[0]?.[60] ?? '' },
      { key: '2_90',  css: 'hsl(0,0%,90%)', name: (t.colorLabel as any)[2]?.[0]?.[90] ?? '' },
    ];
    const swatches = grayShades.map(s => colorSwatchHtml(s.css, s.name, discoveredColors.has(s.key))).join('');
    return `<div class="di-hue-group-row"><div class="di-swatches">${swatches}</div></div>`;
  }

  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [];
  return hues.map(hue => {
    const groupKnown = (PALETTE_L as readonly number[]).some(l => discoveredColors.has(`${hue}_${l}`));
    const groupName = groupKnown ? ((t.colorLabel as any)[hue]?.hueName ?? '') : '?';
    const swatches = (PALETTE_L as readonly number[]).map(l => {
      const css = `hsl(${hue},${PALETTE_S}%,${l}%)`;
      const name = (t.colorLabel as any)[hue]?.[PALETTE_S]?.[l] ?? '';
      return colorSwatchHtml(css, name, discoveredColors.has(`${hue}_${l}`));
    }).join('');
    return `<div class="di-hue-group-row">
      <span class="di-hue-name">${groupName}</span>
      <div class="di-swatches">${swatches}</div>
    </div>`;
  }).join('');
}

function renderSecretBucketGroups(bucket: ColorBucket): string {
  if (bucket === 'white') {
    return `<div class="di-hue-group-row"><div class="di-swatches"><span class="di-swatch di-swatch--secret"></span></div></div>`;
  }
  if (bucket === 'gray') {
    const swatches = Array(3).fill(`<span class="di-swatch di-swatch--secret"></span>`).join('');
    return `<div class="di-hue-group-row"><div class="di-swatches">${swatches}</div></div>`;
  }
  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [];
  return hues.map(() => {
    const swatches = (PALETTE_L as readonly number[]).map(() => `<span class="di-swatch di-swatch--secret"></span>`).join('');
    return `<div class="di-hue-group-row"><div class="di-swatches">${swatches}</div></div>`;
  }).join('');
}


function renderColorSection(catalog: CatalogEntry[]): string {
  const discoveredColors = buildDiscoveredColors(catalog);

  const buckets = BUCKET_ORDER.map(bucket => {
    const label = t.colorBucketLabels[bucket] ?? bucket;
    const isSecret = SECRET_BUCKETS.has(bucket);
    const bucketKnown = catalog.some(e => colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === bucket);
    const keys = getBucketKeys(bucket);
    const foundCount = keys.filter(k => discoveredColors.has(k)).length;
    const counter = `<span class="di-bucket-counter">${foundCount}/${keys.length}</span>`;

    if (isSecret && !bucketKnown) {
      const groups = renderSecretBucketGroups(bucket);
      return `<div class="di-bucket">
        <div class="di-bucket-heading di-bucket-heading--secret">?${counter}</div>
        ${groups}
      </div>`;
    }

    return `<div class="di-bucket">
      <div class="di-bucket-heading">${label}${counter}</div>
      ${renderBucketHueGroups(bucket, discoveredColors)}
    </div>`;
  }).join('');

  return `<div class="di-block">
    <div class="di-block-title">${t.discoveryIndexSectionColors}</div>
    <div class="di-color-buckets">${buckets}</div>
  </div>`;
}

// ─── Shape × Color bucket matrix ─────────────────────────────────────────────

function renderShapeColorSection(catalog: CatalogEntry[]): string {
  const discoveredShapeColors = buildDiscoveredShapeColors(catalog);

  const knownBuckets = new Set(
    catalog.map(e => colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)))
  );
  const discoveredShapes = new Set(
    PETAL_SHAPES.filter(s => BUCKET_ORDER.some(b => discoveredShapeColors.has(`${s}_${b}`)))
  );

  const HEADER_ROW = 1;
  const DATA_ROW   = 2;

  function cell(cls: string, col: number, row: number, title = '', content = ''): string {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<span class="${cls}"${titleAttr} style="grid-column:${col};grid-row:${row}">${content}</span>`;
  }
  function dot(shapeKnown: boolean, bucketKnown: boolean, found: boolean, col: number, row: number, title: string): string {
    if (!shapeKnown || !bucketKnown) return cell('di-count-dot di-dot--secret', col, row);
    const cls = found ? 'di-count-dot di-dot--found' : 'di-count-dot di-dot--missing';
    return cell(cls, col, row, title);
  }

  const nBuckets = BUCKET_ORDER.length;

  const colHeaders = BUCKET_ORDER.map((bucket, i) => {
    const bucketKnown = !SECRET_BUCKETS.has(bucket) || knownBuckets.has(bucket);
    const content = bucketKnown ? renderBucketSwatchStrip(bucket) : '?';
    const title   = bucketKnown ? (t.colorBucketLabels[bucket] ?? bucket) : '';
    return cell('di-col-header', 2 + i, HEADER_ROW, title, content);
  }).join('');

  const shapeRows = PETAL_SHAPES.map((shape, si) => {
    const row        = DATA_ROW + si;
    const shapeKnown = discoveredShapes.has(shape);
    const name       = shapeKnown ? (t.shapeLabels[shape] ?? shape) : '?';
    const labelCls   = shapeKnown ? 'di-shape-label' : 'di-shape-label di-shape-label--secret';
    const shapeLabel = cell(labelCls, 1, row, '', name);
    const dots = BUCKET_ORDER.map((bucket, i) => {
      const bucketKnown = !SECRET_BUCKETS.has(bucket) || knownBuckets.has(bucket);
      const title = shapeKnown && bucketKnown ? `${name} · ${t.colorBucketLabels[bucket] ?? bucket}` : '';
      return dot(shapeKnown, bucketKnown, discoveredShapeColors.has(`${shape}_${bucket}`), 2 + i, row, title);
    }).join('');
    return shapeLabel + dots;
  }).join('');

  const grid = `<div class="di-shape-grid" style="grid-template-columns:auto repeat(${nBuckets}, 17px)">
    ${colHeaders}
    ${shapeRows}
  </div>`;

  return `<div class="di-block">
    <div class="di-block-title">${t.discoveryIndexSectionShapeColors}</div>
    <div class="di-shape-groups">${grid}</div>
  </div>`;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummaryStats(catalog: CatalogEntry[]): string {
  const shapeCounts = buildDiscoveredShapeCounts(catalog);
  const colors = buildDiscoveredColors(catalog);
  const totalShapeCounts = PETAL_SHAPES.length * PETAL_COUNTS.length;
  const totalColors =
    1 + 3 +
    Object.values(PALETTE_HUES_BUCKETS).reduce((sum, hues) => sum + hues.length * PALETTE_L.length, 0);
  return t.discoveryIndexSummary(shapeCounts.size, totalShapeCounts, colors.size, totalColors);
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderDiscoveryIndex(catalog: CatalogEntry[], open = false): HTMLElement {
  const el = document.createElement('details');
  el.className = 'di-panel';
  el.id = 'discovery-index';

  if (open) el.setAttribute('open', '');

  el.innerHTML = `
    <summary class="di-summary">
      <span class="di-summary-title">${t.discoveryIndexTitle}</span>
      <span class="di-summary-stats">${buildSummaryStats(catalog)}</span>
    </summary>
    <div class="di-body">
      ${catalog.length > 0 ? renderShapeSection(catalog) + renderShapeColorSection(catalog) + renderColorSection(catalog) : ''}
    </div>`;

  return el;
}
