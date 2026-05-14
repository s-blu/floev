import { expressedColor, expressedShape, expressedCenter, expressedPetalCount, expressedEffect, colorBucket } from '../engine/genetic/genetic_utils';
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer';
import type { CatalogEntry, HSLColor, PetalEffect } from '../model/plant';
import { RARITY_BADGE_STYLES, RARITY_COLORS, RARITY_ICON, type Rarity } from "../model/rarity_model";
import { formatDate, state } from './ui';
import { t } from '../model/i18n';
import { hasUpgrade } from '../engine/shop_engine';
import { renderDiscoveryIndex } from './discovery_index_ui';
import { renderCompletionIndex } from './completion_index_ui';
import { buildFamilySwatchStyle } from './swatch_utils';

// ─── Catalog helpers ──────────────────────────────────────────────────────────
const SHAPE_LABELS: Record<string, string> = {
  round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
};
const CENTER_LABELS: Record<string, string> = {
  dot: t.centerDot, disc: t.centerDisc, stamen: t.centerTypeLabels.stamen,
};

let entryIndex = new Map<string, number>();

type CatalogSortKey = 'rarity' | 'shape' | 'petalCount' | 'center' | 'color' | 'effect' | 'num';
const SORT_OPTIONS: CatalogSortKey[] = ['rarity', 'shape', 'petalCount', 'center', 'color', 'effect', 'num'];
const COLOR_BUCKET_ORDER = ['red', 'pink', 'yellowgreen', 'green', 'blue', 'purple', 'gray', 'white'];
const EFFECT_ORDER = ['none', 'bicolor', 'gradient', 'iridescent', 'shimmer'];
const SHAPE_ORDER = ['round', 'lanzett', 'tropfen', 'wavy', 'zickzack'];
const CENTER_ORDER = ['dot', 'disc', 'stamen'];

const RARITY_OPEN_KEY = 'catalog_rarity_open';
const CATALOG_SORT_KEY = 'catalog_sort';
const CATALOG_GROUPS_OPEN_KEY = 'catalog_groups_open';

function loadRarityOpenStates(): Map<number, boolean> {
  try {
    const raw = localStorage.getItem(RARITY_OPEN_KEY);
    if (raw) return new Map(Object.entries(JSON.parse(raw)).map(([k, v]) => [Number(k), v as boolean]));
  } catch { /* empty */ }
  return new Map();
}

function loadSortState(): CatalogSortKey {
  try {
    const raw = localStorage.getItem(CATALOG_SORT_KEY);
    if (raw && (SORT_OPTIONS as string[]).includes(raw)) return raw as CatalogSortKey;
  } catch { /* empty */ }
  return 'rarity';
}

function saveSortState(sort: CatalogSortKey): void {
  try { localStorage.setItem(CATALOG_SORT_KEY, sort); } catch { /* empty */ }
}

function loadGroupOpenStates(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CATALOG_GROUPS_OPEN_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /* empty */ }
  return {};
}

function saveGroupOpenState(compositeKey: string, open: boolean): void {
  try {
    const raw = localStorage.getItem(CATALOG_GROUPS_OPEN_KEY);
    const current = raw ? JSON.parse(raw) as Record<string, boolean> : {};
    current[compositeKey] = open;
    localStorage.setItem(CATALOG_GROUPS_OPEN_KEY, JSON.stringify(current));
  } catch { /* empty */ }
}

function saveRarityOpenState(rarity: number, open: boolean): void {
  try {
    const raw = localStorage.getItem(RARITY_OPEN_KEY);
    const current = raw ? JSON.parse(raw) : {};
    current[rarity] = open;
    localStorage.setItem(RARITY_OPEN_KEY, JSON.stringify(current));
  } catch { /* empty */ }
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
export function renderCatalog(): void {
  const container = document.getElementById('catalog-grid');
  const count = document.getElementById('catalog-count');
  if (!container || !count) return;

  count.textContent = String(state.catalog.length);

  if (state.catalog.length === 0) {
    container.innerHTML = `<span class="empty-hint">${t.catalogEmpty}</span>`;
    return;
  }

  const allSorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered);
  entryIndex = new Map<string, number>();
  allSorted.forEach((e, i) => entryIndex.set(e.plant.id, i + 1));

  const currentSort = loadSortState();
  const discoveryIndexOpen  = (document.getElementById('discovery-index')  as HTMLDetailsElement | null)?.open ?? false;
  const completionIndexOpen = (document.getElementById('completion-index') as HTMLDetailsElement | null)?.open ?? false;

  container.innerHTML = '';
  container.appendChild(buildSortToolbar(currentSort));

  if (hasUpgrade(state, 'unlock_discovery_index')) {
    container.appendChild(renderDiscoveryIndex(state.catalog, discoveryIndexOpen));
  }
  if (hasUpgrade(state, 'unlock_completion_index')) {
    container.appendChild(renderCompletionIndex(state.catalog, completionIndexOpen));
  }

  if (currentSort === 'rarity') {
    renderByRarity(container);
  } else {
    renderBySort(container, currentSort);
  }
}

