import type { Plant } from '../../model/plant';
import { expressedColor, expressedShape, expressedNumber, expressedCenter, expressedEffect } from '../genetic/genetic_utils';
import { renderCenter } from './center_renderer';
import { buildPetalPath, petalToSVG } from './petal_renderer';
import { renderStem } from './renderer';
import { hsl, clamp } from './renderer_utils';
import { resolvePetalEffect } from './petaleffect_renderer';

export function renderFullBloom(plant: Plant, defs: string, cx: number, bloomY: number, body: string) {
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  const shape = expressedShape(plant.petalShape);
  const n = Math.round(expressedNumber(plant.petalCount));
  const pr = 12 + (8 - n) * 1.4;

  const effect = expressedEffect(plant.petalEffect);
  // Effects always render at L=60 regardless of allele lightness
  const effectPc = (effect !== 'none' && pc.s > 0) ? { ...pc, l: 60 as const } : pc;
  const fills = resolvePetalEffect(effect, effectPc, shape, plant.id, cx, bloomY);
  // defs wird erst nach allen getFill-Calls gezogen (lazy getter für bicolor)
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const petal = buildPetalPath(shape, angle, cx, bloomY, pr);
    const fill   = fills.getFill(i, n, angle);
    const stroke = fills.getStroke(i, n, angle);
    body += petalToSVG(petal, fill, stroke);
  }
  defs += fills.defs;

  const centerType = expressedCenter(plant.centerType);
  body += renderCenter(centerType, effectPc.l, cx, bloomY);

  return { defs, body };
}

export function renderBud(plant: Plant, body: string, cx: number, bloomY: number) {
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  body += `<ellipse cx="${cx}" cy="${bloomY + 2}" rx="7" ry="11" fill="#2d6e35"/>`;
  body += `<ellipse cx="${cx}" cy="${bloomY + 1}" rx="5" ry="8.5" fill="#3a9a45"/>`;
  body += `<ellipse cx="${cx - 1.5}" cy="${bloomY}" rx="2.5" ry="6" fill="${hsl(pc)}" opacity="0.5"/>`;
  body += `<line x1="${cx - 1}" y1="${bloomY - 7}" x2="${cx - 1}" y2="${bloomY + 2}" stroke="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 10, 40, 90) })}" stroke-width="1.5" opacity="0.55"/>`;
  return body;
}

export function renderStemWithLeaves(body: string, plant: Plant, cx: number, stemBase: number, bloomY: number, stemLen: number) {
  body += renderStem(plant, cx, stemBase, bloomY);
  const leafY = stemBase - stemLen * 0.28;
  const stemLeafShape = (xPos: number, rotate: number) => `<ellipse cx="${xPos}" cy="${leafY}" rx="11" ry="6" fill="#3a9a45" transform="rotate(${rotate},${xPos},${leafY})"/>`;
  body += stemLeafShape(cx - 8, 50);
  body += stemLeafShape(cx + 8, -50);
  return body;
}

export function renderSprout(stemBase: number, stemLen: number, body: string, cx: number) {
  const tipY = stemBase - stemLen * 0.35;
  body += `<line x1="${cx}" y1="${stemBase}" x2="${cx}" y2="${tipY}" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`;
  body += `<ellipse cx="${cx}" cy="${tipY - 5}" rx="4" ry="6" fill="#3a9a45"/>`;
  return body;
}

export function renderSeed(cx: number, stemBase: number) {
  return `<ellipse cx="${cx}" cy="${stemBase - 4}" rx="5" ry="3.5" fill="#8B6914"/>`;
}

