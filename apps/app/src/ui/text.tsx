import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { fonts, fontSize, type ColorName } from './theme';
import { useSaafTheme } from './theme-context';

type Variant = 'wordmark' | 'title' | 'heading' | 'body' | 'label' | 'small';

export type AppTextProps = TextProps & { variant?: Variant; color?: ColorName };

/** All app text. Unbounded only for the wordmark and screen titles; Onest everywhere else. */
export function AppText({ variant = 'body', color = 'ink', style, ...rest }: AppTextProps) {
  const { colors } = useSaafTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[styles[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  wordmark: { fontFamily: fonts.display, fontSize: fontSize.xl, lineHeight: 40 },
  title: { fontFamily: fonts.display, fontSize: fontSize.lg, lineHeight: 30 },
  heading: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.md, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: fontSize.sm, lineHeight: 22 },
  label: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, lineHeight: 20 },
  small: { fontFamily: fonts.body, fontSize: fontSize.xs, lineHeight: 18 },
});
