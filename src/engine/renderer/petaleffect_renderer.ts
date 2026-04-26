import type { PetalEffect, HSLColor, PetalShape } from '../../model/plant';
import { hsl, darken, clamp } from './renderer_utils';

// ─── Effect fill resolver ─────────────────────────────────────────────────────

export interface EffectFills {
  defs: string;
  getFill: (i: number, n: number, angle: number) => string;
  getStroke: (i: number, n: number, angle: number) => string;
  getOverlay: (i: number, n: number, angle: number, petalPathOrEllipse: string) => string;
}

export function resolvePetalEffect(
  effect: PetalEffect,
  pc: HSLColor,
  shape: PetalShape,
  plantId: string,
  pr: number,
  cx: number = 0,
  cy: number = 0
): EffectFills {
  const baseStroke = hsl(darken(pc));
  const noOverlay = () => '';

  switch (effect) {

    // ── none ──────────────────────────────────────────────────────────────────
    case 'none':
    default:
      return {
        defs: '',
        getFill: () => hsl(pc),
        getStroke: () => baseStroke,
        getOverlay: noOverlay,
      };

    // ── bicolor ───────────────────────────────────────────────────────────────
    // userSpaceOnUse gradient along each petal's radial axis (center → tip).
    // Light near center, hard-edged dark tips.
    case 'bicolor': {
      const { h, s } = pc;
      const lLight = 90, lMid = 60, lDark = 30;
      // round/lanzett tips sit at pr*1.8 — smaller TIP_DIST moves tip beyond 100% (clamped dark).
      // round uses pr*2.0 so only the outer ~15% shows dark; lanzett pr*1.6 for a sharper tip.
      // tropfen/wavy/zickzack tips reach pr*2.2–2.3, keep larger TIP_DIST.
      const TIP_DIST = shape === 'round' ? pr * 2.0 : (shape === 'lanzett' ? pr * 1.6 : pr * 2.2);

      const ctxKey = `${Math.round(cx)}_${Math.round(cy)}`;
      const defsMap: string[] = [];
      const buildGrad = (i: number, angle: number) => {
        const id = `bc_${plantId.replace(/[^a-z0-9]/gi, '')}_${ctxKey}_${i}`;
        if (defsMap[i] !== undefined) return id;
        let x1: number, y1: number, x2: number, y2: number;
        if (shape === 'round') {
          // <ellipse> uses transform="rotate(θ, ecx, ecy)" which causes SVG to interpret
          // userSpaceOnUse gradient coords in the rotated local frame, doubling the rotation.
          // Fix: express the gradient horizontally in local space (along the ellipse major axis).
          const ca = Math.cos(angle), sa = Math.sin(angle);
          const ecx = cx + ca * (pr - 1);
          const ecy = cy + sa * pr;
          x1 = ecx - pr;  y1 = ecy;
          x2 = ecx - pr + TIP_DIST;  y2 = ecy;
        } else {
          x1 = cx;  y1 = cy;
          x2 = cx + Math.cos(angle) * TIP_DIST;
          y2 = cy + Math.sin(angle) * TIP_DIST;
        }
        defsMap[i] = `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="54%"  stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="66%"  stop-color="hsl(${h},${s}%,${lMid}%)"/>
          <stop offset="78%"  stop-color="hsl(${h},${s}%,${lDark + 4}%)"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lDark}%)"/>
        </linearGradient>`;
        return id;
      };
      return {
        get defs() { return defsMap.join(''); },
        getFill: (i, _n, angle) => `url(#${buildGrad(i, angle)})`,
        getStroke: () => `hsl(${h},${s}%,${lDark - 5}%)`,
        getOverlay: noOverlay,
      };
    }

    // ── gradient — radial, center light → tip dark ────────────────────────────
    case 'gradient': {
      const gradId = `g_${plantId.replace(/[^a-z0-9]/gi, '')}`;
      if (shape === 'round') {
        return {
          defs: renderGradientDef(pc, shape, gradId),
          getFill: () => `url(#${gradId})`,
          getStroke: () => baseStroke,
          getOverlay: noOverlay,
        };
      }
      // Path-based shapes: bloom-centered radial gradient in userSpaceOnUse.
      // objectBoundingBox fails for rotated paths — its bounding box is axis-aligned
      // in SVG space, so cx/cy percentages don't track the petal direction.
      // A gradient anchored at (cx, cy) naturally places light at the base for any angle.
      const { h, s } = pc;
      const gradR = pr * 2.6;
      const stops: [number, number][] = [[0, 90], [20, 85], [35, 65], [50, 45], [65, 30]];
      const stopMarkup = stops.map(([pct, l]) => `<stop offset="${pct}%" stop-color="hsl(${h},${s}%,${l}%)"/>`).join('');
      return {
        defs: `<radialGradient id="${gradId}" cx="${cx}" cy="${cy}" r="${gradR}" gradientUnits="userSpaceOnUse">${stopMarkup}</radialGradient>`,
        getFill: () => `url(#${gradId})`,
        getStroke: () => baseStroke,
        getOverlay: noOverlay,
      };
    }

    // ── shimmer — soft sine-wave hue drift across petals ─────────────────────
    // For grayscale colors the hue drift is invisible, so boost lightness amplitude instead.
    case 'shimmer': {
      const AMP = 18;
      const FREQ = 1.3;
      const isGray = pc.s < 10;
      const L_AMP = isGray ? 16 : 4;
      return {
        defs: '',
        getFill: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0;
          const hShift = Math.sin(t * Math.PI * FREQ * 2) * AMP;
          const lShift = Math.sin(t * Math.PI * FREQ * 2 + 1.0) * L_AMP;
          return hsl({ h: (pc.h + hShift + 360) % 360, s: pc.s, l: clamp(pc.l + lShift, 20, 95) });
        },
        getStroke: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0;
          const hShift = Math.sin(t * Math.PI * FREQ * 2) * AMP;
          return hsl(darken({ h: (pc.h + hShift + 360) % 360, s: pc.s, l: pc.l }));
        },
        getOverlay: noOverlay,
      };
    }

    // ── iridescent — hue rotates 120° across all petals ──────────────────────
    // For grayscale colors (s ≈ 0), force a full rainbow so the effect is visible.
    case 'iridescent': {
      const isGray = pc.s < 10;
      const spread = isGray ? 360 : 120;
      const rainbowS = 75;
      const rainbowL = clamp(pc.l, 45, 75);
      return {
        defs: '',
        getFill: (i, n) => {
          const h = (pc.h + (n > 1 ? (i / (n - 1)) * spread : 0)) % 360;
          return isGray
            ? hsl({ h, s: rainbowS, l: rainbowL })
            : hsl({ ...pc, h });
        },
        getStroke: (i, n) => {
          const h = (pc.h + (n > 1 ? (i / (n - 1)) * spread : 0)) % 360;
          return isGray
            ? hsl(darken({ h, s: rainbowS, l: rainbowL }))
            : hsl(darken({ ...pc, h }));
        },
        getOverlay: noOverlay,
      };
    }
  }
}
// ─── SVG radial gradient (gradient effect) ───────────────────────────────────

export function renderGradientDef(petalColor: HSLColor, petalShape: PetalShape, gradId: string): string {
  let { h, s } = petalColor;
  if (s === 0) { h = 0; s = 0; }
  const stops: [number, number][] = [
    [0, 90], [15, 85], [30, 70], [40, 60],
    [60, 50], [70, 40], [85, 35], [100, 30],
  ];
  const stopMarkup = stops
    .map(([pct, l]) => `<stop offset="${pct}%" stop-color="hsl(${h},${s}%,${l}%)"/>`)
    .join('');
  const coords = { cx: 20, cy: 50, r: 75 };
  if (petalShape === 'wavy') { coords.cx = 50; coords.cy = 10; }
  return (
    `<radialGradient id="${gradId}" cx="${coords.cx}%" cy="${coords.cy}%" r="${coords.r}%">` +
    stopMarkup +
    `</radialGradient>`
  );
}
