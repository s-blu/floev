import { t } from '../model/i18n';
import { expressedColor, expressedShape, expressedNumber, colorBucket } from '../engine/genetic/genetic_utils';
import {
  PETAL_SHAPES, PALETTE_HUES_BUCKETS, PALETTE_S, PALETTE_L,
} from '../model/genetic_model';
import type { CatalogEntry } from '../model/plant';
import type { ColorBucket } from '../model/genetic_model';

const SECRET_BUCKETS = new Set<ColorBucket>(['purple', 'blue', 'gray']);
const PETAL_COUNTS = [3, 4, 5, 6, 7, 8] as const;
const BUCKET_ORDER: ColorBucket[] = ['white', 'red', 'yellowgreen', 'pink', 'purple', 'blue', 'gray'];

// ─── Discovery set builders ───────────────────────────────────────────────────

function buildDiscoveredShapeCounts(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const shape = expressedShape(e.plant.petalShape);
    const count = Math.round(expressedNumber(e.plant.petalCount));
    set.add(`${shape}_${count}`);
  }
  return set;
}

function buildDiscoveredColors(catalog: CatalogEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of catalog) {
    const c = expressedColor(e.plant.petalHue, e.plant.petalLightness);
    set.add(`${c.h}_${c.l}`);
  }
  return set;
}

// ─── Shape × Count section ────────────────────────────────────────────────────

function renderShapeSection(catalog: CatalogEntry[]): string {
  const discovered = buildDiscoveredShapeCounts(catalog);
  const discoveredShapes = new Set(
    PETAL_SHAPES.filter(s => PETAL_COUNTS.some(c => discovered.has(`${s}_${c}`)))
  );

  const headerCells = PETAL_COUNTS.map(c =>
    `<span class="di-count-header">${c}</span>`
  ).join('');

  const rows = PETAL_SHAPES.map(shape => {
    const known = discoveredShapes.has(shape);
    const label = known ? (t.shapeLabels[shape] ?? shape) : '?';
    const labelCls = known ? 'di-shape-label' : 'di-shape-label di-shape-label--secret';

    const cells = PETAL_COUNTS.map(count => {
      if (!known) return `<span class="di-count-dot di-dot--secret"></span>`;
      const key = `${shape}_${count}`;
      const cls = discovered.has(key) ? 'di-count-dot di-dot--found' : 'di-count-dot di-dot--missing';
      const title = `${label}, ${count}`;
      return `<span class="${cls}" title="${title}"></span>`;
    }).join('');

    return `<div class="di-shape-row"><span class="${labelCls}">${label}</span>${cells}</div>`;
  }).join('');

  return `<div class="di-block">
    <div class="di-block-title">${t.discoveryIndexSectionShapes}</div>
    <div class="di-shape-table">
      <div class="di-shape-row">
        <span class="di-shape-label"></span>${headerCells}
      </div>
      ${rows}
    </div>
  </div>`;
}

// ─── Color bucket section ─────────────────────────────────────────────────────

function colorDotHtml(cssColor: string, name: string, found: boolean): string {
  if (found) {
    return `<span class="di-color-dot di-color-dot--found" style="background:${cssColor}" title="${name}"></span>`;
  }
  return `<span class="di-color-dot di-color-dot--missing" style="background:${cssColor}" title="?"></span>`;
}

function renderBucketHueGroups(bucket: ColorBucket, discoveredColors: Set<string>): string {
  if (bucket === 'white') {
    const css = 'hsl(0,0%,97%)';
    const name = (t.colorLabel as any)[1]?.['0']?.[100] ?? (t.colorBucketLabels['white'] ?? '');
    return colorDotHtml(css, name, discoveredColors.has('1_100'));
  }

  if (bucket === 'gray') {
    const grayShades = [
      { key: '2_10',  css: 'hsl(0,0%,10%)', name: (t.colorLabel as any)[2]?.[0]?.[10] ?? '' },
      { key: '2_40',  css: 'hsl(0,0%,40%)', name: (t.colorLabel as any)[2]?.[0]?.[40] ?? '' },
      { key: '2_70',  css: 'hsl(0,0%,70%)', name: (t.colorLabel as any)[2]?.[0]?.[70] ?? '' },
    ];
    return grayShades.map(s => colorDotHtml(s.css, s.name, discoveredColors.has(s.key))).join('');
  }

  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [];
  return hues.map(hue => {
    const groupName = (t.colorLabel as any)[hue]?.hueName ?? '';
    const dots = (PALETTE_L as readonly number[]).map(l => {
      const css = `hsl(${hue},${PALETTE_S}%,${l}%)`;
      const name = (t.colorLabel as any)[hue]?.[PALETTE_S]?.[l] ?? '';
      return colorDotHtml(css, name, discoveredColors.has(`${hue}_${l}`));
    }).join('');
    return `<div class="di-hue-group" title="${groupName}">${dots}</div>`;
  }).join('');
}

function getBucketSlotCount(bucket: ColorBucket): number {
  if (bucket === 'white') return 1;
  if (bucket === 'gray') return 3;
  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? [];
  return hues.length * PALETTE_L.length;
}

function renderColorSection(catalog: CatalogEntry[]): string {
  const discoveredColors = buildDiscoveredColors(catalog);

  const bucketRows = BUCKET_ORDER.map(bucket => {
    const label = t.colorBucketLabels[bucket] ?? bucket;
    const isSecret = SECRET_BUCKETS.has(bucket);
    const bucketKnown = catalog.some(e => colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === bucket);

    if (isSecret && !bucketKnown) {
      const slotCount = getBucketSlotCount(bucket);
      const dots = Array(slotCount).fill(`<span class="di-color-dot di-color-dot--secret">?</span>`).join('');
      return `<div class="di-bucket-row">
        <span class="di-bucket-label di-bucket-label--secret">?</span>
        <div class="di-hue-groups">${dots}</div>
      </div>`;
    }

    return `<div class="di-bucket-row">
      <span class="di-bucket-label">${label}</span>
      <div class="di-hue-groups">${renderBucketHueGroups(bucket, discoveredColors)}</div>
    </div>`;
  }).join('');

  return `<div class="di-block">
    <div class="di-block-title">${t.discoveryIndexSectionColors}</div>
    <div class="di-color-buckets">${bucketRows}</div>
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
      ${catalog.length > 0 ? renderShapeSection(catalog) + renderColorSection(catalog) : ''}
    </div>`;

  return el;
}
