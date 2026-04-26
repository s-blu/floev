import type { Plant, PotDesign } from '../../model/plant'
import { expressedNumber} from "../genetic/genetic_utils"
import { renderPot } from './pot_renderer';
import { renderSeed, renderSprout, renderStemWithLeaves, renderBud, renderFullBloom } from './plant_renderer';
import { svg } from './renderer_utils';

// ─── Curved stem ─────────────────────────────────────────────────────────────

export function renderStem(plant: Plant, cx: number, stemBase: number, bloomY: number): string {
  const lean = (plant.id.charCodeAt(0) % 2 === 0 ? 1 : -1) * 5
  const qx = cx + lean
  const qy = (stemBase + bloomY) / 2
  return `<path d="M${cx},${stemBase} Q${qx},${qy} ${cx},${bloomY}" fill="none" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
}

// ─── Main render function ─────────────────────────────────────────────────────

export function renderPlantSVG(plant: Plant | null, w: number, h: number, potDesign?: PotDesign, context: string = 'pot'): string {
  const cx = w / 2
  let defs = '';
  let body = '';

  const potH = 26;
  const potRimH = 7;
  const groundY = h - potH - potRimH + 4;

  const stemBase = groundY - 1;
  const stemLen = h * 0.50 * (plant ? expressedNumber(plant.stemHeight) : 0.6);
  const bloomY = stemBase - stemLen;

  body = renderPot(w, groundY, potRimH, potH, body, potDesign);

  if (!plant) return svg(defs, body, w, h)

  if (plant.phase === 1) {
    body += renderSeed(cx, stemBase)
    return svg(defs, body, w, h)
  }

  if (plant.phase === 2) {
    body = renderSprout(stemBase, stemLen, body, cx);
    return svg(defs, body, w, h)
  }

  body = renderStemWithLeaves(body, plant, cx, stemBase, bloomY, stemLen);

  if (plant.phase === 3) {
    body = renderBud(plant, body, cx, bloomY);
    return svg(defs, body, w, h)
  }

  // Phase 4: full bloom
  ({ defs, body } = renderFullBloom(plant, defs, cx, bloomY, body, context));

  return svg(defs, body, w, h)
}

