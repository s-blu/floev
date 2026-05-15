import type { Plant } from '../../model/plant';
import { renderFullBloom, renderStemWithLeaves } from './plant_renderer';
import { expressedNumber } from '../genetic/genetic_utils';
import { svg } from './renderer_utils';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

export function renderBloomSVG(plant: Plant, w: number, h: number, context: string = 'enc'): string {
  let defs = '';
  let body = '';
  const cx = w / 2;
  const cy = h / 2;

  ({ defs, body } = renderFullBloom(plant, defs, cx, cy, body, context));

  return svg(defs, body, w, h);
}

// ─── Plant-without-pot render (for Blumenkasten slots) ───────────────────────
// Uses the exact same coordinate system as renderPlantSVG (100×130 logical) so
// proportions are identical to the pot view. The SVG is then displayed at the
// requested displayW×displayH via viewBox scaling. The bottom pot-space (~30px
// logical) stays transparent and is hidden by the box pseudo-element.

const POT_W = 100
const POT_H = 130

export function renderPlantNoPotSVG(plant: Plant, displayW: number, displayH: number): string {
  let defs = '';
  let body = '';
  const cx      = POT_W / 2;
  const stemBase = POT_H - 30;
  const stemLen  = POT_H * 0.50 * expressedNumber(plant.stemHeight);
  const bloomY   = stemBase - stemLen;

  body = renderStemWithLeaves(body, plant, cx, stemBase, bloomY, stemLen);
  ({ defs, body } = renderFullBloom(plant, defs, cx, bloomY, body, 'coll'));

  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  return `<svg width="${displayW}" height="${displayH}" viewBox="0 0 ${POT_W} ${POT_H}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`;
}
