import { getBuffLevel } from '../engine/game_params';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { isBuffMaxed, getBuffDef, getNextBuffLevel, canFulfillRequirements, plantMatchesReq } from '../engine/buffs_engine';
import { t } from '../model/i18n';
import type { Plant } from '../model/plant';
import { type BuffReqKind, BUFFS, type BuffId } from '../model/shop';
import { hasUpgrade, state, handleRedeemBuff } from './ui';

// ─── Panel open state (persisted in localStorage) ─────────────────────────────

const BUFFS_PANEL_OPEN_KEY = 'buffsPanelOpen'

function loadBuffsPanelOpen(): boolean {
  const stored = localStorage.getItem(BUFFS_PANEL_OPEN_KEY)
  return stored === null ? true : stored === 'true'
}

function saveBuffsPanelOpen(value: boolean): void {
  localStorage.setItem(BUFFS_PANEL_OPEN_KEY, String(value))
}

let buffsPanelOpen = loadBuffsPanelOpen()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reqLabel(req: BuffReqKind): string {
  switch (req.kind) {
    case 'any': return t.buffReqAny;
    case 'rarity_min': return t.buffReqRarityMin(req.min);
    case 'effect': return t.buffReqEffect(req.effect);
    case 'effect_or': return t.buffReqEffectOr(req.effects);
    case 'petal_count': return t.buffReqPetalCount(req.count);
    case 'shape': return t.buffReqShape(req.shape);
    case 'shape_or': return t.buffReqShapeOr(req.shapes);
    case 'color_bucket': return t.buffReqColorBucket(req.bucket);
    case 'color_bucket_or': return t.buffReqColorOr(req.buckets);
    case 'coin_value_min': return t.buffReqCoinMin(req.min);
    case 'combined': return t.buffReqCombined(req.predicates.map(p => reqLabel(p)));
  }
}

// ─── Panel render ─────────────────────────────────────────────────────────────

export function renderBuffsPanel(): void {
  const panel = document.getElementById('buffs-panel')
  if (!panel) return

  const hasAnyBuff = BUFFS.some(def => !def.unlock_required || hasUpgrade(state, def.unlock_required))
  panel.style.display = hasAnyBuff ? '' : 'none'
  if (!hasAnyBuff) return

  const chevron = panel.querySelector('.buffs-chevron') as HTMLElement | null
  if (chevron) chevron.textContent = buffsPanelOpen ? '▴' : '▾'

  panel.classList.toggle('buffs-panel--open', buffsPanelOpen)

  const body = panel.querySelector('.buffs-body') as HTMLElement | null
  if (!body) return
  if (!buffsPanelOpen) return

  body.innerHTML = renderBuffsItems()
}

function renderBuffsItems(): string {
  return BUFFS.map(def => {
    const unlockReq = def.unlock_required;
    if (unlockReq && !hasUpgrade(state, unlockReq)) return '';

    const currentLevel = getBuffLevel(state, def.id);
    const maxLevel = def.levels.length;
    const maxed = isBuffMaxed(state, def.id);
    const nextLevelDef = !maxed ? def.levels[currentLevel] : null;
    const effectPct = Math.round((def.levels[Math.max(0, currentLevel - 1)]?.value ?? 0) * 100);

    const levelBadge = currentLevel > 0
      ? `<span class="buff-level-badge">${t.buffLevelLabel(currentLevel, maxLevel)}</span>`
      : `<span class="buff-level-badge buff-level-badge--none">${t.buffNotYetLabel}</span>`;

    const currentEffect = currentLevel > 0
      ? `<span class="shop-item-desc">${t.buffDesc[def.id]?.(effectPct)}</span>`
      : `<span class="shop-item-desc">${t.buffDesc[def.id]?.(Math.round((def.levels[0]?.value ?? 0) * 100))}</span>`;

    let actionArea: string;
    if (maxed) {
      actionArea = `<span class="shop-item-owned-badge">${t.buffMaxed}</span>`;
    } else if (nextLevelDef) {
      const reqSummary = nextLevelDef.requirements.map(r => `${r.count}× ${reqLabel(r.req)}`
      ).join(', ');
      actionArea = `
        <div class="buff-action-area">
          <span class="buff-req-summary">${reqSummary}</span>
          <button class="shop-buy-btn" data-action="redeem-buff" data-id="${def.id}">
            ${t.buffRedeemBtn}
          </button>
        </div>`;
    } else {
      actionArea = '';
    }

    return `
      <div class="shop-item">
        <span class="shop-item-icon">${def.icon}</span>
        <div class="shop-item-info">
          <span class="shop-item-title">${t.buffTitle[def.id]}</span>
          ${currentEffect}
          ${levelBadge}
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>`;
  }).join('');
}

