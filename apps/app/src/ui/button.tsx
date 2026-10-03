import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from './text';
import { layout, radius, space } from './theme';
import { useSaafTheme } from './theme-context';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** Only one primary button per screen. */
  variant?: 'primary' | 'ghost';
  busy?: boolean;
};

export function Button({ label, variant = 'primary', busy = false, disabled, ...rest }: ButtonProps) {
  const { colors } = useSaafTheme();
  const primary = variant === 'primary';
  const inactive = !!disabled || busy;

  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-busy={busy}
      aria-disabled={inactive}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: colors.neem }
          : { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
        (pressed || inactive) && styles.dim,
      ]}
      {...rest}>
      {busy ? (
        <ActivityIndicator color={primary ? colors.onNeem : colors.ink} />
      ) : (
        <AppText variant="label" color={primary ? 'onNeem' : 'ink'}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch + space.xs,
    paddingHorizontal: space.xl,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  dim: { opacity: 0.6 },
});
