import type { AlphaMask, RGBA } from '../types';

/** Small seeded PRNG (mulberry32) so synthetic tests are repeatable. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A photo-like test image: smooth colour gradients plus a little noise, opaque. */
export function makePhoto(width: number, height: number, seed = 1, noise = 24): RGBA {
  const rand = seededRandom(seed);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = () => (rand() - 0.5) * noise;
      data[i] = 40 + (150 * x) / width + n();
      data[i + 1] = 30 + (170 * y) / height + n();
      data[i + 2] = 90 + 60 * Math.sin((x + y) / 37) + n();
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

/** Applies Gemini's white-logo blend: out = a * 255 + (1 - a) * in. Returns a new image. */
export function blend(img: RGBA, mask: AlphaMask, x: number, y: number): RGBA {
  const data = new Uint8ClampedArray(img.data);
  for (let my = 0; my < mask.size; my++) {
    for (let mx = 0; mx < mask.size; mx++) {
      const px = x + mx;
      const py = y + my;
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
      const a = mask.alpha[my * mask.size + mx];
      const i = (py * img.width + px) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = a * 255 + (1 - a) * data[i + c];
    }
  }
  return { width: img.width, height: img.height, data };
}
