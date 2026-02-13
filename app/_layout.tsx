import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StyleSheet } from 'react-native';

export default function RootLayout() {
  // On web, restore the original URL after a GitHub Pages 404 redirect.
  // The custom 404.html saves the intended path to sessionStorage before
  // redirecting to the root index.html so the SPA can load.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const redirect = sessionStorage.getItem('__video_clerk_redirect__');
      if (redirect) {
        sessionStorage.removeItem('__video_clerk_redirect__');
        router.replace(redirect);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