function buildSortToolbar(currentSort: CatalogSortKey): HTMLElement {
  const sortLabels: Record<CatalogSortKey, string> = {
    rarity: t.catalogSortRarity,
    shape: t.catalogSortShape,
    petalCount: t.catalogSortPetalCount,
    center: t.catalogSortCenter,
    color: t.catalogSortColor,
    effect: t.catalogSortEffect,
    num: t.catalogSortNum,
  };
  const toolbar = document.createElement('div');
  toolbar.className = 'catalog-sort-toolbar';
  const label = document.createElement('span');
  label.className = 'catalog-sort-label';
  label.textContent = t.catalogSortLabel;
  toolbar.appendChild(label);
  const btns = document.createElement('div');
  btns.className = 'catalog-sort-btns';
  for (const sort of SORT_OPTIONS) {
    const btn = document.createElement('button');
    btn.className = 'catalog-sort-btn' + (sort === currentSort ? ' catalog-sort-btn--active' : '');
    btn.textContent = sortLabels[sort];
    btn.addEventListener('click', () => { saveSortState(sort); renderCatalog(); });
    btns.appendChild(btn);
  }
  toolbar.appendChild(btns);
  return toolbar;
}

function renderByRarity(container: HTMLElement): void {
  const groups: Record<Rarity, CatalogEntry[]> = { 4: [], 3: [], 2: [], 1: [], 0: [] };
  for (const entry of state.catalog) groups[entry.rarity].push(entry);
  for (const r of [4, 3, 2, 1, 0] as Rarity[]) groups[r].sort((a, b) => a.discovered - b.discovered);

  const persistedStates = loadRarityOpenStates();
  for (const rarity of [4, 3, 2, 1, 0] as Rarity[]) {
    const entries = groups[rarity];
    if (entries.length === 0) continue;

    const section = document.createElement('details');
    section.id = `catalog-section-rarity-${rarity}`;
    if (persistedStates.get(rarity) ?? true) section.setAttribute('open', '');
    section.addEventListener('toggle', () => saveRarityOpenState(rarity, section.open));

    const summary = document.createElement('summary');
    summary.className = 'catalog-section-heading';
    summary.innerHTML = `
      <span class="rarity-dot" style="color:${RARITY_COLORS[rarity]}">${RARITY_ICON[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="rarity-name" style="color:${RARITY_COLORS[rarity]}">${t.rarity[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="catalog-section-count">${entries.length}</span>`;
    section.appendChild(summary);

    const grid = document.createElement('div');
    grid.className = 'catalog-rarity-group';
    for (const entry of entries) {
      const num = entryIndex.get(entry.plant.id) ?? 0;
      grid.appendChild(buildEncyclopediaEntry(entry, num));
    }
    section.appendChild(grid);
    container.appendChild(section);
  }
}

