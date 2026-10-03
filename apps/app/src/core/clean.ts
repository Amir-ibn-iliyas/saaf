import { candidates, type Detection, type DetectOptions } from './detect';
import type { LoadedTemplate } from './masks';
import { refinePosition } from './refine';
import { remove } from './remove';
import type { RGBA } from './types';
import { outlineEdgeRatio } from './verify';

export type CleanResult = { image: RGBA; detection: Detection };

export type CleanOptions = DetectOptions & {
  minOutlineEdge: number;
  maxOutlineEdgeAfter: number;
};

/** Variance of max(r, g, b) inside a box (clipped to the image). */
export function boxVariance(img: RGBA, x: number, y: number, size: number): number {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(img.width, x + size);
  const y1 = Math.min(img.height, y + size);
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * img.width + px) * 4;
      const v = Math.max(img.data[i], img.data[i + 1], img.data[i + 2]);
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * detect → refine position (±2 px) → verify → remove → verify again. The original image is
 * returned untouched with `detected: false` unless all of these hold (D-015):
 *  - the box shows the logo's crisp outline before removal (outline edge ratio ≥ min),
 *  - after removal that outline is gone (ratio ≤ max) and the box got smoother.
 * Photo texture can reach the NCC threshold (real crops scored up to 0.65); it never shows
 * the outline, so these checks — not the score — decide.
 */
export function clean(img: RGBA, templates: LoadedTemplate[], options: CleanOptions): CleanResult {
  // Texture can make a wrong template outscore the real one, so every candidate above the
  // threshold is tried, best score first; the first that passes verification wins.
  const found = candidates(img, templates, options);
  for (const candidate of found) {
    if (!candidate.detected) break;
    const result = verifyAndRemove(img, templates, options, candidate);
    if (result) return result;
  }
  const best = found[0] ?? { detected: false, templateId: null, x: 0, y: 0, score: 0 };
  return { image: img, detection: { ...best, detected: false } };
}

function verifyAndRemove(
  img: RGBA,
  templates: LoadedTemplate[],
  options: CleanOptions,
  found: Detection
): CleanResult | null {
  const template = templates.find((t) => t.id === found.templateId)!;
  const { x, y } = refinePosition(img, template.mask, found.x, found.y);
  if (outlineEdgeRatio(img, template.mask, x, y) < options.minOutlineEdge) return null;

  const cleaned = remove(img, template.mask, x, y);
  if (outlineEdgeRatio(cleaned, template.mask, x, y) > options.maxOutlineEdgeAfter) return null;
  if (boxVariance(cleaned, x, y, template.size) >= boxVariance(img, x, y, template.size)) return null;
  // `score` stays the NCC of the detected (unrefined) position.
  return { image: cleaned, detection: { ...found, x, y } };
}
