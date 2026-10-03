import { Platform } from 'react-native';

/**
 * Video server address. Set EXPO_PUBLIC_API_URL in apps/app/.env (see .env.example).
 * Fallback: localhost on web, the emulator's alias for the computer on Android.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000')
).replace(/\/+$/, '');

export type Health = { ok: boolean; version?: string };

/** GET /health with a short timeout. Never throws. */
export async function checkHealth(timeoutMs = 4000): Promise<Health> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
    if (!response.ok) return { ok: false };
    const body = (await response.json()) as Health;
    return { ok: body.ok === true, version: body.version };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
