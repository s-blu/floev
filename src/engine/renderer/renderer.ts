import type { Plant, PotDesign } from '../../model/plant'
import {
  expressedColor, expressedShape, expressedCenter,
  expressedNumber, expressedGradient
} from "../genetic/genetic_utils"
import { buildPetalPath, petalToSVG } from './petal_renderer';
import { renderCenter } from './center_renderer';
import { hsl, clamp, darken } from './renderer_utils'
import { renderGradientDef } from './renderer_utils';

// ─── Curved stem ─────────────────────────────────────────────────────────────

function renderStem(plant: Plant, cx: number, stemBase: number, bloomY: number): string {
  const lean = (plant.id.charCodeAt(0) % 2 === 0 ? 1 : -1) * 5
  const qx = cx + lean
  const qy = (stemBase + bloomY) / 2
  return `<path d="M${cx},${stemBase} Q${qx},${qy} ${cx},${bloomY}" fill="none" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
}

// ─── Main render function ─────────────────────────────────────────────────────

export function renderPlantSVG(plant: Plant | null, w: number, h: number, potDesign?: PotDesign): string {
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

function renderPot(w: number, groundY: number, potRimH: number, potH: number, body: string, potDesign?: PotDesign): string {
  const colorId = potDesign?.colorId ?? 'terracotta'
  const shape   = potDesign?.shape ?? 'standard'

  // Color palette
  const COLORS: Record<string, { body: string; rim: string; shadow: string }> = {
    terracotta: { body: '#b8724a', rim: '#c8855a', shadow: '#a86540' },
    cream:      { body: '#e8dfc8', rim: '#f0e8d4', shadow: '#d4c9ae' },
    slate:      { body: '#6b7280', rim: '#7d8795', shadow: '#5a6170' },
    sage:       { body: '#7a9e7e', rim: '#8db592', shadow: '#6a8a6e' },
    blush:      { body: '#c4867a', rim: '#d49a8e', shadow: '#b07268' },
    cobalt:     { body: '#3d5a8a', rim: '#4a6ea0', shadow: '#304870' },
    obsidian:   { body: '#2a2825', rim: '#3a3835', shadow: '#1e1c1a' },
    gold:       { body: '#c9963a', rim: '#dba84a', shadow: '#b07e28' },
  }
  const c = COLORS[colorId] ?? COLORS.terracotta

  const potW   = w * 0.72
  const potX   = (w - potW) / 2
  const rimW   = potW * 1.09
  const rimX   = (w - rimW) / 2
  const shineW = potW * 0.82
  const shineX = (w - shineW) / 2
  const potTop = groundY + potRimH
  const potBot = potTop + potH
  const rx     = 4

  if (shape === 'conic') {
    // Trapezoid: narrower at top, wider at bottom
    const topW  = potW * 0.72
    const topX  = (w - topW) / 2
    const botW  = potW
    const botX  = (w - botW) / 2
    body += `<path d="M${topX},${potTop} L${topX + topW},${potTop} L${botX + botW},${potBot} L${botX},${potBot} Z" fill="${c.body}" rx="${rx}"/>`
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`
  } else if (shape === 'belly') {
    // Wider in the middle — approximate with two paths + circle
    const midY  = potTop + potH * 0.5
    const bellW = potW * 1.12
    const bellX = (w - bellW) / 2
    // Simple approximation: a rect with bulging sides via a wide ellipse clip
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="${rx}" fill="${c.body}"/>`
    // Belly bulge overlay
    body += `<ellipse cx="${w / 2}" cy="${midY}" rx="${bellW / 2}" ry="${potH * 0.36}" fill="${c.body}"/>`
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`
  } else {
    // Standard
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="${rx}" fill="${c.body}"/>`
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`
  }

  return body
}

function svg(defs: string, body: string, w: number, h: number): string {
  const defsBlock = defs ? `<defs>${defs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`
}
