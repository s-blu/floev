import type { PotDesign } from '../../model/plant';
import type { PotColorDef } from '../../model/shop';
import { POT_COLORS } from '../../model/shop';

// ─── Effect fill helper ───────────────────────────────────────────────────────

let _defSeq = 0

function getEffectFill(effectId: string | undefined, c: PotColorDef, potUid: string): { defs: string; fill: string } {
  if (!effectId || effectId === 'none') return { defs: '', fill: c.body }

  const id = `eff_${potUid}_${++_defSeq}`

  switch (effectId) {
    case 'glossy': {
      const defs = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${c.rim}"/>
        <stop offset="45%"  stop-color="${c.body}"/>
        <stop offset="100%" stop-color="${c.shadow}"/>
      </linearGradient>`
      return { defs, fill: `url(#${id})` }
    }
    case 'stripes': {
      const defs = `<pattern id="${id}" x="0" y="0" width="100" height="7" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="100" height="7"   fill="${c.body}"/>
        <rect x="0" y="0" width="100" height="3.5" fill="${c.rim}" fill-opacity="0.55"/>
      </pattern>`
      return { defs, fill: `url(#${id})` }
    }
    case 'diagonal': {
      const defs = `<pattern id="${id}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect x="0" y="0" width="10" height="10" fill="${c.body}"/>
        <rect x="0" y="0" width="5"  height="10" fill="${c.rim}" fill-opacity="0.5"/>
      </pattern>`
      return { defs, fill: `url(#${id})` }
    }
    case 'dots': {
      const defs = `<pattern id="${id}" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
        <rect   x="0"   y="0"   width="9" height="9" fill="${c.body}"/>
        <circle cx="4.5" cy="4.5" r="2"              fill="${c.rim}" fill-opacity="0.65"/>
      </pattern>`
      return { defs, fill: `url(#${id})` }
    }
    default:
      return { defs: '', fill: c.body }
  }
}

// ─── Shop preview ─────────────────────────────────────────────────────────────

export function renderPotShopPreview(shape: string, colorId: string, effectId?: string): string {
  const c = POT_COLORS.find(pc => pc.id === colorId) ?? POT_COLORS[0]
  const w = 36, h = 32
  const rimH = 4, potH = 18
  const potTop = rimH

  const { defs: effectDefs, fill: bodyFill } = getEffectFill(effectId, c, `${colorId}_${shape}`)

  let potPath = ''
  let rimPath = `<rect x="4" y="0" width="28" height="${rimH}" rx="2" fill="${c.rim}"/>`

  if (shape === 'conic') {
    const topX = 5, topW = 26, botX = 10, botW = 16
    potPath = `<path d="M${topX},${potTop} L${topX + topW},${potTop} L${botX + botW},${potTop + potH} L${botX},${potTop + potH} Z" fill="${bodyFill}"/>`
  } else if (shape === 'belly') {
    const by = potTop + potH * 0.55
    const bulge = 7
    potPath = `<path d="
      M${w/2 - 10},${potTop}
      L${w/2 + 10},${potTop}
      C${w/2 + 10 + bulge},${by} ${w/2 + 10 + bulge},${by} ${w/2 + 8},${potTop + potH}
      L${w/2 - 8},${potTop + potH}
      C${w/2 - 10 - bulge},${by} ${w/2 - 10 - bulge},${by} ${w/2 - 10},${potTop}
      Z" fill="${bodyFill}"/>`
  } else if (shape === 'bowl') {
    potPath = `<path d="M3,${potTop} L33,${potTop} L29,${potTop + potH} L7,${potTop + potH} Z" fill="${bodyFill}"/>`
    rimPath = `<rect x="1" y="0" width="34" height="${rimH}" rx="2" fill="${c.rim}"/>`
  } else if (shape === 'urn') {
    const by = potTop + potH * 0.38
    const bulge = 9
    potPath = `<path d="
      M${w/2 - 8},${potTop}
      L${w/2 + 8},${potTop}
      C${w/2 + 8 + bulge},${by} ${w/2 + 6 + bulge * 0.2},${potTop + potH - 3} ${w/2 + 6},${potTop + potH}
      L${w/2 - 6},${potTop + potH}
      C${w/2 - 6 - bulge * 0.2},${potTop + potH - 3} ${w/2 - 8 - bulge},${by} ${w/2 - 8},${potTop}
      Z" fill="${bodyFill}"/>`
  } else if (shape === 'tiny') {
    potPath = `<rect x="11" y="${potTop}" width="14" height="${potH}" rx="4" fill="${bodyFill}"/>`
    rimPath = `<rect x="9" y="0" width="18" height="${rimH}" rx="2" fill="${c.rim}"/>`
  } else if (shape === 'amphore') {
    const neckY  = potTop + potH * 0.30
    const bellyY = potTop + potH * 0.62
    potPath = `<path d="
      M8,${potTop} L28,${potTop}
      C27,${potTop+1} 25,${neckY-2} 24,${neckY}
      C23,${neckY+2} 29,${bellyY-3} 30,${bellyY}
      C30,${bellyY+3} 27,${potTop+potH-1} 26,${potTop+potH}
      L10,${potTop+potH}
      C9,${potTop+potH-1} 6,${bellyY+3} 6,${bellyY}
      C7,${bellyY-3} 13,${neckY+2} 12,${neckY}
      C11,${neckY-2} 9,${potTop+1} 8,${potTop}
      Z" fill="${bodyFill}"/>
    <path d="M24,${neckY} C33,${potTop-3} 33,${neckY+4} 30,${bellyY}" fill="none" stroke="${c.rim}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12,${neckY} C3,${potTop-3} 3,${neckY+4} 6,${bellyY}" fill="none" stroke="${c.rim}" stroke-width="2.5" stroke-linecap="round"/>`
    rimPath = `<rect x="5" y="0" width="26" height="${rimH}" rx="2" fill="${c.rim}"/>`
  } else if (shape === 'offset') {
    const midY = potTop + potH * 0.50
    potPath = `<path d="
      M11,${potTop} L25,${potTop}
      L25,${midY} L29,${midY}
      L27,${potTop+potH} L9,${potTop+potH}
      L7,${midY} L11,${midY}
      Z" fill="${bodyFill}"/>`
    rimPath = `<rect x="9" y="0" width="18" height="${rimH}" rx="2" fill="${c.rim}"/>`
  } else {
    potPath = `<rect x="6" y="${potTop}" width="24" height="${potH}" rx="3" fill="${bodyFill}"/>`
  }

  const defsBlock = effectDefs ? `<defs>${effectDefs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    ${defsBlock}
    ${potPath}
    ${rimPath}
  </svg>`
}

// ─── Full-scale pot render ────────────────────────────────────────────────────

export function renderPot(w: number, groundY: number, potRimH: number, potH: number, body: string, potDesign?: PotDesign): { body: string; defs: string } {
  const colorId = potDesign?.colorId ?? 'terracotta';
  const shape   = potDesign?.shape   ?? 'standard';
  const c = POT_COLORS.find(pc => pc.id === colorId) ?? POT_COLORS[0];

  const potW = w * 0.72;
  const potX = (w - potW) / 2;
  const rimW = potW * 1.09;
  const rimX = (w - rimW) / 2;
  const shineW = potW * 0.82;
  const shineX = (w - shineW) / 2;
  const potTop = groundY + potRimH;
  const potBot = potTop + potH;
  const cx = w / 2;

  const { defs: effectDefs, fill: bodyFill } = getEffectFill(potDesign?.effectId, c, `${colorId}_${shape}`)

  if (shape === 'conic') {
    const topHalf = potW * 0.50;
    const botHalf = potW * 0.32;
    const tX = cx - topHalf, tX2 = cx + topHalf;
    const bX = cx - botHalf, bX2 = cx + botHalf;
    body += `<path d="M${tX},${potTop} L${tX2},${potTop} L${bX2},${potBot} L${bX},${potBot} Z" fill="${bodyFill}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'belly') {
    const topHalf = potW * 0.42;
    const botHalf = potW * 0.38;
    const bulge = potW * 0.22;
    const midY = potTop + potH * 0.55;
    const tXL = cx - topHalf, tXR = cx + topHalf;
    const bXL = cx - botHalf, bXR = cx + botHalf;
    body += `<path d="
      M${tXL},${potTop}
      L${tXR},${potTop}
      C${tXR + bulge},${midY} ${bXR + bulge * 0.5},${potBot - 4} ${bXR},${potBot}
      L${bXL},${potBot}
      C${bXL - bulge * 0.5},${potBot - 4} ${tXL - bulge},${midY} ${tXL},${potTop}
      Z" fill="${bodyFill}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'bowl') {
    const topHalf = potW * 0.62;
    const botHalf = potW * 0.48;
    const tXL = cx - topHalf, tXR = cx + topHalf;
    const bXL = cx - botHalf, bXR = cx + botHalf;
    const bowlRimW = potW * 1.28;
    const bowlRimX = (w - bowlRimW) / 2;
    body += `<path d="M${tXL},${potTop} L${tXR},${potTop} L${bXR},${potBot} L${bXL},${potBot} Z" fill="${bodyFill}"/>`;
    body += `<rect x="${bowlRimX}" y="${groundY}" width="${bowlRimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'urn') {
    const topHalf = potW * 0.40;
    const botHalf = potW * 0.30;
    const bulge = potW * 0.26;
    const midY = potTop + potH * 0.38;
    const tXL = cx - topHalf, tXR = cx + topHalf;
    const bXL = cx - botHalf, bXR = cx + botHalf;
    body += `<path d="
      M${tXL},${potTop}
      L${tXR},${potTop}
      C${tXR + bulge},${midY} ${bXR + bulge * 0.2},${potBot - 3} ${bXR},${potBot}
      L${bXL},${potBot}
      C${bXL - bulge * 0.2},${potBot - 3} ${tXL - bulge},${midY} ${tXL},${potTop}
      Z" fill="${bodyFill}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'tiny') {
    const tinyPotW = potW * 0.50;
    const tinyPotX = (w - tinyPotW) / 2;
    const tinyRimW = tinyPotW * 1.15;
    const tinyRimX = (w - tinyRimW) / 2;
    const tinyShineW = tinyPotW * 0.80;
    const tinyShineX = (w - tinyShineW) / 2;
    body += `<rect x="${tinyPotX}" y="${potTop}" width="${tinyPotW}" height="${potH}" rx="6" fill="${bodyFill}"/>`;
    body += `<rect x="${tinyRimX}" y="${groundY}" width="${tinyRimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${tinyShineX}" y="${potTop + 2}" width="${tinyShineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'amphore') {
    const mouthHalf = potW * 0.44;
    const neckHalf  = potW * 0.33;
    const bellyHalf = potW * 0.52;
    const baseHalf  = potW * 0.40;
    const neckY     = potTop + potH * 0.30;
    const bellyY    = potTop + potH * 0.62;
    const mXL = cx - mouthHalf, mXR = cx + mouthHalf;
    const nXL = cx - neckHalf,  nXR = cx + neckHalf;
    const bXL = cx - bellyHalf, bXR = cx + bellyHalf;
    const basXL = cx - baseHalf, basXR = cx + baseHalf;
    body += `<path d="
      M${mXL},${potTop} L${mXR},${potTop}
      C${mXR},${potTop+2} ${nXR+2},${neckY-2} ${nXR},${neckY}
      C${nXR-1},${neckY+3} ${bXR},${bellyY-5} ${bXR},${bellyY}
      C${bXR},${bellyY+4} ${basXR+2},${potBot-3} ${basXR},${potBot}
      L${basXL},${potBot}
      C${basXL-2},${potBot-3} ${bXL},${bellyY+4} ${bXL},${bellyY}
      C${bXL},${bellyY-5} ${nXL+1},${neckY+3} ${nXL},${neckY}
      C${nXL-2},${neckY-2} ${mXL},${potTop+2} ${mXL},${potTop}
      Z" fill="${bodyFill}"/>`;
    const handleArchX = cx + potW * 0.72;
    const handleArchY = groundY - potH * 0.15;
    const handleStroke = Math.max(3, potW * 0.07);
    body += `<path d="M${nXR},${neckY} C${handleArchX},${handleArchY} ${handleArchX},${neckY + potH * 0.18} ${bXR},${bellyY}" fill="none" stroke="${c.rim}" stroke-width="${handleStroke}" stroke-linecap="round"/>`;
    body += `<path d="M${nXL},${neckY} C${w - handleArchX},${handleArchY} ${w - handleArchX},${neckY + potH * 0.18} ${bXL},${bellyY}" fill="none" stroke="${c.rim}" stroke-width="${handleStroke}" stroke-linecap="round"/>`;
    const amphRimW = mouthHalf * 2 * 1.09;
    const amphRimX = (w - amphRimW) / 2;
    body += `<rect x="${amphRimX}" y="${groundY}" width="${amphRimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'offset') {
    const midY      = potTop + potH * 0.50;
    const upHalf    = potW * 0.38;
    const loTopHalf = potW * 0.52;
    const loBotHalf = potW * 0.40;
    const upXL = cx - upHalf,    upXR = cx + upHalf;
    const loTXL = cx - loTopHalf, loTXR = cx + loTopHalf;
    const loBXL = cx - loBotHalf, loBXR = cx + loBotHalf;
    body += `<path d="
      M${upXL},${potTop} L${upXR},${potTop}
      L${upXR},${midY} L${loTXR},${midY}
      L${loBXR},${potBot} L${loBXL},${potBot}
      L${loTXL},${midY} L${upXL},${midY}
      Z" fill="${bodyFill}"/>`;
    body += `<rect x="${loTXL}" y="${midY}" width="${loTopHalf * 2}" height="2" fill="${c.shadow}" opacity="0.4"/>`;
    const offRimW = upHalf * 2 * 1.12;
    const offRimX = (w - offRimW) / 2;
    body += `<rect x="${offRimX}" y="${groundY}" width="${offRimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    const upShineW = upHalf * 2 * 0.82;
    const upShineX = (w - upShineW) / 2;
    body += `<rect x="${upShineX}" y="${potTop + 2}" width="${upShineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else {
    // Standard
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="4" fill="${bodyFill}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  }

  return { body, defs: effectDefs }
}
