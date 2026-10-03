import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './text';
import { layout, radius, space, type ThemePreference } from './theme';
import { useSaafTheme } from './theme-context';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** About screen theme switch (as in the mockup). Applies instantly and is saved on device. */
export function ThemeSwitch() {
  const { colors, preference, setPreference } = useSaafTheme();

  return (
    <View
      role="radiogroup"
      aria-label="Theme"
      style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {OPTIONS.map((o) => {
        const selected = o.value === preference;
        return (
          <Pressable
            key={o.value}
            role="radio"
            aria-label={o.label}
            aria-checked={selected}
            onPress={() => setPreference(o.value)}
            style={[styles.option, selected && { backgroundColor: colors.neem }]}>
            <AppText variant="label" color={selected ? 'onNeem' : 'ink'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: space.xs,
    gap: space.xs,
  },
  option: {
    minHeight: layout.minTouch,
    minWidth: 72,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
});
