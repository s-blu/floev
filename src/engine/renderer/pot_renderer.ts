import type { PotDesign } from '../../model/plant';
import { POT_COLORS } from '../../model/shop';

export function renderPotShopPreview(shape: string, colorId: string): string {
  const c = POT_COLORS.find(pc => pc.id === colorId) ?? POT_COLORS[0]
  const w = 36, h = 32
  const rimH = 4, potH = 18
  const potTop = rimH

  let potPath = ''
  if (shape === 'conic') {
    // Klassische Blumentopfform: oben breit, unten schmal
    const topX = 5, topW = 26, botX = 10, botW = 16
    potPath = `<path d="M${topX},${potTop} L${topX + topW},${potTop} L${botX + botW},${potTop + potH} L${botX},${potTop + potH} Z" fill="${c.body}"/>`
  } else if (shape === 'belly') {
    // Echter Bauch mit Bézier
    const bx = w / 2, by = potTop + potH * 0.55
    const bulge = 7
    potPath = `<path d="
      M${w/2 - 10},${potTop}
      L${w/2 + 10},${potTop}
      C${w/2 + 10 + bulge},${by} ${w/2 + 10 + bulge},${by} ${w/2 + 8},${potTop + potH}
      L${w/2 - 8},${potTop + potH}
      C${w/2 - 10 - bulge},${by} ${w/2 - 10 - bulge},${by} ${w/2 - 10},${potTop}
      Z" fill="${c.body}"/>`
  } else {
    potPath = `<rect x="6" y="${potTop}" width="24" height="${potH}" rx="3" fill="${c.body}"/>`
  }

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    ${potPath}
    <rect x="4" y="0" width="28" height="${rimH}" rx="2" fill="${c.rim}"/>
  </svg>`
}

export function renderPot(w: number, groundY: number, potRimH: number, potH: number, body: string, potDesign?: PotDesign): string {
  const colorId = potDesign?.colorId ?? 'terracotta';
  const shape = potDesign?.shape ?? 'standard';
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

  if (shape === 'conic') {
    // Klassische Blumentopfform: oben breit, unten schmal
    const topHalf = potW * 0.50;
    const botHalf = potW * 0.32;
    const tX = cx - topHalf, tX2 = cx + topHalf;
    const bX = cx - botHalf, bX2 = cx + botHalf;
    body += `<path d="M${tX},${potTop} L${tX2},${potTop} L${bX2},${potBot} L${bX},${potBot} Z" fill="${c.body}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'belly') {
    // Echter Bauch — Bézier-Kurven auf beiden Seiten
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
      Z" fill="${c.body}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else {
    // Standard
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="4" fill="${c.body}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  }

  return body;
}