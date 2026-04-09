import type { Plant } from '../../model/plant';
import { expressedColor, expressedGradient, expressedShape, expressedNumber, expressedCenter } from '../genetic.utils';
import { buildPetalPath, petalToSVG } from './petal.renderer';
import { renderGradientDef, hsl, darken, clamp } from './renderer.utils';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────
/**
 * Renders only the flower head, centered in the given canvas.
 * Uses the same fixed petal radius as the main renderer so proportions match.
 */

export function renderBloomSVG(plant: Plant, w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;

  const pc = expressedColor(plant.petalColor);
  const grad = expressedGradient(plant.gradientColor);
  const shape = expressedShape(plant.petalShape);
  const n = Math.round(expressedNumber(plant.petalCount));

  // Same formula as renderFullBloom in renderer.ts — keeps center/petal ratio identical
  const pr = 12 + (8 - n) * 1.4;
  const hasGrad = grad !== null;

  let defs = '';
  let body = '';

  const gradId = `gb${plant.id.replace(/[^a-z0-9]/gi, '')}`;
  if (hasGrad) {
    defs += renderGradientDef(pc, grad!, gradId);
  }

  const fillStr = hasGrad ? `url(#${gradId})` : hsl(pc);
  const strokeStr = hsl(darken(pc));

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const petal = buildPetalPath(shape, angle, cx, cy, pr);
    body += petalToSVG(petal, fillStr, strokeStr);
  }

  // Center
  const cc = expressedColor(plant.centerColor);
  const ccStr = hsl(cc);
  const ccDark = hsl({ h: cc.h, s: clamp(cc.s + 10, 20, 100), l: clamp(cc.l - 18, 45, 80) });
  const centerType = expressedCenter(plant.centerType);

  if (centerType === 'dot') {
    body += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${ccStr}"/>`;
  } else if (centerType === 'disc') {
    body += `<circle cx="${cx}" cy="${cy}" r="8.5" fill="${ccDark}"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${ccStr}"/>`;
  } else {
    body += `<circle cx="${cx}" cy="${cy}" r="5" fill="${ccStr}"/>`;
    const tipCol = hsl({ h: cc.h, s: clamp(cc.s + 5, 20, 80), l: clamp(cc.l - 22, 45, 75) });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const fx = cx + Math.cos(a) * 8.5;
      const fy = cy + Math.sin(a) * 8.5;
      const lx = cx + Math.cos(a) * 5.5;
      const ly = cy + Math.sin(a) * 5.5;
      body += `<line x1="${lx}" y1="${ly}" x2="${fx}" y2="${fy}" stroke="${tipCol}" stroke-width="1" stroke-linecap="round" opacity="0.75"/>`;
      body += `<circle cx="${fx}" cy="${fy}" r="1.6" fill="${tipCol}" opacity="0.85"/>`;
    }
  }

  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  // overflow="visible" ensures petals are never clipped by the viewBox
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`;
}
