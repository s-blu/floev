import type { ColorBucket } from '../model/genetic_model'
import { PALETTE_HUES_BUCKETS, PALETTE_S, PALETTE_L } from '../model/genetic_model'
import type { PetalShape, CenterType } from '../model/plant'

export const COIN_ICON = '<span class="coin-icon" aria-label="Münze">🪙</span>'

// ─── Center type icons ────────────────────────────────────────────────────────

export const CENTER_TYPE_ICONS: Record<CenterType, string> = {
  dot:    `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" fill="currentColor"/></svg>`,
  disc:   `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="currentColor"/><circle cx="5" cy="5" r="4.5" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  stamen: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="2" cy="8" r="1.5" fill="currentColor"/><circle cx="5" cy="3.5" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>`,
}

// ─── Effect swatch ────────────────────────────────────────────────────────────

const EFFECT_SWATCH_HUE: Record<string, number> = {
  bicolor: 320, gradient: 200, shimmer: 40, iridescent: 0,
}

export function renderEffectSwatch(effect: string): string {
  const h = EFFECT_SWATCH_HUE[effect] ?? 0
  const hsl = (hue: number, s: number, l: number) =>
    `hsl(${((hue % 360) + 360) % 360},${s}%,${l}%)`
  let bg: string
  switch (effect) {
    case 'bicolor':
      bg = `linear-gradient(90deg, ${hsl(h,90,88)} 50%, ${hsl(h,90,28)} 50%)`
      break
    case 'gradient':
      bg = `linear-gradient(to right, ${hsl(h,90,90)}, ${hsl(h,90,30)})`
      break
    case 'shimmer':
      bg = `linear-gradient(135deg, ${hsl(h-15,90,60)} 25%, ${hsl(h,90,60)} 25%, ${hsl(h,90,60)} 50%, ${hsl(h+15,90,60)} 50%, ${hsl(h+15,90,60)} 75%, ${hsl(h,90,60)} 75%)`
      break
    case 'iridescent':
      bg = `linear-gradient(135deg, ${hsl(0,80,65)} 25%, ${hsl(90,80,65)} 25%, ${hsl(90,80,65)} 50%, ${hsl(180,80,65)} 50%, ${hsl(180,80,65)} 75%, ${hsl(270,80,65)} 75%)`
      break
    default:
      bg = hsl(h, 90, 60)
  }
  return `<div class="di-mini-swatches"><span class="di-mini-swatch di-mini-swatch--effect" style="background:${bg}"></span></div>`
}

// ─── Bucket swatch strip ──────────────────────────────────────────────────────

const BUCKET_SWATCH_L = 60

export function renderBucketSwatchStrip(bucket: ColorBucket): string {
  if (bucket === 'white') {
    return `<div class="di-mini-swatches"><span class="di-mini-swatch" style="background:hsl(0,0%,97%)"></span></div>`
  }
  if (bucket === 'gray') {
    return `<div class="di-mini-swatches"><span class="di-mini-swatch" style="background:hsl(0,0%,${BUCKET_SWATCH_L}%)"></span></div>`
  }
  const hues = (PALETTE_HUES_BUCKETS as Record<string, readonly number[]>)[bucket] ?? []
  const swatches = hues.map(hue =>
    `<span class="di-mini-swatch" style="background:hsl(${hue},${PALETTE_S}%,${BUCKET_SWATCH_L}%)"></span>`
  ).join('')
  return `<div class="di-mini-swatches">${swatches}</div>`
}

// ─── Hue swatch strip ────────────────────────────────────────────────────────

export function renderHueSwatchStrip(hue: number): string {
  if (hue === 1) {
    return `<div class="di-mini-swatches"><span class="di-mini-swatch di-mini-swatch--effect" style="background:hsl(0,0%,97%)"></span></div>`
  }
  const lightnesses = hue === 2 ? [30, 60, 90] : [...(PALETTE_L as readonly number[])]
  const hslFn = (l: number) => hue === 2 ? `hsl(0,0%,${l}%)` : `hsl(${hue},${PALETTE_S}%,${l}%)`
  const swatches = lightnesses.map(l => `<span class="di-mini-swatch" style="background:${hslFn(l)}"></span>`).join('')
  return `<div class="di-mini-swatches">${swatches}</div>`
}

// ─── Petal shape SVG ──────────────────────────────────────────────────────────

export function renderPetalShapeSvg(shape: PetalShape, w = 40, h = 44, fillColor = 'hsl(330,80%,72%)', strokeColor = 'hsl(330,70%,55%)'): string {
  // Fixed coordinate space so shapes stay fully visible at any display size.
  const cx = 20
  const cy = 38
  const fill = fillColor
  const stroke = strokeColor
  const sw = 'stroke-width="0.8"'
  let path = ''

  switch (shape) {
    case 'round':
      path = `<ellipse cx="${cx}" cy="${cy - 14}" rx="8.5" ry="12" fill="${fill}" stroke="${stroke}" ${sw}/>`
      break
    case 'lanzett':
      path = `<path d="M${cx},${cy - 2} C${cx + 4},${cy - 16} ${cx},${cy - 30} ${cx},${cy - 30} C${cx},${cy - 30} ${cx - 4},${cy - 16} ${cx},${cy - 2} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`
      break
    case 'tropfen':
      path = `<path d="M${cx},${cy - 2} C${cx + 10},${cy - 14} ${cx},${cy - 32} ${cx},${cy - 32} C${cx},${cy - 32} ${cx - 10},${cy - 14} ${cx},${cy - 2} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`
      break
    case 'wavy':
      path = `<path d="M${cx},${cy - 2} C${cx + 10},${cy - 10} ${cx + 14},${cy - 16} ${cx + 8},${cy - 20} C${cx + 2},${cy - 24} ${cx + 12},${cy - 28} ${cx},${cy - 30} C${cx - 12},${cy - 28} ${cx - 2},${cy - 24} ${cx - 8},${cy - 20} C${cx - 14},${cy - 16} ${cx - 10},${cy - 10} ${cx},${cy - 2} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`
      break
    case 'zickzack':
      path = `<path d="M${cx},${cy - 2} L${cx + 4},${cy - 8} L${cx + 10},${cy - 14} L${cx + 5},${cy - 18} L${cx + 10},${cy - 24} L${cx + 5},${cy - 28} L${cx},${cy - 30} L${cx - 5},${cy - 28} L${cx - 10},${cy - 24} L${cx - 5},${cy - 18} L${cx - 10},${cy - 14} L${cx - 4},${cy - 8} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`
      break
  }

  return `<svg width="${w}" height="${h}" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">${path}</svg>`
}
