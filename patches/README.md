# Patches

Applied automatically by [patch-package](https://github.com/ds300/patch-package) after `npm install`.

## expo-dev-menu+7.0.18.patch

Sets `isOnboardingFinishedKey` to `true` by default in the iOS dev menu preferences. Without this patch, the Expo dev menu onboarding modal appears on every fresh install in the iOS simulator, which blocks automated testing and is disruptive during development.

This patch can be removed if a future version of `expo-dev-menu` defaults onboarding to finished or provides a configuration option to skip it.
