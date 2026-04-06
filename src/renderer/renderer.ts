import type { Plant, HSLColor } from '../types/plant'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hsl({ h, s, l }: HSLColor): string {
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Darken a colour for petal stroke */
function darken(c: HSLColor, amount = 22): HSLColor {
  return { h: c.h, s: clamp(c.s + 8, 30, 100), l: clamp(c.l - amount, 15, 60) }
}

/** Lighten for center highlight */
function lighten(c: HSLColor, amount = 20): HSLColor {
  return { h: c.h, s: clamp(c.s * 0.4, 15, 70), l: clamp(c.l + amount, 50, 92) }
}

/** Complementary-ish hue for center */
function shiftHue(c: HSLColor, shift: number): HSLColor {
  return { h: (c.h + shift) % 360, s: clamp(c.s * 0.65, 20, 80), l: clamp(c.l * 0.55, 20, 60) }
}

// ─── Petal path builders ──────────────────────────────────────────────────────

type PetalResult =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotDeg: number }
  | { type: 'polygon'; points: string }
  | { type: 'path'; d: string }

function buildPetalPath(
  shape: Plant['petalShape'],
  angle: number,
  cx: number,
  bloomY: number,
  pr: number,
): PetalResult {
  const ca = Math.cos(angle)
  const sa = Math.sin(angle)
  const perp = angle + Math.PI / 2
  const cp = Math.cos(perp)
  const sp = Math.sin(perp)
  const baseR = pr * 0.48
  const tipR = pr * 2.1

  if (shape === 'round') {
    return {
      type: 'ellipse',
      cx: cx + ca * (pr + 5),
      cy: bloomY + sa * (pr + 5),
      rx: pr * 0.54,
      ry: pr * 0.80,
      rotDeg: (angle * 180) / Math.PI,
    }
  }

  if (shape === 'pointed') {
    const b1x = cx + ca * baseR + cp * pr * 0.32
    const b1y = bloomY + sa * baseR + sp * pr * 0.32
    const b2x = cx + ca * baseR - cp * pr * 0.32
    const b2y = bloomY + sa * baseR - sp * pr * 0.32
    const tx = cx + ca * tipR
    const ty = bloomY + sa * tipR
    return { type: 'polygon', points: `${b1x},${b1y} ${tx},${ty} ${b2x},${b2y}` }
  }

  // wavy
  const a0 = angle - 0.28
  const a1 = angle + 0.28
  const midR = pr * 1.3
  const x0 = cx + Math.cos(a0) * baseR, y0 = bloomY + Math.sin(a0) * baseR
  const qx = cx + ca * midR, qy = bloomY + sa * midR
  const ex = cx + ca * tipR, ey = bloomY + sa * tipR
  const x3 = cx + Math.cos(a1) * baseR, y3 = bloomY + Math.sin(a1) * baseR
  const wx = Math.cos(angle + 0.45) * 6
  const wy = Math.sin(angle + 0.45) * 6
  return {
    type: 'path',
    d: `M${x0},${y0} Q${qx},${qy} ${ex},${ey} Q${x3 + wx},${y3 + wy} ${x3},${y3}Z`,
  }
}

// ─── SVG string builders ──────────────────────────────────────────────────────

function petalToSVG(petal: PetalResult, fill: string, stroke: string): string {
  const sw = 'stroke-width="0.8"'
  if (petal.type === 'ellipse') {
    return `<ellipse cx="${petal.cx}" cy="${petal.cy}" rx="${petal.rx}" ry="${petal.ry}" fill="${fill}" stroke="${stroke}" ${sw} transform="rotate(${petal.rotDeg},${petal.cx},${petal.cy})"/>`
  }
  if (petal.type === 'polygon') {
    return `<polygon points="${petal.points}" fill="${fill}" stroke="${stroke}" ${sw}/>`
  }
  return `<path d="${petal.d}" fill="${fill}" stroke="${stroke}" ${sw}/>`
}

function renderGradientDef(plant: Plant, gradId: string): string {
  const pc = plant.petalColor
  const gc = plant.gradientColor!
  return (
    `<radialGradient id="${gradId}" cx="40%" cy="55%" r="65%">` +
    `<stop offset="0%" stop-color="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 16, 40, 92) })}"/>` +
    `<stop offset="100%" stop-color="${hsl(gc)}"/>` +
    `</radialGradient>`
  )
}

// ─── Main render function ─────────────────────────────────────────────────────

/**
 * Render a plant as an SVG string.
 *
 * @param plant  The plant to render (null = empty pot)
 * @param w      Viewport width in pixels
 * @param h      Viewport height in pixels
 */
