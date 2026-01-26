# Phase 1: Project Setup & Infrastructure

**Status**: Planned
**Estimated Effort**: 1-2 days
**Prerequisites**: None (this is the first phase)

## Context

This phase establishes the foundation for the React Native conversion. We'll initialize an Expo project with TypeScript, configure the Metro bundler, set up NativeWind for styling, and migrate environment variables.

**Key Decision**: We're using Expo with Expo Router because it provides:
- File-system based routing (similar to current React Router 7)
- Built-in web support for GitHub Pages deployment
- Managed native dependencies
- EAS Build for iOS compilation

## Files to Create

| File | Purpose |
|------|---------|
| `app.json` | Expo configuration |
| `metro.config.js` | Metro bundler with NativeWind |
| `tailwind.config.js` | NativeWind styling config |
| `global.css` | Global styles entry point |
| `babel.config.js` | Babel configuration |
| `app/_layout.tsx` | Root layout |
| `src/lib/supabase/client.ts` | Updated Supabase client |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Replace dependencies |
| `tsconfig.json` | Update for Expo/RN |
| `.gitignore` | Add Expo-specific ignores |
| `.env` | Rename variables to EXPO_PUBLIC_* |

## Files to Remove

| File | Reason |
|------|--------|
| `vite.config.ts` | Replaced by Metro |
| `react-router.config.ts` | Replaced by Expo Router |
| `vitest.setup.ts` | Will be replaced in Phase 8 |
| `app/routes.ts` | Expo Router auto-generates |

## Step-by-Step Instructions

### Step 1: Update package.json

Replace the entire `package.json` with the new dependencies:

```json
{
  "name": "video-clerk-ui",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "dev:web": "expo start --web",
    "dev:ios": "expo start --ios",
    "build:web": "expo export --platform web",
    "build:ios": "eas build --platform ios",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.1.0",
    "@supabase/supabase-js": "^2.49.0",
    "clsx": "^2.1.1",
    "expo": "~52.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-web-browser": "~14.0.0",
    "lucide-react-native": "^0.475.0",
    "nativewind": "^4.1.23",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.6",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "^15.8.0",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-web": "~0.19.13",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@testing-library/react-native": "^12.9.0",
    "@types/react": "~18.3.0",
    "eslint": "^9.18.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.0"
  },
  "private": true
}
```

**Important Notes**:
- `"main": "expo-router/entry"` is required for Expo Router
- React version pinned to 18.3.1 (Expo 52 requirement)
- NativeWind 4 requires Tailwind CSS 3.x (not 4.x)

### Step 2: Create app.json

Create `app.json` in the project root:

```json
{
  "expo": {
    "name": "Video Clerk",
    "slug": "video-clerk",
    "version": "1.0.0",
    "scheme": "videoclerk",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#18181b"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.videoclerk.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#18181b"
      },
      "package": "com.videoclerk.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Key Settings**:
- `scheme: "videoclerk"` - Required for deep linking (OAuth callbacks)
- `web.output: "static"` - Required for GitHub Pages (static hosting)
- `web.bundler: "metro"` - Use Metro for web (enables code sharing)
- `experiments.typedRoutes: true` - TypeScript route checking

### Step 3: Create metro.config.js

Create `metro.config.js` in the project root:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

### Step 4: Create tailwind.config.js

Create `tailwind.config.js` in the project root:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Match existing color scheme
        background: "#09090b",
        foreground: "#fafafa",
      },
    },
  },
  plugins: [],
};
```

### Step 5: Create global.css

Create `global.css` in the project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 6: Create babel.config.js

Create `babel.config.js` in the project root:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

**Important**: `react-native-reanimated/plugin` must be listed last.

### Step 7: Update tsconfig.json

