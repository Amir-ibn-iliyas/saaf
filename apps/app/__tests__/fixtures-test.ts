/**
 * @jest-environment node
 *
 * Task 1.4: runs clean() on the owner's real fixtures (../../fixtures/images).
 *   gemini-*  → logo detected and gone
 *   other-*   → image unchanged, detected: false
 * Decodes with canvaskit-wasm (dev dependency, also used by scripts/build-masks.cjs).
 * Set SAAF_FIXTURE_DUMP=<folder> to also write before/after corner crops there.
 */
/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { TextDecoder } from 'util';

import { bundledMasksConfig, clean, loadTemplates, outlineEdgeRatio, type RGBA } from '../src/core';
import { carryProvenance, provenanceBlocks } from '../src/features/image/provenance';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

const FIXTURES = path.join(__dirname, '../../../fixtures/images');
const DUMP = process.env.SAAF_FIXTURE_DUMP;
const files = fs.existsSync(FIXTURES)
  ? fs.readdirSync(FIXTURES).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];
const gemini = files.filter((f) => f.startsWith('gemini-'));
const other = files.filter((f) => f.startsWith('other-'));

/** After cleaning, the logo outline must not stand out from the rest of the box (D-015). */
const MAX_OUTLINE_EDGE_RATIO = 1.3;

let CK: any;
beforeAll(async () => {
  // jest-expo's TextDecoder polyfill lacks utf-16le, which CanvasKit needs.
  (globalThis as any).TextDecoder = TextDecoder;
  CK = await CanvasKitInit();
});

function info(width: number, height: number) {
  return {
    width,
    height,
    colorType: CK.ColorType.RGBA_8888,
    alphaType: CK.AlphaType.Unpremul,
    colorSpace: CK.ColorSpace.SRGB,
  };
}

function decode(file: string): RGBA {
  const image = CK.MakeImageFromEncoded(fs.readFileSync(path.join(FIXTURES, file)));
  const width = image.width();
  const height = image.height();
  const px = image.readPixels(0, 0, info(width, height));
  image.delete();
  return { width, height, data: new Uint8ClampedArray(px.buffer, px.byteOffset, px.length) };
}


function dumpCrops(file: string, before: RGBA, after: RGBA, x: number, y: number, size: number) {
  if (!DUMP) return;
  const pad = 24;
  const s = size + 2 * pad;
  const scale = 3;
  const w = s * scale * 2;
  const h = s * scale;
  const out = new Uint8Array(w * h * 4);
  [before, after].forEach((img, k) => {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < s * scale; px++) {
        const sx = x - pad + Math.floor(px / scale);
        const sy = y - pad + Math.floor(py / scale);
        const si = (sy * img.width + sx) * 4;
        out.set(img.data.subarray(si, si + 4), (py * w + k * s * scale + px) * 4);
      }
    }
  });
  const png = CK.MakeImage(info(w, h), out, w * 4).encodeToBytes(CK.ImageFormat.PNG, 100);
  fs.writeFileSync(path.join(DUMP, `crop-${file}`), png);
}

const templates = loadTemplates();
const options = bundledMasksConfig;

(gemini.length ? describe : describe.skip)('Gemini fixtures', () => {
  it.each(gemini)('%s: logo detected and cleaned', (file) => {
    const img = decode(file);
    const { image, detection } = clean(img, templates, options);
    expect(detection.detected).toBe(true);

    const t = templates.find((tt) => tt.id === detection.templateId)!;
    const edgeBefore = outlineEdgeRatio(img, t.mask, detection.x, detection.y);
    const edgeAfter = outlineEdgeRatio(image, t.mask, detection.x, detection.y);
    console.log(
      `${file} ${img.width}x${img.height}: ${t.id} at (${detection.x}, ${detection.y}) ` +
        `score ${detection.score.toFixed(3)}, outline edge ratio ${edgeBefore.toFixed(2)} -> ${edgeAfter.toFixed(2)}`
    );
    dumpCrops(file, img, image, detection.x, detection.y, t.size);

    expect(edgeAfter).toBeLessThan(MAX_OUTLINE_EDGE_RATIO);
  });
});

function cropOf(img: RGBA, x0: number, y0: number, width: number, height: number): RGBA {
  const w = Math.min(width, img.width - x0);
  const h = Math.min(height, img.height - y0);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const from = ((y0 + y) * img.width + x0) * 4;
    data.set(img.data.subarray(from, from + w * 4), y * w * 4);
  }
  return { width: w, height: h, data };
}

// Real photo texture can score above the NCC threshold; the outline checks must stop it (D-015).
(gemini.length ? describe : describe.skip)('logo-free parts of the Gemini fixtures', () => {
  it.each(gemini)('%s: crops without the logo stay unchanged', (file) => {
    const img = decode(file);
    const crops = [
      cropOf(img, 0, 0, 1024, 1024),
      cropOf(img, 0, 0, img.width, img.height - 400),
      cropOf(img, 200, 100, 1000, 900),
      cropOf(img, 600, 0, 1000, 900),
    ];
    // Plus 20 seeded random crops that end at least 300 px above / left of the logo corner.
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
    for (let k = 0; k < 20; k++) {
      const cw = 500 + Math.floor(rand() * (img.width - 800));
      const ch = 500 + Math.floor(rand() * (img.height - 800));
      const x0 = Math.floor(rand() * Math.max(1, img.width - 300 - cw));
      const y0 = Math.floor(rand() * Math.max(1, img.height - 300 - ch));
      crops.push(cropOf(img, x0, y0, cw, ch));
    }
    for (const crop of crops) {
      const { image, detection } = clean(crop, templates, options);
      if (detection.detected) console.log(`FALSE POSITIVE ${file} crop ${crop.width}x${crop.height}: ${JSON.stringify(detection)}`);
      expect(detection.detected).toBe(false);
      expect(image).toBe(crop);
    }
  });
});

(gemini.length ? describe : describe.skip)('provenance', () => {
  it.each(gemini)('%s: the cleaned PNG keeps the C2PA chunk byte for byte', (file) => {
    const original = new Uint8Array(fs.readFileSync(path.join(FIXTURES, file)));
    const { image } = clean(decode(file), templates, options);
    const encoded = CK.MakeImage(info(image.width, image.height), image.data, image.width * 4).encodeToBytes(
      CK.ImageFormat.PNG,
      100
    );
    const sourceBlocks = provenanceBlocks(original);
    expect(sourceBlocks.length).toBeGreaterThan(0);
    expect(provenanceBlocks(encoded)).toHaveLength(0);

    const kept = provenanceBlocks(carryProvenance(original, encoded));
    expect(kept.map((b) => Buffer.from(b).toString('base64'))).toEqual(
      sourceBlocks.map((b) => Buffer.from(b).toString('base64'))
    );
  });
});

(other.length ? describe : describe.skip)('non-Gemini fixtures', () => {
  it.each(other)('%s: unchanged', (file) => {
    const img = decode(file);
    const { image, detection } = clean(img, templates, options);
    expect(detection.detected).toBe(false);
    expect(image).toBe(img);
  });
});
