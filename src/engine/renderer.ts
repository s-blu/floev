import type { Plant, HSLColor } from '../model/plant'
import {
  expressedColor, expressedShape, expressedCenter,
  expressedNumber, expressedGradient,
} from '../model/plant'

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

// ─── Petal path builders ──────────────────────────────────────────────────────

type PetalResult =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotDeg: number }
  | { type: 'path'; d: string }

function buildPetalPath(
  shape: Plant['petalShape']['a'],
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

  if (shape === 'round') {
    return {
      type: 'ellipse',
      cx: cx + ca * (pr - 1),
      cy: bloomY + sa * (pr),
      rx: pr * 0.80,
      ry: pr * 0.54,
      rotDeg: (angle * 180) / Math.PI,
    }
  }

  if (shape === 'pointed') {
    const tipR = pr * 2.2
    const baseW = pr * 0.38
    const b1x = cx + ca * pr * 0.18 + cp * baseW
    const b1y = bloomY + sa * pr * 0.18 + sp * baseW
    const b2x = cx + ca * pr * 0.18 - cp * baseW
    const b2y = bloomY + sa * pr * 0.18 - sp * baseW
    const tx = cx + ca * tipR
    const ty = bloomY + sa * tipR
    const ctrl1x = cx + ca * (pr * 1.1) + cp * baseW * 0.55
    const ctrl1y = bloomY + sa * (pr * 1.1) + sp * baseW * 0.55
    const ctrl2x = cx + ca * (pr * 1.1) - cp * baseW * 0.55
    const ctrl2y = bloomY + sa * (pr * 1.1) - sp * baseW * 0.55
    return {
      type: 'path',
      d: `M${b1x},${b1y} C${ctrl1x},${ctrl1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${ctrl2x},${ctrl2y} ${b2x},${b2y} Z`,
    }
  }

  // wavy
  const tipR = pr * 2.2
  const baseW = pr * 0.40
  const b1x = cx + ca * pr * 0.18 + cp * baseW
  const b1y = bloomY + sa * pr * 0.18 + sp * baseW
  const b2x = cx + ca * pr * 0.18 - cp * baseW
  const b2y = bloomY + sa * pr * 0.18 - sp * baseW
  const tx = cx + ca * tipR
  const ty = bloomY + sa * tipR
  const m1x = cx + ca * pr * 0.95 + cp * baseW * 2.0
  const m1y = bloomY + sa * pr * 0.95 + sp * baseW * 2.0
  const m2x = cx + ca * pr * 0.95 - cp * baseW * 1.2
  const m2y = bloomY + sa * pr * 0.95 - sp * baseW * 1.2
  return {
    type: 'path',
    d: `M${b1x},${b1y} C${m1x},${m1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${m2x},${m2y} ${b2x},${b2y} Z`,
  }
}

// ─── SVG string builders ──────────────────────────────────────────────────────

function petalToSVG(petal: PetalResult, fill: string, stroke: string): string {
  const sw = 'stroke-width="0.8"'
  if (petal.type === 'ellipse') {
    return `<ellipse cx="${petal.cx}" cy="${petal.cy}" rx="${petal.rx}" ry="${petal.ry}" fill="${fill}" stroke="${stroke}" ${sw} transform="rotate(${petal.rotDeg},${petal.cx},${petal.cy})"/>`
  }
  return `<path d="${petal.d}" fill="${fill}" stroke="${stroke}" ${sw}/>`
}

function renderGradientDef(petalColor: HSLColor, gradColor: HSLColor, gradId: string): string {
  const pc = petalColor
  const gc = gradColor
  return (
    `<radialGradient id="${gradId}" cx="40%" cy="55%" r="65%">` +
    `<stop offset="0%" stop-color="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 16, 40, 92) })}"/>` +
    `<stop offset="100%" stop-color="${hsl(gc)}"/>` +
    `</radialGradient>`
  )
}

// ─── Curved stem ─────────────────────────────────────────────────────────────

