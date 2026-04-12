import type { Plant } from '../../model/plant';
import { expressedColor, expressedGradient, expressedShape, expressedNumber, expressedCenter } from '../genetic/genetic_utils';
import { buildPetalPath, petalToSVG } from './petal_renderer';
import { renderGradientDef, hsl, darken } from './renderer.utils';
import { renderCenter } from './center_renderer';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

export function renderBloomSVG(plant: Plant, w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;

  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  const hasGrad = expressedGradient(plant.hasGradient);
  const shape = expressedShape(plant.petalShape);
  const n = Math.round(expressedNumber(plant.petalCount));

  const pr = 12 + (8 - n) * 1.4;

  let defs = '';
  let body = '';

  const gradId = `gb${plant.id.replace(/[^a-z0-9]/gi, '')}`;
  if (hasGrad) {
    defs += renderGradientDef(pc, gradId);
  }

  const fillStr = hasGrad ? `url(#${gradId})` : hsl(pc);
  const strokeStr = hsl(darken(pc));

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const petal = buildPetalPath(shape, angle, cx, cy, pr);
    body += petalToSVG(petal, fillStr, strokeStr);
  }

  const cc = plant.centerColor.a;
  const centerType = expressedCenter(plant.centerType);
  body += renderCenter(centerType, cc, cx, cy);

  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`;
}
