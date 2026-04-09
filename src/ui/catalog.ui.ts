import { RARITY_COLORS, RARITY_LABELS } from '../engine/game';
import { expressedColor, expressedGradient, expressedShape, expressedCenter, expressedNumber } from '../engine/genetic.utils';
import { renderBloomSVG } from '../engine/renderer/encyclopedia.renderer';
import type { Rarity, CatalogEntry } from '../model/plant';
import { openAncestryIds, state } from './ui';

// ─── Catalog helpers ──────────────────────────────────────────────────────────
const SHAPE_LABELS: Record<string, string> = {
  round: 'Rund', pointed: 'Spitz', wavy: 'Wellig',
};
const CENTER_LABELS: Record<string, string> = {
  dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubblätter',
};
const RARITY_BADGE_STYLES: Record<Rarity, { bg: string; color: string; }> = {
  0: { bg: '#F1EFE8', color: '#5F5E5A' },
  1: { bg: '#E1F5EE', color: '#0F6E56' },
  2: { bg: '#E6F1FB', color: '#185FA5' },
  3: { bg: '#EEEDFE', color: '#3C3489' },
  4: { bg: '#FAEEDA', color: '#854F0B' },
};
const RARITY_ICON: Record<Rarity, string> = {
  0: '▪',
  1: '●',
  2: '♦',
  3: '★',
  4: '👑',
}


let entryIndex = new Map<string, number>()

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}
// ─── Catalog ──────────────────────────────────────────────────────────────────
export function renderCatalog(): void {
  const container = document.getElementById('catalog-grid');
  const count = document.getElementById('catalog-count');
  if (!container || !count) return;

  container.querySelectorAll<HTMLDetailsElement>('.enc-ancestry[data-id]').forEach(el => {
    const id = el.dataset.id!;
    if (el.open) openAncestryIds.add(id);
    else openAncestryIds.delete(id);
  });

  count.textContent = String(state.catalog.length);

  if (state.catalog.length === 0) {
    container.innerHTML = '<span class="empty-hint">Noch keine Entdeckungen.</span>';
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

  container.innerHTML = '';

  for (const rarity of [4, 3, 2, 1, 0] as Rarity[]) {
    const entries = groups[rarity];
    if (entries.length === 0) continue;

    const heading = document.createElement('div');
    heading.className = 'catalog-section-heading';
    heading.innerHTML = `
      <span class="rarity-dot" style="color:${RARITY_COLORS[rarity]}">${RARITY_ICON[rarity]}</span>
      <span class="rarity-line"></span>
      <span class="rarity-name" style="color:${RARITY_COLORS[rarity]}">${RARITY_LABELS[rarity]}</span>
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

  container.querySelectorAll<HTMLDetailsElement>('.enc-ancestry[data-id]').forEach(el => {
    el.addEventListener('toggle', () => {
      const id = el.dataset.id!;
      if (el.open) openAncestryIds.add(id);
      else openAncestryIds.delete(id);
    });
  });
}
function buildEncyclopediaEntry(entry: CatalogEntry, num: number): HTMLElement {
  const plant = entry.plant;
  const pc = expressedColor(plant.petalColor);
  const grad = expressedGradient(plant.gradientColor);
  const shape = expressedShape(plant.petalShape);
  const center = expressedCenter(plant.centerType);
  const count = Math.round(expressedNumber(plant.petalCount));
  const hasGrad = grad !== null;

  const hslMain = `hsl(${Math.round(pc.h)},${Math.round(pc.s)}%,${Math.round(pc.l)}%)`;
  const swatchStyle = hasGrad
    ? `background: linear-gradient(135deg, ${hslMain}, hsl(${Math.round(grad!.h)},${Math.round(grad!.s)}%,${Math.round(grad!.l)}%))`
    : `background: ${hslMain}`;

  const parentA = plant.parentIds
    ? state.catalog.find(e => e.plant.id === plant.parentIds![0]) ?? null
    : null;
  const parentB = plant.parentIds
    ? state.catalog.find(e => e.plant.id === plant.parentIds![1]) ?? null
    : null;

  const badge = RARITY_BADGE_STYLES[entry.rarity];

  const el = document.createElement('div');
  el.className = 'enc-entry';
  el.style.borderLeftColor = RARITY_COLORS[entry.rarity];

  let ancestryHtml = '';
  if (plant.parentIds) {
    const isOpen = openAncestryIds.has(plant.id);
    const renderParentSlot = (e: CatalogEntry | null, id: string) => {
      const num = e ? (entryIndex.get(e.plant.id) ?? '?') : '?';
      const name = e ? `Blüte ${num}` : 'Unbekannt';
      const thumb = e
        ? `<div class="enc-parent-thumb" title="Gen. ${e.plant.generation}">${renderBloomSVG(e.plant, 38, 38)}</div>`
        : `<div class="enc-parent-thumb enc-parent-unknown" title="Elter unbekannt (${id})"><span>?</span></div>`;
      return `<div class="enc-parent-slot">${thumb}<span class="enc-parent-name">${name}</span></div>`;
    };
    ancestryHtml = `
      <details class="enc-ancestry" data-id="${plant.id}"${isOpen ? ' open' : ''}>
        <summary>Stammbaum</summary>
        <div class="enc-parents-row">
          ${renderParentSlot(parentA, plant.parentIds[0])}
          <span class="enc-parent-cross">×</span>
          ${renderParentSlot(parentB, plant.parentIds[1])}
        </div>
      </details>`;
  }

  el.innerHTML = `
    <div class="enc-bloom">${renderBloomSVG(plant, 80, 80)}</div>
    <div class="enc-body">
      <div class="enc-entry-num">Nr. ${num}</div>
      <div class="enc-entry-name" style="font-family: var(--font-serif, Georgia, serif)">Blüte ${num}</div>
      <span class="enc-rarity-badge" style="background:${badge.bg};color:${badge.color}">${RARITY_LABELS[entry.rarity]}</span>
      <div class="enc-meta">
        ${renderMetaRow('Blätter', `${count} · ${SHAPE_LABELS[shape] ?? shape}`)}
        ${renderMetaRow('Mitte', `${CENTER_LABELS[center] ?? center}`)}
        ${renderMetaRow('Farbe', `<span class="enc-color-swatch" style="${swatchStyle}"></span>`)}
        ${renderMetaRow('Gen.', `${plant.generation}`)}
      </div>
      <div class="enc-discovered">${formatDate(entry.discovered)}</div>
      ${ancestryHtml}
    </div>`;

  return el;
}

function renderMetaRow(label: string, value: string) {
  return `<div class="enc-meta-row">
          <span class="enc-meta-label">${label}</span>
          <span class="enc-meta-value">${value}</span>
        </div>`
} 
