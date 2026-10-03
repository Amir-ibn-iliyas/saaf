import * as Device from 'expo-device';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppText, BackLink, Button, radius, Screen, space, useSaafTheme } from '@/ui';

import { runSpike, type SpikeResult } from './run-spike';

const TARGET_MS = 1500;

function ms(value: number) {
  return `${Math.round(value)} ms`;
}

/** Dev-only Phase 0 spike screen (reached from the Home dev links). */
export default function SpikeView() {
  const { colors } = useSaafTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpikeResult | null>(null);

  const device = [Platform.OS, Device.manufacturer, Device.modelName].filter(Boolean).join(' · ');

  async function pickAndRun() {
    setError(null);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (picked.canceled) return;

      setBusy(true);
      setResult(null);
      setResult(await runSpike(picked.assets[0].uri));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const aspectRatio = result ? result.width / result.height : 1;

  return (
    <Screen footer={<Button label={busy ? 'Working…' : 'Pick image'} onPress={pickAndRun} busy={busy} />}>
      <BackLink />
      <AppText variant="title">Skia pixel spike</AppText>
      <AppText color="muted">
        Pick an image. Skia decodes it, inverts a 100 × 100 box in the bottom-right corner and
        encodes a PNG.
      </AppText>

      {busy && <ActivityIndicator color={colors.neem} />}
      {error && <AppText>Error: {error}</AppText>}

      {result && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <AppText variant="heading">
            {result.width} × {result.height} — total {ms(result.totalMs)}{' '}
            {result.totalMs < TARGET_MS ? '✅' : '❌'} (target {'<'} {ms(TARGET_MS)})
          </AppText>
          <AppText variant="small" color="muted">
            load + decode {ms(result.decodeMs)} · read pixels {ms(result.readMs)} · invert{' '}
            {ms(result.editMs)} · encode PNG {ms(result.encodeMs)}
          </AppText>
          <AppText variant="small" color="muted">
            Device: {device}
          </AppText>
          <Image
            source={{ uri: result.uri }}
            style={[styles.image, { aspectRatio }]}
            contentFit="contain"
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.frame, borderWidth: 1, gap: space.sm },
  image: { width: '100%' },
});
