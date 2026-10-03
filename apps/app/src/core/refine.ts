import { remove } from './remove';
import type { AlphaMask, RGBA } from './types';

/** Copies a rectangle (clipped to the image) into its own small image. */
function crop(img: RGBA, x0: number, y0: number, w: number, h: number) {
  const cx0 = Math.max(0, x0);
  const cy0 = Math.max(0, y0);
  const cx1 = Math.min(img.width, x0 + w);
  const cy1 = Math.min(img.height, y0 + h);
  const width = Math.max(0, cx1 - cx0);
  const height = Math.max(0, cy1 - cy0);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((cy0 + y) * img.width + cx0) * 4;
    data.set(img.data.subarray(from, from + width * 4), y * width * 4);
  }
  return { patch: { width, height, data }, ox: cx0, oy: cy0 };
}

/** Sum of |horizontal| + |vertical| brightness steps (max of r, g, b) over the whole patch. */
function edgeEnergy(img: RGBA): number {
  const { width, height, data } = img;
  const b = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return Math.max(data[i], data[i + 1], data[i + 2]);
  };
  let e = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const v = b(x, y);
      e += Math.abs(b(x + 1, y) - v) + Math.abs(b(x, y + 1) - v);
    }
  }
  return e;
}

/**
 * Fine-tunes the logo position. Removing at a slightly wrong spot leaves thin dark/light
 * lines along the logo edges, so we try every offset within ±radius and keep the one whose
 * result has the least edge energy over a fixed area around the box. Real fixtures: NCC
 * texture can pull detection 1 px off; this puts it back (D-013). The result may lie partly
 * outside the image near an edge; remove() clips the box.
 */
export function refinePosition(
  img: RGBA,
  mask: AlphaMask,
  x: number,
  y: number,
  radius = 2,
  margin = 4
): { x: number; y: number } {
  const pad = radius + margin;
  const { patch, ox, oy } = crop(img, x - pad, y - pad, mask.size + 2 * pad + 1, mask.size + 2 * pad + 1);
  if (patch.width === 0 || patch.height === 0) return { x, y };

  let best = { x, y };
  let bestEnergy = Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const cleaned = remove(patch, mask, x + dx - ox, y + dy - oy);
      const energy = edgeEnergy(cleaned);
      // On a tie the detected position (0, 0) wins; other ties keep the first in scan order.
      if (energy < bestEnergy || (energy === bestEnergy && dx === 0 && dy === 0)) {
        bestEnergy = energy;
        best = { x: x + dx, y: y + dy };
      }
    }
  }
  return best;
}
