import { expressedCenter, expressedColor } from '../genetic/genetic_utils';
import { hsl, clamp } from './renderer.utils';

// ─── Center renderer (shared logic) ──────────────────────────────────────────

export function renderCenter(
  centerType: ReturnType<typeof expressedCenter>,
  cc: ReturnType<typeof expressedColor>,
  cx: number,
  cy: number
): string {
  const ccStr = hsl(cc);
  // A noticeably darker shade for the disc ring / stamen tips
  const ringColor = hsl({ h: cc.h, s: clamp(cc.s + 15, 20, 100), l: clamp(cc.l - 28, 20, 65) });
  let out = '';

  if (centerType === 'dot') {
    out += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${ccStr}"/>`;
  } else if (centerType === 'disc') {
    // Outer ring: thin, dark stroke — no fill so petals show through at the edge
    out += `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="${ringColor}" stroke-width="1.2" opacity="0.85"/>`;
    // Inner filled disc
    out += `<circle cx="${cx}" cy="${cy}" r="6.5" fill="${ccStr}"/>`;
    // Subtle highlight dot
    out += `<circle cx="${cx - 1.5}" cy="${cy - 1.5}" r="2" fill="white" opacity="0.18"/>`;
  } else {
    // stamen
    const tipCol = hsl({ h: cc.h, s: clamp(cc.s + 5, 20, 80), l: clamp(cc.l - 22, 40, 72) });
    out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${ccStr}"/>`;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const fx = cx + Math.cos(a) * 8.5;
      const fy = cy + Math.sin(a) * 8.5;
      const lx = cx + Math.cos(a) * 5.5;
      const ly = cy + Math.sin(a) * 5.5;
      out += `<line x1="${lx}" y1="${ly}" x2="${fx}" y2="${fy}" stroke="${tipCol}" stroke-width="1" stroke-linecap="round" opacity="0.75"/>`;
      out += `<circle cx="${fx}" cy="${fy}" r="1.6" fill="${tipCol}" opacity="0.85"/>`;
    }
  }
  return out;
}
