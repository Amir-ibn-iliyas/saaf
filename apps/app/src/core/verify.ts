import type { AlphaMask, RGBA } from './types';

/**
 * Mean brightness step (max of r, g, b) on the logo outline divided by the mean step
 * elsewhere in the box. The real logo has a crisp outline exactly where the mask changes, so
 * a watermarked box scores high (real fixtures 2.5–6.3) while photo texture that merely
 * resembles the logo does not (logo-free crops ≤ 1.5). After a correct removal the outline
 * is gone (~1); a wrong removal draws one (> 1.5). See D-015.
 */
export function outlineEdgeRatio(img: RGBA, mask: AlphaMask, x: number, y: number): number {
  const { size, alpha } = mask;
  const a = (mx: number, my: number) =>
    alpha[Math.min(size - 1, Math.max(0, my)) * size + Math.min(size - 1, Math.max(0, mx))];
  const b = (px: number, py: number) => {
    const i = (py * img.width + px) * 4;
    return Math.max(img.data[i], img.data[i + 1], img.data[i + 2]);
  };

  let onLine = 0;
  let nLine = 0;
  let off = 0;
  let nOff = 0;
  for (let my = 1; my < size - 1; my++) {
    for (let mx = 1; mx < size - 1; mx++) {
      const px = x + mx;
      const py = y + my;
      if (px < 1 || py < 1 || px >= img.width - 1 || py >= img.height - 1) continue;
      const maskStep = Math.abs(a(mx + 1, my) - a(mx - 1, my)) + Math.abs(a(mx, my + 1) - a(mx, my - 1));
      const step = Math.abs(b(px + 1, py) - b(px - 1, py)) + Math.abs(b(px, py + 1) - b(px, py - 1));
      if (maskStep > 0.1) {
        onLine += step;
        nLine++;
      } else if (maskStep < 0.005) {
        off += step;
        nOff++;
      }
    }
  }
  if (nLine === 0 || nOff === 0) return 0;
  // +1 keeps flat areas (no texture at all) from dividing by ~0.
  return onLine / nLine / (off / nOff + 1);
}
