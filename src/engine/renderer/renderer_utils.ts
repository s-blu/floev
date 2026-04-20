import type { HSLColor, PetalEffect, PetalShape } from '../../model/plant';

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

// ─── Effect fill resolver ─────────────────────────────────────────────────────

export interface EffectFills {
  defs: string
  getFill: (i: number, n: number, angle: number) => string
  getStroke: (i: number, n: number, angle: number) => string
  getOverlay: (i: number, n: number, angle: number, petalPathOrEllipse: string) => string
}

export function resolvePetalEffect(
  effect: PetalEffect,
  pc: HSLColor,
  shape: PetalShape,
  plantId: string,
  cx: number = 0,
  cy: number = 0,
): EffectFills {
  const baseStroke = hsl(darken(pc))
  const noOverlay = () => ''

  switch (effect) {

    // ── none ──────────────────────────────────────────────────────────────────
    case 'none':
    default:
      return {
        defs: '',
        getFill: () => hsl(pc),
        getStroke: () => baseStroke,
        getOverlay: noOverlay,
      }

    // ── bicolor ───────────────────────────────────────────────────────────────
    // userSpaceOnUse gradient along each petal's radial axis (center → tip).
    // Light near center, hard-edged dark tips.
    case 'bicolor': {
      const { h, s } = pc
      const isAchromatic = s === 0
      const lLight = isAchromatic ? 92 : 88
      const lDark  = isAchromatic ? 20 : 28
      // World-space distance from bloom center to beyond any petal tip
      const TIP_DIST = 42

      const defsMap: string[] = []
      const buildGrad = (i: number, angle: number) => {
        const id = `bc_${plantId.replace(/[^a-z0-9]/gi, '')}_${i}`
        if (defsMap[i] !== undefined) return id
        const x2 = cx + Math.cos(angle) * TIP_DIST
        const y2 = cy + Math.sin(angle) * TIP_DIST
        const lMid = Math.round(lLight * 0.55 + lDark * 0.45)
        defsMap[i] = `<linearGradient id="${id}" x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="54%"  stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="66%"  stop-color="hsl(${h},${s}%,${lMid}%)"/>
          <stop offset="78%"  stop-color="hsl(${h},${s}%,${lDark + 4}%)"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lDark}%)"/>
        </linearGradient>`
        return id
      }
      return {
        get defs() { return defsMap.join('') },
        getFill:   (i, _n, angle) => `url(#${buildGrad(i, angle)})`,
        getStroke: () => `hsl(${h},${s}%,${Math.max(lDark - 5, 10)}%)`,
        getOverlay: noOverlay,
      }
    }

    // ── gradient — radial, center light → tip dark ────────────────────────────
    case 'gradient': {
      const gradId = `g_${plantId.replace(/[^a-z0-9]/gi, '')}`
      return {
        defs: renderGradientDef(pc, shape, gradId),
        getFill: () => `url(#${gradId})`,
        getStroke: () => baseStroke,
        getOverlay: noOverlay,
      }
    }

    // ── shimmer — soft sine-wave hue drift across petals ─────────────────────
    case 'shimmer': {
      const AMP  = 12
      const FREQ = 1.5
      return {
        defs: '',
        getFill: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0
          const hShift = Math.sin(t * Math.PI * FREQ * 2) * AMP
          const lShift = Math.sin(t * Math.PI * FREQ * 2 + 1.0) * 4
          return hsl({ h: (pc.h + hShift + 360) % 360, s: pc.s, l: clamp(pc.l + lShift, 20, 95) })
        },
        getStroke: (i, n) => {
          const t = n > 1 ? i / (n - 1) : 0
          const hShift = Math.sin(t * Math.PI * FREQ * 2) * AMP
          return hsl(darken({ h: (pc.h + hShift + 360) % 360, s: pc.s, l: pc.l }))
        },
        getOverlay: noOverlay,
      }
    }

    // ── iridescent — hue rotates 120° across all petals ──────────────────────
    case 'iridescent': {
      const spread = 120
      return {
        defs: '',
        getFill: (i, n) => {
          const h = (pc.h + (n > 1 ? (i / (n - 1)) * spread : 0)) % 360
          return hsl({ ...pc, h })
        },
        getStroke: (i, n) => {
          const h = (pc.h + (n > 1 ? (i / (n - 1)) * spread : 0)) % 360
          return hsl(darken({ ...pc, h }))
        },
        getOverlay: noOverlay,
      }
    }
  }
}

// ─── SVG radial gradient (gradient effect) ───────────────────────────────────

export function renderGradientDef(petalColor: HSLColor, petalShape: PetalShape, gradId: string): string {
  let { h, s } = petalColor
  if (s === 0) { h = 0; s = 0; }
  const stops: [number, number][] = [
    [0, 90], [15, 85], [30, 70], [40, 60],
    [60, 50], [70, 40], [85, 35], [100, 30],
  ]
  const stopMarkup = stops
    .map(([pct, l]) => `<stop offset="${pct}%" stop-color="hsl(${h},${s}%,${l}%)"/>`)
    .join('')
  const coords = { cx: 20, cy: 50, r: 75 }
  if (petalShape === 'wavy')     { coords.cx = 50; coords.cy = 10 }
  if (petalShape === 'tropfen')  { coords.cx = 50; coords.r  = 50 }
  if (petalShape === 'zickzack') { coords.cx = 50; coords.r  = 65 }
  return (
    `<radialGradient id="${gradId}" cx="${coords.cx}%" cy="${coords.cy}%" r="${coords.r}%">` +
    stopMarkup +
    `</radialGradient>`
  )
}
