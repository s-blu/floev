import type { Plant } from '../../model/plant';

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

  // ── round ────────────────────────────────────────────────────────────────────
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

  // ── lanzett — schlank, lang, elegant ─────────────────────────────────────────
  if (shape === 'lanzett') {
    const tipR = pr * (pr < 14 ? 2.3 : 1.8);
    const baseW = pr * 0.22;
    const b1x = cx + ca * pr * 0.1 + cp * baseW;
    const b1y = bloomY + sa * pr * 0.1 + sp * baseW;
    const b2x = cx + ca * pr * 0.1 - cp * baseW;
    const b2y = bloomY + sa * pr * 0.1 - sp * baseW;
    const tx = cx + ca * tipR;
    const ty = bloomY + sa * tipR;
    const c1x = cx + ca * pr * 1.2 + cp * baseW * 0.3;
    const c1y = bloomY + sa * pr * 1.2 + sp * baseW * 0.3;
    const c2x = cx + ca * pr * 1.2 - cp * baseW * 0.3;
    const c2y = bloomY + sa * pr * 1.2 - sp * baseW * 0.3;
    return {
      type: 'path',
      d: `M${b1x},${b1y} C${c1x},${c1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${c2x},${c2y} ${b2x},${b2y} Z`,
    };
  }

  // ── tropfen — schmale Basis, breite Mitte, spitze Spitze ────────────────────
  if (shape === 'tropfen') {
    const tipR = pr * 2.3;
    const baseW = pr * 0.18;
    const b1x = cx + ca * pr * 0.05 + cp * baseW;
    const b1y = bloomY + sa * pr * 0.05 + sp * baseW;
    const b2x = cx + ca * pr * 0.05 - cp * baseW;
    const b2y = bloomY + sa * pr * 0.05 - sp * baseW;
    const tx = cx + ca * tipR;
    const ty = bloomY + sa * tipR;
    // Kontrollpunkte weit außen in der Mitte → Tropfenform
    const c1x = cx + ca * pr * 1.0 + cp * baseW * 4.0;
    const c1y = bloomY + sa * pr * 1.0 + sp * baseW * 4.0;
    const c2x = cx + ca * pr * 1.0 - cp * baseW * 4.0;
    const c2y = bloomY + sa * pr * 1.0 - sp * baseW * 4.0;
    return {
      type: 'path',
      d: `M${b1x},${b1y} C${c1x},${c1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${c2x},${c2y} ${b2x},${b2y} Z`,
    };
  }

  // ── wavy — fließende S-Kurven auf beiden Seiten ──────────────────────────────
  if (shape === 'wavy') {
    const tipR = pr * 2.2;
    const baseW = pr * 0.44;
    const b1x = cx + ca * pr * 0.15 + cp * baseW;
    const b1y = bloomY + sa * pr * 0.15 + sp * baseW;
    const b2x = cx + ca * pr * 0.15 - cp * baseW;
    const b2y = bloomY + sa * pr * 0.15 - sp * baseW;
    const tx = cx + ca * tipR;
    const ty = bloomY + sa * tipR;
    // Seite 1: S-Kurve — erst weit außen, dann nach innen
    const m1ax = cx + ca * pr * 0.6 + cp * baseW * 2.2;
    const m1ay = bloomY + sa * pr * 0.6 + sp * baseW * 2.2;
    const m1bx = cx + ca * pr * 1.3 + cp * baseW * 0.4;
    const m1by = bloomY + sa * pr * 1.3 + sp * baseW * 0.4;
    // Seite 2: S-Kurve gespiegelt
    const m2ax = cx + ca * pr * 0.6 - cp * baseW * 0.4;
    const m2ay = bloomY + sa * pr * 0.6 - sp * baseW * 0.4;
    const m2bx = cx + ca * pr * 1.3 - cp * baseW * 2.2;
    const m2by = bloomY + sa * pr * 1.3 - sp * baseW * 2.2;
    return {
      type: 'path',
      d: `M${b1x},${b1y} C${m1ax},${m1ay} ${m1bx},${m1by} ${tx},${ty} C${m2bx},${m2by} ${m2ax},${m2ay} ${b2x},${b2y} Z`,
    };
  }

  // ── zickzack — fransige Zacken, Federform (seltenste) ───────────────────────
  const tipR = pr * 2.3;
  const baseW = pr * 0.42;
  const b1x = cx + ca * pr * 0.15 + cp * baseW;
  const b1y = bloomY + sa * pr * 0.15 + sp * baseW;
  const b2x = cx + ca * pr * 0.15 - cp * baseW;
  const b2y = bloomY + sa * pr * 0.15 - sp * baseW;
  const tx = cx + ca * tipR;
  const ty = bloomY + sa * tipR;
  const zag = (r: number, side: number) => ({
    x: cx + ca * r + cp * side,
    y: bloomY + sa * r + sp * side,
  });
  const pts: string[] = [
    `M${b1x},${b1y}`,
    ...([
      [pr * 0.5, baseW * 1.6], [pr * 0.7, baseW * 0.5],
      [pr * 1.0, baseW * 1.8], [pr * 1.3, baseW * 0.3],
      [pr * 1.7, baseW * 1.2],
    ] as [number, number][]).map(([r, s]) => { const p = zag(r, s); return `L${p.x},${p.y}`; }),
    `L${tx},${ty}`,
    ...([
      [pr * 1.7, -baseW * 0.4], [pr * 1.3, -baseW * 1.5],
      [pr * 1.0, -baseW * 0.2], [pr * 0.7, -baseW * 1.6],
      [pr * 0.5, -baseW * 0.8],
    ] as [number, number][]).map(([r, s]) => { const p = zag(r, s); return `L${p.x},${p.y}`; }),
    `L${b2x},${b2y} Z`,
  ];
  return { type: 'path', d: pts.join(' ') };
}

// ─── SVG string builders ──────────────────────────────────────────────────────
export function petalToSVG(petal: PetalResult, fill: string, stroke: string): string {
  const sw = 'stroke-width="0.8"';
  if (petal.type === 'ellipse') {
    return `<ellipse cx="${petal.cx}" cy="${petal.cy}" rx="${petal.rx}" ry="${petal.ry}" fill="${fill}" stroke="${stroke}" ${sw} transform="rotate(${petal.rotDeg},${petal.cx},${petal.cy})"/>`;
  }
  return `<path d="${petal.d}" fill="${fill}" stroke="${stroke}" ${sw}/>`;
}