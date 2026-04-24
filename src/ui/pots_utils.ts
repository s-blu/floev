import { hasHiddenRareTrait, isHomozygous } from '../engine/genetic/genetic_utils';
import { getRarityForPot } from '../engine/rarity';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { t } from '../model/i18n';
import { GameState, Pot } from '../model/plant';
import { RARITY_COLORS, RARITY_ICON } from '../model/rarity_model';
import { hasUpgrade } from './ui';

export function buildPlantViewForPot(pot: Pot, state: GameState): string {
    if (!pot) return '';
    const isBlooming = pot.plant?.phase === 4;
    const lupePurchased = hasUpgrade(state, 'unlock_lupe');
    if (isBlooming && pot.plant) {
        return `<div class="plant-view plant-view--interactive">
        ${renderPlantSVG(pot.plant, 100, 130, pot.design)}
        ${lupePurchased ? `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>` : ''}
        </div>`;
    }
    return `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130, pot.design)}</div>`;
}

export function buildSideInfo(pot: Pot, state: GameState): string {
    if (!pot) return '<div class="pot-side-info"></div>';
    const isBlooming = pot.plant?.phase === 4;
    const r = getRarityForPot(state, pot);
    const hasCosmetics = (state.unlockedPotColors?.length ?? 0) > 0 || (state.unlockedPotShapes?.length ?? 0) > 0;
    let content = '';

    if (isBlooming && pot.plant) {
        const homozyg = isHomozygous(pot.plant);
        const rareCarrier = hasUpgrade(state, 'unlock_rare_radar') && hasHiddenRareTrait(pot.plant)
            ? `<span class="phase-rare-carrier" title="${t.rareCarrierTitle}">${t.rareCarrierBadge}</span>`
            : '';
        content += `<span class="pot-side-rarity" style="color:${RARITY_COLORS[r]}" title="${t.rarity[r]}">${RARITY_ICON[r]}</span>`;
        if (homozyg) content += `<span class="pot-side-homo" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`;
        if (rareCarrier) content += rareCarrier;
        content += `<span class="pot-side-gen">Gen. ${pot.plant.generation}</span>`;
    }

    if (hasCosmetics) {
        content += `<button class="pot-design-btn" data-action="pot-design" data-pot="${pot.id}" title="${t.potDesignBtnTitle}">🎨</button>`;
    }
    return `<div class="pot-side-info">${content}</div>`;
}

export function buildPotVisualArea(pot: Pot, state: GameState): string {
    return `<div class="pot-visual-area">${buildPlantViewForPot(pot, state)}${buildSideInfo(pot, state)}</div>`;
}

export function buildPotSill(): string {
    return '<div class="pot-sill"></div>';
}
