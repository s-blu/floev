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

  // ── zickzack — Federform, Lappen springen vorwärts und biegen zurück ───────
  // Lappen-Spitze liegt jeweils näher zur Blüten-Spitze als der Hals (Cusp-Technik).
  const tipR = pr * 2.2;
  const pt = (r: number, s: number) => `${cx + ca * r + cp * s},${bloomY + sa * r + sp * s}`;
  const tx = cx + ca * tipR;
  const ty = bloomY + sa * tipR;
  const d = [
    `M${pt(pr * 0.05, pr * 0.13)}`,
    // Seite 1 – drei Lappen (je 2 C-Kurven: vorwärts zur Spitze, Bogen zurück)
    `C${pt(pr * 0.05, pr * 0.13)} ${pt(pr * 0.55, pr * 0.70)} ${pt(pr * 0.66, pr * 0.68)}`,
    `C${pt(pr * 0.98, pr * 0.65)} ${pt(pr * 0.62, pr * 0.18)} ${pt(pr * 0.62, pr * 0.18)}`,
    `C${pt(pr * 0.62, pr * 0.18)} ${pt(pr * 1.23, pr * 0.53)} ${pt(pr * 1.31, pr * 0.51)}`,
    `C${pt(pr * 1.39, pr * 0.49)} ${pt(pr * 1.15, pr * 0.15)} ${pt(pr * 1.15, pr * 0.15)}`,
    `C${pt(pr * 1.15, pr * 0.15)} ${pt(pr * 1.69, pr * 0.33)} ${pt(pr * 1.77, pr * 0.32)}`,
    `C${pt(pr * 1.85, pr * 0.32)} ${pt(pr * 1.65, pr * 0.11)} ${pt(pr * 1.65, pr * 0.11)}`,
    `C${pt(pr * 1.87, pr * 0.10)} ${pt(pr * 2.20, pr * 0.03)} ${tx},${ty}`,
    // Seite 2 – exakte Spiegelung (Spitze → Basis)
    `C${pt(pr * 2.20, -pr * 0.03)} ${pt(pr * 1.87, -pr * 0.10)} ${pt(pr * 1.65, -pr * 0.11)}`,
    `C${pt(pr * 1.65, -pr * 0.11)} ${pt(pr * 1.85, -pr * 0.32)} ${pt(pr * 1.77, -pr * 0.32)}`,
    `C${pt(pr * 1.69, -pr * 0.33)} ${pt(pr * 1.15, -pr * 0.15)} ${pt(pr * 1.15, -pr * 0.15)}`,
    `C${pt(pr * 1.15, -pr * 0.15)} ${pt(pr * 1.39, -pr * 0.49)} ${pt(pr * 1.31, -pr * 0.51)}`,
    `C${pt(pr * 1.23, -pr * 0.53)} ${pt(pr * 0.62, -pr * 0.18)} ${pt(pr * 0.62, -pr * 0.18)}`,
    `C${pt(pr * 0.62, -pr * 0.18)} ${pt(pr * 0.98, -pr * 0.65)} ${pt(pr * 0.66, -pr * 0.68)}`,
    `C${pt(pr * 0.55, -pr * 0.70)} ${pt(pr * 0.05, -pr * 0.13)} ${pt(pr * 0.05, -pr * 0.13)}`,
    'Z',
  ].join(' ');
  return { type: 'path', d };
}

// ─── SVG string builders ──────────────────────────────────────────────────────
export function petalToSVG(petal: PetalResult, fill: string, stroke: string): string {
  const sw = 'stroke-width="0.8"';
  if (petal.type === 'ellipse') {
    return `<ellipse cx="${petal.cx}" cy="${petal.cy}" rx="${petal.rx}" ry="${petal.ry}" fill="${fill}" stroke="${stroke}" ${sw} transform="rotate(${petal.rotDeg},${petal.cx},${petal.cy})"/>`;
  }
  return `<path d="${petal.d}" fill="${fill}" stroke="${stroke}" ${sw}/>`;
}