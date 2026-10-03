/**
 * @jest-environment node
 */
import { boxVariance, clean } from '../clean';
import { outlineEdgeRatio } from '../verify';
import { bundledMasksConfig, loadTemplates } from '../masks';
import { blend, makePhoto } from '../testing/synthetic';

const templates = loadTemplates();
const options = bundledMasksConfig;
// Per-pixel noise of real photos is far below makePhoto's default (24); at 24 the soft May-2026
// mask's outline drowns (ratio 1.8 < 2.0) and clean() leaves the image alone (safe side).
const NOISE = 12;
const byId = (id: string) => templates.find((t) => t.id === id)!;

describe('clean', () => {
  it.each(templates.map((t) => [t.id, t] as const))('removes a %s logo', (_id, t) => {
    const photo = makePhoto(900, 640, 21, NOISE);
    const x = photo.width - t.marginRight - t.size;
    const y = photo.height - t.marginBottom - t.size;
    const marked = blend(photo, t.mask, x, y);

    const { image, detection } = clean(marked, templates, options);

    expect(detection).toMatchObject({ detected: true, templateId: t.id, x, y });
    expect(boxVariance(image, x, y, t.size)).toBeLessThan(boxVariance(marked, x, y, t.size));
    let maxError = 0;
    for (let i = 0; i < photo.data.length; i++) {
      maxError = Math.max(maxError, Math.abs(image.data[i] - photo.data[i]));
    }
    expect(maxError).toBeLessThanOrEqual(2);
  });

  it('returns a plain photo unchanged (same object)', () => {
    const photo = makePhoto(1024, 768, 5, NOISE);
    const { image, detection } = clean(photo, templates, options);
    expect(detection.detected).toBe(false);
    expect(image).toBe(photo);
  });

  function expectUntouchedWhenOnlyWrongTemplateKnown(logoId: string, knownId: string) {
    const logo = byId(logoId);
    const photo = makePhoto(900, 640, 31, NOISE);
    const marked = blend(
      photo,
      logo.mask,
      photo.width - logo.marginRight - logo.size,
      photo.height - logo.marginBottom - logo.size
    );

    const { image, detection } = clean(marked, [byId(knownId)], options);

    expect(detection.detected).toBe(false);
    expect(image).toBe(marked);
  }

  it('does not damage a g96-m64 logo when only the wrong template g48-m96 is known', () => {
    expectUntouchedWhenOnlyWrongTemplateKnown('g96-m64', 'g48-m96');
  });

  it('picks the right template when a smaller similar one is also known', () => {
    const logo = byId('g48-m96');
    const photo = makePhoto(900, 640, 31, NOISE);
    const marked = blend(photo, logo.mask, photo.width - 96 - 48, photo.height - 96 - 48);
    const { detection } = clean(marked, [byId('g36-m96'), logo], options);
    expect(detection).toMatchObject({ detected: true, templateId: 'g48-m96' });
  });

  // Was a known limitation (D-009); the outline checks (D-015) now catch it.
  it('does not damage a g48-m96 logo when only the smaller g36-m96 is known', () => {
    expectUntouchedWhenOnlyWrongTemplateKnown('g48-m96', 'g36-m96');
  });

  // Flat backgrounds: a low-contrast logo (near-white) may be left alone, but must never be
  // damaged — the result is either a correct clean or the untouched input.
  it.each([
    ['black', 0],
    ['grey', 128],
    ['near-white', 240],
  ])('never damages a logo on a flat %s background', (_name, value) => {
    const t = byId('g96-m64');
    const flat = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).fill(value) };
    for (let i = 3; i < flat.data.length; i += 4) flat.data[i] = 255;
    const x = 400 - t.marginRight - t.size;
    const y = 300 - t.marginBottom - t.size;
    const marked = blend(flat, t.mask, x, y);

    const { image, detection } = clean(marked, templates, options);
    if (detection.detected) {
      let maxError = 0;
      for (let i = 0; i < flat.data.length; i++) {
        maxError = Math.max(maxError, Math.abs(image.data[i] - flat.data[i]));
      }
      expect(maxError).toBeLessThanOrEqual(2);
    } else {
      expect(image).toBe(marked);
    }
  });
});

describe('outlineEdgeRatio', () => {
  it('is 0 for a box outside the image', () => {
    const t = byId('g48-m32');
    const img = makePhoto(100, 100, 1, NOISE);
    expect(outlineEdgeRatio(img, t.mask, 500, 500)).toBe(0);
    expect(outlineEdgeRatio(img, t.mask, -200, -200)).toBe(0);
  });
});
