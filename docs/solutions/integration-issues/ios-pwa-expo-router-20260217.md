---
module: Web
date: 2026-02-17
problem_type: integration_issue
component: pwa_ios
symptoms:
  - "Links open in embedded browser instead of in-app in iOS PWA"
  - "Bottom safe area gap in iOS PWA standalone mode"
  - "Status bar is white instead of matching app theme color"
  - "app/+html.tsx template not being used by Expo"
root_cause: multiple_issues
resolution_type: configuration_and_workaround
severity: high
tags: [pwa, ios, expo-router, viewport-fit, safe-area, standalone, html-template, black-translucent]
---

# iOS PWA Support with Expo Router

## Problem

Three separate issues when running the Expo Router app as an iOS home-screen PWA:

1. **Links open in embedded browser** instead of navigating in-app
2. **Bottom safe area gap** — wasted space below the tab bar
3. **Status bar color** — white instead of matching the app's indigo header

## Environment

- Expo SDK 54, Expo Router v4
- React Native Web
- iOS 26 standalone PWA (saved to home screen)
- `app/+html.tsx` custom HTML template

## Root Causes

### Issue 1: Links opening in embedded browser

**Root cause:** `app/+html.tsx` was completely ignored by Expo.

Expo only uses the custom `+html.tsx` template when `web.output` is set to `"static"` in `app.json`. Without it, both the dev server and `npx expo export` use a default HTML shell that lacks all PWA meta tags (`apple-mobile-web-app-capable`, manifest link, etc.). Without these meta tags, iOS doesn't know the app is a PWA and opens links in Safari.

**Fix:** Add `"output": "static"` to `app.json`:

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

### Issue 2: Bottom safe area gap

**Root cause:** `viewport-fit=cover` in the viewport meta tag.

When `viewport-fit=cover` is set, `env(safe-area-inset-bottom)` becomes non-zero (typically ~34px for the home indicator). React Native Web's `react-native-safe-area-context` library reads these CSS environment variables and provides them to React Navigation, which automatically adds `insets.bottom` as padding to the bottom tab bar. This creates a visible gap at the bottom of the app.

**What did NOT work:**
- CSS height overrides (`100svh`, `100dvh`, `min-height`, `position: fixed; inset: 0`) — none could make the body/html fill the bottom safe area in standalone mode
- `@media (display-mode: standalone)` scoped overrides — appeared to have no effect
- `safeAreaInsets={{ bottom: 0 }}` on the Tabs component — the gap persisted, suggesting the insets are consumed elsewhere in the React Navigation/React Native Web stack
- Setting `html` or `body` background to match the tab bar — cosmetically hid the gap but didn't fix the wasted space

**Fix:** Remove `viewport-fit=cover` from the viewport meta tag. This makes `env(safe-area-inset-bottom)` return 0, eliminating the gap. iOS handles the bottom safe area (home indicator region) natively.

```html
<!-- Before (causes bottom gap): -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

<!-- After (no gap): -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

**Tradeoff:** Without `viewport-fit=cover`, the app cannot render content behind the status bar or home indicator. This means `apple-mobile-web-app-status-bar-style: black-translucent` alone won't make the indigo header show through the status bar — the status bar area is outside the viewport.

### Issue 3: Status bar color

**Root cause:** Without `viewport-fit=cover`, `black-translucent` has no visible effect — the status bar is opaque and shows its default color (white in light mode).

**Fix:** Set `body { background-color }` to the desired status bar color. With `black-translucent`, the status bar is transparent and shows whatever is behind the page content — which is the body background. Since the viewport doesn't extend into the status bar area (no `viewport-fit=cover`), the body background fills that space.

```tsx
// In +html.tsx
import { lightColors } from '../lib/theme/colors';

<style dangerouslySetInnerHTML={{
  __html: `body{background-color:${lightColors.primaryHeader}}`
}} />
```

## Key Learnings

### 1. Expo ignores `+html.tsx` without `output: "static"`

This is the most critical finding. Without `"output": "static"` in `app.json`, the custom HTML template is completely unused. The dev server and static export both fall back to Expo's default HTML shell. **Always verify the exported HTML contains your meta tags** by inspecting `dist/index.html` after `npx expo export`.

### 2. `viewport-fit=cover` is incompatible with React Native Web's safe area handling

The React Router (non-React-Native) version of this app uses `viewport-fit=cover` successfully because it manually controls safe area padding with `env(safe-area-inset-bottom)` in CSS. React Native Web's approach is fundamentally different: `react-native-safe-area-context` reads the CSS environment variables and injects them as numeric values into React Navigation's layout system. This creates padding that **cannot be overridden by CSS** since it's applied as inline React Native styles deep in the component tree.

Even `safeAreaInsets={{ bottom: 0 }}` on the Tabs navigator didn't work, suggesting the insets are consumed by multiple components in the React Navigation stack.

### 3. The body background trick for status bar color

With `black-translucent` and WITHOUT `viewport-fit=cover`, the status bar is transparent but the viewport doesn't extend behind it. The body background color fills the area behind the transparent status bar. This gives us a colored status bar without the safe area layout complications.

### 4. `ScrollViewStyleReset` sets `height: 100%` on html/body/#root

Expo Router's `ScrollViewStyleReset` component injects: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`. Custom height overrides (100svh, 100dvh) should be added with care — `100svh` actually made the layout worse by being shorter than `100%` in some contexts.

### 5. React Native Web renders `<a>` tags for tab bar items

Tab bar items with `href` render as `<a>` tags. React Native Web's `PressResponder` calls `stopPropagation()` on click events, preventing bubble-phase listeners from firing. `PlatformPressable` calls `preventDefault()` on the event. Despite this, links work correctly in the PWA because `preventDefault()` prevents the browser's default navigation — the key issue was missing PWA meta tags, not link handling.

## Final Configuration

### `app.json`
```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

### `app/+html.tsx`
Key elements:
- **No `viewport-fit=cover`** in viewport meta tag
- `apple-mobile-web-app-capable: yes` — enables standalone PWA mode
- `apple-mobile-web-app-status-bar-style: black-translucent` — transparent status bar
- `body background-color` set to header color — colors the status bar
- `link rel="manifest"` pointing to web manifest
- `link rel="apple-touch-icon"` for home screen icon

### `public/manifest.webmanifest`
- `display: "standalone"` — PWA runs without browser chrome
- `scope: "/"` — all routes stay in-app

## Prevention

- When modifying `+html.tsx`, always rebuild (`npx expo export`) and verify `dist/index.html` contains the expected tags
- Do NOT add `viewport-fit=cover` to the viewport meta tag — it breaks the bottom layout due to React Native Web's safe area handling
- If the status bar color needs to change, update the body background in `+html.tsx` (referencing `lightColors.primaryHeader` from the theme)
- Test PWA behavior by saving to the iOS home screen — the dev server and browser mode may not exhibit the same issues

## Related Issues

- React Native Web safe area handling: https://github.com/th3rdwave/react-native-safe-area-context
- Expo Router static export: https://docs.expo.dev/router/reference/static-rendering/
