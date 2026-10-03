import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { copy } from './copy';
import { fitMedia, useResponsive } from './responsive';
import { AppText } from './text';
import { radius, space } from './theme';
import { useSaafTheme } from './theme-context';
import { useArrowKeys } from './use-arrow-keys';

type CompareSliderProps = {
  beforeUri: string;
  afterUri: string;
  /** width / height of the image. */
  aspectRatio: number;
};

const STEP = 0.05;
/** Below this frame width the After/Before tags would cover the handle. */
const TAGS_INSIDE_MIN_WIDTH = 220;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The "wiper": after (cleaned) on the left, before (original) on the right, a draggable
 * handle in between. Drag runs on the UI thread (Reanimated) so it stays smooth on Android.
 * Web: arrow keys move it. No wipe animation, so reduced motion needs no special case.
 */
export function CompareSlider({ beforeUri, afterUri, aspectRatio }: CompareSliderProps) {
  const { colors } = useSaafTheme();
  const { mediaMaxHeight } = useResponsive();
  const [available, setAvailable] = useState(0);
  const [percent, setPercent] = useState(50);
  const position = useSharedValue(0.5);
  const frameRef = useRef<View>(null);

  // Full width for landscape images; tall images are limited in height (and centred) so the
  // actions below stay on screen.
  const onLayout = (e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width);
  const box = fitMedia(aspectRatio, available, mediaMaxHeight);
  const width = box.width;

  const setTo = useCallback(
    (next: number) => {
      const value = clamp(next);
      position.set(value);
      setPercent(Math.round(value * 100));
    },
    [position]
  );
  const step = useCallback((dir: 1 | -1) => setTo(position.get() + dir * STEP), [position, setTo]);
  useArrowKeys(frameRef, step);

  // Only a sideways drag moves the handle; a vertical swipe on the image still scrolls the page.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (width > 0) position.set(clamp(e.x / width));
    })
    .onEnd(() => {
      scheduleOnRN(setPercent, Math.round(position.get() * 100));
    });
  // A tap jumps the handle to the finger.
  const tap = Gesture.Tap().onEnd((e) => {
    if (width <= 0) return;
    position.set(clamp(e.x / width));
    scheduleOnRN(setPercent, Math.round(position.get() * 100));
  });
  const gesture = Gesture.Race(pan, tap);

  const afterClip = useAnimatedStyle(() => ({ width: position.get() * width }));
  const handle = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() * width }] }));

  return (
    <View onLayout={onLayout} style={styles.measure}>
    <GestureDetector gesture={gesture}>
      <View
        ref={frameRef}
        role="slider"
        aria-label={copy.slider.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={copy.slider.value(percent)}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        tabIndex={0}
        style={[styles.frame, { width: box.width, height: box.height, backgroundColor: colors.wash }]}>
        <Image source={{ uri: beforeUri }} style={StyleSheet.absoluteFill} contentFit="cover" />

        <Animated.View style={[styles.afterClip, afterClip]}>
          <Image source={{ uri: afterUri }} style={[styles.afterImage, { width }]} contentFit="cover" />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.handleTrack, handle]}>
          <View style={[styles.line, { backgroundColor: colors.surface }]} />
          <View style={[styles.grip, { backgroundColor: colors.neem }]}>
            <View style={[styles.gripBar, { backgroundColor: colors.onNeem }]} />
            <View style={[styles.gripBar, { backgroundColor: colors.onNeem }]} />
          </View>
        </Animated.View>

        {width >= TAGS_INSIDE_MIN_WIDTH && (
          <>
            <Tag label={copy.slider.after} style={styles.tagLeft} />
            <Tag label={copy.slider.before} style={styles.tagRight} />
          </>
        )}
      </View>
    </GestureDetector>
    {width > 0 && width < TAGS_INSIDE_MIN_WIDTH && (
      <View style={[styles.tagsBelow, { width }]}>
        <AppText variant="small" color="muted">
          ← {copy.slider.after}
        </AppText>
        <AppText variant="small" color="muted">
          {copy.slider.before} →
        </AppText>
      </View>
    )}
    </View>
  );
}

function Tag({ label, style }: { label: string; style: object }) {
  const { colors } = useSaafTheme();
  return (
    <View pointerEvents="none" style={[styles.tag, { backgroundColor: colors.ink }, style]}>
      <AppText variant="small" color="paper">
        {label}
      </AppText>
    </View>
  );
}

const GRIP_W = 28;

const styles = StyleSheet.create({
  measure: { width: '100%', alignItems: 'center', gap: space.xs },
  tagsBelow: { flexDirection: 'row', justifyContent: 'space-between' },
  frame: {
    borderRadius: radius.frame,
    overflow: 'hidden',
    // RN types only know auto/pointer; the web supports the left-right resize cursor.
    ...Platform.select({ web: { cursor: 'ew-resize' as ViewStyle['cursor'] } }),
  },
  afterClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  afterImage: { height: '100%' },
  handleTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -GRIP_W / 2,
    width: GRIP_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  grip: {
    width: GRIP_W,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gripBar: { width: 2, height: 22, borderRadius: 1 },
  tag: {
    position: 'absolute',
    top: space.md,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.chip,
  },
  tagLeft: { left: space.md },
  tagRight: { right: space.md },
});
