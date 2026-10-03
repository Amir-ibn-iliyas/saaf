import { Redirect, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';

import { canShare, saveMedia, shareMedia } from '@/features/image/save';
import type { PickedFile } from '@/features/pick/classify';
import { useSession } from '@/features/session/session';
import { messageFor } from '@/features/video/errors';
import { useCleanVideo } from '@/features/video/use-clean-video';
import {
  AppText,
  BackLink,
  Button,
  Chip,
  copy,
  layout,
  ProgressBar,
  radius,
  Screen,
  space,
  fitMedia,
  useResponsive,
  useSaafTheme,
  useToast,
} from '@/ui';

const noopSubscribe = () => () => {};
const isWeb = Platform.OS === 'web';

export default function VideoScreen() {
  const { video } = useSession();
  // Opened directly or after a reload: nothing picked (the session lives in memory).
  if (!video) return <Redirect href="/" />;
  return <VideoFlow key={video.uri} video={video} />;
}

/** Video: upload with progress → server cleans → preview, save / download, share. */
function VideoFlow({ video }: { video: PickedFile }) {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useSaafTheme();
  const { mediaMaxHeight } = useResponsive();
  const [available, setAvailable] = useState(0);
  const { state, cancel } = useCleanVideo(video);
  const [saving, setSaving] = useState(false);
  const shareable = useSyncExternalStore(
    noopSubscribe,
    () => canShare('video/mp4'),
    () => false
  );

  const done = state.stage === 'done' ? state.result : null;
  const item = done ? { uri: done.uri, name: done.name, mimeType: 'video/mp4' } : null;
  const player = useVideoPlayer(done?.uri ?? video.uri, (p) => {
    p.loop = false;
  });

  const save = async () => {
    if (!item) return;
    setSaving(true);
    const result = await saveMedia(item);
    setSaving(false);
    if (result === 'permission_denied') toast(copy.err.permission, 'error');
    else if (result === 'failed') toast(copy.err.save_video_failed, 'error');
    else if (!isWeb) toast(copy.toast.saved);
  };

  const share = async () => {
    if (item && !(await shareMedia(item))) toast(copy.err.share_video_failed, 'error');
  };

  const again = (
    <Pressable
      role="button"
      aria-label={copy.result.again}
      onPress={() => router.dismissTo('/')}
      style={styles.textButton}>
      <AppText variant="label" color="neem">
        {copy.result.again}
      </AppText>
    </Pressable>
  );

  const errorText = state.stage === 'error' ? messageFor(state.code) : '';
  // role="alert" is not announced by Android TalkBack on its own.
  useEffect(() => {
    if (errorText && Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(errorText);
  }, [errorText]);

  const working = state.stage === 'uploading' || state.stage === 'cleaning';
  const footer = working ? (
    <Button label={copy.video.cancel} variant="ghost" onPress={cancel} />
  ) : done ? (
    <>
      <Button label={isWeb ? copy.result.download : copy.result.save} busy={saving} onPress={save} />
      {shareable && <Button label={copy.result.share} variant="ghost" onPress={share} />}
      {again}
    </>
  ) : (
    again
  );

  const details = [video.name, video.durationMs ? copy.video.seconds(video.durationMs / 1000) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <Screen splitOnWide footer={footer}>
      <View style={styles.top}>
        <BackLink />
        {done && <Chip label={copy.result.chip} tone="success" />}
      </View>
      <AppText variant="small" color="muted" numberOfLines={1}>
        {details}
      </AppText>

      <View style={styles.measure} onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}>
      <VideoView
        player={player}
        style={[styles.frame, fitMedia(16 / 9, available, mediaMaxHeight), { backgroundColor: colors.wash }]}
        nativeControls={!!done}
        contentFit="contain"
        accessibilityLabel={done ? done.name : video.name}
      />
      </View>

      {working && (
        <View style={styles.progress} aria-live="polite">
          <AppText variant="title">{copy.state.cleaningVideo}</AppText>
          <ProgressBar
            label={copy.video.uploading}
            value={state.stage === 'uploading' ? state.progress : 1}
            status={
              state.stage === 'uploading' ? `${Math.round(state.progress * 100)}%` : copy.video.done
            }
          />
          <ProgressBar
            label={copy.video.cleaning}
            value={state.stage === 'cleaning' ? null : 0}
            tone="amber"
          />
          <AppText variant="small" color="muted">
            {copy.video.keepOpen}
          </AppText>
        </View>
      )}

      {errorText !== '' && (
        <View
          role="alert"
          style={[styles.notice, { backgroundColor: colors.brickBg, borderColor: colors.brick }]}>
          <AppText>{errorText}</AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  measure: { width: '100%', alignItems: 'center' },
  frame: { borderRadius: radius.frame, overflow: 'hidden' },
  progress: { gap: space.lg },
  notice: { borderWidth: 1, borderRadius: radius.button, padding: space.lg },
  textButton: { minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center' },
});