// ─── Panel initialisation ─────────────────────────────────────────────────────

export function initBuffsPanel(): void {
  const panel = document.getElementById('buffs-panel')
  if (!panel) return

  panel.querySelector('.buffs-toggle-btn')?.addEventListener('click', () => {
    buffsPanelOpen = !buffsPanelOpen
    saveBuffsPanelOpen(buffsPanelOpen)
    renderBuffsPanel()
  })

  panel.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-action="redeem-buff"]') as HTMLElement | null
    if (!el) return
    const id = el.dataset.id as BuffId
    if (id) openBuffRedeemOverlay(id)
  })
}

// ─── Buff redeem overlay ──────────────────────────────────────────────────────

let _buffOverlayId: BuffId | null = null;
let _buffSelectedPotIds: number[] = [];
let _buffSelectedSeedIds: string[] = [];

function openBuffRedeemOverlay(id: BuffId): void {
  document.getElementById('buff-redeem-overlay')?.remove();
  _buffOverlayId = id;
  _buffSelectedPotIds = [];
  _buffSelectedSeedIds = [];

  const def = getBuffDef(id);
  if (!def) return;
  const nextLevel = getNextBuffLevel(state, id);
  const levelDef = def.levels[nextLevel - 1];
  if (!levelDef) return;

  const overlay = document.createElement('div');
  overlay.id = 'buff-redeem-overlay';
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = buildOverlayHtml(def.id, nextLevel, levelDef.requirements);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBuffOverlay(); });
  document.getElementById('buff-redeem-cancel')?.addEventListener('click', closeBuffOverlay);
  document.getElementById('buff-redeem-confirm')?.addEventListener('click', confirmBuffRedeem);
  overlay.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-buff-pot]') as HTMLElement | null;
    if (el) toggleBuffPotSelection(Number(el.dataset.buffPot), id);
    const sel = (e.target as HTMLElement).closest('[data-buff-seed]') as HTMLElement | null;
    if (sel) toggleBuffSeedSelection(sel.dataset.buffSeed!, id);
  });
}

function buildOverlayHtml(id: BuffId, nextLevel: number, requirements: import('../model/shop').BuffRequirement[]): string {
  const needsPot = requirements.some(r => r.source === 'pot');
  const needsSeed = requirements.some(r => r.source === 'seed_drawer');

  const reqRows = requirements.map(r => {
    const label = `${r.count}× ${reqLabel(r.req)} (${r.source === 'pot' ? t.buffReqSourcePot : t.buffReqSourceSeed})`;
    return `<li class="buff-req-row" data-req-source="${r.source}">${label}</li>`;
  }).join('');

  const bloomingPots = state.pots.filter(p => p.plant && p.plant.phase === 4);
  const potCards = needsPot ? bloomingPots.map(pot => {
    const svg = renderPlantSVG(pot.plant, 60, 72, pot.design);
    return `<button class="buff-plant-card" data-buff-pot="${pot.id}" title="Topf ${pot.id + 1}">${svg}</button>`;
  }).join('') : '';

  const seedCards = needsSeed ? state.seeds.map(seed => {
    const svg = renderPlantSVG(seed, 60, 72);
    return `<button class="buff-plant-card" data-buff-seed="${seed.id}">${svg}</button>`;
  }).join('') : '';

  return `
    <div class="dialog-box dialog-box--wide">
      <p class="dialog-title">${t.buffRedeemTitle(t.buffTitle[id], nextLevel)}</p>
      <ul class="buff-req-list">${reqRows}</ul>
      ${needsPot ? `
        <p class="buff-pick-hint">${t.buffRedeemPickHint(requirements.filter(r => r.source === 'pot').reduce((s, r) => s + r.count, 0))}</p>
        <div class="buff-plant-grid" id="buff-pot-grid">${bloomingPots.length ? potCards : '<p class="buff-no-plants">Keine blühenden Pflanzen vorhanden.</p>'}</div>
      ` : ''}
      ${needsSeed ? `
        <p class="buff-pick-hint">${t.buffRedeemSeedHint(requirements.filter(r => r.source === 'seed_drawer').reduce((s, r) => s + r.count, 0))}</p>
        <div class="buff-plant-grid" id="buff-seed-grid">${state.seeds.length ? seedCards : '<p class="buff-no-plants">Keine Samen in der Schublade.</p>'}</div>
      ` : ''}
      <p class="buff-progress-hint" id="buff-progress-hint"></p>
      <div class="dialog-actions">
        <button class="btn" id="buff-redeem-cancel">${t.buffRedeemCancel}</button>
        <button class="btn btn-confirm" id="buff-redeem-confirm" disabled>${t.buffRedeemConfirm}</button>
      </div>
    </div>`;
}

