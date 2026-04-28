import type { Plant } from '../../model/plant';
import { renderFullBloom } from './plant_renderer';
import { svg } from './renderer_utils';

// ─── Bloom-only render (for encyclopedia) ────────────────────────────────────

export function renderBloomSVG(plant: Plant, w: number, h: number, context: string = 'enc'): string {
  let defs = '';
  let body = '';
  const cx = w / 2;
  const cy = h / 2;

  ({ defs, body } = renderFullBloom(plant, defs, cx, cy, body, context));

  return svg(defs, body, w, h);
}
