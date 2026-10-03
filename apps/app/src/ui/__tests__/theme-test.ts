/**
 * @jest-environment node
 */
import tokens from '../../../../../design/tokens.json';
import { fontSize, layout, palette, radius, resolveScheme, space } from '../theme';

/** WCAG relative luminance contrast ratio. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme', () => {
  it('matches design/tokens.json', () => {
    expect(palette).toEqual(tokens.color);
    expect(fontSize).toEqual(tokens.size);
    expect(radius).toEqual(tokens.radius);
    expect(Object.values(space)).toEqual(tokens.space);
    expect(layout).toEqual(tokens.layout);
  });

  // Text colour on background pairs the components use. In light mode brick on brickBg (4.0:1)
  // and neem on wash (4.3:1) fail, so components never put text in those pairs (D-010).
  it.each(['light', 'dark'] as const)('text pairs reach 4.5:1 contrast in %s', (scheme) => {
    const c = palette[scheme];
    const pairs: [string, string][] = [
      ['ink', 'paper'],
      ['ink', 'surface'],
      ['ink', 'wash'],
      ['muted', 'paper'],
      ['muted', 'surface'],
      ['onNeem', 'neem'],
      ['paper', 'ink'],
      ['neem', 'surface'],
      ['neem', 'paper'],
      ['successInk', 'successBg'],
      ['amberInk', 'amberBg'],
      ['ink', 'brickBg'],
      ['muted', 'wash'],
      ['brick', 'surface'],
    ];
    for (const [fg, bg] of pairs) {
      const ratio = contrast(c[fg as keyof typeof c], c[bg as keyof typeof c]);
      if (ratio < 4.5) throw new Error(`${scheme}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  });

  it('resolves the preference against the system setting', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });
});
