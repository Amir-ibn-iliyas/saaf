import { StyleSheet, View } from 'react-native';

import { AppText } from './text';
import { fontSize, radius, space, type ColorName } from './theme';
import { useSaafTheme } from './theme-context';

export type ChipTone = 'success' | 'progress' | 'error';

// Error chips use ink text on brickBg: brick text on brickBg is below 4.5:1 in light (D-010).
const TONES: Record<ChipTone, { bg: ColorName; text: ColorName; dot: ColorName }> = {
  success: { bg: 'successBg', text: 'successInk', dot: 'successInk' },
  progress: { bg: 'amberBg', text: 'amberInk', dot: 'amber' },
  error: { bg: 'brickBg', text: 'ink', dot: 'brick' },
};

export function Chip({ label, tone = 'success' }: { label: string; tone?: ChipTone }) {
  const { colors } = useSaafTheme();
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: colors[t.bg] }]}>
      <View style={[styles.dot, { backgroundColor: colors[t.dot] }]} />
      <AppText variant="label" color={t.text} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: fontSize.xs, lineHeight: 18 },
});
