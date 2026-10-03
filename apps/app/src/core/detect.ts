import type { LoadedTemplate } from './masks';
import type { RGBA } from './types';

export type Detection = {
  detected: boolean;
  /** Best-scoring template, even when below the threshold (null if none fit the image). */
  templateId: string | null;
  /** Top-left corner of the best box. */
  x: number;
  y: number;
  /** Normalized cross-correlation, -1..1. */
  score: number;
};

export type DetectOptions = { threshold: number; searchRadius: number };

/** max(r, g, b) per pixel — the white logo raises every channel, so it shows up here. */
function brightness(img: RGBA, x0: number, y0: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const { data, width } = img;
  for (let y = 0; y < h; y++) {
    let i = ((y0 + y) * width + x0) * 4;
    for (let x = 0; x < w; x++, i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      out[y * w + x] = r > g ? (r > b ? r : b) : g > b ? g : b;
    }
  }
  return out;
}

/**
 * Normalized cross-correlation between the mask and the brightness patch whose top-left is
 * (ox, oy) inside `area`. Subtracting a flat background does not change NCC, so the raw
 * brightness can be used directly.
 */
function ncc(
  area: Float32Array,
  areaWidth: number,
  ox: number,
  oy: number,
  alpha: Float32Array,
  size: number,
  maskMean: number,
  maskNorm: number
): number {
  const n = size * size;
  let sum = 0;
  for (let y = 0; y < size; y++) {
    const row = (oy + y) * areaWidth + ox;
    for (let x = 0; x < size; x++) sum += area[row + x];
  }
  const mean = sum / n;

  let cross = 0;
  let energy = 0;
  for (let y = 0; y < size; y++) {
    const row = (oy + y) * areaWidth + ox;
    for (let x = 0; x < size; x++) {
      const d = area[row + x] - mean;
      cross += d * (alpha[y * size + x] - maskMean);
      energy += d * d;
    }
  }
  if (energy === 0 || maskNorm === 0) return 0;
  return cross / Math.sqrt(energy * maskNorm);
}

/**
 * The best NCC match of each template near its expected bottom-right position
 * (± searchRadius px), best score first. `detected` marks the ones at or above the threshold.
 */
export function candidates(img: RGBA, templates: LoadedTemplate[], options: DetectOptions): Detection[] {
  const { threshold, searchRadius: r } = options;
  const found: Detection[] = [];

  for (const t of templates) {
    const { size, alpha } = t.mask;
    const ex = img.width - t.marginRight - size;
    const ey = img.height - t.marginBottom - size;

    // Search area, clipped to the image.
    const ax0 = Math.max(0, ex - r);
    const ay0 = Math.max(0, ey - r);
    const ax1 = Math.min(img.width, ex + r + size);
    const ay1 = Math.min(img.height, ey + r + size);
    const aw = ax1 - ax0;
    const ah = ay1 - ay0;
    if (aw < size || ah < size) continue;

    let maskSum = 0;
    for (const a of alpha) maskSum += a;
    const maskMean = maskSum / alpha.length;
    let maskNorm = 0;
    for (const a of alpha) maskNorm += (a - maskMean) * (a - maskMean);

    const area = brightness(img, ax0, ay0, aw, ah);
    let best: Detection = { detected: false, templateId: t.id, x: ax0, y: ay0, score: -Infinity };
    for (let oy = 0; oy + size <= ah; oy++) {
      for (let ox = 0; ox + size <= aw; ox++) {
        const score = ncc(area, aw, ox, oy, alpha, size, maskMean, maskNorm);
        if (score > best.score) best = { ...best, x: ax0 + ox, y: ay0 + oy, score };
      }
    }
    found.push({ ...best, detected: best.score >= threshold });
  }

  return found.sort((a, b) => b.score - a.score);
}

/** The single best candidate. `detected` is true only when its score reaches the threshold. */
export function detect(img: RGBA, templates: LoadedTemplate[], options: DetectOptions): Detection {
  return (
    candidates(img, templates, options)[0] ?? { detected: false, templateId: null, x: 0, y: 0, score: 0 }
  );
}
