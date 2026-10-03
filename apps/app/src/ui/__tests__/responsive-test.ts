/**
 * @jest-environment node
 */
import { fitMedia, layoutFor } from '../responsive-layout';

describe('layoutFor', () => {
  it.each([
    [320, 568, 'compact'],
    [375, 600, 'compact'], // short screen
    [390, 844, 'phone'],
    [430, 932, 'phone'],
    [768, 1024, 'tablet'],
    [1024, 768, 'desktop'],
    [1440, 900, 'desktop'],
  ] as const)('%i×%i is %s', (w, h, sizeClass) => {
    expect(layoutFor(w, h).sizeClass).toBe(sizeClass);
  });

  it('splits media and actions only on wide, tall-enough screens', () => {
    expect(layoutFor(1440, 900).split).toBe(true);
    expect(layoutFor(1280, 500).split).toBe(false);
    expect(layoutFor(768, 1024).split).toBe(false);
    expect(layoutFor(390, 844).split).toBe(false);
  });

  it('keeps single columns readable and only split screens wide', () => {
    expect(layoutFor(390, 844).columnWidth).toBe(480);
    expect(layoutFor(1440, 900).columnWidth).toBe(560);
    expect(layoutFor(1440, 900).splitWidth).toBeGreaterThan(900);
  });

  it('keeps gutters, title and pick area smaller on small phones', () => {
    const small = layoutFor(320, 568);
    const phone = layoutFor(390, 844);
    expect(small.gutter).toBeLessThan(phone.gutter);
    expect(small.titleSize).toBeLessThan(phone.titleSize);
    expect(small.pickHeight).toBeLessThan(phone.pickHeight);
    expect(small.pickHeight).toBeGreaterThanOrEqual(180);
  });

  it('never lets media push the actions off a phone screen', () => {
    for (const [w, h] of [
      [320, 568],
      [390, 844],
    ]) {
      const l = layoutFor(w, h);
      expect(l.mediaMaxHeight).toBeLessThanOrEqual(h - 250);
    }
  });
});

describe('fitMedia', () => {
  it('uses the full width for landscape media', () => {
    expect(fitMedia(16 / 9, 342, 500)).toEqual({ width: 342, height: 342 / (16 / 9) });
  });

  it('limits tall portrait media by height and narrows it', () => {
    const box = fitMedia(9 / 16, 342, 400);
    expect(box.height).toBeCloseTo(400);
    expect(box.width).toBeCloseTo(225);
  });
});
