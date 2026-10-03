import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useSyncExternalStore } from 'react';

import { AppText, Screen } from '@/ui';

const noopSubscribe = () => () => {};

function Loading() {
  return (
    <Screen>
      <AppText color="muted">Loading Skia…</AppText>
    </Screen>
  );
}

// Web: CanvasKit (public/canvaskit.wasm) must load before any module that touches `Skia`,
// so the spike view is imported lazily. Skip it during static rendering on the server.
export default function SpikeScreen() {
  const inBrowser = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  if (!inBrowser) return <Loading />;

  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={() => import('./spike-view')}
      fallback={<Loading />}
    />
  );
}
