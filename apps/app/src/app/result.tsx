import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { CleanedImage, ImageOutcome } from '@/features/image/clean-image';
import { canShare, saveImage, shareImage, type SaveResult } from '@/features/image/save';
import { useCleanImages } from '@/features/image/use-clean-images';
import { useSession } from '@/features/session/session';
import {
  AppText,
  BackLink,
  Button,
  Chip,
  CompareSlider,
  copy,
  layout,
  radius,
  Screen,
  space,
  useSaafTheme,
  useToast,
} from '@/ui';

const noopSubscribe = () => () => {};
const isWeb = Platform.OS === 'web';

/** Image result: cleaning progress, compare slider, save / share, batch strip. */
export default function ResultScreen() {
  const router = useRouter();
  const toast = useToast();
  const { images } = useSession();
  const { outcomes, done, total, finished } = useCleanImages(images);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  // Web Share support is only known in the browser (not during static rendering).
  const shareable = useSyncExternalStore(noopSubscribe, canShare, () => false);

  // Opened directly or after a reload: nothing picked (the session lives in memory).
  if (total === 0) return <Redirect href="/" />;

  const index = Math.min(selected, total - 1);
  const current = outcomes[index] ?? null;
  const cleaned = outcomes.filter((o): o is CleanedImage => o?.status === 'cleaned');
  const batch = total > 1;

  const report = (results: SaveResult[], total: number) => {
    const saved = results.filter((r) => r === 'saved').length;
    if (results.includes('permission_denied')) toast(copy.err.permission, 'error');
    else if (saved < total) {
      toast(total > 1 ? copy.err.save_partial(saved, total) : copy.err.save_failed, 'error');
    } else if (!isWeb) toast(copy.toast.saved);
  };

  const share = async (item: CleanedImage) => {
    if (!(await shareImage(item))) toast(copy.err.share_failed, 'error');
  };

  const save = async (items: CleanedImage[]) => {
    setSaving(true);
    const results: SaveResult[] = [];
    for (const item of items) {
      const result = await saveImage(item);
      results.push(result);
      if (result === 'permission_denied') break;
    }
    setSaving(false);
    report(results, items.length);
  };

  const saveLabel = batch
    ? `${isWeb ? copy.result.downloadAll : copy.result.saveAll} (${cleaned.length})`
    : isWeb
      ? copy.result.download
      : copy.result.save;
  const saveTargets = batch ? cleaned : current?.status === 'cleaned' ? [current] : [];

  return (
    <Screen
      splitOnWide
      footer={
        <>
          {saveTargets.length > 0 && (
            <Button
              label={saveLabel}
              busy={saving}
              disabled={batch && !finished}
              onPress={() => save(saveTargets)}
            />
          )}
          {current?.status === 'cleaned' && shareable && (
            <Button label={copy.result.share} variant="ghost" onPress={() => share(current)} />
          )}
          <Pressable
            role="button"
            aria-label={copy.result.again}
            onPress={() => router.dismissTo('/')}
            style={styles.textButton}>
            <AppText variant="label" color="neem">
              {copy.result.again}
            </AppText>
          </Pressable>
        </>
      }>
      <View style={styles.top}>
        <BackLink />
        {!finished ? (
          <Chip
            label={batch ? `${copy.state.cleaning} ${done + 1}/${total}` : copy.state.cleaning}
            tone="progress"
          />
        ) : (
          current?.status === 'cleaned' && <Chip label={copy.result.chip} tone="success" />
        )}
      </View>

      <Outcome outcome={current} />

      {batch && <Strip outcomes={outcomes} total={total} selected={index} onSelect={setSelected} />}
    </Screen>
  );
}

function Outcome({ outcome }: { outcome: ImageOutcome | null }) {
  const { colors } = useSaafTheme();

  if (!outcome) {
    return (
      <View style={[styles.frame, styles.center, { backgroundColor: colors.wash }]}>
        <ActivityIndicator color={colors.neem} />
        <AppText color="muted">{copy.state.cleaning}</AppText>
      </View>
    );
  }
  if (outcome.status === 'no_watermark') return <Notice text={copy.err.no_watermark} />;
  if (outcome.status === 'failed') return <Notice text={copy.err.clean_failed} />;
  if (outcome.status === 'provenance_unsupported') {
    return <Notice text={copy.err.provenance_unsupported} />;
  }
  return (
    <CompareSlider
      key={outcome.uri}
      beforeUri={outcome.source.uri}
      afterUri={outcome.uri}
      aspectRatio={outcome.width / outcome.height}
    />
  );
}

function Notice({ text }: { text: string }) {
  const { colors } = useSaafTheme();
  return (
    <View
      role="alert"
      style={[styles.notice, { backgroundColor: colors.brickBg, borderColor: colors.brick }]}>
      <AppText>{text}</AppText>
    </View>
  );
}

type StripProps = {
  outcomes: (ImageOutcome | null)[];
  total: number;
  selected: number;
  onSelect: (index: number) => void;
};

/** Batch: one thumbnail per picked photo, with a tick once it is cleaned. */
function Strip({ outcomes, total, selected, onSelect }: StripProps) {
  const { colors } = useSaafTheme();
  const { images } = useSession();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}>
      {Array.from({ length: total }, (_, i) => {
        const outcome = outcomes[i];
        const uri = outcome?.status === 'cleaned' ? outcome.uri : images[i]?.uri;
        const done = outcome?.status === 'cleaned';
        const mark = !outcome ? '…' : done ? '✓' : '–';
        const status = !outcome
          ? copy.state.cleaning
          : done
            ? copy.result.chip
            : outcome.status === 'no_watermark'
              ? copy.err.no_watermark
              : copy.err.clean_failed;
        return (
          <Pressable
            key={images[i]?.uri ?? i}
            role="button"
            aria-label={`${images[i]?.name ?? ''}, ${i + 1} of ${total}. ${status}`}
            aria-selected={i === selected}
            onPress={() => onSelect(i)}
            style={[
              styles.thumb,
              {
                borderColor: i === selected ? colors.neem : colors.line,
                backgroundColor: colors.wash,
              },
            ]}>
            {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
            <View style={[styles.mark, { backgroundColor: done ? colors.neem : colors.surface }]}>
              <AppText variant="small" color={done ? 'onNeem' : 'ink'}>
                {mark}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const THUMB = 64;

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  frame: { width: '100%', borderRadius: radius.frame, overflow: 'hidden' },
  center: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  notice: { borderWidth: 1, borderRadius: radius.button, padding: space.lg },
  textButton: { minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center' },
  strip: { gap: space.sm, paddingVertical: space.xs },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.button - 4,
    borderWidth: 2,
    overflow: 'hidden',
  },
  mark: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
