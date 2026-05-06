import { getBuffLevel } from '../engine/game_params';
import { isBuffMaxed, getBuffDef, getNextBuffLevel, canBuyBuff } from '../engine/buffs_engine';
import { t } from '../model/i18n';
import { BUFFS, type BuffId } from "../model/buffs";
import { hasUpgrade, state, handleBuyBuff } from './ui';

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

function buildEffectBadge(defId: string, currentLevel: number): string {
  if (currentLevel <= 0) return '';
  const pct = Math.round((getBuffDef(defId as BuffId)?.levels[currentLevel - 1]?.value ?? 0) * 100);
  const label = t.buffBadge[defId]?.(pct);
  return label ? `<span class="buff-level-badge">${label}</span>` : '';
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

  const preview = panel.querySelector('.buffs-collapsed-preview') as HTMLElement | null
  if (preview) {
    if (!buffsPanelOpen) {
      preview.innerHTML = renderBuffsCollapsedPreview()
      preview.style.display = ''
    } else {
      preview.style.display = 'none'
    }
  }

  const body = panel.querySelector('.buffs-body') as HTMLElement | null
  if (!body) return
  if (!buffsPanelOpen) return

  body.innerHTML = renderBuffsItems()
}

function renderBuffsCollapsedPreview(): string {
  const active = BUFFS.filter(def => {
    if (def.unlock_required && !hasUpgrade(state, def.unlock_required)) return false;
    return getBuffLevel(state, def.id) > 0;
  });
  if (active.length === 0) return '';
  const items = active.map(def => {
    const badge = buildEffectBadge(def.id, getBuffLevel(state, def.id));
    return `<span class="buffs-active-item"><span>${def.icon}</span>${badge}</span>`;
  }).join('');
  return `<div class="buffs-active-row">${items}</div>`;
}

function renderBuffsItems(): string {
  const researchPoints = state.researchPoints ?? 0
  const hasResearchBook = hasUpgrade(state, 'unlock_research_book')
  const pointsDisplay = hasResearchBook
    ? `<span class="buffs-research-points">${t.researchPointsBadge(researchPoints)}</span>`
    : `<span class="buffs-research-hint">${t.buffNoResearchBook}</span>`

  const items = BUFFS.map(def => {
    const unlockReq = def.unlock_required;
    if (unlockReq && !hasUpgrade(state, unlockReq)) return '';

    const currentLevel = getBuffLevel(state, def.id);
    const maxed = isBuffMaxed(state, def.id);
    const nextLevelDef = !maxed ? def.levels[getNextBuffLevel(state, def.id) - 1] : null;

    const effectBadge = buildEffectBadge(def.id, currentLevel);

    const currentEffect = currentLevel > 0
      ? `<span class="shop-item-desc">${t.buffDesc[def.id]?.(Math.round((def.levels[currentLevel - 1]?.value ?? 0) * 100))}</span>`
      : `<span class="shop-item-desc">${t.buffDesc[def.id]?.(Math.round((def.levels[0]?.value ?? 0) * 100))}</span>`;

    let actionArea: string;
    if (maxed) {
      actionArea = `<span class="shop-item-owned-badge">${t.buffMaxed}</span>`;
    } else if (nextLevelDef) {
      const canAfford = canBuyBuff(state, def.id)
      actionArea = `
        <div class="buff-action-area">
          <span class="buff-cost-label">${t.buffCost(nextLevelDef.cost)}</span>
          <button class="shop-buy-btn${canAfford ? '' : ' shop-buy-btn--disabled'}"
                  data-action="buy-buff" data-id="${def.id}"
                  ${canAfford ? '' : 'disabled'}>
            ${t.buffBuyBtn}
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
          ${effectBadge}
        </div>
        <div class="shop-item-action">${actionArea}</div>
      </div>`;
  }).join('');

  return `<div class="buffs-points-header">${pointsDisplay}</div>${items}`
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
    const el = (e.target as HTMLElement).closest('[data-action="buy-buff"]') as HTMLElement | null
    if (!el) return
    const id = el.dataset.id as BuffId
    if (id) handleBuyBuff(id)
  })
}
