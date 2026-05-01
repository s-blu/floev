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
        <rect   x="0"   y="0"   width="12" height="12" fill="${c.body}"/>
        <circle cx="4" cy="4" r="3"              fill="${c.rim}" fill-opacity="0.65"/>
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
    // Proportions derived from hand-tuned reference SVG (viewBox 0 0 100 130)
    const tH  = w * 0.317,  nH = w * 0.258,  bH = w * 0.334,  basH = w * 0.288
    const cx2 = w / 2
    const nY  = potTop + potH * 0.30
    const bY  = potTop + potH * 0.62
    const bot = potTop + potH
    potPath = `<path d="
      M${cx2-tH},${potTop} L${cx2+tH},${potTop}
      C${cx2+tH},${potTop+potH*0.077} ${cx2+w*0.2776},${potTop+potH*0.223} ${cx2+nH},${nY}
      C${cx2+w*0.2476},${potTop+potH*0.415} ${cx2+bH},${potTop+potH*0.427} ${cx2+bH},${bY}
      C${cx2+bH},${potTop+potH*0.774} ${cx2+w*0.308},${potTop+potH*0.885} ${cx2+basH},${bot}
      L${cx2-basH},${bot}
      C${cx2-w*0.308},${potTop+potH*0.885} ${cx2-bH},${potTop+potH*0.774} ${cx2-bH},${bY}
      C${cx2-bH},${potTop+potH*0.427} ${cx2-w*0.2476},${potTop+potH*0.415} ${cx2-nH},${nY}
      C${cx2-w*0.2776},${potTop+potH*0.223} ${cx2-tH},${potTop+potH*0.077} ${cx2-tH},${potTop}
      Z" fill="${bodyFill}"/>
    <path d="M${cx2+nH},${potTop+potH*0.423} C${cx2+w*0.415},${rimH*0.16} ${cx2+w*0.415},${potTop+potH*0.465} ${cx2+bH},${bY}" fill="none" stroke="${c.rim}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${cx2-nH},${potTop+potH*0.423} C${cx2-w*0.415},${rimH*0.16} ${cx2-w*0.415},${potTop+potH*0.465} ${cx2-bH},${bY}" fill="none" stroke="${c.rim}" stroke-width="2.5" stroke-linecap="round"/>`
    // Curved rim: edges slightly higher than center, flat bottom flush with body
    const aRH = w * 0.345, rC = rimH * 0.28
    rimPath = `<path d="
      M${cx2-aRH},${rC} Q${cx2},${0} ${cx2+aRH},${rC}
      L${cx2+aRH},${rimH} L${cx2-aRH},${rimH}
      Z" fill="${c.rim}"/>`
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
    // Proportions derived from hand-tuned reference SVG (viewBox 0 0 100 130)
    const tH   = w * 0.317,  nH  = w * 0.258,  bH  = w * 0.334,  basH = w * 0.288;
    const nXL  = cx - nH,    nXR = cx + nH;
    const bXL  = cx - bH,    bXR = cx + bH;
    const neckY  = potTop + potH * 0.30;
    const bellyY = potTop + potH * 0.62;
    body += `<path d="
      M${cx-tH},${potTop} L${cx+tH},${potTop}
      C${cx+tH},${potTop+potH*0.077} ${cx+w*0.2776},${potTop+potH*0.223} ${nXR},${neckY}
      C${cx+w*0.2476},${potTop+potH*0.415} ${bXR},${potTop+potH*0.427} ${bXR},${bellyY}
      C${bXR},${potTop+potH*0.774} ${cx+w*0.308},${potTop+potH*0.885} ${cx+basH},${potBot}
      L${cx-basH},${potBot}
      C${cx-w*0.308},${potTop+potH*0.885} ${bXL},${potTop+potH*0.774} ${bXL},${bellyY}
      C${bXL},${potTop+potH*0.427} ${cx-w*0.2476},${potTop+potH*0.415} ${nXL},${neckY}
      C${cx-w*0.2776},${potTop+potH*0.223} ${cx-tH},${potTop+potH*0.077} ${cx-tH},${potTop}
      Z" fill="${bodyFill}"/>`;
    // Handles: arch up to rim level, starting exactly at body edge at neckY
    const hAX = cx + w * 0.415, hAY = groundY + potRimH * 0.16;
    const hMY = potTop + potH * 0.465;
    const handleStroke = Math.max(3, w * 0.05);
    body += `<path d="M${nXR},${neckY} C${hAX},${hAY} ${hAX},${hMY} ${bXR},${bellyY}" fill="none" stroke="${c.rim}" stroke-width="${handleStroke}" stroke-linecap="round"/>`;
    body += `<path d="M${nXL},${neckY} C${2*cx-hAX},${hAY} ${2*cx-hAX},${hMY} ${bXL},${bellyY}" fill="none" stroke="${c.rim}" stroke-width="${handleStroke}" stroke-linecap="round"/>`;
    // Rim: edges higher than center, center stays at groundY so flower sits flush
    const aRH = w * 0.345, rC = potRimH * 0.6, rimR = rC * 0.6;
    body += `<path d="
      M${cx-aRH},${potTop}
      L${cx-aRH},${groundY-rC+rimR}
      A${rimR},${rimR} 0 0 1 ${cx-aRH+rimR},${groundY-rC}
      Q${cx},${groundY+rC} ${cx+aRH-rimR},${groundY-rC}
      A${rimR},${rimR} 0 0 1 ${cx+aRH},${groundY-rC+rimR}
      L${cx+aRH},${potTop}
      Z" fill="${c.rim}"/>`;
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