function renderBySort(container: HTMLElement, sort: CatalogSortKey): void {
  if (sort === 'num') {
    const sorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered);
    const groupOpenStates = loadGroupOpenStates();
    const bucketMap = new Map<number, CatalogEntry[]>();
    for (const entry of sorted) {
      const num = entryIndex.get(entry.plant.id) ?? 0;
      const bucket = Math.floor((num - 1) / 100) * 100 + 1;
      if (!bucketMap.has(bucket)) bucketMap.set(bucket, []);
      bucketMap.get(bucket)!.push(entry);
    }
    for (const [start, entries] of [...bucketMap.entries()].sort(([a], [b]) => a - b)) {
      const end = start + 99;
      const compositeKey = `num:${start}`;
      const section = document.createElement('details');
      section.id = `catalog-section-num-${start}`;
      if (groupOpenStates[compositeKey] ?? true) section.setAttribute('open', '');
      section.addEventListener('toggle', () => saveGroupOpenState(compositeKey, section.open));
      const summary = document.createElement('summary');
      summary.className = 'catalog-section-heading catalog-section-heading--plain';
      summary.innerHTML = `
        <span class="rarity-line"></span>
        <span class="catalog-group-name">${start} – ${end}</span>
        <span class="rarity-line"></span>
        <span class="catalog-section-count">${entries.length}</span>`;
      section.appendChild(summary);
      const grid = document.createElement('div');
      grid.className = 'catalog-rarity-group';
      for (const entry of entries) {
        const num = entryIndex.get(entry.plant.id) ?? 0;
        grid.appendChild(buildEncyclopediaEntry(entry, num));
      }
      section.appendChild(grid);
      container.appendChild(section);
    }
    return;
  }

  const groupMap = new Map<string, CatalogEntry[]>();
  for (const entry of state.catalog) {
    const key = getSortGroupKey(entry, sort);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(entry);
  }
  for (const entries of groupMap.values()) {
    entries.sort((a, b) => (entryIndex.get(a.plant.id) ?? 0) - (entryIndex.get(b.plant.id) ?? 0));
  }

  const orderedKeys = getOrderedGroupKeys(sort, groupMap);
  const groupOpenStates = loadGroupOpenStates();

  for (const key of orderedKeys) {
    const entries = groupMap.get(key) ?? [];
    if (entries.length === 0) continue;
    const compositeKey = `${sort}:${key}`;

    const section = document.createElement('details');
    section.id = `catalog-section-${sort}-${key}`;
    if (groupOpenStates[compositeKey] ?? true) section.setAttribute('open', '');
    section.addEventListener('toggle', () => saveGroupOpenState(compositeKey, section.open));

    const summary = document.createElement('summary');
    summary.className = 'catalog-section-heading catalog-section-heading--plain';
    summary.innerHTML = `
      <span class="rarity-line"></span>
      <span class="catalog-group-name">${getGroupLabel(sort, key)}</span>
      <span class="rarity-line"></span>
      <span class="catalog-section-count">${entries.length}</span>`;
    section.appendChild(summary);

    const grid = document.createElement('div');
    grid.className = 'catalog-rarity-group';
    for (const entry of entries) {
      const num = entryIndex.get(entry.plant.id) ?? 0;
      grid.appendChild(buildEncyclopediaEntry(entry, num));
    }
    section.appendChild(grid);
    container.appendChild(section);
  }
}

function getSortGroupKey(entry: CatalogEntry, sort: CatalogSortKey): string {
  const plant = entry.plant;
  switch (sort) {
    case 'shape':      return expressedShape(plant.petalShape);
    case 'petalCount': return String(expressedPetalCount(plant.petalCount));
    case 'center':     return expressedCenter(plant.centerType);
    case 'color':      return colorBucket(expressedColor(plant.petalHue, plant.petalLightness));
    case 'effect':     return expressedEffect(plant.petalEffect);
    default:           return '';
  }
}

function getOrderedGroupKeys(sort: CatalogSortKey, groupMap: Map<string, CatalogEntry[]>): string[] {
  const existing = [...groupMap.keys()];
  switch (sort) {
    case 'shape':      return SHAPE_ORDER.filter(k => existing.includes(k));
    case 'petalCount': return [3, 5, 8].map(String).filter(k => existing.includes(k));
    case 'center':     return CENTER_ORDER.filter(k => existing.includes(k));
    case 'color':      return COLOR_BUCKET_ORDER.filter(k => existing.includes(k));
    case 'effect':     return EFFECT_ORDER.filter(k => existing.includes(k));
    default:           return existing;
  }
}

function getGroupLabel(sort: CatalogSortKey, key: string): string {
  switch (sort) {
    case 'shape':      return SHAPE_LABELS[key] ?? key;
    case 'petalCount': return `${key} ${t.catalogMetaPetals}`;
    case 'center':     return CENTER_LABELS[key] ?? key;
    case 'color':      return (t.colorBucketLabels as Record<string, string>)[key] ?? key;
    case 'effect':     return (t.effectLabels as Record<string, string>)[key] ?? key;
    default:           return key;
  }
}

