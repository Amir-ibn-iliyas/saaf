/**
 * @jest-environment node
 */
import { detect } from '../detect';
import { bundledMasksConfig, loadTemplates } from '../masks';
import { blend, makePhoto } from '../testing/synthetic';

const templates = loadTemplates();
const options = {
  threshold: bundledMasksConfig.threshold,
  searchRadius: bundledMasksConfig.searchRadius,
};

describe('detect', () => {
  it.each(templates.map((t) => [t.id, t] as const))(
    'finds %s at its exact position, including small shifts',
    (_id, t) => {
      const photo = makePhoto(900, 640, 11);
      for (const [dx, dy] of [
        [0, 0],
        [3, -2],
        [-8, 8],
      ]) {
        const x = photo.width - t.marginRight - t.size + dx;
        const y = photo.height - t.marginBottom - t.size + dy;
        const result = detect(blend(photo, t.mask, x, y), templates, options);

        expect(result).toMatchObject({ detected: true, templateId: t.id, x, y });
        expect(result.score).toBeGreaterThan(0.9);
      }
    }
  );

  it('returns detected: false for plain photos', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const result = detect(makePhoto(1024, 768, seed), templates, options);
      expect(result.detected).toBe(false);
      expect(result.score).toBeLessThan(options.threshold);
    }
  });

  it('returns detected: false for a flat image', () => {
    const img = { width: 300, height: 300, data: new Uint8ClampedArray(300 * 300 * 4).fill(128) };
    expect(detect(img, templates, options)).toMatchObject({ detected: false, score: 0 });
  });

  it('skips templates that do not fit and handles tiny images', () => {
    const tiny = makePhoto(40, 40, 9);
    expect(detect(tiny, templates, options)).toMatchObject({ detected: false, templateId: null });
  });
});
