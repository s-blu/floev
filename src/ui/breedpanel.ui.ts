import { computeBreedEstimate } from '../engine/breed';
import { renderPlantSVG } from '../engine/renderer/renderer';
import type { BreedEstimate } from '../model/plant';
import { state,render, breedState } from './ui';

// ─── Breeding panel ───────────────────────────────────────────────────────────
export function renderBreedPanel(): void {
// let breedSelA: number | null = null
// let breedSelB: number | null = null
// let breedEstimate: BreedEstimate | null = null

  const slotA = document.getElementById('breed-a');
  const slotB = document.getElementById('breed-b');
  const preview = document.getElementById('breed-preview');
  const btn = document.getElementById('breed-btn') as HTMLButtonElement | null;
  if (!slotA || !slotB || !preview || !btn) return;

  const potA = breedState.breedSelA !== null ? state.pots.find(p => p.id === breedState.breedSelA) : null;
  const potB = breedState.breedSelB !== null ? state.pots.find(p => p.id === breedState.breedSelB) : null;

  // Slot A — with X button if plant is selected
  if (potA?.plant) {
    slotA.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potA.plant, 66, 86)}
        <button class="breed-slot-remove" data-remove="a" title="Entfernen">×</button>
      </div>`;
  } else {
    slotA.innerHTML = '<span>Elter 1</span>';
  }

  // Slot B — with X button if plant is selected
  if (potB?.plant) {
    slotB.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potB.plant, 66, 86)}
        <button class="breed-slot-remove" data-remove="b" title="Entfernen">×</button>
      </div>`;
  } else {
    slotB.innerHTML = '<span>Elter 2</span>';
  }

  const hasEmptyPot = state.pots.some(p => !p.plant);

  if (potA?.plant && potB?.plant) {
    if (!breedState.breedEstimate) {
      breedState.breedEstimate = computeBreedEstimate(potA.plant, potB.plant);
    }
    preview.innerHTML = formatEstimate(breedState.breedEstimate);
    btn.disabled = !hasEmptyPot;
  } else {
    preview.textContent = 'Wähle zwei blühende Pflanzen aus.';
    btn.disabled = true;
    breedState.breedEstimate = null;
  }

  const hint = document.querySelector('.breed-hint') as HTMLElement | null;
  if (hint) {
    if (potA?.plant && potB?.plant && !hasEmptyPot) {
      hint.textContent = 'Kein freier Topf — entferne zuerst eine Pflanze.';
      hint.style.color = '#A32D2D';
    } else {
      hint.textContent = 'Ergebnis landet in einem leeren Topf';
      hint.style.color = '';
    }
  }

  // X-button listeners on breed slots
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
// ─── Estimate formatting ──────────────────────────────────────────────────────
const SHAPE_DE: Record<string, string> = { round: 'Rund', pointed: 'Spitz', wavy: 'Wellig' };
const CENTER_DE: Record<string, string> = { dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubbl.' };
function probBars<T extends string>(items: { [k: string]: T | number; }[], labelKey: string, valueKey: string, labelMap: Record<string, string>): string {
  return items.map((item) => {
    const label = labelMap[(item as Record<string, string>)[labelKey]] ?? (item as Record<string, string>)[labelKey];
    const pct = item[valueKey] as number;
    return `<div class="prob-entry">
      <span class="prob-label">${label}</span>
      <span class="prob-bar-wrap"><span class="prob-bar" style="width:${pct}%"></span></span>
      <span class="prob-pct">${pct}%</span>
    </div>`;
  }).join('');
}

function formatEstimate(e: BreedEstimate): string {
  const sw = (h: number) => `<span class="swatch" style="background:hsl(${Math.round(h)},${Math.round(e.avgS)}%,${Math.round(e.avgL)}%)"></span>`;

  const shapeBars = e.shapeProbs.map(x => renderProbabilityEntry(SHAPE_DE[x.shape] ?? x.shape, x)).join('');

  const centerBars = e.centerProbs.map(x => renderProbabilityEntry(CENTER_DE[x.center] ?? x.center, x)).join('');

  return `
    <div class="est-row">${sw(e.minH)}${sw(e.midH)}${sw(e.maxH)}<span>Farbbereich (ca.)</span></div>
    <div class="est-row" style="margin-bottom:4px">Blätter: ${e.minP}–${e.maxP}</div>
    <div class="prob-group">
      <div class="prob-group-label">Blütenform</div>
      ${shapeBars}
    </div>
    <div class="prob-group">
      <div class="prob-group-label">Blütenmitte</div>
      ${centerBars}
    </div>
    ${e.gradPct > 0 ? `<div class="est-grad">✦ Farbverlauf: ~${e.gradPct}%</div>` : ''}
    <div class="est-note">Ohne seltene Mutationen.</div>`;
}

function renderProbabilityEntry(label: string, x: { pct: number}) {
return `<div class="prob-entry">
      <span class="prob-label">${label}</span>
      <span class="prob-bar-wrap"><span class="prob-bar ${x.pct > 49 ? 'high' : x.pct > 29 ? 'middle' : 'low'}" style="width:${x.pct}%"></span></span>
      <span class="prob-pct">${x.pct}%</span>
    </div>`
}
