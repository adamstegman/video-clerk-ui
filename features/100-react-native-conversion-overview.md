# React Native Conversion Plan: Overview

**Status**: Planned
**Date**: January 2026
**Target Platforms**: Web (GitHub Pages), iOS (App Store/TestFlight)

## Executive Summary

This document series outlines the plan to convert Video Clerk UI from a React web application to React Native, supporting both web and iOS platforms from a single codebase. The web target will continue deploying to GitHub Pages.

## Why React Native with Expo?

### Framework Choice: Expo with Expo Router

**Options Considered**:
- A) React Native CLI + React Navigation
- B) Expo + React Navigation
- C) Expo + Expo Router
- D) Separate codebases (React web + React Native mobile)

**Decision**: Option C - Expo + Expo Router

**Rationale**:
- Expo Router provides file-system based routing similar to current React Router 7
- Expo's web support allows single codebase for all platforms
- Expo manages native dependencies (no Xcode/Android Studio required for most work)
- EAS Build handles iOS compilation in the cloud
- Lower migration effort than separate codebases
- Active development and strong community

## Phase Overview

| Phase | Document | Focus Area | Estimated Effort |
|-------|----------|------------|------------------|
| 1 | [101-rn-phase-1-project-setup.md](101-rn-phase-1-project-setup.md) | Project infrastructure & dependencies | 1-2 days |
| 2 | [102-rn-phase-2-routing-migration.md](102-rn-phase-2-routing-migration.md) | Navigation system | 2-3 days |
| 3 | [103-rn-phase-3-styling-migration.md](103-rn-phase-3-styling-migration.md) | Tailwind CSS to NativeWind | 3-4 days |
| 4 | [104-rn-phase-4-animation-migration.md](104-rn-phase-4-animation-migration.md) | motion to Reanimated | 3-4 days |
| 5 | [105-rn-phase-5-component-migrations.md](105-rn-phase-5-component-migrations.md) | UI component conversions | 5-7 days |
| 6 | [106-rn-phase-6-supabase-auth.md](106-rn-phase-6-supabase-auth.md) | Backend & authentication | 2-3 days |
| 7 | [107-rn-phase-7-build-deployment.md](107-rn-phase-7-build-deployment.md) | Build & CI/CD | 2-3 days |
| 8 | [108-rn-phase-8-testing.md](108-rn-phase-8-testing.md) | Testing infrastructure | 2-3 days |

**Total Estimated Effort**: 4-6 weeks

## What Transfers Directly (No Changes Needed)

These parts of the codebase are fully compatible with React Native:

1. **TypeScript type system** - All types, interfaces, and generics
2. **Database schema** - Supabase tables and RLS policies
3. **TMDB API client** (`app/tmdb-api/tmdb-api.ts`) - Pure fetch-based
4. **Context structure** - React Context API works identically
5. **Data normalization logic** - Helper functions in containers
6. **Form validation patterns** - Logic is UI-agnostic
7. **Error handling patterns** - Try/catch and error state management

## What Requires Major Changes

| Area | Current | Target | Effort |
|------|---------|--------|--------|
| Routing | React Router 7 | Expo Router | HIGH |
| Styling | Tailwind CSS 4 | NativeWind 4 | HIGH |
| Animations | motion (Framer Motion) | Reanimated 3 | HIGH |
| UI Elements | HTML elements | React Native components | MEDIUM |
| Icons | lucide-react | lucide-react-native | LOW |
| Build | Vite | Metro bundler | MEDIUM |
| Auth storage | localStorage | AsyncStorage | LOW |

## Target Architecture

### New Project Structure

```
video-clerk-ui/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Landing page
│   ├── login.tsx                 # Auth screen
│   ├── (app)/                    # Protected routes (group)
│   │   ├── _layout.tsx           # Auth guard + providers
│   │   ├── (tabs)/               # Bottom tab navigator
│   │   │   ├── _layout.tsx       # Tab configuration
│   │   │   ├── list/             # List feature
│   │   │   │   ├── index.tsx
│   │   │   │   └── [entryId].tsx
│   │   │   ├── watch/            # Watch feature
│   │   │   │   ├── index.tsx
│   │   │   │   └── [entryId].tsx
│   │   │   └── settings.tsx
│   │   └── add.tsx               # Modal route
├── src/
│   ├── components/               # Shared UI components
│   ├── features/                 # Feature-specific components
│   │   ├── list/
│   │   ├── watch/
│   │   └── settings/
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   │   ├── supabase/
│   │   └── utils.ts
│   └── tmdb-api/                 # TMDB integration
├── assets/                       # Static assets
├── app.json                      # Expo configuration
├── metro.config.js               # Metro bundler config
├── tailwind.config.js            # NativeWind config
├── eas.json                      # EAS Build config
└── package.json
```

### Context Provider Hierarchy

```
<AuthProvider>                    # Session management
  <SafeAreaProvider>              # Safe area context
    <GestureHandlerRootView>      # Gesture handler
      <AppDataProvider>           # User data
        <TMDBAPIProvider>         # TMDB client
          <TMDBConfiguration>     # Image config
            <TMDBGenres>          # Genre data
              <Stack />           # Navigation
```

## Dependencies Summary

### Remove (Web-Only)
- `react-router`, `@react-router/*` - Replaced by Expo Router
- `motion` - Replaced by Reanimated
- `vite`, `@vitejs/plugin-react` - Replaced by Metro
- `tailwindcss` (standalone) - Replaced by NativeWind

### Add (React Native)
- `expo`, `expo-router`, `expo-linking`
- `react-native`, `react-native-web`
- `react-native-reanimated`, `react-native-gesture-handler`
- `react-native-safe-area-context`, `react-native-screens`
- `nativewind`, `tailwindcss` (as NativeWind peer dep)
- `lucide-react-native`
- `@react-native-async-storage/async-storage`

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation complexity | Card swipe may not feel identical | Start simple, iterate; reference iOS gesture best practices |
| NativeWind gaps | Some Tailwind utilities unavailable | Fall back to StyleSheet.create for edge cases |
| Web parity regression | Features may break on web | Test web build after each phase |
| Build time increase | Expo builds slower than Vite | Use development builds; EAS for production |
| Deep linking complexity | OAuth callbacks need setup | Follow Supabase RN guide; test early |

## Success Criteria

1. **Web**: Deploys to GitHub Pages with identical functionality
2. **iOS**: Builds and runs on iOS simulator and physical device
3. **Feature parity**: All current features work on both platforms
4. **Performance**: Card swipe animations at 60fps on iOS
5. **Auth**: Login/logout works on both platforms with session persistence
6. **Tests**: Existing test coverage maintained

## How to Use These Documents

Each phase document contains:

1. **Context**: Background information and what this phase accomplishes
2. **Prerequisites**: What must be completed before starting
3. **Files to Change**: Specific files that need modification or creation
4. **Step-by-Step Instructions**: Detailed implementation guidance
5. **Code Examples**: Before/after code snippets
6. **Test Guidance**: How to verify the phase is complete
7. **Acceptance Criteria**: Checkboxes to confirm completion

**For AI Agents**: Execute phases in order. Each phase builds on the previous. Verify acceptance criteria before proceeding to the next phase.

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main development guide
- [005-watch-page-card-swiping.md](005-watch-page-card-swiping.md) - Card swipe implementation details
- [007-authentication.md](007-authentication.md) - Auth flow details
- [008-mobile-first-pwa.md](008-mobile-first-pwa.md) - Current mobile considerations

---

**Next Step**: Begin with [Phase 1: Project Setup](101-rn-phase-1-project-setup.md)
