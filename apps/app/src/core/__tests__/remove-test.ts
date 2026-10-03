/**
 * @jest-environment node
 */
import { loadTemplates } from '../masks';
import { remove } from '../remove';
import { blend, makePhoto } from '../testing/synthetic';

const templates = loadTemplates();

describe('remove', () => {
  it.each(templates.map((t) => [t.id, t] as const))(
    'round-trips %s with max error <= 2/255',
    (_id, t) => {
      const original = makePhoto(400, 360, 7);
      const x = original.width - t.marginRight - t.size;
      const y = original.height - t.marginBottom - t.size;
      const cleaned = remove(blend(original, t.mask, x, y), t.mask, x, y);

      let maxError = 0;
      for (let i = 0; i < original.data.length; i++) {
        maxError = Math.max(maxError, Math.abs(cleaned.data[i] - original.data[i]));
      }
      expect(maxError).toBeLessThanOrEqual(2);
    }
  );

  it('leaves pixels outside the box byte-identical and does not touch the input', () => {
    const t = templates[0];
    const img = makePhoto(200, 150, 3);
    const before = new Uint8ClampedArray(img.data);
    const x = 120;
    const y = 70;
    const out = remove(img, t.mask, x, y);

    expect(img.data).toEqual(before);
    for (let py = 0; py < img.height; py++) {
      for (let px = 0; px < img.width; px++) {
        const inside = px >= x && px < x + t.size && py >= y && py < y + t.size;
        if (inside) continue;
        const i = (py * img.width + px) * 4;
        for (let c = 0; c < 4; c++) expect(out.data[i + c]).toBe(img.data[i + c]);
      }
    }
  });

  it('keeps the image alpha channel and clips boxes that stick out of the image', () => {
    const t = templates[0];
    const img = makePhoto(60, 50, 4);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 100;
    const out = remove(img, t.mask, 30, 20); // box runs past the right and bottom edges
    expect(out.data).toHaveLength(img.data.length);
    for (let i = 3; i < out.data.length; i += 4) expect(out.data[i]).toBe(100);
    expect(out.data).not.toEqual(img.data); // RGB inside the clipped box did change
  });

  it('clamps alpha so a fully white mask pixel cannot blow up', () => {
    const img = { width: 1, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255]) };
    const out = remove(img, { size: 1, alpha: new Float32Array([1]) }, 0, 0);
    expect(Array.from(out.data)).toEqual([255, 255, 255, 255]);
  });
});