export function renderPlantSVG(plant: Plant | null, w: number, h: number): string {
  const cx = w / 2

  // Pot geometry
  const potH = 26
  const potRimH = 7
  const potW = w * 0.72
  const groundY = h - potH - potRimH + 4
  const stemBase = groundY - 1

  // Stem + bloom position
  const stemLen = h * 0.50 * (plant ? plant.stemHeight : 0.6)
  const bloomY = stemBase - stemLen

  let defs = ''
  let body = ''

  // ── Pot ────────────────────────────────────────────────────────────────────
  const potX = (w - potW) / 2
  const rimX = (w - potW * 1.09) / 2
  const shineX = (w - potW * 0.82) / 2
  body += `<rect x="${potX}" y="${groundY + potRimH}" width="${potW}" height="${potH}" rx="4" fill="#b8724a"/>`
  body += `<rect x="${rimX}" y="${groundY}" width="${potW * 1.09}" height="${potRimH}" rx="3" fill="#c8855a"/>`
  body += `<rect x="${shineX}" y="${groundY + potRimH + 2}" width="${potW * 0.82}" height="3" rx="1" fill="#a86540" opacity="0.35"/>`

  // ── Empty / seed ──────────────────────────────────────────────────────────
  if (!plant || plant.phase === 1) {
    body += `<ellipse cx="${cx}" cy="${stemBase - 4}" rx="5" ry="3.5" fill="#8B6914"/>`
    return svg(defs, body, w, h)
  }

  // ── Phase 2: sprout ───────────────────────────────────────────────────────
  if (plant.phase === 2) {
    const tipY = stemBase - stemLen * 0.35
    body += `<line x1="${cx}" y1="${stemBase}" x2="${cx}" y2="${tipY}" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
    body += `<ellipse cx="${cx}" cy="${tipY - 5}" rx="4" ry="6" fill="#3a9a45"/>`
    return svg(defs, body, w, h)
  }

  // ── Stem + leaves (phases 3–4) ────────────────────────────────────────────
  body += `<line x1="${cx}" y1="${stemBase}" x2="${cx}" y2="${bloomY}" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
  const leafY = stemBase - stemLen * 0.52
  body += `<ellipse cx="${cx - 9}" cy="${leafY}" rx="10" ry="5" fill="#3a9a45" transform="rotate(-30,${cx - 9},${leafY})"/>`
  body += `<ellipse cx="${cx + 9}" cy="${leafY + 4}" rx="10" ry="5" fill="#3a9a45" transform="rotate(30,${cx + 9},${leafY + 4})"/>`

  // ── Phase 3: bud with colour hint ─────────────────────────────────────────
  if (plant.phase === 3) {
    const pc = plant.petalColor
    body += `<ellipse cx="${cx}" cy="${bloomY + 2}" rx="7" ry="11" fill="#2d6e35"/>`
    body += `<ellipse cx="${cx}" cy="${bloomY + 1}" rx="5" ry="8.5" fill="#3a9a45"/>`
    // The hint of the final colour peeking through a slit
    body += `<ellipse cx="${cx - 1.5}" cy="${bloomY}" rx="2.5" ry="6" fill="${hsl(pc)}" opacity="0.5"/>`
    body += `<line x1="${cx - 1}" y1="${bloomY - 7}" x2="${cx - 1}" y2="${bloomY + 2}" stroke="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 10, 40, 90) })}" stroke-width="1.5" opacity="0.55"/>`
    return svg(defs, body, w, h)
  }

  // ── Phase 4: full bloom ───────────────────────────────────────────────────
  const pc = plant.petalColor
  const n = plant.petalCount
  const pr = 12 + (8 - n) * 1.4
  const hasGrad = plant.gradientColor !== null

  // Gradient definition (only if needed)
  const gradId = `g${plant.id.replace(/[^a-z0-9]/gi, '')}`
  if (hasGrad) {
    defs += renderGradientDef(plant, gradId)
  }

  const fillStr = hasGrad ? `url(#${gradId})` : hsl(pc)
  const strokeStr = hsl(darken(pc))

  // Draw petals in a circle
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const petal = buildPetalPath(plant.petalShape, angle, cx, bloomY, pr)
    body += petalToSVG(petal, fillStr, strokeStr)
  }

  // Center
  const cFill = hsl(shiftHue(pc, 25))
  const cHi = hsl(lighten(pc))
  if (plant.centerType === 'dot') {
    body += `<circle cx="${cx}" cy="${bloomY}" r="5.5" fill="${cFill}"/>`
  } else if (plant.centerType === 'disc') {
    body += `<circle cx="${cx}" cy="${bloomY}" r="9" fill="${cFill}"/>`
    body += `<circle cx="${cx}" cy="${bloomY}" r="5" fill="${cHi}"/>`
  } else {
    // stamen — ring of small dots
    body += `<circle cx="${cx}" cy="${bloomY}" r="5.5" fill="${cFill}"/>`
    const stamenCol = hsl({ h: (pc.h + 175) % 360, s: 55, l: 52 })
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      body += `<circle cx="${cx + Math.cos(a) * 9}" cy="${bloomY + Math.sin(a) * 9}" r="2.5" fill="${stamenCol}"/>`
    }
  }

  return svg(defs, body, w, h)
}

function svg(defs: string, body: string, w: number, h: number): string {
  const defsBlock = defs ? `<defs>${defs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`
}
