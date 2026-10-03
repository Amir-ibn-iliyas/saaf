/**
 * @jest-environment node
 */
import { loadTemplates } from '../masks';
import { refinePosition } from '../refine';
import { blend, makePhoto } from '../testing/synthetic';

const templates = loadTemplates();

describe('refinePosition', () => {
  it.each([
    [0, 0],
    [1, 0],
    [0, -1],
    [-2, 2],
  ])('moves a guess that is off by (%i, %i) back onto the logo', (dx, dy) => {
    const t = templates.find((tt) => tt.id === 'g96-m192')!;
    const photo = makePhoto(700, 600, 13);
    const x = 700 - t.marginRight - t.size;
    const y = 600 - t.marginBottom - t.size;
    const marked = blend(photo, t.mask, x, y);

    expect(refinePosition(marked, t.mask, x + dx, y + dy)).toEqual({ x, y });
  });

  it('works for a logo touching the image edge', () => {
    const t = templates.find((tt) => tt.id === 'g48-m32')!;
    const photo = makePhoto(60, 60, 2);
    const marked = blend(photo, t.mask, 10, 10);
    expect(refinePosition(marked, t.mask, 11, 9)).toEqual({ x: 10, y: 10 });
  });

  it('keeps the detected position when every offset is equally good', () => {
    const t = templates.find((tt) => tt.id === 'g48-m32')!;
    const white = { width: 120, height: 120, data: new Uint8ClampedArray(120 * 120 * 4).fill(255) };
    expect(refinePosition(white, t.mask, 40, 40)).toEqual({ x: 40, y: 40 });
  });
});
