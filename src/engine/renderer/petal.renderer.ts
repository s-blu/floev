import type { Plant } from '../../model/plant';
import { PetalResult } from './petal.renderer';

// ─── Petal path builders ──────────────────────────────────────────────────────
export type PetalResult = { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotDeg: number; } |
{ type: 'path'; d: string; };
export function buildPetalPath(
  shape: Plant['petalShape']['a'],
  angle: number,
  cx: number,
  bloomY: number,
  pr: number): PetalResult {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const perp = angle + Math.PI / 2;
  const cp = Math.cos(perp);
  const sp = Math.sin(perp);

  if (shape === 'round') {
    return {
      type: 'ellipse',
      cx: cx + ca * (pr - 1),
      cy: bloomY + sa * (pr),
      rx: pr * 0.80,
      ry: pr * 0.54,
      rotDeg: (angle * 180) / Math.PI,
    };
  }

  if (shape === 'pointed') {
    const tipR = pr * 2.2;
    const baseW = pr * 0.38;
    const b1x = cx + ca * pr * 0.18 + cp * baseW;
    const b1y = bloomY + sa * pr * 0.18 + sp * baseW;
    const b2x = cx + ca * pr * 0.18 - cp * baseW;
    const b2y = bloomY + sa * pr * 0.18 - sp * baseW;
    const tx = cx + ca * tipR;
    const ty = bloomY + sa * tipR;
    const ctrl1x = cx + ca * (pr * 1.1) + cp * baseW * 0.55;
    const ctrl1y = bloomY + sa * (pr * 1.1) + sp * baseW * 0.55;
    const ctrl2x = cx + ca * (pr * 1.1) - cp * baseW * 0.55;
    const ctrl2y = bloomY + sa * (pr * 1.1) - sp * baseW * 0.55;
    return {
      type: 'path',
      d: `M${b1x},${b1y} C${ctrl1x},${ctrl1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${ctrl2x},${ctrl2y} ${b2x},${b2y} Z`,
    };
  }

  // wavy
  const tipR = pr * 2.2;
  const baseW = pr * 0.40;
  const b1x = cx + ca * pr * 0.18 + cp * baseW;
  const b1y = bloomY + sa * pr * 0.18 + sp * baseW;
  const b2x = cx + ca * pr * 0.18 - cp * baseW;
  const b2y = bloomY + sa * pr * 0.18 - sp * baseW;
  const tx = cx + ca * tipR;
  const ty = bloomY + sa * tipR;
  const m1x = cx + ca * pr * 0.95 + cp * baseW * 2.0;
  const m1y = bloomY + sa * pr * 0.95 + sp * baseW * 2.0;
  const m2x = cx + ca * pr * 0.95 - cp * baseW * 1.2;
  const m2y = bloomY + sa * pr * 0.95 - sp * baseW * 1.2;
  return {
    type: 'path',
    d: `M${b1x},${b1y} C${m1x},${m1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${m2x},${m2y} ${b2x},${b2y} Z`,
  };
}// ─── SVG string builders ──────────────────────────────────────────────────────
export function petalToSVG(petal: PetalResult, fill: string, stroke: string): string {
  const sw = 'stroke-width="0.8"';
  if (petal.type === 'ellipse') {
    return `<ellipse cx="${petal.cx}" cy="${petal.cy}" rx="${petal.rx}" ry="${petal.ry}" fill="${fill}" stroke="${stroke}" ${sw} transform="rotate(${petal.rotDeg},${petal.cx},${petal.cy})"/>`;
  }
  return `<path d="${petal.d}" fill="${fill}" stroke="${stroke}" ${sw}/>`;
}

