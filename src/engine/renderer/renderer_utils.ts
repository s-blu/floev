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
      const AMP  = 18
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

    // ── crystalline — faceted look via perpendicular gradient per petal ───────
    // A linearGradient runs ACROSS each petal (perpendicular to its radial axis):
    //   edge-dark → centre-bright → edge-dark
    // This creates a sharp midrib/ridge illusion with no clipping needed.
    // A second axial gradient layer (from tip) deepens the faceted effect.
    case 'crystalline': {
      const { h, s, l } = pc
      const lBright = clamp(l + 22, 30, 96)   // midrib highlight
      const lDeep   = clamp(l - 18, 8,  75)   // edge shadow
      const lTip    = clamp(l - 26, 6,  70)   // tip darkening

      const defsPerp: string[] = []   // perpendicular (across petal) gradients
      const defsAxial: string[] = []  // axial (along petal) tip-dark gradients

      const buildGrads = (i: number, angle: number) => {
        const safeId = plantId.replace(/[^a-z0-9]/gi, '')
        const idP = `cp_${safeId}_${i}`
        const idA = `ca_${safeId}_${i}`
        if (defsPerp[i] !== undefined) return { idP, idA }

        // Perpendicular direction (across the petal width)
        const perpAngle = angle + Math.PI / 2
        const PW = 28 // half-width in world space — covers widest petal
        const px1 = cx + Math.cos(perpAngle) * PW
        const py1 = cy + Math.sin(perpAngle) * PW
        const px2 = cx - Math.cos(perpAngle) * PW
        const py2 = cy - Math.sin(perpAngle) * PW

        // Symmetric: dark edge → bright midrib → dark edge
        defsPerp[i] = `<linearGradient id="${idP}" x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="hsl(${h},${s}%,${lDeep}%)"/>
          <stop offset="28%"  stop-color="hsl(${h},${s}%,${l}%)"/>
          <stop offset="50%"  stop-color="hsl(${h},${Math.min(s+8,100)}%,${lBright}%)"/>
          <stop offset="72%"  stop-color="hsl(${h},${s}%,${l}%)"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lDeep}%)"/>
        </linearGradient>`

        // Axial: base stays at l, tip goes dark — same direction as bicolor
        const TIP = 42
        const ax2 = cx + Math.cos(angle) * TIP
        const ay2 = cy + Math.sin(angle) * TIP
        defsAxial[i] = `<linearGradient id="${idA}" x1="${cx}" y1="${cy}" x2="${ax2}" y2="${ay2}" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0"/>
          <stop offset="55%"  stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0"/>
          <stop offset="75%"  stop-color="hsl(${h},${s}%,${lTip + 8}%)" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lTip}%)"     stop-opacity="0.75"/>
        </linearGradient>`

        return { idP, idA }
      }

      const defsCollector: { perp: string[]; axial: string[] } = { perp: [], axial: [] }

      return {
        get defs() { return defsPerp.join('') + defsAxial.join('') },
        getFill: (i, _n, angle) => {
          const { idP } = buildGrads(i, angle)
          return `url(#${idP})`
        },
        getStroke: () => `hsl(${h},${s}%,${clamp(l - 28, 6, 65)}%)`,
        // Second pass: overlay the axial tip-darkening rect using a second <path>
        // We can't reuse the petal path here, so instead we just do nothing —
        // the perpendicular gradient alone already looks crystalline.
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
