import { expressedColor, expressedShape, expressedCenter, expressedNumber, expressedEffect } from '../engine/genetic/genetic_utils';
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer';
import type { CatalogEntry, HSLColor, PetalEffect } from '../model/plant';
import { RARITY_BADGE_STYLES, RARITY_COLORS, RARITY_ICON, type Rarity } from "../model/rarity_model";
import { state } from './ui';
import { t } from '../model/i18n';
import { hasUpgrade } from '../engine/shop_engine';
import { renderDiscoveryIndex } from './discovery_index_ui';
import { buildFamilySwatchStyle } from './swatch_utils';

// ─── Catalog helpers ──────────────────────────────────────────────────────────
const SHAPE_LABELS: Record<string, string> = {
  round: t.shapeRound, lanzett: t.shapeLanzett, tropfen: t.shapeDrop, wavy: t.shapeWavy, zickzack: t.shapeZickzack,
};
const CENTER_LABELS: Record<string, string> = {
  dot: t.centerDot, disc: t.centerDisc, stamen: t.centerTypeLabels.stamen,
};

let entryIndex = new Map<string, number>();

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
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

  const groups: Record<Rarity, CatalogEntry[]> = { 4: [], 3: [], 2: [], 1: [], 0: [] };
  for (const entry of state.catalog) {
    groups[entry.rarity].push(entry);
  }
  for (const r of [4, 3, 2, 1, 0] as Rarity[]) {
    groups[r].sort((a, b) => a.discovered - b.discovered);
  }

  const allSorted = [...state.catalog].sort((a, b) => a.discovered - b.discovered);
  entryIndex = new Map<string, number>();
  allSorted.forEach((e, i) => entryIndex.set(e.plant.id, i + 1));

  const discoveryIndexOpen = (document.getElementById('discovery-index') as HTMLDetailsElement | null)?.open ?? false;
  container.innerHTML = '';
  if (hasUpgrade(state, 'unlock_discovery_index')) {
    container.appendChild(renderDiscoveryIndex(state.catalog, discoveryIndexOpen));
  }

  for (const rarity of [4, 3, 2, 1, 0] as Rarity[]) {
    const entries = groups[rarity];
    if (entries.length === 0) continue;

    const heading = document.createElement('div');
    heading.className = 'catalog-section-heading';
    heading.innerHTML = `
      <span class="rarity-dot" style="color:${RARITY_COLORS[rarity]}">${RARITY_ICON[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="rarity-name" style="color:${RARITY_COLORS[rarity]}">${t.rarity[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="catalog-section-count">${entries.length}</span>`;
    container.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'catalog-rarity-group';
    for (const entry of entries) {
      const num = entryIndex.get(entry.plant.id) ?? 0;
      grid.appendChild(buildEncyclopediaEntry(entry, num));
    }
    container.appendChild(grid);
  }

}

function buildEncyclopediaEntry(entry: CatalogEntry, num: number): HTMLElement {
  const plant = entry.plant;
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  const shape = expressedShape(plant.petalShape);
  const center = expressedCenter(plant.centerType);
  const count = Math.round(expressedNumber(plant.petalCount));
  const effect = expressedEffect(plant.petalEffect);
  const hasEffect = effect !== 'none' && pc.s > 0;
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
      <div class="enc-bloom">${renderBloomSVG(plant, 80, 80)}</div>
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
        : diagonal4([0, 40, 80, 120].map(o => hsl(h + o, s, l)));
    }
    default:
      return `background: ${hsl(h, s, l)}`;
  }
}
