import { View } from 'react-native';

import { AppText, Button, Chip, Screen, space, ThemeSwitch, useSaafTheme, useToast } from '@/ui';

/** Task 2.1 sample screen: every base component, in the current theme. */
export default function UiKitScreen() {
  const { scheme, preference } = useSaafTheme();
  const toast = useToast();

  return (
    <Screen
      footer={
        <>
          <Button label="Save to gallery" onPress={() => toast('Saved to gallery')} />
          <Button
            label="Share"
            variant="ghost"
            onPress={() =>
              toast('Allow photo access in Settings to save files to your gallery.', 'error')
            }
          />
        </>
      }>
      <AppText variant="wordmark">saaf</AppText>
      <AppText variant="title">Clean your AI photos and videos</AppText>
      <AppText color="muted">
        Photos are cleaned on your device. Videos are processed on our server and deleted right
        after.
      </AppText>

      <AppText variant="heading">Theme</AppText>
      <ThemeSwitch />
      <AppText variant="small" color="muted">
        Preference: {preference} · showing {scheme}
      </AppText>

      <AppText variant="heading">Chips</AppText>
      <View style={{ gap: space.sm }}>
        <Chip label="Watermark removed" tone="success" />
        <Chip label="Cleaning…" tone="progress" />
        <Chip label="No Gemini watermark found" tone="error" />
      </View>

      <AppText variant="heading">Buttons</AppText>
      <Button label="Busy" variant="ghost" busy />
      <Button label="Disabled" variant="ghost" disabled />
    </Screen>
  );
}
