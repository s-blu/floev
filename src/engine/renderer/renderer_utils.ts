import type { HSLColor } from '../../model/plant';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function hsl({ h, s, l }: HSLColor): string {
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
export function darken(c: HSLColor): HSLColor {
  return { h: c.h, s: Math.max(c.s - 10, 0), l: Math.max(c.l - 20, 0) }
}
export function svg(defs: string, body: string, w: number, h: number): string {
  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`;
}

