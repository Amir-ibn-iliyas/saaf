import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useFileDrop } from '@/features/pick/use-file-drop';
import { usePick } from '@/features/pick/use-pick';
import { AppText, Button, copy, layout, radius, Screen, space, useResponsive, useSaafTheme } from '@/ui';

export default function HomeScreen() {
  const { colors } = useSaafTheme();
  const { titleSize, pickHeight } = useResponsive();
  const { pick, handleFiles, picking } = usePick();
  const { ref: dropRef, dragging, supported: dropSupported } = useFileDrop(handleFiles, picking);

  return (
    <Screen footer={<Button label={copy.home.button} onPress={pick} busy={picking} />}>
      <View style={styles.header}>
        <AppText variant="wordmark" role="heading">
          saaf
        </AppText>
        <Link href="/about" asChild>
          <Pressable role="link" hitSlop={space.md} style={styles.headerLink}>
            <AppText variant="label" color="neem">
              {copy.home.about}
            </AppText>
          </Pressable>
        </Link>
      </View>

      <AppText variant="title" style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.22) }}>
        {copy.home.title}
      </AppText>

      <Pressable
        ref={dropRef}
        onPress={pick}
        disabled={picking}
        role="button"
        aria-label={copy.home.pick}
        style={({ pressed }) => [
          styles.pickArea,
          { minHeight: pickHeight },
          {
            backgroundColor: dragging ? colors.successBg : colors.wash,
            borderColor: colors.neem,
          },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'photo', android: 'image', web: 'image' }}
          tintColor={colors.neem}
          size={40}
        />
        <AppText variant="heading">{copy.home.pick}</AppText>
        <AppText variant="small" color="muted">
          {copy.home.formats}
        </AppText>
        {dropSupported && (
          <AppText variant="small" color="muted">
            {copy.home.drop}
          </AppText>
        )}
      </Pressable>

      <AppText variant="small" color="muted">
        {copy.home.privacy}
      </AppText>

      {__DEV__ && (
        <View style={styles.devLinks}>
          <Link href="/ui-kit">
            <AppText variant="small" color="muted">
              Dev: UI kit
            </AppText>
          </Link>
          <Link href="/spike">
            <AppText variant="small" color="muted">
              Dev: Skia spike
            </AppText>
          </Link>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLink: {
    minHeight: layout.minTouch,
    minWidth: layout.minTouch,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pickArea: {
    borderRadius: radius.frame,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xl,
    ...Platform.select({ web: { cursor: 'pointer' as const } }),
  },
  pressed: { opacity: 0.7 },
  devLinks: { flexDirection: 'row', gap: space.lg },
});
