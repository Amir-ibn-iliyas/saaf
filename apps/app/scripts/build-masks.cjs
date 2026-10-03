#!/usr/bin/env node
/**
 * Builds the alpha mask JSON files in src/core/masks/ from the calibrated PNGs in
 * src/core/masks/source/ (black-background captures, MIT — see THIRD_PARTY_NOTICES.md).
 *
 *   alpha = max(r, g, b) / 255   (stored as one byte per pixel, base64)
 *
 * The 36 px mask is not calibrated: it is an area-average downscale of the 96 px mask.
 * Veo (video) masks: the same logo at 0.62 × the image opacity, fitted on the owner's two
 * 720p Veo fixtures (D-017). The 72 px one (1080p) is derived and not yet verified.
 *
 * Run from apps/app:  node scripts/build-masks.cjs
 */
const fs = require('fs');
const path = require('path');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/core/masks/source');
const OUT = path.join(ROOT, 'src/core/masks');

const CALIBRATED = [
  { id: 'alpha-48', file: 'bg_48.png' },
  { id: 'alpha-96', file: 'bg_96.png' },
  { id: 'alpha-96-20260520', file: 'bg_96_20260520.png' },
];
const DERIVED = [
  { id: 'alpha-36', from: 'alpha-96', size: 36, scale: 1 },
  { id: 'alpha-veo-48', from: 'alpha-48', size: 48, scale: 0.62 },
  { id: 'alpha-veo-72', from: 'alpha-96', size: 72, scale: 0.62 },
];

function decodeAlpha(CK, file) {
  const image = CK.MakeImageFromEncoded(fs.readFileSync(path.join(SOURCE, file)));
  if (!image) throw new Error(`cannot decode ${file}`);
  const width = image.width();
  const height = image.height();
  if (width !== height) throw new Error(`${file} is not square (${width}x${height})`);
  const px = image.readPixels(0, 0, {
    width,
    height,
    colorType: CK.ColorType.RGBA_8888,
    alphaType: CK.AlphaType.Unpremul,
    colorSpace: CK.ColorSpace.SRGB,
  });
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
  }
  return { size: width, alpha };
}

/** Area-average downscale of a square byte mask. */
function downscale(src, srcSize, dstSize) {
  const out = new Uint8Array(dstSize * dstSize);
  const scale = srcSize / dstSize;
  for (let dy = 0; dy < dstSize; dy++) {
    for (let dx = 0; dx < dstSize; dx++) {
      const x0 = dx * scale;
      const y0 = dy * scale;
      let sum = 0;
      let area = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y0 + scale); sy++) {
        const wy = Math.min(sy + 1, y0 + scale) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x0 + scale); sx++) {
          const wx = Math.min(sx + 1, x0 + scale) - Math.max(sx, x0);
          sum += src[sy * srcSize + sx] * wx * wy;
          area += wx * wy;
        }
      }
      out[dy * dstSize + dx] = Math.round(sum / area);
    }
  }
  return out;
}

function write(id, size, alpha, note) {
  const json = { id, size, encoding: 'base64-u8', note, data: Buffer.from(alpha).toString('base64') };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(json, null, 2) + '\n');
  const max = alpha.reduce((m, v) => Math.max(m, v), 0);
  console.log(`${id}: ${size}x${size}, max alpha ${(max / 255).toFixed(3)}`);
}

CanvasKitInit().then((CK) => {
  const built = {};
  for (const { id, file } of CALIBRATED) {
    const { size, alpha } = decodeAlpha(CK, file);
    built[id] = { size, alpha };
    write(id, size, alpha, `Calibrated from ${file} (alpha = max(r,g,b)/255).`);
  }
  for (const { id, from, size, scale } of DERIVED) {
    const src = built[from];
    const resized = size === src.size ? src.alpha : downscale(src.alpha, src.size, size);
    const alpha = resized.map((v) => Math.round(v * scale));
    const how = size === src.size ? `${from}` : `area-average downscale of ${from}`;
    write(id, size, alpha, `${how} × ${scale}; not calibrated from black captures.`);
  }
});
