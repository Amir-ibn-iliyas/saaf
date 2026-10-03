import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { ServerStatus } from '@/features/video/server-status';
import { AppText, BackLink, copy, radius, Screen, space, ThemeSwitch, useSaafTheme } from '@/ui';

export default function AboutScreen() {
  const { colors } = useSaafTheme();
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen>
      <BackLink />

      <View style={styles.section}>
        <AppText variant="heading" role="heading">
          What Saaf does
        </AppText>
        <AppText color="muted">
          Removes the visible sparkle logo from Gemini images and Veo videos.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading" role="heading">
          Your files
        </AppText>
        <AppText color="muted">
          Photos never leave your device. Videos are uploaded, cleaned and deleted right after.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading" role="heading">
          {copy.about.theme}
        </AppText>
        <ThemeSwitch />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <AppText>{copy.about.synthid}</AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading" role="heading">
          Credits
        </AppText>
        <AppText color="muted">
          Built on open-source reverse alpha blending research (gemini-watermark-remover by
          GargantuaX and GeminiWatermarkTool by AllenK, MIT). Fonts: Unbounded and Onest (SIL
          Open Font License).
        </AppText>
      </View>

      <AppText variant="small" color="muted" style={styles.version}>
        Version {version}
      </AppText>
      {__DEV__ && <ServerStatus />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  card: { borderWidth: 1, borderRadius: radius.button, padding: space.lg },
  version: { textAlign: 'center', marginTop: space.lg },
});