function buildEncyclopediaEntry(entry: CatalogEntry, num: number): HTMLElement {
  const plant = entry.plant;
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  const shape = expressedShape(plant.petalShape);
  const center = expressedCenter(plant.centerType);
  const count = expressedPetalCount(plant.petalCount);
  const effect = expressedEffect(plant.petalEffect);
  const hasEffect = effect !== 'none' && (pc.s > 0 || pc.h === 2);
  const pcForEffect = hasEffect ? { ...pc, l: 60 as const } : pc;
  const hslMain = `hsl(${Math.round(pc.h)},${Math.round(pc.s)}%,${Math.round(pc.l)}%)`;
  const swatchStyle = `background: ${hasEffect ? buildFamilySwatchStyle(pc) : hslMain}`;
  const swatchLabel = hasEffect
    ? (t.colorLabel as any)[pc.h]?.hueName ?? ''
    : (t.colorLabel as any)[pc.h]?.[pc.s]?.[pc.l] ?? '';
  const groupLabel = (t.colorLabel as any)[pc.h]?.hueName ?? '';
  const swatchTitle = hasEffect
    ? groupLabel
    : [swatchLabel, groupLabel].filter(Boolean).join(' · ');
  const badge = RARITY_BADGE_STYLES[entry.rarity];

  const el = document.createElement('div');
  el.className = `enc-entry rarity-${entry.rarity}`;

  el.innerHTML = `
    <div class="enc-title">
      <div class="enc-entry-name">${entry.plantname ?? t.catalogEntryName(num)}</div>
      <div class="enc-entry-num">${t.catalogEntryNum(num)}</div>
    </div>
    <div class="enc-body">
      <div class="enc-bloom">${renderBloomSVG(plant, 80, 80, 'cat')}</div>
      <div class="enc-info">
        <div class="enc-badges-row">
          <span class="enc-rarity-badge" style="background:${badge.bg};color:${badge.color}">${t.rarity[entry.rarity]}</span>
        </div>
        <div class="enc-meta">
          ${renderMetaRow(t.catalogMetaPetals, `${count} · ${SHAPE_LABELS[shape] ?? shape}`)}
          ${renderMetaRow(t.catalogMetaCenter, `${CENTER_LABELS[center] ?? center}`)}
          ${renderMetaRow(t.catalogMetaColor, `${swatchLabel} <span class="enc-color-swatch" style="${swatchStyle}" title="${swatchTitle}"></span>`)}
          ${effect !== 'none' ? renderMetaRow(t.catalogMetaEffect, `${(t.effectLabels as Record<string, string>)[effect] ?? effect} <span class="enc-color-swatch" style="${buildEffectSwatchStyle(effect, pcForEffect)}"></span>`) : ''}
          ${renderMetaRow(t.catalogMetaGen, `${plant.generation}`)}
        </div>
        <div class="enc-discovered">${formatDate(entry.discovered)}</div>
      </div>
    </div>`;

  return el;
}

function renderMetaRow(label: string, value: string): string {
  return `<div class="enc-meta-row">
    <span class="enc-meta-label">${label}</span>
    <span class="enc-meta-value">${value}</span>
  </div>`;
}


function buildEffectSwatchStyle(effect: PetalEffect, pc: HSLColor): string {
  const { h, s, l } = pc;
  const hsl = (hue: number, sat: number, lig: number) =>
    `hsl(${((hue % 360) + 360) % 360},${sat}%,${lig}%)`;
  const diagonal4 = (colors: string[]) =>
    `background: linear-gradient(135deg, ${colors[0]} 25%, ${colors[1]} 25%, ${colors[1]} 50%, ${colors[2]} 50%, ${colors[2]} 75%, ${colors[3]} 75%)`;

  switch (effect) {
    case 'bicolor':
      return `background: linear-gradient(90deg, ${hsl(h, s, s === 0 ? 90 : 88)} 50%, ${hsl(h, s, s === 0 ? 20 : 28)} 50%)`;
    case 'gradient':
      return `background: linear-gradient(to right, ${hsl(h, s, 90)}, ${hsl(h, s, 30)})`;
    case 'shimmer': {
      const isGray = s < 10;
      return isGray
        ? diagonal4([l - 20, l - 5, l + 15, l - 8].map(lv => hsl(h, s, lv)))
        : diagonal4([-12, 0, 12, 0].map(o => hsl(h + o, s, l)));
    }
    case 'iridescent': {
      const isGray = s < 10;
      const rl = Math.min(Math.max(l, 45), 75);
      return isGray
        ? diagonal4([0, 90, 180, 270].map(o => hsl(o, 75, rl)))
        : diagonal4([-60, -20, 20, 60].map(o => hsl(h + o, s, l)));
    }
    default:
      return `background: ${hsl(h, s, l)}`;
  }
}
