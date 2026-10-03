import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { refreshMasks } from '@/features/masks/mask-store';
import { SaafThemeProvider, ToastProvider, useSaafTheme } from '@/ui';
import { fontAssets } from '@/ui/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Remote masks (5.2): cached ones first, then the server; the bundled masks otherwise.
  useEffect(() => {
    refreshMasks();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SaafThemeProvider>
        <ThemedRoot fontsReady={fontsLoaded || !!fontError} />
      </SaafThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot({ fontsReady }: { fontsReady: boolean }) {
  const { scheme, colors, ready } = useSaafTheme();
  const show = fontsReady && ready;

  useEffect(() => {
    if (show) SplashScreen.hideAsync();
  }, [show]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.neem,
        background: colors.paper,
        card: colors.surface,
        text: colors.ink,
        border: colors.line,
      },
    };
  }, [scheme, colors]);

  // Keep the native splash until fonts and the saved theme are ready (no flash of the
  // wrong theme).
  if (!show) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <ToastProvider>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
        />
      </ToastProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
