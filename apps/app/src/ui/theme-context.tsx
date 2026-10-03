import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palette, resolveScheme, type Colors, type Scheme, type ThemePreference } from './theme';

export type { ThemePreference } from './theme';

export const THEME_STORAGE_KEY = 'saaf.themePreference';

type ThemeValue = {
  scheme: Scheme;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** False until the saved preference has been read (avoids a light/dark flash). */
  ready: boolean;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function SaafThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (!cancelled && isPreference(saved)) setPreferenceState(saved);
      })
      .catch(() => {
        // No storage (private browsing, server render): keep following the system.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = resolveScheme(preference, system);
    return { scheme, colors: palette[scheme], preference, setPreference, ready };
  }, [preference, system, setPreference, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSaafTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useSaafTheme must be used inside <SaafThemeProvider>');
  return value;
}
