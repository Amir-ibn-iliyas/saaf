import AsyncStorage from '@react-native-async-storage/async-storage';

import { bundledMasksConfig, loadTemplates, parseMasksBundle, type UsableMasks } from '@/core';
import { API_URL } from '@/features/video/api';

const CACHE_KEY = 'saaf.masks';
const FETCH_TIMEOUT_MS = 4000;

let current: UsableMasks | null = null;

/** The masks to use right now: remote/cached if valid, otherwise the ones shipped in the app. */
export function getMasks(): UsableMasks {
  current ??= { config: bundledMasksConfig, templates: loadTemplates() };
  return current;
}

/**
 * Called once at app start (task 5.2): use the cached remote masks, then try to fetch newer
 * ones from the server. Any failure keeps what we have. Never throws.
 */
export async function refreshMasks(): Promise<void> {
  try {
    const cached = parseMasksBundle(JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) ?? 'null'));
    if (cached) current = cached;
  } catch {
    // No storage or a broken cache entry: keep the bundled masks.
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/v1/masks`, { signal: controller.signal });
    if (!response.ok) return;
    const text = await response.text();
    const remote = parseMasksBundle(JSON.parse(text));
    if (!remote) return;
    current = remote;
    await AsyncStorage.setItem(CACHE_KEY, text);
  } catch {
    // Offline or no server (images still work fully on the device).
  } finally {
    clearTimeout(timer);
  }
}
