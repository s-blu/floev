// Renders a single seed SVG (prototype: one shape for all seeds)

let _seedGradId = 0

export function renderSeedSvg(size = 40): string {
  const id = `sg${++_seedGradId}`
  const cx = size / 2
  const cy = size / 2
  const rx = size * 0.28
  const ry = size * 0.42

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="${id}" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#c4916a"/>
        <stop offset="100%" stop-color="#7a4a28"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>
    <ellipse cx="${cx - rx * 0.15}" cy="${cy - ry * 0.25}" rx="${rx * 0.18}" ry="${ry * 0.12}"
      fill="rgba(255,255,255,0.22)" transform="rotate(-20,${cx},${cy})"/>
  </svg>`
}
