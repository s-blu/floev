import { hasHiddenRareTrait, isHomozygous } from '../engine/genetic/genetic_utils';
import { getRarityForPot } from '../engine/rarity';
import { renderPlantSVG } from '../engine/renderer/renderer';
import { t } from '../model/i18n';
import { GameState, Pot } from '../model/plant';
import { RARITY_COLORS, RARITY_ICON } from '../model/rarity_model';
import { hasUpgrade } from './ui';

export function buildPotHeader(pot: Pot, state: GameState): string {
    if (!pot) return '';
    const r = getRarityForPot(state, pot);
    const isBlooming = pot.plant?.phase === 4;
    const hasCosmetics = (state.unlockedPotColors?.length ?? 0) > 0 || (state.unlockedPotShapes?.length ?? 0) > 0


    let headerHtml = '<div class="pot-card-header">';
    if (isBlooming && pot.plant) {
        const homozyg = isHomozygous(pot.plant);
        if (homozyg) {
            headerHtml += `<span class="pot-homozygous-badge" title="${t.homozygousTitle}">${t.homozygousBadge}</span>`;
        }
        headerHtml += `<span class="pot-rarity-dot" style="color:${RARITY_COLORS[r]}" title="${t.rarity[r]}">${RARITY_ICON[r]}</span>`;
    }
    if (hasCosmetics) {
        headerHtml += `<button class="pot-design-btn" data-action="pot-design" data-pot="${pot.id}" title="${t.potDesignBtnTitle}">🎨</button>`;
    }
    headerHtml += '</div>';

    return headerHtml;
}

export function buildPlantViewForPot(pot: Pot, state: GameState): string {
    if (!pot) return '';
    const isBlooming = pot.plant?.phase === 4;
    let plantHtml = '';
    const lupePurchased = hasUpgrade(state, 'unlock_lupe');
    if (isBlooming && pot.plant) {
    plantHtml = `
        <div class="plant-view plant-view--interactive">
        ${renderPlantSVG(pot.plant, 100, 130, pot.design)}
        ${lupePurchased ? `<button class="plant-magnifier" data-action="allele-inspect" data-pot="${pot.id}" title="${t.alleleInspectTitle}">🔍</button>` : ''}
        </div>`;
    } else {
        plantHtml = `<div class="plant-view">${renderPlantSVG(pot.plant ?? null, 100, 130, pot.design)}</div>`;
    }

    return plantHtml;
}

export function getBloomingLabel(pot: Pot, state: GameState): string {
    if (!pot?.plant) return '';
    const r = getRarityForPot(state, pot);
    let labelHtml = '';
    const rareCarrier = hasUpgrade(state, 'unlock_rare_radar') && hasHiddenRareTrait(pot.plant)
      ? ` <span class="phase-rare-carrier" title="${t.rareCarrierTitle}">${t.rareCarrierBadge}</span>`
      : '';
    labelHtml = `<p class="phase-label">${rareCarrier} ${t.rarity[r]} · Gen. ${pot.plant.generation}</p>`;

    return labelHtml;
}
