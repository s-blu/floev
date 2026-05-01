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
  cy: number = 0,
  context: string = ''
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
      const isWhite = pc.s === 0 && pc.l === 100;
      const lLight = 60, lMid = 45, lDark = 35;
      const SKY_H = 207, SKY_S = 65, SKY_L = 85;
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
        const [s1, s2, s3] = shape === 'lanzett' ? [52, 58, 64] : [64, 70, 76];
        const stops = isWhite
          ? `<stop offset="0%"   stop-color="hsl(0,0%,97%)"/>
          <stop offset="${s1}%"  stop-color="hsl(0,0%,97%)"/>
          <stop offset="${s2}%"  stop-color="hsl(${SKY_H},${Math.round(SKY_S * 0.5)}%,${SKY_L + 5}%)"/>
          <stop offset="${s3}%"  stop-color="hsl(${SKY_H},${SKY_S}%,${SKY_L}%)"/>
          <stop offset="100%" stop-color="hsl(${SKY_H},${SKY_S}%,${SKY_L}%)"/>`
          : `<stop offset="0%"   stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="${s1}%"  stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="${s2}%"  stop-color="hsl(${h},${s}%,${lMid}%)"/>
          <stop offset="${s3}%"  stop-color="hsl(${h},${s}%,${lDark}%)"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lDark}%)"/>`;
        defsMap[i] = `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </linearGradient>`;
        return id;
      };
      return {
        get defs() { return defsMap.join(''); },
        getFill: (i, _n, angle) => `url(#${buildGrad(i, angle)})`,
        getStroke: () => isWhite ? `hsl(${SKY_H},${SKY_S - 15}%,${SKY_L - 8}%)` : `hsl(${h},${s}%,${lDark - 5}%)`,
        getOverlay: noOverlay,
      };
    }

    // ── gradient — radial, center light → tip dark ────────────────────────────
    case 'gradient': {

      const isWhite = pc.s === 0 && pc.l === 100;
      const ROSE_H = 345, ROSE_S = 55;
      const gradId = `g_${plantId.replace(/[^a-z0-9]/gi, '')}${context ? `_${context}` : ''}`;

      if (shape === 'round') {
        if (isWhite) {
          const stopMarkup = [[0, 0, 100], [25, 0, 99], [50, 0, 97], [70, 20, 91], [85, ROSE_S, 84], [100, ROSE_S, 78]]
            .map(([pct, s, l]) => `<stop offset="${pct}%" stop-color="hsl(${ROSE_H},${s}%,${l}%)"/>`)
            .join('');
          const coords = { cx: 20, cy: 50, r: 75 };
          return {
            defs: `<radialGradient id="${gradId}" cx="${coords.cx}%" cy="${coords.cy}%" r="${coords.r}%">${stopMarkup}</radialGradient>`,
            getFill: () => `url(#${gradId})`,
            getStroke: () => `hsl(${ROSE_H},${ROSE_S - 15}%,75%)`,
            getOverlay: noOverlay,
          };
        }
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
      // lanzett: match bicolor's TIP_DIST so 100% lands at the actual tip, not beyond it.
      const gradR = shape === 'lanzett' ? pr * 1.6 : pr * 2.6;
      const whiteStops: [number, number, number][] = shape === 'lanzett'
        ? [[0, 0, 100], [52, 0, 99], [64, 20, 91], [76, ROSE_S, 83], [100, ROSE_S, 78]]
        : [[0, 0, 100], [25, 0, 99], [50, 0, 97], [65, 20, 91], [78, ROSE_S, 83]];
      const stopMarkup = isWhite
        ? whiteStops.map(([pct, ws, l]) => `<stop offset="${pct}%" stop-color="hsl(${ROSE_H},${ws}%,${l}%)"/>`).join('')
        : [[0, 90], [20, 85], [35, 65], [50, 45], [65, 30]]
            .map(([pct, l]) => `<stop offset="${pct}%" stop-color="hsl(${h},${s}%,${l}%)"/>`)
            .join('');
      return {
        defs: `<radialGradient id="${gradId}" cx="${cx}" cy="${cy}" r="${gradR}" gradientUnits="userSpaceOnUse">${stopMarkup}</radialGradient>`,
        getFill: () => `url(#${gradId})`,
        getStroke: () => isWhite ? `hsl(${ROSE_H},${ROSE_S - 15}%,75%)` : baseStroke,
        getOverlay: noOverlay,
      };
    }

    // ── shimmer — soft sine-wave lightness drift across petals ───────────────
    case 'shimmer': {
      const isWhite = pc.s === 0 && pc.l === 100;
      const FREQ = 1.3;
      if (isWhite) {
        // Blue-gray shimmer: abs(wave) so both peaks sweep from white toward pale blue-gray.
        const BGRAY_H = 215, BGRAY_S = 25;
        const getAbs = (i: number, n: number) => Math.abs(Math.sin((n > 1 ? i / (n - 1) : 0) * Math.PI * FREQ * 2));
        return {
          defs: '',
          getFill: (i, n) => {
            const w = getAbs(i, n);
            return hsl({ h: BGRAY_H, s: 7 + w * BGRAY_S, l: 98 - w * 11 });
          },
          getStroke: (i, n) => {
            const w = getAbs(i, n);
            return hsl({ h: BGRAY_H, s: w * BGRAY_S + 12, l: 78 - w * 10 });
          },
          getOverlay: noOverlay,
        };
      }
      const L_AMP = 15;
      return {
        defs: '',
        getFill: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0;
          const lShift = Math.sin(t * Math.PI * FREQ * 2) * L_AMP;
          return hsl({ ...pc, l: clamp(pc.l + lShift, 20, 95) });
        },
        getStroke: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0;
          const lShift = Math.sin(t * Math.PI * FREQ * 2) * L_AMP;
          return hsl(darken({ ...pc, l: clamp(pc.l + lShift, 20, 95) }));
        },
        getOverlay: noOverlay,
      };
    }

    // ── iridescent — hue shifts per petal, centered on pc.h ─────────────────
    // Gray: full vivid rainbow. White: pearl wave (rose ↔ blue) with white petals between.
    case 'iridescent': {
      const isWhite = pc.s === 0 && pc.l === 100;
      const isGray = pc.s < 10 && !isWhite;
      if (isWhite) {
        // Pearl iridescent: sine wave alternates rose (h=345) and sky blue (h=207),
        // zero crossings land on full white.
        const PEARL_S = 60;
        const FREQ = 1.3;
        const getWave = (i: number, n: number) => Math.sin((n > 1 ? i / (n - 1) : 0) * Math.PI * FREQ * 2);
        return {
          defs: '',
          getFill: (i, n) => {
            const wave = getWave(i, n);
            return hsl({ h: wave >= 0 ? 345 : 207, s: Math.abs(wave) * PEARL_S, l: 100 - Math.abs(wave) * 10 });
          },
          getStroke: (i, n) => {
            const wave = getWave(i, n);
            return hsl({ h: wave >= 0 ? 345 : 207, s: Math.abs(wave) * PEARL_S + 10, l: 78 - Math.abs(wave) * 5 });
          },
          getOverlay: noOverlay,
        };
      }
      const getStep = (n: number) => isGray ? 45 : (n <= 5 ? 30 : 20);
      const getH = (i: number, n: number) => (pc.h + (i - (n - 1) / 2) * getStep(n) + 3600) % 360;
      return {
        defs: '',
        getFill: (i, n) => {
          const h = getH(i, n);
          return isGray ? hsl({ h, s: 75, l: clamp(pc.l, 45, 75) }) : hsl({ ...pc, h });
        },
        getStroke: (i, n) => {
          const h = getH(i, n);
          return isGray ? hsl(darken({ h, s: 75, l: clamp(pc.l, 45, 75) })) : hsl(darken({ ...pc, h }));
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
