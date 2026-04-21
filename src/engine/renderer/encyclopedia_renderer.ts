import type { Plant } from '../../model/plant';
import { expressedColor, expressedShape, expressedNumber, expressedCenter, expressedEffect } from '../genetic/genetic_utils';
import { buildPetalPath, petalToSVG } from './petal_renderer';
import { resolvePetalEffect } from './petaleffect_renderer';
import { renderCenter } from './center_renderer';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

export function renderBloomSVG(plant: Plant, w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;

  const pc     = expressedColor(plant.petalHue, plant.petalLightness);
  const effect = expressedEffect(plant.petalEffect);
  const shape  = expressedShape(plant.petalShape);
  const n      = Math.round(expressedNumber(plant.petalCount));
  const pr     = 12 + (8 - n) * 1.4;

  let defs = '';
  let body = '';

  const fills = resolvePetalEffect(effect, pc, shape, plant.id, cx, cy);

  for (let i = 0; i < n; i++) {
    const angle  = (i / n) * Math.PI * 2 - Math.PI / 2;
    const petal  = buildPetalPath(shape, angle, cx, cy, pr);
    const fill   = fills.getFill(i, n, angle);
    const stroke = fills.getStroke(i, n, angle);
    body += petalToSVG(petal, fill, stroke);
    body += fills.getOverlay(i, n, angle, '');
  }

  // bicolor uses a lazy defs getter — access after all getFill calls
  defs += fills.defs;

  const centerType = expressedCenter(plant.centerType);
  body += renderCenter(centerType, pc.l, cx, cy);

  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`;
}
