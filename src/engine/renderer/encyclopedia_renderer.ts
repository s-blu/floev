import type { Plant } from '../../model/plant';
import { renderFullBloom } from './plant_renderer';
import { svg } from './renderer_utils';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

export function renderBloomSVG(plant: Plant, w: number, h: number): string {
  let defs = '';
  let body = '';
  const cx = w / 2;
  const cy = h / 2;

  ({ defs, body } = renderFullBloom(plant, defs, cx, cy, body));

  return svg(defs, body, w, h);
}
