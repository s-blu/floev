import type { Plant, PetalShape } from '../../model/plant'
import { expressedShape } from '../genetic/genetic_utils'
import { calcRarityScore } from '../rarity'

let _seedId = 0

function seedRotation(plantId: string): number {
  let hash = 0
  for (let i = 0; i < Math.min(10, plantId.length); i++) {
    hash = (hash * 31 + plantId.charCodeAt(i)) & 0xffff
  }
  return ((hash % 56) - 28)
}

export function renderSeedIcon(size = 14): string {
  const id = `sico${++_seedId}`
  const cx = size / 2
  const cy = size / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="vertical-align:middle;display:inline-block;flex-shrink:0">
    <defs>
      <radialGradient id="${id}" cx="35%" cy="28%" r="68%">
        <stop offset="0%" stop-color="#c4916a"/>
        <stop offset="100%" stop-color="#7a4a28"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${size*0.31}" ry="${size*0.35}" fill="url(#${id})"/>
    <ellipse cx="${cx - size*0.07}" cy="${cy - size*0.12}" rx="${size*0.14}" ry="${size*0.09}"
      fill="rgba(255,255,255,0.22)" transform="rotate(-22,${cx},${cy})"/>
  </svg>`
}

export function renderSeedSvg(plant: Plant, size = 40): string {
  const id = `seed${++_seedId}`
  const shape = expressedShape(plant.petalShape)
  const score = calcRarityScore(plant)
  const cx = size / 2
  const cy = size / 2
  const rot = seedRotation(plant.id)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${buildGradient(id, score)}</defs>
    <g transform="rotate(${rot}, ${cx}, ${cy})">
      ${score >= 90 ? buildGoldenOutline(shape, cx, cy, size) : ''}
      ${buildBody(shape, cx, cy, size, id)}
      ${buildShine(cx, cy, size, shape)}
      ${buildMarkings(score, cx, cy, size, shape)}
    </g>
  </svg>`
}

// ─── Gradient ─────────────────────────────────────────────────────────────────

function buildGradient(id: string, score: number): string {
  const light = score >= 90 ? '#d0a070' : score >= 75 ? '#c89870' : '#c4916a'
  const dark  = score >= 90 ? '#7a4020' : score >= 75 ? '#6e3a1e' : '#7a4a28'
  return `<radialGradient id="${id}" cx="35%" cy="28%" r="68%">
    <stop offset="0%" stop-color="${light}"/>
    <stop offset="100%" stop-color="${dark}"/>
  </radialGradient>`
}

// ─── Seed shape path data (shared between fill and outline) ───────────────────

function seedShapeElement(shape: PetalShape, cx: number, cy: number, s: number, attrs: string): string {
  switch (shape) {
    case 'round':
      return `<ellipse cx="${cx}" cy="${cy}" rx="${s*0.31}" ry="${s*0.35}" ${attrs}/>`

    case 'lanzett':
      return `<ellipse cx="${cx}" cy="${cy}" rx="${s*0.20}" ry="${s*0.43}" ${attrs}/>`

    case 'tropfen': {
      const w = s * 0.28
      const t = cy - s * 0.40
      const b = cy + s * 0.40
      return `<path d="M ${cx} ${t} C ${cx+w*1.1} ${t+s*0.10} ${cx+w} ${cy+s*0.08} ${cx} ${b} C ${cx-w} ${cy+s*0.08} ${cx-w*1.1} ${t+s*0.10} ${cx} ${t} Z" ${attrs}/>`
    }

    case 'wavy': {
      const w = s * 0.30
      const h = s * 0.38
      const t = cy - h; const b = cy + h
      return `<path d="M ${cx} ${t} C ${cx+w*0.55} ${t+h*0.04} ${cx+w*1.20} ${cy-h*0.42} ${cx+w} ${cy} C ${cx+w*1.20} ${cy+h*0.42} ${cx+w*0.55} ${b-h*0.04} ${cx} ${b} C ${cx-w*0.55} ${b-h*0.04} ${cx-w*1.20} ${cy+h*0.42} ${cx-w} ${cy} C ${cx-w*1.20} ${cy-h*0.42} ${cx-w*0.55} ${t+h*0.04} ${cx} ${t} Z" ${attrs}/>`
    }

    case 'zickzack': {
      const w = s * 0.27
      const h = s * 0.40
      const t = cy - h; const b = cy + h
      return `<path d="M ${cx} ${t} L ${cx+w*0.60} ${t+h*0.28} L ${cx+w} ${cy-h*0.08} L ${cx+w*0.82} ${cy+h*0.36} L ${cx} ${b} L ${cx-w*0.82} ${cy+h*0.36} L ${cx-w} ${cy-h*0.08} L ${cx-w*0.60} ${t+h*0.28} Z" ${attrs}/>`
    }
  }
}

// ─── Body (filled) ────────────────────────────────────────────────────────────

function buildBody(shape: PetalShape, cx: number, cy: number, s: number, gid: string): string {
  return seedShapeElement(shape, cx, cy, s, `fill="url(#${gid})"`)
}

// ─── Legendary golden outline ─────────────────────────────────────────────────

function buildGoldenOutline(shape: PetalShape, cx: number, cy: number, size: number): string {
  const sw = Math.max(1.5, size * 0.055)
  // Outer glow (wider, more transparent)
  const glow = seedShapeElement(shape, cx, cy, size,
    `fill="none" stroke="rgba(210,155,38,0.30)" stroke-width="${sw * 2.4}"`)
  // Crisp golden line
  const line = seedShapeElement(shape, cx, cy, size,
    `fill="none" stroke="rgba(218,162,40,0.88)" stroke-width="${sw}"`)
  return glow + line
}

// ─── Shine highlight ──────────────────────────────────────────────────────────

function buildShine(cx: number, cy: number, size: number, shape: PetalShape): string {
  const rx = shape === 'lanzett' ? size * 0.09 : size * 0.14
  const ry = shape === 'lanzett' ? size * 0.06 : size * 0.09
  return `<ellipse cx="${cx - size*0.07}" cy="${cy - size*0.12}" rx="${rx}" ry="${ry}"
    fill="rgba(255,255,255,0.22)" transform="rotate(-22,${cx},${cy})"/>`
}

// ─── Rarity markings ──────────────────────────────────────────────────────────
// Common   (< 30): no markings
// Uncommon (30+):  single central ridge
// Rare     (50+):  three ridges (center + two flanking)
// Epic     (75+):  ridges + prominent purple dots
// Legendary(90+):  golden outline (above) + golden ridge + golden dots

function buildMarkings(score: number, cx: number, cy: number, size: number, shape: PetalShape): string {
  if (score < 30) return ''

  const h = shape === 'lanzett' ? size * 0.40 : size * 0.32
  const isLegendary = score >= 90
  const isEpic = score >= 75

  const ridgeStroke = isLegendary
    ? 'rgba(218,162,40,0.82)'
    : 'rgba(48,20,6,0.52)'
  const sw = Math.max(1.2, size * 0.042)

  const centerRidge = `<path d="M ${cx} ${cy-h} Q ${cx+size*0.032} ${cy} ${cx} ${cy+h}"
    stroke="${ridgeStroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`

  if (score < 50) return centerRidge

  const off = size * 0.092
  const sideStroke = isLegendary ? 'rgba(218,162,40,0.52)' : 'rgba(48,20,6,0.36)'
  const sideSw = Math.max(0.9, size * 0.032)
  const sideRidges = `
    <path d="M ${cx+off} ${cy-h*0.70} Q ${cx+off*1.28} ${cy} ${cx+off} ${cy+h*0.70}"
      stroke="${sideStroke}" stroke-width="${sideSw}" fill="none" stroke-linecap="round"/>
    <path d="M ${cx-off} ${cy-h*0.70} Q ${cx-off*1.28} ${cy} ${cx-off} ${cy+h*0.70}"
      stroke="${sideStroke}" stroke-width="${sideSw}" fill="none" stroke-linecap="round"/>`

  if (!isEpic) return centerRidge + sideRidges

  const r = Math.max(2.4, size * 0.060)
  const dotFill = isLegendary ? 'rgba(218,162,40,0.92)' : 'rgba(148,72,215,0.82)'
  const dotGlow = isLegendary ? 'rgba(218,162,40,0.30)' : 'rgba(148,72,215,0.25)'
  const glowR = r * 1.8
  const dots = `
    <circle cx="${cx}" cy="${cy - h*0.42}" r="${glowR}" fill="${dotGlow}"/>
    <circle cx="${cx}" cy="${cy - h*0.42}" r="${r}" fill="${dotFill}"/>
    <circle cx="${cx}" cy="${cy + h*0.42}" r="${glowR * 0.65}" fill="${dotGlow}"/>
    <circle cx="${cx}" cy="${cy + h*0.42}" r="${r * 0.62}" fill="${dotFill}"/>`

  return centerRidge + sideRidges + dots
}
