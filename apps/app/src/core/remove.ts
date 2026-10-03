import type { AlphaMask, RGBA } from './types';

/** Never divide by (1 - a) with a closer to 1 than this. */
export const MAX_ALPHA = 0.99;

/**
 * Reverses Gemini's white-logo blend inside one mask box:
 *   watermarked = a * 255 + (1 - a) * original  →  original = (watermarked - a * 255) / (1 - a)
 *
 * `x`, `y` is the top-left corner of the box. Returns a new image; pixels outside the box
 * (and the image's own alpha channel) are copied unchanged. Parts of the box outside the
 * image are ignored.
 */
export function remove(img: RGBA, mask: AlphaMask, x: number, y: number): RGBA {
  const { width, height } = img;
  const data = new Uint8ClampedArray(img.data);
  const { size, alpha } = mask;

  const y0 = Math.max(0, y);
  const y1 = Math.min(height, y + size);
  const x0 = Math.max(0, x);
  const x1 = Math.min(width, x + size);

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const a = Math.min(alpha[(py - y) * size + (px - x)], MAX_ALPHA);
      if (a <= 0) continue;
      const scale = 1 / (1 - a);
      const offset = a * 255;
      const i = (py * width + px) * 4;
      // Uint8ClampedArray rounds and clamps to 0..255 on write.
      data[i] = (data[i] - offset) * scale;
      data[i + 1] = (data[i + 1] - offset) * scale;
      data[i + 2] = (data[i + 2] - offset) * scale;
    }
  }

  return { width, height, data };
}
