import type { Plant } from '../../model/plant'
import {
  expressedColor, expressedShape, expressedCenter,
  expressedNumber, expressedGradient
} from "../genetic/genetic_utils"
import { buildPetalPath, petalToSVG } from './petal_renderer';
import { renderCenter } from './center_renderer';
import { hsl, clamp, darken } from './renderer.utils'
import { renderGradientDef } from './renderer.utils';

// ─── Curved stem ─────────────────────────────────────────────────────────────

function renderStem(plant: Plant, cx: number, stemBase: number, bloomY: number): string {
  const lean = (plant.id.charCodeAt(0) % 2 === 0 ? 1 : -1) * 5
  const qx = cx + lean
  const qy = (stemBase + bloomY) / 2
  return `<path d="M${cx},${stemBase} Q${qx},${qy} ${cx},${bloomY}" fill="none" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
}

// ─── Main render function ─────────────────────────────────────────────────────

export function renderPlantSVG(plant: Plant | null, w: number, h: number): string {
  const cx = w / 2
  let defs = '';
  let body = '';

  const potH = 26;
  const potRimH = 7;
  const groundY = h - potH - potRimH + 4;

  const stemBase = groundY - 1;
  const stemLen = h * 0.50 * (plant ? expressedNumber(plant.stemHeight) : 0.6);
  const bloomY = stemBase - stemLen;

  body = renderPot(w, groundY, potRimH, potH, body);

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
  ({ defs, body } = renderFullBloom(plant, defs, cx, bloomY, body));

  return svg(defs, body, w, h)
}

function renderFullBloom(plant: Plant, defs: string, cx: number, bloomY: number, body: string) {
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  const hasGrad = expressedGradient(plant.hasGradient);
  const shape = expressedShape(plant.petalShape);
  const n = Math.round(expressedNumber(plant.petalCount));
  const pr = 12 + (8 - n) * 1.4;

  const gradId = `g${plant.id.replace(/[^a-z0-9]/gi, '')}`;
  if (hasGrad) {
    defs += renderGradientDef(pc, shape, gradId);
  }

  const fillStr = hasGrad ? `url(#${gradId})` : hsl(pc);
  const strokeStr = hsl(darken(pc));

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const petal = buildPetalPath(shape, angle, cx, bloomY, pr);
    body += petalToSVG(petal, fillStr, strokeStr);
  }

  const cc = plant.centerColor.a;
  const centerType = expressedCenter(plant.centerType);
  body += renderCenter(centerType, cc, cx, bloomY);

  return { defs, body };
}

function renderBud(plant: Plant, body: string, cx: number, bloomY: number) {
  const pc = expressedColor(plant.petalHue, plant.petalLightness);
  body += `<ellipse cx="${cx}" cy="${bloomY + 2}" rx="7" ry="11" fill="#2d6e35"/>`;
  body += `<ellipse cx="${cx}" cy="${bloomY + 1}" rx="5" ry="8.5" fill="#3a9a45"/>`;
  body += `<ellipse cx="${cx - 1.5}" cy="${bloomY}" rx="2.5" ry="6" fill="${hsl(pc)}" opacity="0.5"/>`;
  body += `<line x1="${cx - 1}" y1="${bloomY - 7}" x2="${cx - 1}" y2="${bloomY + 2}" stroke="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 10, 40, 90) })}" stroke-width="1.5" opacity="0.55"/>`;
  return body;
}

function renderStemWithLeaves(body: string, plant: Plant, cx: number, stemBase: number, bloomY: number, stemLen: number) {
  body += renderStem(plant, cx, stemBase, bloomY);
  const leafY = stemBase - stemLen * 0.28;
  const stemLeafShape = (xPos: number, rotate: number) =>
    `<ellipse cx="${xPos}" cy="${leafY}" rx="11" ry="6" fill="#3a9a45" transform="rotate(${rotate},${xPos},${leafY})"/>`;
  body += stemLeafShape(cx - 8, 50);
  body += stemLeafShape(cx + 8, -50);
  return body;
}

function renderSprout(stemBase: number, stemLen: number, body: string, cx: number) {
  const tipY = stemBase - stemLen * 0.35;
  body += `<line x1="${cx}" y1="${stemBase}" x2="${cx}" y2="${tipY}" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`;
  body += `<ellipse cx="${cx}" cy="${tipY - 5}" rx="4" ry="6" fill="#3a9a45"/>`;
  return body;
}

function renderSeed(cx: number, stemBase: number) {
  return `<ellipse cx="${cx}" cy="${stemBase - 4}" rx="5" ry="3.5" fill="#8B6914"/>`;
}

function renderPot(w: number, groundY: number, potRimH: number, potH: number, body: string) {
  const potW = w * 0.72;
  const potX = (w - potW) / 2;
  const rimX = (w - potW * 1.09) / 2;
  const shineX = (w - potW * 0.82) / 2;
  body += `<rect x="${potX}" y="${groundY + potRimH}" width="${potW}" height="${potH}" rx="4" fill="#b8724a"/>`;
  body += `<rect x="${rimX}" y="${groundY}" width="${potW * 1.09}" height="${potRimH}" rx="3" fill="#c8855a"/>`;
  body += `<rect x="${shineX}" y="${groundY + potRimH + 2}" width="${potW * 0.82}" height="3" rx="1" fill="#a86540" opacity="0.35"/>`;
  return body;
}

function svg(defs: string, body: string, w: number, h: number): string {
  const defsBlock = defs ? `<defs>${defs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`
}
