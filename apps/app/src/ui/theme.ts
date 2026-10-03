/**
 * Design tokens — mirror of design/tokens.json (Neem green). Keep the two in sync;
 * src/ui/__tests__/theme-test.ts fails if they drift. Components read colours from
 * useSaafTheme(), never hard-coded hex.
 */
export const palette = {
  light: {
    ink: '#15241B',
    muted: '#56665C',
    paper: '#F1F6F2',
    surface: '#FFFFFF',
    wash: '#DCEBE1',
    line: '#CFDDD3',
    neem: '#0F7A55',
    onNeem: '#FFFFFF',
    successBg: '#DDF0E5',
    successInk: '#0B5A3E',
    amber: '#E8A317',
    amberBg: '#FBEFD2',
    amberInk: '#7A5206',
    brick: '#C8412B',
    brickBg: '#FBE3DE',
  },
  dark: {
    ink: '#E6F0EA',
    muted: '#93A79B',
    paper: '#0F1713',
    surface: '#17221C',
    wash: '#1F2E26',
    line: '#2A3A31',
    neem: '#4CC38A',
    onNeem: '#062A1B',
    successBg: '#173A29',
    successInk: '#8FE3B8',
    amber: '#F0B84A',
    amberBg: '#3A2E12',
    amberInk: '#F6D48C',
    brick: '#F07A63',
    brickBg: '#3B1D17',
  },
} as const;

export type Scheme = keyof typeof palette;
export type ColorName = keyof typeof palette.light;
export type Colors = Record<ColorName, string>;

export type ThemePreference = 'system' | 'light' | 'dark';

export function resolveScheme(preference: ThemePreference, system: string | null | undefined): Scheme {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

/** Font family names as registered by useFonts (see src/ui/fonts.ts). */
export const fonts = {
  display: 'Unbounded_600SemiBold',
  body: 'Onest_400Regular',
  bodyMedium: 'Onest_500Medium',
  bodySemiBold: 'Onest_600SemiBold',
} as const;

export const fontSize = { xl: 32, lg: 22, md: 17, sm: 15, xs: 13 } as const;
export const radius = { frame: 20, button: 14, chip: 999 } as const;
/** 4-pt grid: 4, 8, 12, 16, 24, 32. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const layout = { maxContentWidth: 480, minTouch: 44 } as const;