function toggleBuffPotSelection(potId: number, id: BuffId): void {
  const idx = _buffSelectedPotIds.indexOf(potId);
  if (idx >= 0) {
    _buffSelectedPotIds.splice(idx, 1);
  } else {
    _buffSelectedPotIds.push(potId);
  }
  updateBuffOverlayState(id);
}

function toggleBuffSeedSelection(seedId: string, id: BuffId): void {
  const idx = _buffSelectedSeedIds.indexOf(seedId);
  if (idx >= 0) {
    _buffSelectedSeedIds.splice(idx, 1);
  } else {
    _buffSelectedSeedIds.push(seedId);
  }
  updateBuffOverlayState(id);
}

function updateBuffOverlayState(id: BuffId): void {
  const def = getBuffDef(id);
  if (!def) return;
  const nextLevel = getNextBuffLevel(state, id);
  const levelDef = def.levels[nextLevel - 1];
  if (!levelDef) return;

  const potPlants = _buffSelectedPotIds
    .map(pid => state.pots.find(p => p.id === pid)?.plant)
    .filter((p): p is Plant => !!p && p.phase === 4);
  const seedPlants = _buffSelectedSeedIds
    .map(sid => state.seeds.find(s => s.id === sid))
    .filter((p): p is Plant => !!p);

  const fulfilled = canFulfillRequirements(potPlants, seedPlants, levelDef.requirements);

  document.querySelectorAll<HTMLElement>('[data-buff-pot]').forEach(el => {
    const pid = Number(el.dataset.buffPot);
    el.classList.toggle('buff-plant-card--selected', _buffSelectedPotIds.includes(pid));
    const plant = state.pots.find(p => p.id === pid)?.plant;
    const matchesAny = plant && levelDef.requirements.some(r => r.source === 'pot' && plantMatchesReq(plant, r.req));
    el.classList.toggle('buff-plant-card--ineligible', !matchesAny);
  });
  document.querySelectorAll<HTMLElement>('[data-buff-seed]').forEach(el => {
    const sid = el.dataset.buffSeed!;
    el.classList.toggle('buff-plant-card--selected', _buffSelectedSeedIds.includes(sid));
    const seed = state.seeds.find(s => s.id === sid);
    const matchesAny = seed && levelDef.requirements.some(r => r.source === 'seed_drawer' && plantMatchesReq(seed, r.req));
    el.classList.toggle('buff-plant-card--ineligible', !matchesAny);
  });

  const total = _buffSelectedPotIds.length + _buffSelectedSeedIds.length;
  const needed = levelDef.requirements.reduce((s, r) => s + r.count, 0);
  const hint = document.getElementById('buff-progress-hint');
  if (hint) hint.textContent = t.buffRedeemProgress(total, needed);

  const confirmBtn = document.getElementById('buff-redeem-confirm') as HTMLButtonElement | null;
  if (confirmBtn) confirmBtn.disabled = !fulfilled;
}

function confirmBuffRedeem(): void {
  if (!_buffOverlayId) return;
  handleRedeemBuff(_buffOverlayId, [..._buffSelectedPotIds], [..._buffSelectedSeedIds]);
  closeBuffOverlay();
  renderBuffsPanel();
}

function closeBuffOverlay(): void {
  document.getElementById('buff-redeem-overlay')?.remove();
  _buffOverlayId = null;
  _buffSelectedPotIds = [];
  _buffSelectedSeedIds = [];
}
