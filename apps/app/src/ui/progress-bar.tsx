import { StyleSheet, View } from 'react-native';

import { AppText } from './text';
import { radius, space } from './theme';
import { useSaafTheme } from './theme-context';

type ProgressBarProps = {
  label: string;
  /** 0..1, or null while the length of the step is unknown. */
  value: number | null;
  /** Text on the right: "62%", "Done", or nothing. */
  status?: string;
  tone?: 'neem' | 'amber';
};

/** One labelled step of the video progress (mockup: Uploading / Cleaning). */
export function ProgressBar({ label, value, status, tone = 'neem' }: ProgressBarProps) {
  const { colors } = useSaafTheme();
  const fill = tone === 'neem' ? colors.neem : colors.amber;
  const percent = value == null ? undefined : Math.round(value * 100);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText variant="label">{label}</AppText>
        {status ? (
          <AppText variant="label" color="muted">
            {status}
          </AppText>
        ) : null}
      </View>
      <View
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-busy={value == null}
        aria-valuetext={status ?? (value == null ? 'In progress' : `${percent}%`)}
        style={[styles.track, { backgroundColor: colors.line }]}>
        {/* Unknown length: a third of the bar, no animation (reduced motion friendly). */}
        <View style={[styles.fill, { backgroundColor: fill, width: `${percent ?? 33}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: radius.chip, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.chip },
});
