import { useEffect, useState } from 'react';

import { AppText } from '@/ui';

import { API_URL, checkHealth, type Health } from './api';

/** Dev-only line on About: can the app reach the video server? (task 3.4) */
export function ServerStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((h) => {
      if (!cancelled) setHealth(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const status = !health
    ? 'checking…'
    : health.ok
      ? `connected (v${health.version ?? '?'})`
      : 'not reachable — is the server running? Check EXPO_PUBLIC_API_URL.';
  return (
    <AppText variant="small" color="muted">
      Dev · video server {API_URL}: {status}
    </AppText>
  );
}
