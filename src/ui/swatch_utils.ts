import type { HSLColor } from '../model/plant';

export function buildFamilySwatchStyle(pc: HSLColor): string {
  const { h, s } = pc;
  const c = (l: number) => `hsl(${Math.round(h)},${Math.round(s)}%,${l}%)`;
  return `background: linear-gradient(to right, ${c(30)} 33%, ${c(60)} 33%, ${c(60)} 66%, ${c(90)} 66%)`;
}
