import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './text';
import { layout, space } from './theme';

/** "Back" text link at the top of inner screens. Goes Home when there is no history (web reload). */
export function BackLink() {
  const router = useRouter();
  return (
    <Pressable
      role="link"
      aria-label="Back"
      hitSlop={space.md}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={styles.link}>
      <AppText variant="label" color="neem">
        Back
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: layout.minTouch,
    minWidth: layout.minTouch,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