function renderStem(plant: Plant, cx: number, stemBase: number, bloomY: number): string {
  const lean = (plant.id.charCodeAt(0) % 2 === 0 ? 1 : -1) * 5
  const qx = cx + lean
  const qy = (stemBase + bloomY) / 2
  return `<path d="M${cx},${stemBase} Q${qx},${qy} ${cx},${bloomY}" fill="none" stroke="#2d7a3a" stroke-width="2.5" stroke-linecap="round"/>`
}

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

/**
 * Renders only the flower head, centered in the given canvas.
 * No pot, no stem, no leaves. Phase must be 4 (bloom).
 */
export function renderBloomSVG(plant: Plant, w: number, h: number): string {
  const cx = w / 2
  const cy = h / 2

  const pc    = expressedColor(plant.petalColor)
  const grad  = expressedGradient(plant.gradientColor)
  const shape = expressedShape(plant.petalShape)
  const n     = Math.round(expressedNumber(plant.petalCount))
  const pr    = (Math.min(w, h) * 0.28) + (8 - n) * 1.4
  const hasGrad = grad !== null

  let defs = ''
  let body = ''

  const gradId = `gb${plant.id.replace(/[^a-z0-9]/gi, '')}`
  if (hasGrad) {
    defs += renderGradientDef(pc, grad!, gradId)
  }

  const fillStr   = hasGrad ? `url(#${gradId})` : hsl(pc)
  const strokeStr = hsl(darken(pc))

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const petal = buildPetalPath(shape, angle, cx, cy, pr)
    body += petalToSVG(petal, fillStr, strokeStr)
  }

  // Center
  const cc     = expressedColor(plant.centerColor)
  const ccStr  = hsl(cc)
  const ccDark = hsl({ h: cc.h, s: clamp(cc.s + 10, 20, 100), l: clamp(cc.l - 18, 45, 80) })
  const centerType = expressedCenter(plant.centerType)

  if (centerType === 'dot') {
    body += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${ccStr}"/>`
  } else if (centerType === 'disc') {
    body += `<circle cx="${cx}" cy="${cy}" r="8.5" fill="${ccDark}"/>`
    body += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${ccStr}"/>`
  } else {
    body += `<circle cx="${cx}" cy="${cy}" r="5" fill="${ccStr}"/>`
    const tipCol = hsl({ h: cc.h, s: clamp(cc.s + 5, 20, 80), l: clamp(cc.l - 22, 45, 75) })
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const fx = cx + Math.cos(a) * 8.5
      const fy = cy + Math.sin(a) * 8.5
      const lx = cx + Math.cos(a) * 5.5
      const ly = cy + Math.sin(a) * 5.5
      body += `<line x1="${lx}" y1="${ly}" x2="${fx}" y2="${fy}" stroke="${tipCol}" stroke-width="1" stroke-linecap="round" opacity="0.75"/>`
      body += `<circle cx="${fx}" cy="${fy}" r="1.6" fill="${tipCol}" opacity="0.85"/>`
    }
  }

  const defsBlock = defs ? `<defs>${defs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`
}

// ─── Main render function ─────────────────────────────────────────────────────

