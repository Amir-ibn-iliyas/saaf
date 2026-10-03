/**
 * @jest-environment node
 */
import { bundledMasksConfig, decodeBase64, loadTemplates } from '../masks';

describe('masks', () => {
  it('decodes base64', () => {
    // Buffer.from([0, 1, 127, 128, 254, 255, 42]).toString('base64')
    expect(Array.from(decodeBase64('AAF/gP7/Kg=='))).toEqual([0, 1, 127, 128, 254, 255, 42]);
  });

  it('loads every template with values in 0..1', () => {
    const templates = loadTemplates();
    expect(templates.map((t) => t.id)).toEqual(bundledMasksConfig.templates.map((t) => t.id));

    for (const t of templates) {
      expect(t.mask.alpha).toHaveLength(t.size * t.size);
      let max = 0;
      for (const a of t.mask.alpha) {
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1);
        max = Math.max(max, a);
      }
      // a real logo, not an empty mask
      expect(max).toBeGreaterThan(0.2);
    }
  });

  it.each([
    // [mask file, x, y, max(r,g,b) in the source PNG] — off-diagonal pairs catch a transposed mask
    ['alpha-48', 42, 21, 80],
    ['alpha-48', 21, 42, 97],
    ['alpha-48', 24, 24, 128],
    ['alpha-96', 40, 15, 82],
    ['alpha-96', 15, 40, 65],
    ['alpha-96', 48, 48, 129],
    ['alpha-96-20260520', 41, 13, 34],
    ['alpha-96-20260520', 13, 41, 46],
  ] as const)('%s at (%i, %i) matches the source PNG value %i', (file, x, y, byte) => {
    const t = loadTemplates().find((tt) => tt.file === file)!;
    expect(t.mask.alpha[y * t.size + x]).toBeCloseTo(byte / 255, 6);
  });

  it('has a sane threshold', () => {
    expect(bundledMasksConfig.threshold).toBeGreaterThan(0);
    expect(bundledMasksConfig.threshold).toBeLessThan(1);
  });
});