Replace `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./src/*"]
    },
    "types": ["nativewind/types"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

**Note**: Both `@/*` and `~/*` aliases map to `./src/*` for compatibility with existing code.

### Step 8: Create nativewind-env.d.ts

Create `nativewind-env.d.ts` in the project root:

```typescript
/// <reference types="nativewind/types" />
```

### Step 9: Create assets directory

Create placeholder assets (required by Expo):

```
assets/
├── icon.png          (1024x1024, app icon)
├── splash.png        (1284x2778, splash screen)
├── adaptive-icon.png (1024x1024, Android adaptive icon)
└── favicon.png       (48x48, web favicon)
```

For now, create simple placeholder images or copy from existing `public/` folder if available.

### Step 10: Update .gitignore

Add Expo-specific entries to `.gitignore`:

```gitignore
# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native builds
ios/
android/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*

# EAS
.eas/

# Metro
.metro-health-check*

# Temporary files
*.tsbuildinfo
```

### Step 11: Update environment variables

Rename environment variables from `VITE_*` to `EXPO_PUBLIC_*`:

**Old `.env`**:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
VITE_TMDB_API_READ_TOKEN=...
```

**New `.env`**:
```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_TMDB_API_READ_TOKEN=your-tmdb-token
```

### Step 12: Create root layout

Create `app/_layout.tsx`:

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#09090b" },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**Key Points**:
- Import `global.css` first for NativeWind
- `GestureHandlerRootView` wraps everything (required for gestures)
- `SafeAreaProvider` provides safe area context
- Dark background matches existing app

### Step 13: Create placeholder index

Create `app/index.tsx` as a placeholder:

```tsx
import { View, Text } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <Text className="text-2xl font-bold text-white">Video Clerk</Text>
      <Text className="mt-2 text-zinc-400">React Native Setup Complete</Text>
    </View>
  );
}
```

### Step 14: Update Supabase client

Move and update `app/lib/supabase/client.ts` to `src/lib/supabase/client.ts`:

```typescript
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  }
);

// Factory function for compatibility with existing code
export function createClient() {
  return supabase;
}
```

**Key Changes**:
- Import `react-native-url-polyfill/auto` first
- Use `AsyncStorage` for native platforms
- Platform-specific session detection
- Singleton pattern for consistent instance

### Step 15: Copy database types

Copy `app/lib/supabase/database.types.ts` to `src/lib/supabase/database.types.ts` (no changes needed).

### Step 16: Create src directory structure

```bash
mkdir -p src/lib/supabase
mkdir -p src/components
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/features/list
mkdir -p src/features/watch
mkdir -p src/features/settings
mkdir -p src/tmdb-api
```

### Step 17: Install dependencies and verify

Run:
```bash
rm -rf node_modules package-lock.json
npm install
```

Then verify:
```bash
npx expo start --web
```

## Test Guidance

### Manual Verification

1. **Run web dev server**:
   ```bash
   npx expo start --web
   ```
   - Should open browser at localhost:8081
   - Should show "Video Clerk" placeholder page
   - No console errors

2. **Run iOS simulator** (if on macOS):
   ```bash
   npx expo start --ios
   ```
   - Should launch iOS Simulator
   - Should show same placeholder page
   - NativeWind styles should apply (dark background, white text)

3. **Type checking**:
   ```bash
   npm run typecheck
   ```
   - Should complete with no errors

4. **Verify NativeWind**:
   - The `className` props should apply styles
   - `bg-zinc-950` should render dark background
   - `text-white` should render white text

### Automated Verification

Create a simple smoke test at `__tests__/setup.test.ts`:

```typescript
import { describe, it, expect } from "@jest/globals";

describe("Project Setup", () => {
  it("has correct environment variables defined", () => {
    expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBeDefined();
  });

  it("can import Supabase client", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    expect(typeof createClient).toBe("function");
  });
});
```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] `npm install` completes without errors
- [ ] `npx expo start --web` launches and shows placeholder page
- [ ] NativeWind classes apply correctly (visible dark background, styled text)
- [ ] `npm run typecheck` passes with no errors
- [ ] Project structure matches the target layout
- [ ] Environment variables renamed to `EXPO_PUBLIC_*` format
- [ ] `vite.config.ts` and `react-router.config.ts` are removed
- [ ] `app.json` created with correct Expo configuration
- [ ] `metro.config.js` created with NativeWind integration
- [ ] `tailwind.config.js` created with NativeWind preset
- [ ] Root layout (`app/_layout.tsx`) wraps with required providers
- [ ] Supabase client updated for React Native compatibility

## Troubleshooting

### "Cannot find module 'nativewind/types'"
Ensure `nativewind-env.d.ts` exists and `tsconfig.json` includes the types.

### NativeWind styles not applying
1. Check `global.css` is imported in `app/_layout.tsx`
2. Verify `metro.config.js` uses `withNativeWind`
3. Clear Metro cache: `npx expo start --clear`

### "Invariant Violation: No entries found"
Ensure `app/_layout.tsx` exists (Expo Router requires a root layout).

### AsyncStorage warnings on web
This is expected. The client uses `undefined` for web storage, falling back to localStorage.

---

**Next Phase**: [Phase 2: Routing Migration](102-rn-phase-2-routing-migration.md)
