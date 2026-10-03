import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './text';
import { layout, radius, space } from './theme';
import { useSaafTheme } from './theme-context';

type ToastTone = 'info' | 'error';
type ToastState = { id: number; message: string; tone: ToastTone } | null;

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

const VISIBLE_MS = { info: 3000, error: 6000 } as const;

/**
 * Space kept free at the bottom for the tallest screen footer (Result: two 48 px buttons and
 * a 44 px text button, plus gaps and padding), so a toast never covers them.
 */
const FOOTER_CLEARANCE =
  (layout.minTouch + space.xs) * 2 + layout.minTouch + space.sm * 2 + space.md + space.lg + space.sm;

/** Small message above the footer. No animation, so reduced motion is respected. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
    // aria-live covers web and Android; iOS VoiceOver needs an explicit announcement.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <ToastView key={toast.id} message={toast.message} tone={toast.tone} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastView({ message, tone }: { message: string; tone: ToastTone }) {
  const { colors } = useSaafTheme();
  const insets = useSafeAreaInsets();
  const error = tone === 'error';

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + FOOTER_CLEARANCE }]}>
      <View
        role="alert"
        aria-live={error ? 'assertive' : 'polite'}
        style={[
          styles.toast,
          error
            ? { backgroundColor: colors.brickBg, borderColor: colors.brick }
            : { backgroundColor: colors.ink, borderColor: colors.ink },
        ]}>
        <AppText variant="label" color={error ? 'ink' : 'paper'}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  toast: {
    maxWidth: layout.maxContentWidth,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.button,
    borderWidth: 1,
  },
});
