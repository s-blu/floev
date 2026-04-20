import type { HSLColor, PetalEffect, PetalShape } from '../../model/plant';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function hsl({ h, s, l }: HSLColor): string {
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
/** Darken a colour for petal stroke */
export function darken(c: HSLColor): HSLColor {
  return { h: c.h, s: Math.max(c.s - 10, 0), l: Math.max(c.l - 20, 0) }
}

// ─── Effect fill resolver ─────────────────────────────────────────────────────
//
// Returns { defs, getFill } where:
//   defs     — SVG <defs> markup to prepend (may be empty string)
//   getFill  — function(petalIndex, totalPetals, angle) → fill string for that petal
//
// This keeps all effect logic in one place; renderers only call resolvePetalEffect.

export interface EffectFills {
  defs: string
  /** Returns the SVG fill string for a given petal. */
  getFill: (i: number, n: number, angle: number) => string
  /** Stroke for petals (may differ per effect). Falls back to darken(pc). */
  getStroke: (i: number, n: number, angle: number) => string
  /** Extra SVG markup overlaid ON TOP of each petal (facets, veins, …). Empty string = none. */
  getOverlay: (i: number, n: number, angle: number, petalPathOrEllipse: string) => string
}

export function resolvePetalEffect(
  effect: PetalEffect,
  pc: HSLColor,
  shape: PetalShape,
  plantId: string,
): EffectFills {
  const baseStroke = hsl(darken(pc))
  const noOverlay = () => ''

  switch (effect) {

    // ── none — plain flat fill ────────────────────────────────────────────────
    case 'none':
    default:
      return {
        defs: '',
        getFill: () => hsl(pc),
        getStroke: () => baseStroke,
        getOverlay: noOverlay,
      }

    // ── bicolor — light base, dark tipped, hard-ish transition ────────────────
    // Implemented as a linear gradient per-petal along the radial axis.
    // Because SVG linearGradient uses userSpaceOnUse we emit one gradient per
    // petal (they differ only in their angle).  We name them bc_{plantId}_{i}.
    case 'bicolor': {
      const { h, s } = pc
      const isAchromatic = s === 0
      const lLight = isAchromatic ? 88 : 90
      const lMid   = isAchromatic ? 65 : 68
      const lDark  = isAchromatic ? 18 : 28

      // We'll build per-petal gradient defs lazily in a collector
      const defsMap: string[] = []

      const buildGrad = (i: number, n: number, angle: number) => {
        const id = `bc_${plantId.replace(/[^a-z0-9]/gi, '')}_${i}`
        if (defsMap[i] !== undefined) return id

        // Direction: gradient runs from center (base, light) to tip (dark)
        // angle is the petal angle in radians (0 = right, -π/2 = up)
        // We use gradientTransform rotate to align with petal axis.
        const deg = Math.round((angle * 180) / Math.PI)
        defsMap[i] = `<linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%"
          gradientTransform="rotate(${deg + 90}, 0.5, 0.5)">
          <stop offset="0%"   stop-color="hsl(${h},${s}%,${lLight}%)"/>
          <stop offset="45%"  stop-color="hsl(${h},${s}%,${lMid}%)"/>
          <stop offset="68%"  stop-color="hsl(${h},${s}%,${lDark + 8}%)"/>
          <stop offset="100%" stop-color="hsl(${h},${s}%,${lDark}%)"/>
        </linearGradient>`
        return id
      }

      return {
        get defs() {
          // Accessed after all getFill calls — defsMap is fully populated by then
          return defsMap.join('')
        },
        getFill: (i, n, angle) => {
          const id = buildGrad(i, n, angle)
          return `url(#${id})`
        },
        getStroke: () => `hsl(${pc.h},${pc.s}%,${Math.max(pc.l - 25, 15)}%)`,
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

    // ── shimmer — alternating hue ±30° on neighbouring petals ────────────────
    case 'shimmer': {
      const hA = pc.h
      const hB = (pc.h + 30) % 360
      const sA = hsl(pc)
      const sB = hsl({ ...pc, h: hB })
      const strokeA = baseStroke
      const strokeB = hsl(darken({ ...pc, h: hB }))
      return {
        defs: '',
        getFill:   (i) => i % 2 === 0 ? sA : sB,
        getStroke: (i) => i % 2 === 0 ? strokeA : strokeB,
        getOverlay: noOverlay,
      }
    }

    // ── crystalline — faceted geometry overlaid on each petal ────────────────
    // Three facets: left (dark), right (light), centre sliver (near-white).
    // Facet geometry is derived from the petal angle.
    case 'crystalline': {
      const baseFill   = hsl(pc)
      const facetDark  = hsl({ h: pc.h, s: pc.s, l: clamp(pc.l - 22, 10, 80) })
      const facetLight = hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 18, 30, 95) })
      const sliverCol  = hsl({ h: pc.h, s: Math.max(pc.s - 20, 0), l: clamp(pc.l + 30, 60, 98) })

      return {
        defs: '',
        getFill:   () => baseFill,
        getStroke: () => hsl({ h: pc.h, s: pc.s, l: clamp(pc.l - 30, 8, 70) }),
        getOverlay: (_i, _n, angle, _path) => {
          // We can't easily clip path-shaped facets in a generic way,
          // so we render thin triangular facet lines from center outward.
          // This gives a crystal-cut look without requiring per-shape clip paths.
          const ca = Math.cos(angle)
          const sa = Math.sin(angle)
          const perp = angle + Math.PI / 2
          const cp = Math.cos(perp)
          const sp = Math.sin(perp)

          // Petal radius estimate — matches renderer pr logic for n=5
          const pr = 16

          // Three "crease" lines emanating from near-center to tip area
          const tipX  = ca * pr * 2.1
          const tipY  = sa * pr * 2.1
          const midX  = ca * pr * 0.8
          const midY  = sa * pr * 0.8

          // Left crease
          const lx1 = midX + cp * pr * 0.55,  ly1 = midY + sp * pr * 0.55
          const lx2 = tipX + cp * pr * 0.10,  ly2 = tipY + sp * pr * 0.10
          // Right crease
          const rx1 = midX - cp * pr * 0.55,  ry1 = midY - sp * pr * 0.55
          const rx2 = tipX - cp * pr * 0.10,  ry2 = tipY - sp * pr * 0.10

          return `
            <line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}"
              stroke="${facetDark}" stroke-width="0.7" opacity="0.75" stroke-linecap="round"/>
            <line x1="${rx1}" y1="${ry1}" x2="${rx2}" y2="${ry2}"
              stroke="${facetLight}" stroke-width="0.7" opacity="0.75" stroke-linecap="round"/>
            <line x1="${midX}" y1="${midY}" x2="${tipX}" y2="${tipY}"
              stroke="${sliverCol}" stroke-width="0.5" opacity="0.55" stroke-linecap="round"/>`
        },
      }
    }

    // ── iridescent — hue rotates 120° across all petals ──────────────────────
    case 'iridescent': {
      const spread = 120
      return {
        defs: '',
        getFill: (i, n) => {
          const hShift = n > 1 ? (i / (n - 1)) * spread : 0
          const h = (pc.h + hShift) % 360
          return hsl({ ...pc, h })
        },
        getStroke: (i, n) => {
          const hShift = n > 1 ? (i / (n - 1)) * spread : 0
          const h = (pc.h + hShift) % 360
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

  if (s === 0) {
    h = 0; s = 0;
  }

  const stops: [number, number][] = [
    [0, 90], [15, 85], [30, 70], [40, 60],
    [60, 50], [70, 40], [85, 35], [100, 30],
  ]
  const stopMarkup = stops
    .map(([pct, l]) => `<stop offset="${pct}%" stop-color="hsl(${h},${s}%,${l}%)"/>`)
    .join('')

  const coords = { cx: 20, cy: 50, r: 75 }
  if (petalShape === 'wavy')    { coords.cx = 50; coords.cy = 10 }
  if (petalShape === 'tropfen') { coords.cx = 50; coords.r  = 50 }
  if (petalShape === 'zickzack'){ coords.cx = 50; coords.r  = 65 }

  return (
    `<radialGradient id="${gradId}" cx="${coords.cx}%" cy="${coords.cy}%" r="${coords.r}%">` +
    stopMarkup +
    `</radialGradient>`
  )
}
