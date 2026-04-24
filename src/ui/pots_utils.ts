import { hasHiddenRareTrait, isHomozygous } from '../engine/genetic/genetic_utils';
import { getRarityForPot } from '../engine/rarity';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { t } from '../model/i18n';
import { GameState, Pot } from '../model/plant';
import { RARITY_COLORS, RARITY_ICON } from '../model/rarity_model';
import { hasUpgrade } from './ui';

export function buildPlantViewForPot(pot: Pot, _state: GameState): string {
    if (!pot) return '';
    return `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130, pot.design)}</div>`;
}

export function buildLeftActions(pot: Pot, state: GameState): string {
    const isBlooming = pot.plant?.phase === 4;
    const lupePurchased = hasUpgrade(state, 'unlock_lupe');
    const hasCosmetics = (state.unlockedPotColors?.length ?? 0) > 0 || (state.unlockedPotShapes?.length ?? 0) > 0;
    let content = '';
    if (hasCosmetics) {
        content += `<button class="pot-design-btn" data-action="pot-design" data-pot="${pot.id}" title="${t.potDesignBtnTitle}">🎨</button>`;
    }
    if (isBlooming && lupePurchased) {
        content += `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>`;
    }
    if (!content) return '';
    return `<div class="pot-left-actions">${content}</div>`;
}

export function buildSideInfo(pot: Pot, state: GameState): string {
    if (!pot || pot.plant?.phase !== 4 || !pot.plant) return '';
    const r = getRarityForPot(state, pot);
    const homozyg = isHomozygous(pot.plant);
    const rareCarrier = hasUpgrade(state, 'unlock_rare_radar') && hasHiddenRareTrait(pot.plant)
        ? `<span class="phase-rare-carrier" title="${t.rareCarrierTitle}">${t.rareCarrierBadge}</span>`
        : '';
    let content = '';
    if (homozyg) content += `<span class="pot-side-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`;
    if (rareCarrier) content += rareCarrier;
    content += `<span class="pot-side-gen"><span class="pot-side-rarity" style="color:${RARITY_COLORS[r]}" title="${t.rarity[r]}">${RARITY_ICON[r]}</span> Gen. ${pot.plant.generation}</span>`;
    return `<div class="pot-side-info">${content}</div>`;
}

export function buildPotVisualArea(pot: Pot, state: GameState): string {
    return `<div class="pot-visual-area">${buildLeftActions(pot, state)}${buildPlantViewForPot(pot, state)}${buildSideInfo(pot, state)}</div>`;
}

export function buildPotSill(): string {
    return '<div class="pot-sill"></div>';
}
