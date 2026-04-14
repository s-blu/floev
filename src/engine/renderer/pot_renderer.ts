import type { PotDesign } from '../../model/plant';
import { POT_COLORS } from '../../model/shop';


// ─── Pot shape mini SVG preview ───────────────────────────────────────────────
export function renderPotShopPreview(shape: string, colorId: string): string {
  const c = POT_COLORS.find(pc => pc.id === colorId) ?? POT_COLORS[0]
  const w = 36, h = 32
  const rimH = 4, potH = 18

  let potPath = ''
  if (shape === 'conic') {
    const topX = 8, topW = 20, botX = 4, botW = 28
    potPath = `<path d="M${topX},${rimH} L${topX + topW},${rimH} L${botX + botW},${rimH + potH} L${botX},${rimH + potH} Z" fill="${c.body}"/>`
  } else if (shape === 'belly') {
    potPath = `
      <rect x="6" y="${rimH}" width="24" height="${potH}" rx="3" fill="${c.body}"/>
      <ellipse cx="${w / 2}" cy="${rimH + potH * 0.5}" rx="14" ry="${potH * 0.36}" fill="${c.body}"/>`
  } else {
    potPath = `<rect x="6" y="${rimH}" width="24" height="${potH}" rx="3" fill="${c.body}"/>`
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
  const rx = 4;

  if (shape === 'conic') {
    // Trapezoid: narrower at top, wider at bottom
    const topW = potW * 0.72;
    const topX = (w - topW) / 2;
    const botW = potW;
    const botX = (w - botW) / 2;
    body += `<path d="M${topX},${potTop} L${topX + topW},${potTop} L${botX + botW},${potBot} L${botX},${potBot} Z" fill="${c.body}" rx="${rx}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else if (shape === 'belly') {
    // Wider in the middle — approximate with two paths + circle
    const midY = potTop + potH * 0.5;
    const bellW = potW * 1.12;
    const bellX = (w - bellW) / 2;
    // Simple approximation: a rect with bulging sides via a wide ellipse clip
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="${rx}" fill="${c.body}"/>`;
    // Belly bulge overlay
    body += `<ellipse cx="${w / 2}" cy="${midY}" rx="${bellW / 2}" ry="${potH * 0.36}" fill="${c.body}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  } else {
    // Standard
    body += `<rect x="${potX}" y="${potTop}" width="${potW}" height="${potH}" rx="${rx}" fill="${c.body}"/>`;
    body += `<rect x="${rimX}" y="${groundY}" width="${rimW}" height="${potRimH}" rx="3" fill="${c.rim}"/>`;
    body += `<rect x="${shineX}" y="${potTop + 2}" width="${shineW}" height="3" rx="1" fill="${c.shadow}" opacity="0.35"/>`;
  }

  return body;
}

