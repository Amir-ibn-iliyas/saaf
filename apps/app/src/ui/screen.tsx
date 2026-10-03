import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from './responsive';
import { layout, space } from './theme';
import { useSaafTheme } from './theme-context';

type ScreenProps = {
  children: ReactNode;
  /** Pinned to the bottom (thumb zone), e.g. the primary button. */
  footer?: ReactNode;
  /**
   * Result / video screens: on desktop-sized windows show the content on the left and the
   * footer actions in a column on the right, instead of one long column.
   */
  splitOnWide?: boolean;
};

/**
 * Paper background, safe areas and a centred content column whose width and side padding
 * follow the size class (compact phone → desktop), see `useResponsive`.
 */
export function Screen({ children, footer, splitOnWide = false }: ScreenProps) {
  const { colors } = useSaafTheme();
  const insets = useSafeAreaInsets();
  const { gutter, columnWidth, splitWidth, split } = useResponsive();
  const splitHere = split && splitOnWide && !!footer;
  const column = { maxWidth: splitHere ? splitWidth : columnWidth, paddingHorizontal: gutter };
  const top = insets.top + (gutter > space.xl ? space.xxl : space.xl);

  if (splitHere) {
    return (
      <View style={[styles.root, { backgroundColor: colors.paper }]}>
        <ScrollView contentContainerStyle={[styles.column, column, styles.row, { paddingTop: top }]}>
          <View style={styles.main}>{children}</View>
          <View style={styles.side}>{footer}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <ScrollView
        contentContainerStyle={[styles.column, column, { paddingTop: top, paddingBottom: space.xl }]}>
        {children}
      </ScrollView>
      {footer && (
        <View style={[styles.column, column, styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  column: { width: '100%', alignSelf: 'center', gap: space.lg },
  footer: { paddingTop: space.md, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xxl, paddingBottom: space.xxl },
  main: { flex: 3, gap: space.lg, minWidth: 0 },
  // Actions start level with the media (below the 44 px back-link row).
  side: { flex: 2, gap: space.sm, paddingTop: layout.minTouch + space.lg },
});
