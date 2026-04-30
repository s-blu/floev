import { computeBreedEstimate } from '../engine/breed';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { state, render, breedState, isOnCooldown, formatCooldownRemaining, handleCraftSingleSeed, handleCraftMultipleSeeds } from './ui';
import { t } from '../model/i18n';
import { isHomozygous } from '../engine/genetic/genetic_utils';
import { formatEstimate } from './breedestimate_ui';
import { MAX_SURPLUS_SEEDS_PER_PLANT, MAX_SEED_STORAGE, MULTI_SEED_COUNT_MIN } from '../model/genetic_model';
import { hasUpgrade } from '../engine/shop_engine';
import { renderSeedIcon } from '../engine/renderer/seed_renderer';
import type { Plant } from '../model/plant';

// ─── Breeding panel ───────────────────────────────────────────────────────────

function renderSurplusCap(plant: Plant): string {
  const used = plant.surplusSeedsProduced ?? 0
  const remaining = MAX_SURPLUS_SEEDS_PER_PLANT - used
  const exhausted = remaining <= 0
  const bars = Array.from({ length: MAX_SURPLUS_SEEDS_PER_PLANT }, (_, i) =>
    `<span class="surplus-cap-bar${i < remaining ? ' surplus-cap-bar--full' : ''}"></span>`
  ).join('')
  return `<div class="surplus-cap" title="${t.surplusSeedCapacity(remaining, MAX_SURPLUS_SEEDS_PER_PLANT)}">
    <span class="surplus-cap-icon${exhausted ? ' surplus-cap-icon--exhausted' : ''}">${renderSeedIcon(12)}</span>
    <div class="surplus-cap-bars">${bars}</div>
  </div>`
}

function renderCooldownStatus(plant: Plant): string {
  const active = isOnCooldown(plant)
  const inner = active
    ? `<span>${t.craftRestingLabel}</span><span>${t.craftRestingTime(formatCooldownRemaining(plant.breedCooldownUntil!))}</span>`
    : ''
  return `<div class="breed-cooldown-status">${inner}</div>`
}

export function renderBreedPanel(): void {
  const slotA    = document.getElementById('breed-a');
  const slotB    = document.getElementById('breed-b');
  const preview  = document.getElementById('breed-preview');
  const btn      = document.getElementById('breed-btn') as HTMLButtonElement | null;
  if (!slotA || !slotB || !preview || !btn) return;

  const potA = breedState.breedSelA !== null ? state.pots.find(p => p.id === breedState.breedSelA) : null;
  const potB = breedState.breedSelB !== null ? state.pots.find(p => p.id === breedState.breedSelB) : null;

  if (potA?.plant) {
    const homoA = isHomozygous(potA.plant);
    slotA.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potA.plant, 66, 86, undefined, 'brd')}
        ${homoA ? `<span class="breed-slot-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>` : ''}
        <button class="breed-slot-remove" data-remove="a" title="${t.breedSlotRemoveTitle}">×</button>
      </div>`;
  } else {
    slotA.innerHTML = `<span>${t.breedParent1}</span>`;
  }

  if (potB?.plant) {
    const homoB = isHomozygous(potB.plant);
    slotB.innerHTML = `
      <div class="breed-slot-inner">
        ${renderPlantSVG(potB.plant, 66, 86, undefined, 'brd')}
        ${homoB ? `<span class="breed-slot-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>` : ''}
        <button class="breed-slot-remove" data-remove="b" title="${t.breedSlotRemoveTitle}">×</button>
      </div>`;
  } else {
    slotB.innerHTML = `<span>${t.breedParent2}</span>`;
  }

  const hasEmptyPot = state.pots.some(p => !p.plant);
  const showCap = hasUpgrade(state, 'unlock_seed_drawer');

  const capA = document.getElementById('breed-a-cap');
  const capB = document.getElementById('breed-b-cap');
  const emptyStatus = '<div class="breed-cooldown-status"></div>'
  if (capA) capA.innerHTML = (showCap && potA?.plant ? renderSurplusCap(potA.plant) : '') + (potA?.plant ? renderCooldownStatus(potA.plant) : emptyStatus);
  if (capB) capB.innerHTML = (showCap && potB?.plant ? renderSurplusCap(potB.plant) : '') + (potB?.plant ? renderCooldownStatus(potB.plant) : emptyStatus);

  const bothBlooming = !!(potA?.plant && potB?.plant);
  const aCooldown = bothBlooming && isOnCooldown(potA!.plant!);
  const bCooldown = bothBlooming && isOnCooldown(potB!.plant!);
  const anyCooldown = aCooldown || bCooldown;
  const aCapFull = bothBlooming && (potA!.plant!.surplusSeedsProduced ?? 0) >= MAX_SURPLUS_SEEDS_PER_PLANT;
  const bCapFull = bothBlooming && (potB!.plant!.surplusSeedsProduced ?? 0) >= MAX_SURPLUS_SEEDS_PER_PLANT;
  const drawerFull = state.seeds.length >= MAX_SEED_STORAGE;
  const drawerNearFull = state.seeds.length + MULTI_SEED_COUNT_MIN > MAX_SEED_STORAGE;

  if (potA?.plant && potB?.plant) {
    if (!breedState.breedEstimate) {
      breedState.breedEstimate = computeBreedEstimate(potA.plant, potB.plant);
    }
    preview.innerHTML = formatEstimate(breedState.breedEstimate, potA.plant, potB.plant);
    btn.disabled = !hasEmptyPot || anyCooldown;
  } else {
    preview.textContent = t.breedPrompt;
    btn.disabled = true;
    breedState.breedEstimate = null;
  }

  const hint = document.querySelector('.breed-hint') as HTMLElement | null;
  if (hint) {
    if (potA?.plant && potB?.plant && !hasEmptyPot) {
      hint.textContent = t.breedHintNoSpace;
      hint.style.color = '#A32D2D';
    } else {
      const seedChancePossible = showCap && !(bothBlooming && (aCapFull || bCapFull));
      hint.textContent = seedChancePossible ? t.breedHintWithSeed : t.breedHint;
      hint.style.color = '';
    }
  }

  const craftActions = document.getElementById('breed-craft-actions');
  if (craftActions) {
    if (bothBlooming && showCap) {
      const singleDisabled = anyCooldown || aCapFull || bCapFull || drawerFull;
      const multiDisabled = anyCooldown || drawerNearFull;
      craftActions.innerHTML = `
        <div class="breed-craft-list">
          <div class="breed-craft-item">
            <button class="btn btn-craft-seed" id="craft-single-seed-btn" ${singleDisabled ? 'disabled' : ''} title="${t.craftSingleSeedTitle}">${t.craftSingleSeedBtn}</button>
            <span class="breed-craft-hint">${t.craftSingleSeedWarningShort}</span>
          </div>
          <div class="breed-craft-item">
            <button class="btn btn-craft-seed" id="craft-multi-seed-btn" ${multiDisabled ? 'disabled' : ''} title="${t.craftMultiSeedTitle}">${t.craftMultiSeedBtn}</button>
            <span class="breed-craft-hint">${t.craftMultiSeedWarningShort}</span>
          </div>
        </div>`
      document.getElementById('craft-single-seed-btn')?.addEventListener('click', handleCraftSingleSeed);
      document.getElementById('craft-multi-seed-btn')?.addEventListener('click', handleCraftMultipleSeeds);
    } else {
      craftActions.innerHTML = '';
    }
  }

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