export function renderPlantSVG(plant: Plant | null, w: number, h: number): string {
  const cx = w / 2

  // Pot geometry
  const potH = 26
  const potRimH = 7
  const potW = w * 0.72
  const groundY = h - potH - potRimH + 4
  const stemBase = groundY - 1

  // Resolve expressed phenotype values up front
  const stemLen = h * 0.50 * (plant ? expressedNumber(plant.stemHeight) : 0.6)
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

  // ── Empty pot ─────────────────────────────────────────────────────────────
  if (!plant) {
    return svg(defs, body, w, h)
  }

  // ── Seed (phase 1) ────────────────────────────────────────────────────────
  if (plant.phase === 1) {
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
  body += renderStem(plant, cx, stemBase, bloomY)

  const leafY = stemBase - stemLen * 0.28
  const stemLeafShape = (xPos: number, rotate: number) =>
    `<ellipse cx="${xPos}" cy="${leafY}" rx="11" ry="6" fill="#3a9a45" transform="rotate(${rotate},${xPos},${leafY})"/>`
  body += stemLeafShape(cx - 8, 50)
  body += stemLeafShape(cx + 8, -50)

  // ── Phase 3: bud with colour hint ─────────────────────────────────────────
  if (plant.phase === 3) {
    const pc = expressedColor(plant.petalColor)
    body += `<ellipse cx="${cx}" cy="${bloomY + 2}" rx="7" ry="11" fill="#2d6e35"/>`
    body += `<ellipse cx="${cx}" cy="${bloomY + 1}" rx="5" ry="8.5" fill="#3a9a45"/>`
    body += `<ellipse cx="${cx - 1.5}" cy="${bloomY}" rx="2.5" ry="6" fill="${hsl(pc)}" opacity="0.5"/>`
    body += `<line x1="${cx - 1}" y1="${bloomY - 7}" x2="${cx - 1}" y2="${bloomY + 2}" stroke="${hsl({ h: pc.h, s: pc.s, l: clamp(pc.l + 10, 40, 90) })}" stroke-width="1.5" opacity="0.55"/>`
    return svg(defs, body, w, h)
  }

  // ── Phase 4: full bloom ───────────────────────────────────────────────────
  const pc    = expressedColor(plant.petalColor)
  const grad  = expressedGradient(plant.gradientColor)
  const shape = expressedShape(plant.petalShape)
  const n     = Math.round(expressedNumber(plant.petalCount))
  const pr    = 12 + (8 - n) * 1.4
  const hasGrad = grad !== null

  const gradId = `g${plant.id.replace(/[^a-z0-9]/gi, '')}`
  if (hasGrad) {
    defs += renderGradientDef(pc, grad!, gradId)
  }

  const fillStr   = hasGrad ? `url(#${gradId})` : hsl(pc)
  const strokeStr = hsl(darken(pc))

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const petal = buildPetalPath(shape, angle, cx, bloomY, pr)
    body += petalToSVG(petal, fillStr, strokeStr)
  }

  // ── Center ────────────────────────────────────────────────────────────────
  const cc     = expressedColor(plant.centerColor)
  const ccStr  = hsl(cc)
  const ccDark = hsl({ h: cc.h, s: clamp(cc.s + 10, 20, 100), l: clamp(cc.l - 18, 45, 80) })
  const centerType = expressedCenter(plant.centerType)

  if (centerType === 'dot') {
    body += `<circle cx="${cx}" cy="${bloomY}" r="5.5" fill="${ccStr}"/>`
  } else if (centerType === 'disc') {
    body += `<circle cx="${cx}" cy="${bloomY}" r="8.5" fill="${ccDark}"/>`
    body += `<circle cx="${cx}" cy="${bloomY}" r="5.5" fill="${ccStr}"/>`
  } else {
    body += `<circle cx="${cx}" cy="${bloomY}" r="5" fill="${ccStr}"/>`
    const tipCol = hsl({ h: cc.h, s: clamp(cc.s + 5, 20, 80), l: clamp(cc.l - 22, 45, 75) })
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const fx = cx + Math.cos(a) * 8.5
      const fy = bloomY + Math.sin(a) * 8.5
      const lx = cx + Math.cos(a) * 5.5
      const ly = bloomY + Math.sin(a) * 5.5
      body += `<line x1="${lx}" y1="${ly}" x2="${fx}" y2="${fy}" stroke="${tipCol}" stroke-width="1" stroke-linecap="round" opacity="0.75"/>`
      body += `<circle cx="${fx}" cy="${fy}" r="1.6" fill="${tipCol}" opacity="0.85"/>`
    }
  }

  return svg(defs, body, w, h)
}

function svg(defs: string, body: string, w: number, h: number): string {
  const defsBlock = defs ? `<defs>${defs}</defs>` : ''
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defsBlock}${body}</svg>`
}
