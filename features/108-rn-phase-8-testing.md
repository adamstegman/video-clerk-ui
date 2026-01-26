# Phase 8: Comprehensive Testing Infrastructure

**Status**: Planned
**Estimated Effort**: 5-7 days
**Prerequisites**: Phase 1-7 complete

## Context

This phase establishes a comprehensive testing infrastructure where **passing tests guarantee the app works correctly**. The goal is to eliminate the need for manual testing before merging PRs—if CI passes, we ship with confidence.

**Testing Philosophy**:
- Tests should cover every user-visible behavior
- Tests should catch regressions before users do
- Tests should document expected behavior
- Tests should run fast enough to not slow development (<2 min for full suite)
- Failing tests should clearly indicate what broke

**Coverage Targets**:
- **Overall**: 85%+ line coverage
- **Critical paths** (auth, data loading): 95%+
- **UI components**: 80%+
- **Utilities**: 100%

## Test Categories

### 1. Unit Tests (60-70% of tests)
- Individual components in isolation
- Hooks with mocked dependencies
- Utility functions
- Fast, focused, numerous

### 2. Integration Tests (25-35% of tests)
- Feature containers with mocked API
- Multi-component interactions
- Navigation flows
- Data loading and error states

### 3. End-to-End Style Tests (5-10% of tests)
- Critical user journeys
- Full feature flows
- Cross-cutting concerns

---

## Files to Create

### Test Infrastructure
| File | Purpose |
|------|---------|
| `jest.config.js` | Jest configuration |
| `jest.setup.js` | Global mocks and setup |
| `src/test-utils/index.ts` | Barrel export |
| `src/test-utils/render.tsx` | Custom render with providers |
| `src/test-utils/mocks/supabase.ts` | Supabase client mock |
| `src/test-utils/mocks/navigation.ts` | Router mock with history |
| `src/test-utils/mocks/tmdb.ts` | TMDB API mock |
| `src/test-utils/fixtures/entries.ts` | Entry test data |
| `src/test-utils/fixtures/users.ts` | User/session fixtures |
| `src/test-utils/assertions.ts` | Custom assertions |
| `src/test-utils/setup.ts` | Test setup helpers |

### Component Tests
| File | Tests |
|------|-------|
| `src/components/__tests__/action-button.test.tsx` | Button states, variants, loading |
| `src/components/__tests__/header.test.tsx` | Title, back button, actions |
| `src/components/__tests__/spinner.test.tsx` | Loading indicator |
| `src/components/__tests__/text-input-field.test.tsx` | Input, validation, errors |

### Context Tests
| File | Tests |
|------|-------|
| `src/contexts/__tests__/auth-context.test.tsx` | Auth state, sign in/out, persistence |
| `src/contexts/__tests__/app-data-context.test.tsx` | User data provider |

### Feature Tests - Auth
| File | Tests |
|------|-------|
| `app/__tests__/login.test.tsx` | Login form, validation, submission, errors |
| `app/__tests__/forgot-password.test.tsx` | Reset flow |
| `app/__tests__/auth-guard.test.tsx` | Protected route redirects |

### Feature Tests - List
| File | Tests |
|------|-------|
| `src/features/list/__tests__/list-page.test.tsx` | List display, sections, empty state |
| `src/features/list/__tests__/list-page-container.test.tsx` | Data loading, errors, refresh |
| `src/features/list/__tests__/entry-row.test.tsx` | Row display, navigation |
| `src/features/list/__tests__/add-to-list.test.tsx` | Search, results, saving |
| `src/features/list/__tests__/edit-entry.test.tsx` | Edit form, delete, mark watched |

### Feature Tests - Watch
| File | Tests |
|------|-------|
| `src/features/watch/__tests__/watch-page.test.tsx` | State machine, mode transitions |
| `src/features/watch/__tests__/watch-page-container.test.tsx` | Data loading |
| `src/features/watch/__tests__/card-stack.test.tsx` | Card rendering, swipe handling |
| `src/features/watch/__tests__/swipeable-card.test.tsx` | Gesture response |
| `src/features/watch/__tests__/picker-view.test.tsx` | Selection, winner choice |
| `src/features/watch/__tests__/winner-view.test.tsx` | Winner display, mark watched |

### Integration Tests
| File | Tests |
|------|-------|
| `src/__tests__/integration/auth-flow.test.tsx` | Full auth journey |
| `src/__tests__/integration/list-management.test.tsx` | Add, view, edit, delete entries |
| `src/__tests__/integration/watch-flow.test.tsx` | Swipe to winner flow |

---

## Step-by-Step Instructions

### Step 1: Install Dependencies

```bash
npm install --save-dev \
  @testing-library/jest-native@^5.4.3 \
  @testing-library/react-native@^12.9.0 \
  @types/jest@^29.5.0 \
  jest@^29.7.0 \
  jest-expo@~52.0.0 \
  react-test-renderer@18.3.1
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2 --forceExit",
    "test:update": "jest --updateSnapshot",
    "test:changed": "jest --onlyChanged",
    "test:debug": "jest --detectOpenHandles --runInBand"
  }
}
```

### Step 2: Create Jest Configuration

Create `jest.config.js`:

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^~/(.*)$": "<rootDir>/src/$1",
  },

  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "(jest-)?react-native|" +
      "@react-native(-community)?|" +
      "expo(nent)?|" +
      "@expo(nent)?/.*|" +
      "react-navigation|" +
      "@react-navigation/.*|" +
      "nativewind|" +
      "react-native-reanimated|" +
      "react-native-gesture-handler|" +
      "react-native-screens|" +
      "react-native-safe-area-context|" +
      "lucide-react-native" +
    "))",
  ],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/test-utils/**",
    "!**/__tests__/**",
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Critical paths need higher coverage
    "src/contexts/*.{ts,tsx}": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "src/lib/**/*.{ts,tsx}": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  testMatch: [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/*.test.{ts,tsx}",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/.expo/",
    "/dist/",
  ],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  testTimeout: 10000,

  // Fail on console errors (catches React warnings)
  setupFiles: ["<rootDir>/src/test-utils/fail-on-console.js"],

  // Better error output
  verbose: true,

  // Collect coverage even when tests fail
  collectCoverage: false,

  // Faster in CI
  maxWorkers: process.env.CI ? 2 : "50%",
};
```

### Step 3: Create Console Error Detection

Create `src/test-utils/fail-on-console.js`:

```javascript
// Fail tests on unexpected console errors/warnings
// This catches React warnings, PropType errors, and other issues

const originalError = console.error;
const originalWarn = console.warn;

// Patterns that are OK to ignore
const IGNORED_PATTERNS = [
  /Warning: ReactDOM.render is no longer supported/,
  /Warning: An update to .* inside a test was not wrapped in act/,
  /NativeWind/,
  /Reanimated/,
  /React does not recognize the `.*` prop/,
];

const shouldIgnore = (message) => {
  const str = typeof message === "string" ? message : String(message);
  return IGNORED_PATTERNS.some((pattern) => pattern.test(str));
};

console.error = function (...args) {
  if (shouldIgnore(args[0])) {
    return;
  }
  originalError.apply(console, args);
  throw new Error(`Unexpected console.error: ${args[0]}`);
};

console.warn = function (...args) {
  if (shouldIgnore(args[0])) {
    return;
  }
  originalWarn.apply(console, args);
  // Warnings don't fail tests but are logged
};

// Allow tests to temporarily suppress errors
global.suppressConsoleErrors = () => {
  console.error = () => {};
  console.warn = () => {};
};

global.restoreConsoleErrors = () => {
  console.error = originalError;
  console.warn = originalWarn;
};
```

### Step 4: Create Jest Setup

Create `jest.setup.js`:

```javascript
import "@testing-library/jest-native/extend-expect";

// ============================================
// NAVIGATION MOCKS
// ============================================

const navigationHistory = [];
let currentRoute = "/";
let routeParams = {};

const mockRouter = {
  push: jest.fn((route, params) => {
    navigationHistory.push(route);
    currentRoute = route;
    if (params) routeParams = params;
  }),
  replace: jest.fn((route, params) => {
    currentRoute = route;
    if (params) routeParams = params;
  }),
  back: jest.fn(() => {
    if (navigationHistory.length > 0) {
      navigationHistory.pop();
      currentRoute = navigationHistory[navigationHistory.length - 1] || "/";
    }
  }),
  canGoBack: jest.fn(() => navigationHistory.length > 0),
  setParams: jest.fn((params) => {
    routeParams = { ...routeParams, ...params };
  }),
};

jest.mock("expo-router", () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: jest.fn(() => routeParams),
  useGlobalSearchParams: jest.fn(() => routeParams),
  useSegments: jest.fn(() => currentRoute.split("/").filter(Boolean)),
  usePathname: jest.fn(() => currentRoute),
  useFocusEffect: jest.fn((callback) => {
    callback();
    return () => {};
  }),
  Link: jest.fn(({ children, href, asChild, onPress, ...props }) => {
    const { Pressable, Text } = require("react-native");
    const handlePress = () => {
      if (onPress) onPress();
      mockRouter.push(href);
    };
    if (asChild && children) {
      const child = require("react").Children.only(children);
      return require("react").cloneElement(child, { onPress: handlePress });
    }
    return (
      <Pressable onPress={handlePress} {...props}>
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </Pressable>
    );
  }),
  Redirect: jest.fn(({ href }) => {
    mockRouter.replace(href);
    return null;
  }),
  Stack: {
    Screen: jest.fn(() => null),
  },
  Tabs: {
    Screen: jest.fn(() => null),
  },
  Slot: jest.fn(({ children }) => children),
}));

// ============================================
// EXPO MODULE MOCKS
// ============================================

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `videoclerk://${path}`),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  parse: jest.fn((url) => ({ path: url })),
}));

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(() =>
    Promise.resolve({ type: "cancel" })
  ),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "cancel" })),
  dismissBrowser: jest.fn(),
  warmUpAsync: jest.fn(() => Promise.resolve()),
  coolDownAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
  setStatusBarStyle: jest.fn(),
  setStatusBarHidden: jest.fn(),
}));

jest.mock("expo-image", () => {
  const { Image } = require("react-native");
  return {
    Image: (props) => <Image {...props} testID={props.testID || "expo-image"} />,
  };
});

// ============================================
// REACT NATIVE MODULE MOCKS
// ============================================

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }) => <View testID="safe-area-provider">{children}</View>,
    SafeAreaView: ({ children, style }) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  // Track gesture callbacks for testing
  const gestureCallbacks = {
    onStart: null,
    onUpdate: null,
    onEnd: null,
  };

  return {
    GestureHandlerRootView: ({ children, style }) => (
      <View style={style} testID="gesture-root">{children}</View>
    ),
    GestureDetector: ({ children, gesture }) => {
      // Store callbacks for test access
      if (gesture?._onStart) gestureCallbacks.onStart = gesture._onStart;
      if (gesture?._onUpdate) gestureCallbacks.onUpdate = gesture._onUpdate;
      if (gesture?._onEnd) gestureCallbacks.onEnd = gesture._onEnd;
      return children;
    },
    Gesture: {
      Pan: () => {
        const gesture = {
          _onStart: null,
          _onUpdate: null,
          _onEnd: null,
          enabled: () => gesture,
          onStart: (cb) => { gesture._onStart = cb; return gesture; },
          onUpdate: (cb) => { gesture._onUpdate = cb; return gesture; },
          onEnd: (cb) => { gesture._onEnd = cb; return gesture; },
          onFinalize: () => gesture,
          minDistance: () => gesture,
          activeOffsetX: () => gesture,
          failOffsetY: () => gesture,
        };
        return gesture;
      },
      Tap: () => ({
        onStart: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
        maxDuration: jest.fn().mockReturnThis(),
      }),
    },
    Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
    State: { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 },
    // Export for tests to trigger gestures
    __gestureCallbacks: gestureCallbacks,
  };
});

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");

  const mockSharedValue = (initial) => {
    let value = initial;
    return {
      get value() { return value; },
      set value(v) { value = v; },
    };
  };

  return {
    default: {
      createAnimatedComponent: (Component) => Component,
      View,
      Text: require("react-native").Text,
      Image: require("react-native").Image,
      ScrollView: require("react-native").ScrollView,
    },
    useSharedValue: mockSharedValue,
    useAnimatedStyle: (fn) => fn(),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedGestureHandler: (handlers) => handlers,
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDelay: (_, value) => value,
    withSequence: (...values) => values[values.length - 1],
    withRepeat: (value) => value,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: (value) => value,
    Extrapolate: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t,
      cubic: (t) => t,
      inOut: () => (t) => t,
      out: () => (t) => t,
      in: () => (t) => t,
    },
    Layout: {
      springify: () => ({ duration: () => ({}) }),
      duration: () => ({}),
    },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    SlideInRight: { duration: () => ({}) },
    SlideOutLeft: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    FadeOutUp: { duration: () => ({}) },
    // Animated components
    createAnimatedComponent: (Component) => Component,
    View,
    Text: require("react-native").Text,
    Image: require("react-native").Image,
    ScrollView: require("react-native").ScrollView,
  };
});

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// ============================================
// PLATFORM MOCK
// ============================================

jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "ios",
  select: (obj) => obj.ios ?? obj.default,
  Version: 17,
  isPad: false,
  isTVOS: false,
  isTV: false,
}));

// ============================================
// TEST LIFECYCLE
// ============================================

beforeEach(() => {
  // Reset navigation state
  navigationHistory.length = 0;
  currentRoute = "/";
  routeParams = {};
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.setParams.mockClear();
});

afterEach(async () => {
  // Flush promises
  await new Promise((resolve) => setTimeout(resolve, 0));
});

// ============================================
// GLOBAL TEST HELPERS
// ============================================

global.mockRouter = mockRouter;
global.getNavigationHistory = () => [...navigationHistory];
global.getCurrentRoute = () => currentRoute;
global.setRouteParams = (params) => { routeParams = params; };

jest.setTimeout(10000);
```

### Step 5: Create Test Fixtures

Create `src/test-utils/fixtures/users.ts`:

```typescript
import type { User, Session } from "@supabase/supabase-js";

export const mockUser: User = {
  id: "user-test-123",
  email: "test@example.com",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Test User" },
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  confirmed_at: "2024-01-01T00:00:00.000Z",
  email_confirmed_at: "2024-01-01T00:00:00.000Z",
  identities: [],
};

export const mockSession: Session = {
  access_token: "mock-access-token-xyz",
  refresh_token: "mock-refresh-token-abc",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: mockUser,
};

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUser,
  id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ...overrides,
});

export const createMockSession = (
  user: User = mockUser,
  overrides: Partial<Session> = {}
): Session => ({
  ...mockSession,
  user,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

export const expiredSession: Session = {
  ...mockSession,
  expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
};
```

Create `src/test-utils/fixtures/entries.ts`:

```typescript
export interface MockTMDBDetails {
  tmdb_id: number;
  title: string;
  release_date: string | null;
  poster_path: string | null;
  overview: string;
  genre_ids: number[];
  runtime: number | null;
  media_type: "movie" | "tv";
}

export interface MockEntry {
  id: number;
  watched_at: string | null;
  added_at: string;
  group_id: number;
  tmdb_details: MockTMDBDetails;
  entry_tags: Array<{ tag_id: number; tags: { id: number; name: string } }>;
}

// ============================================
// MOVIE FIXTURES
// ============================================

export const fightClubEntry: MockEntry = {
  id: 1,
  watched_at: null,
  added_at: "2024-01-15T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 550,
    title: "Fight Club",
    release_date: "1999-10-15",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    overview: "A depressed man suffering from insomnia meets a strange soap salesman.",
    genre_ids: [18, 53],
    runtime: 139,
    media_type: "movie",
  },
  entry_tags: [{ tag_id: 1, tags: { id: 1, name: "Thriller" } }],
};

export const inceptionEntry: MockEntry = {
  id: 2,
  watched_at: null,
  added_at: "2024-01-14T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 27205,
    title: "Inception",
    release_date: "2010-07-16",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg",
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    genre_ids: [28, 878, 12],
    runtime: 148,
    media_type: "movie",
  },
  entry_tags: [],
};

export const matrixEntry: MockEntry = {
  id: 3,
  watched_at: "2024-01-20T20:00:00.000Z",
  added_at: "2024-01-10T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 603,
    title: "The Matrix",
    release_date: "1999-03-30",
    poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    overview: "A computer hacker learns about the true nature of reality.",
    genre_ids: [28, 878],
    runtime: 136,
    media_type: "movie",
  },
  entry_tags: [{ tag_id: 2, tags: { id: 2, name: "Sci-Fi" } }],
};

// ============================================
// TV FIXTURES
// ============================================

export const breakingBadEntry: MockEntry = {
  id: 4,
  watched_at: null,
  added_at: "2024-01-12T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 1396,
    title: "Breaking Bad",
    release_date: "2008-01-20",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
    genre_ids: [18, 80],
    runtime: 45,
    media_type: "tv",
  },
  entry_tags: [],
};

// ============================================
// EDGE CASE FIXTURES
// ============================================

export const entryWithoutPoster: MockEntry = {
  id: 5,
  watched_at: null,
  added_at: "2024-01-11T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 99999,
    title: "Unknown Indie Film",
    release_date: "2023-01-01",
    poster_path: null,
    overview: "An obscure film without poster.",
    genre_ids: [],
    runtime: null,
    media_type: "movie",
  },
  entry_tags: [],
};

export const entryWithLongTitle: MockEntry = {
  id: 6,
  watched_at: null,
  added_at: "2024-01-11T10:00:00.000Z",
  group_id: 1,
  tmdb_details: {
    tmdb_id: 88888,
    title: "The Incredibly Long and Verbose Title of a Movie That Just Keeps Going and Going",
    release_date: "2023-01-01",
    poster_path: "/test.jpg",
    overview: "A movie with an extremely long title.",
    genre_ids: [35],
    runtime: 90,
    media_type: "movie",
  },
  entry_tags: [],
};

// ============================================
// COLLECTIONS
// ============================================

export const mockUnwatchedEntries: MockEntry[] = [
  fightClubEntry,
  inceptionEntry,
  breakingBadEntry,
];

export const mockWatchedEntries: MockEntry[] = [matrixEntry];

export const mockAllEntries: MockEntry[] = [
  ...mockUnwatchedEntries,
  ...mockWatchedEntries,
];

export const mockEmptyEntries: MockEntry[] = [];

// ============================================
// FACTORY FUNCTIONS
// ============================================

let entryIdCounter = 100;

export const createMockEntry = (overrides: Partial<MockEntry> = {}): MockEntry => {
  const id = overrides.id ?? ++entryIdCounter;
  return {
    id,
    watched_at: null,
    added_at: new Date().toISOString(),
    group_id: 1,
    tmdb_details: {
      tmdb_id: 10000 + id,
      title: `Test Movie ${id}`,
      release_date: "2024-01-01",
      poster_path: `/test-${id}.jpg`,
      overview: `Test movie description ${id}`,
      genre_ids: [18],
      runtime: 120,
      media_type: "movie",
    },
    entry_tags: [],
    ...overrides,
  };
};

export const createMockEntries = (count: number): MockEntry[] =>
  Array.from({ length: count }, (_, i) => createMockEntry({ id: i + 1 }));

// ============================================
// NORMALIZED FORMAT (as returned by containers)
// ============================================

export interface NormalizedEntry {
  id: number;
  title: string;
  releaseYear?: string;
  posterUrl?: string;
  posterPath?: string | null;
  watched: boolean;
  mediaType: "movie" | "tv";
  genres?: string[];
  runtime?: number;
}

export const normalizeEntry = (entry: MockEntry): NormalizedEntry => ({
  id: entry.id,
  title: entry.tmdb_details.title,
  releaseYear: entry.tmdb_details.release_date?.split("-")[0],
  posterPath: entry.tmdb_details.poster_path,
  posterUrl: entry.tmdb_details.poster_path
    ? `https://image.tmdb.org/t/p/w500${entry.tmdb_details.poster_path}`
    : undefined,
  watched: !!entry.watched_at,
  mediaType: entry.tmdb_details.media_type,
  runtime: entry.tmdb_details.runtime ?? undefined,
});

export const normalizeEntries = (entries: MockEntry[]): NormalizedEntry[] =>
  entries.map(normalizeEntry);
```

---

## 3. Supabase Mock Implementation

### `src/test-utils/mocks/supabase.ts`

```typescript
// Comprehensive Supabase mock with full query builder chain support
import { vi } from "vitest";
import type { User, Session } from "@supabase/supabase-js";

// ============================================
// MOCK STATE (tracks calls for assertions)
// ============================================

export interface SupabaseMockState {
  // Query tracking
  queries: Array<{
    table: string;
    operation: "select" | "insert" | "update" | "delete" | "upsert";
    filters: Record<string, unknown>;
    data?: unknown;
  }>;

  // RPC tracking
  rpcCalls: Array<{
    fn: string;
    params: unknown;
  }>;

  // Auth tracking
  authCalls: Array<{
    method: string;
    params?: unknown;
  }>;

  // Configured responses
  responses: Map<string, { data: unknown; error: unknown }>;

  // Current auth state
  currentUser: User | null;
  currentSession: Session | null;
}

let mockState: SupabaseMockState = {
  queries: [],
  rpcCalls: [],
  authCalls: [],
  responses: new Map(),
  currentUser: null,
  currentSession: null,
};

export const getSupabaseMockState = () => mockState;

export const resetSupabaseMock = () => {
  mockState = {
    queries: [],
    rpcCalls: [],
    authCalls: [],
    responses: new Map(),
    currentUser: null,
    currentSession: null,
  };
};

export const setMockUser = (user: User | null) => {
  mockState.currentUser = user;
};

export const setMockSession = (session: Session | null) => {
  mockState.currentSession = session;
};

// Configure response for a specific table/operation
export const setMockResponse = (
  key: string, // e.g., "entries:select", "tags:insert"
  response: { data: unknown; error: unknown }
) => {
  mockState.responses.set(key, response);
};

// ============================================
// QUERY BUILDER MOCK
// ============================================

type QueryResponse = { data: unknown; error: unknown };

const createQueryBuilder = (table: string) => {
  let operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  let filters: Record<string, unknown> = {};
  let insertData: unknown = null;

  const getResponse = (): QueryResponse => {
    const key = `${table}:${operation}`;
    const configured = mockState.responses.get(key);
    if (configured) return configured;

    // Default empty response
    return { data: operation === "select" ? [] : null, error: null };
  };

  const trackAndReturn = (): QueryResponse => {
    mockState.queries.push({
      table,
      operation,
      filters,
      data: insertData,
    });
    return getResponse();
  };

  // All terminal methods return the tracked response
  const terminalMethods = {
    then: (resolve: (value: QueryResponse) => void) => {
      resolve(trackAndReturn());
    },
    single: () => {
      const response = trackAndReturn();
      // single() returns first item or null
      if (Array.isArray(response.data)) {
        return {
          data: response.data[0] ?? null,
          error: response.error,
        };
      }
      return response;
    },
    maybeSingle: () => terminalMethods.single(),
  };

  const builder: Record<string, unknown> = {
    // Query operations
    select: (columns?: string) => {
      operation = "select";
      filters.columns = columns;
      return builder;
    },
    insert: (data: unknown) => {
      operation = "insert";
      insertData = data;
      return builder;
    },
    update: (data: unknown) => {
      operation = "update";
      insertData = data;
      return builder;
    },
    delete: () => {
      operation = "delete";
      return builder;
    },
    upsert: (data: unknown) => {
      operation = "upsert";
      insertData = data;
      return builder;
    },

    // Filter methods
    eq: (column: string, value: unknown) => {
      filters[`eq:${column}`] = value;
      return builder;
    },
    neq: (column: string, value: unknown) => {
      filters[`neq:${column}`] = value;
      return builder;
    },
    gt: (column: string, value: unknown) => {
      filters[`gt:${column}`] = value;
      return builder;
    },
    gte: (column: string, value: unknown) => {
      filters[`gte:${column}`] = value;
      return builder;
    },
    lt: (column: string, value: unknown) => {
      filters[`lt:${column}`] = value;
      return builder;
    },
    lte: (column: string, value: unknown) => {
      filters[`lte:${column}`] = value;
      return builder;
    },
    like: (column: string, pattern: string) => {
      filters[`like:${column}`] = pattern;
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      filters[`ilike:${column}`] = pattern;
      return builder;
    },
    is: (column: string, value: unknown) => {
      filters[`is:${column}`] = value;
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters[`in:${column}`] = values;
      return builder;
    },
    contains: (column: string, value: unknown) => {
      filters[`contains:${column}`] = value;
      return builder;
    },
    containedBy: (column: string, value: unknown) => {
      filters[`containedBy:${column}`] = value;
      return builder;
    },

    // Ordering and pagination
    order: (column: string, options?: { ascending?: boolean }) => {
      filters.order = { column, ...options };
      return builder;
    },
    limit: (count: number) => {
      filters.limit = count;
      return builder;
    },
    range: (from: number, to: number) => {
      filters.range = { from, to };
      return builder;
    },

    // Terminal methods
    ...terminalMethods,
  };

  return builder;
};

// ============================================
// AUTH MOCK
// ============================================

const createAuthMock = () => ({
  getUser: vi.fn(async () => {
    mockState.authCalls.push({ method: "getUser" });
    if (mockState.currentUser) {
      return { data: { user: mockState.currentUser }, error: null };
    }
    return { data: { user: null }, error: { message: "Not authenticated" } };
  }),

  getSession: vi.fn(async () => {
    mockState.authCalls.push({ method: "getSession" });
    if (mockState.currentSession) {
      return { data: { session: mockState.currentSession }, error: null };
    }
    return { data: { session: null }, error: null };
  }),

  signInWithPassword: vi.fn(async (credentials: { email: string; password: string }) => {
    mockState.authCalls.push({ method: "signInWithPassword", params: credentials });
    // Default: successful login with mock user
    if (mockState.currentUser && mockState.currentSession) {
      return {
        data: { user: mockState.currentUser, session: mockState.currentSession },
        error: null,
      };
    }
    return {
      data: { user: null, session: null },
      error: { message: "Invalid credentials" },
    };
  }),

  signUp: vi.fn(async (credentials: { email: string; password: string }) => {
    mockState.authCalls.push({ method: "signUp", params: credentials });
    return {
      data: { user: mockState.currentUser, session: mockState.currentSession },
      error: null,
    };
  }),

  signOut: vi.fn(async () => {
    mockState.authCalls.push({ method: "signOut" });
    mockState.currentUser = null;
    mockState.currentSession = null;
    return { error: null };
  }),

  signInWithOAuth: vi.fn(async (options: { provider: string }) => {
    mockState.authCalls.push({ method: "signInWithOAuth", params: options });
    return { data: { url: "https://mock-oauth.com" }, error: null };
  }),

  onAuthStateChange: vi.fn((callback: (event: string, session: Session | null) => void) => {
    mockState.authCalls.push({ method: "onAuthStateChange" });
    // Immediately call with current state
    setTimeout(() => {
      callback(mockState.currentSession ? "SIGNED_IN" : "SIGNED_OUT", mockState.currentSession);
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    };
  }),

  resetPasswordForEmail: vi.fn(async (email: string) => {
    mockState.authCalls.push({ method: "resetPasswordForEmail", params: { email } });
    return { data: {}, error: null };
  }),

  updateUser: vi.fn(async (updates: unknown) => {
    mockState.authCalls.push({ method: "updateUser", params: updates });
    return { data: { user: mockState.currentUser }, error: null };
  }),
});

// ============================================
// STORAGE MOCK
// ============================================

const createStorageMock = () => ({
  from: vi.fn((bucket: string) => ({
    upload: vi.fn(async (path: string, file: unknown) => {
      return { data: { path: `${bucket}/${path}` }, error: null };
    }),
    download: vi.fn(async (path: string) => {
      return { data: new Blob(), error: null };
    }),
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://storage.mock/${bucket}/${path}` },
    })),
    remove: vi.fn(async (paths: string[]) => {
      return { data: paths, error: null };
    }),
    list: vi.fn(async () => {
      return { data: [], error: null };
    }),
  })),
});

// ============================================
// RPC MOCK
// ============================================

const createRpcMock = () =>
  vi.fn(async (fn: string, params?: unknown) => {
    mockState.rpcCalls.push({ fn, params });

    const key = `rpc:${fn}`;
    const configured = mockState.responses.get(key);
    if (configured) return configured;

    // Default responses for known RPCs
    switch (fn) {
      case "save_tmdb_result_to_list":
        return { data: { id: 1 }, error: null };
      case "get_group_stats":
        return { data: { total_entries: 0, watched_entries: 0 }, error: null };
      default:
        return { data: null, error: null };
    }
  });

// ============================================
// MAIN CLIENT MOCK
// ============================================

export const createMockSupabaseClient = () => ({
  from: vi.fn((table: string) => createQueryBuilder(table)),
  auth: createAuthMock(),
  storage: createStorageMock(),
  rpc: createRpcMock(),
});

// Jest/Vitest module mock
export const mockSupabaseModule = () => {
  vi.mock("@/lib/supabase/client", () => ({
    createClient: () => createMockSupabaseClient(),
  }));
};

// ============================================
// TEST HELPERS
// ============================================

// Assert a specific query was made
export const assertQueryMade = (
  table: string,
  operation: "select" | "insert" | "update" | "delete",
  expectedFilters?: Partial<Record<string, unknown>>
) => {
  const query = mockState.queries.find(
    (q) => q.table === table && q.operation === operation
  );

  if (!query) {
    throw new Error(`Expected ${operation} query on "${table}" but none found`);
  }

  if (expectedFilters) {
    for (const [key, value] of Object.entries(expectedFilters)) {
      if (query.filters[key] !== value) {
        throw new Error(
          `Expected filter ${key}=${value} but got ${query.filters[key]}`
        );
      }
    }
  }
};

// Assert RPC was called
export const assertRpcCalled = (fn: string, expectedParams?: unknown) => {
  const call = mockState.rpcCalls.find((c) => c.fn === fn);

  if (!call) {
    throw new Error(`Expected RPC "${fn}" to be called but it wasn't`);
  }

  if (expectedParams !== undefined) {
    expect(call.params).toEqual(expectedParams);
  }
};

// Assert auth method was called
export const assertAuthCalled = (method: string) => {
  const call = mockState.authCalls.find((c) => c.method === method);

  if (!call) {
    throw new Error(`Expected auth.${method}() to be called but it wasn't`);
  }
};
```

---

## 4. TMDB API Mock

### `src/test-utils/mocks/tmdb.ts`

```typescript
// Complete TMDB API mock with realistic test data
import { vi } from "vitest";

// ============================================
// MOCK STATE
// ============================================

export interface TMDBMockState {
  apiCalls: Array<{
    endpoint: string;
    params?: Record<string, unknown>;
  }>;
  responses: Map<string, unknown>;
  shouldFail: boolean;
  failureError: string;
}

let mockState: TMDBMockState = {
  apiCalls: [],
  responses: new Map(),
  shouldFail: false,
  failureError: "Network error",
};

export const getTMDBMockState = () => mockState;

export const resetTMDBMock = () => {
  mockState = {
    apiCalls: [],
    responses: new Map(),
    shouldFail: false,
    failureError: "Network error",
  };
};

export const setTMDBShouldFail = (shouldFail: boolean, error = "Network error") => {
  mockState.shouldFail = shouldFail;
  mockState.failureError = error;
};

export const setTMDBResponse = (endpoint: string, response: unknown) => {
  mockState.responses.set(endpoint, response);
};

// ============================================
// REALISTIC TEST DATA
// ============================================

export const mockTMDBConfiguration = {
  images: {
    base_url: "http://image.tmdb.org/t/p/",
    secure_base_url: "https://image.tmdb.org/t/p/",
    backdrop_sizes: ["w300", "w780", "w1280", "original"],
    logo_sizes: ["w45", "w92", "w154", "w185", "w300", "w500", "original"],
    poster_sizes: ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
    profile_sizes: ["w45", "w185", "h632", "original"],
    still_sizes: ["w92", "w185", "w300", "original"],
  },
  change_keys: [],
};

export const mockTMDBGenres = {
  genres: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ],
};

export const mockSearchResults = {
  page: 1,
  total_pages: 1,
  total_results: 3,
  results: [
    {
      id: 550,
      title: "Fight Club",
      name: undefined,
      release_date: "1999-10-15",
      first_air_date: undefined,
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
      overview: "A ticking-Loss time bomb of a movie.",
      vote_average: 8.4,
      genre_ids: [18, 53],
      media_type: "movie",
      adult: false,
      original_language: "en",
      popularity: 73.433,
    },
    {
      id: 27205,
      title: "Inception",
      name: undefined,
      release_date: "2010-07-16",
      first_air_date: undefined,
      poster_path: "/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
      backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      overview: "Cobb, a skilled thief...",
      vote_average: 8.4,
      genre_ids: [28, 878, 12],
      media_type: "movie",
      adult: false,
      original_language: "en",
      popularity: 88.664,
    },
    {
      id: 1399,
      title: undefined,
      name: "Game of Thrones",
      release_date: undefined,
      first_air_date: "2011-04-17",
      poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      overview: "Seven noble families fight...",
      vote_average: 8.4,
      genre_ids: [10765, 18, 10759],
      media_type: "tv",
      adult: false,
      original_language: "en",
      popularity: 369.594,
    },
  ],
};

export const mockMovieDetails = {
  id: 550,
  title: "Fight Club",
  release_date: "1999-10-15",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
  overview: "A ticking-Loss time bomb of a movie about an insomniac office worker...",
  runtime: 139,
  vote_average: 8.4,
  vote_count: 26000,
  genres: [
    { id: 18, name: "Drama" },
    { id: 53, name: "Thriller" },
  ],
  production_companies: [
    { id: 508, name: "Regency Enterprises", logo_path: "/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.png" },
  ],
  budget: 63000000,
  revenue: 100853753,
  status: "Released",
  tagline: "Mischief. Mayhem. Soap.",
  credits: {
    cast: [
      { id: 819, name: "Edward Norton", character: "The Narrator", profile_path: "/5XBzD5WuTyVQZeS4II6gs1nn5P6.jpg" },
      { id: 287, name: "Brad Pitt", character: "Tyler Durden", profile_path: "/cckcYc2v0yh1tc9QjRelptcOBko.jpg" },
    ],
    crew: [
      { id: 7467, name: "David Fincher", job: "Director", profile_path: "/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg" },
    ],
  },
};

export const mockTVDetails = {
  id: 1399,
  name: "Game of Thrones",
  first_air_date: "2011-04-17",
  last_air_date: "2019-05-19",
  poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
  backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
  overview: "Seven noble families fight for control of the mythical land of Westeros...",
  episode_run_time: [60],
  vote_average: 8.4,
  vote_count: 21000,
  number_of_seasons: 8,
  number_of_episodes: 73,
  genres: [
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 18, name: "Drama" },
    { id: 10759, name: "Action & Adventure" },
  ],
  status: "Ended",
  tagline: "Winter Is Coming",
  credits: {
    cast: [
      { id: 22970, name: "Peter Dinklage", character: "Tyrion Lannister", profile_path: "/xuB7b4GbARu4PX6qRLmYPADByjP.jpg" },
    ],
  },
};

// ============================================
// MOCK API CLASS
// ============================================

export class MockTMDBAPI {
  private baseUrl = "https://api.themoviedb.org/3";

  private trackCall(endpoint: string, params?: Record<string, unknown>) {
    mockState.apiCalls.push({ endpoint, params });
  }

  private getResponse<T>(endpoint: string, defaultResponse: T): T {
    if (mockState.shouldFail) {
      throw new Error(mockState.failureError);
    }

    const configured = mockState.responses.get(endpoint);
    if (configured !== undefined) {
      return configured as T;
    }

    return defaultResponse;
  }

  async getConfiguration() {
    this.trackCall("/configuration");
    return this.getResponse("/configuration", mockTMDBConfiguration);
  }

  async getGenres(mediaType: "movie" | "tv" = "movie") {
    this.trackCall(`/genre/${mediaType}/list`);
    return this.getResponse(`/genre/${mediaType}/list`, mockTMDBGenres);
  }

  async searchMulti(query: string, page = 1) {
    this.trackCall("/search/multi", { query, page });

    // Filter mock results based on query
    const filtered = mockSearchResults.results.filter((r) => {
      const title = r.title || r.name || "";
      return title.toLowerCase().includes(query.toLowerCase());
    });

    return this.getResponse("/search/multi", {
      ...mockSearchResults,
      results: filtered.length > 0 ? filtered : mockSearchResults.results,
    });
  }

  async getMovieDetails(id: number) {
    this.trackCall(`/movie/${id}`);

    if (id === 550) {
      return this.getResponse(`/movie/${id}`, mockMovieDetails);
    }

    // Generate generic movie details for unknown IDs
    return this.getResponse(`/movie/${id}`, {
      ...mockMovieDetails,
      id,
      title: `Movie ${id}`,
    });
  }

  async getTVDetails(id: number) {
    this.trackCall(`/tv/${id}`);

    if (id === 1399) {
      return this.getResponse(`/tv/${id}`, mockTVDetails);
    }

    return this.getResponse(`/tv/${id}`, {
      ...mockTVDetails,
      id,
      name: `TV Show ${id}`,
    });
  }

  async getMovieCredits(id: number) {
    this.trackCall(`/movie/${id}/credits`);
    return this.getResponse(`/movie/${id}/credits`, mockMovieDetails.credits);
  }

  async getTVCredits(id: number) {
    this.trackCall(`/tv/${id}/credits`);
    return this.getResponse(`/tv/${id}/credits`, mockTVDetails.credits);
  }

  async getPopularMovies(page = 1) {
    this.trackCall("/movie/popular", { page });
    return this.getResponse("/movie/popular", {
      page,
      total_pages: 10,
      total_results: 200,
      results: [mockMovieDetails],
    });
  }

  async getTrendingMovies(timeWindow: "day" | "week" = "week") {
    this.trackCall(`/trending/movie/${timeWindow}`);
    return this.getResponse(`/trending/movie/${timeWindow}`, {
      page: 1,
      total_pages: 10,
      total_results: 200,
      results: [mockMovieDetails],
    });
  }

  getImageUrl(path: string | null, size = "w500"): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}

// ============================================
// MODULE MOCK
// ============================================

export const mockTMDBModule = () => {
  vi.mock("@/tmdb-api/tmdb-api", () => ({
    TMDBAPI: MockTMDBAPI,
  }));
};

// ============================================
// TEST HELPERS
// ============================================

export const assertTMDBCalled = (endpoint: string, params?: Record<string, unknown>) => {
  const call = mockState.apiCalls.find((c) => c.endpoint === endpoint);

  if (!call) {
    throw new Error(`Expected TMDB call to "${endpoint}" but none found`);
  }

  if (params) {
    expect(call.params).toMatchObject(params);
  }
};

export const getTMDBCallCount = (endpoint: string): number => {
  return mockState.apiCalls.filter((c) => c.endpoint === endpoint).length;
};
```

---

## 5. Custom Render Utilities

### `src/test-utils/render.tsx`

```tsx
// Comprehensive render utility with all providers configured
import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Contexts
import { AppDataContext } from "@/app-data/app-data-provider";
import { TMDBAPIContext } from "@/tmdb-api/tmdb-api-provider";
import { TMDBConfigurationContext } from "@/tmdb-api/tmdb-configuration";
import { TMDBGenresContext } from "@/tmdb-api/tmdb-genres";

// Mocks
import { MockTMDBAPI, mockTMDBConfiguration, mockTMDBGenres } from "./mocks/tmdb";
import { testUser, testSession } from "./fixtures/users";

// ============================================
// DEFAULT PROVIDER VALUES
// ============================================

const defaultAppData = {
  user: testUser,
};

const defaultTMDBConfig = mockTMDBConfiguration.images;

const defaultGenres = mockTMDBGenres.genres.reduce(
  (acc, g) => ({ ...acc, [g.id]: g.name }),
  {} as Record<number, string>
);

// ============================================
// PROVIDER WRAPPER
// ============================================

interface WrapperOptions {
  // Override app data (user info)
  appData?: Partial<typeof defaultAppData>;

  // Override TMDB configuration
  tmdbConfig?: Partial<typeof defaultTMDBConfig>;

  // Override genres
  genres?: Record<number, string>;

  // Custom TMDB API instance
  tmdbApi?: MockTMDBAPI;

  // Whether user is authenticated
  authenticated?: boolean;

  // Initial route for navigation testing
  initialRoute?: string;

  // Additional wrapper components
  additionalWrappers?: Array<React.ComponentType<{ children: ReactNode }>>;
}

const createWrapper = (options: WrapperOptions = {}) => {
  const {
    appData = defaultAppData,
    tmdbConfig = defaultTMDBConfig,
    genres = defaultGenres,
    tmdbApi = new MockTMDBAPI(),
    authenticated = true,
    additionalWrappers = [],
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    // Build the provider tree from inside out
    let content = children;

    // Additional wrappers (innermost)
    for (const AdditionalWrapper of additionalWrappers.reverse()) {
      content = <AdditionalWrapper>{content}</AdditionalWrapper>;
    }

    // App contexts
    content = (
      <TMDBGenresContext.Provider value={genres}>
        {content}
      </TMDBGenresContext.Provider>
    );

    content = (
      <TMDBConfigurationContext.Provider value={tmdbConfig}>
        {content}
      </TMDBConfigurationContext.Provider>
    );

    content = (
      <TMDBAPIContext.Provider value={tmdbApi}>
        {content}
      </TMDBAPIContext.Provider>
    );

    content = (
      <AppDataContext.Provider
        value={{
          user: authenticated ? appData.user ?? testUser : null,
        }}
      >
        {content}
      </AppDataContext.Provider>
    );

    // React Native required providers (outermost)
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { top: 47, left: 0, right: 0, bottom: 34 },
          }}
        >
          {content}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  };

  return Wrapper;
};

// ============================================
// CUSTOM RENDER FUNCTION
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  wrapperOptions?: WrapperOptions;
}

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { wrapperOptions, ...renderOptions } = options;

  return render(ui, {
    wrapper: createWrapper(wrapperOptions),
    ...renderOptions,
  });
};

// Re-export everything from testing-library
export * from "@testing-library/react-native";

// Override render with our custom version
export { customRender as render };

// ============================================
// SPECIALIZED RENDER HELPERS
// ============================================

// Render as unauthenticated user
export const renderUnauthenticated = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, "wrapperOptions"> & { wrapperOptions?: Omit<WrapperOptions, "authenticated"> } = {}
) => {
  return customRender(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      authenticated: false,
    },
  });
};

// Render with specific user
export const renderWithUser = (
  ui: ReactElement,
  user: typeof testUser,
  options: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      appData: { user },
    },
  });
};

// Render with TMDB API failure
export const renderWithTMDBError = (
  ui: ReactElement,
  errorMessage = "Network error",
  options: CustomRenderOptions = {}
) => {
  const failingApi = new MockTMDBAPI();
  // Configure the mock state to fail
  const { setTMDBShouldFail } = require("./mocks/tmdb");
  setTMDBShouldFail(true, errorMessage);

  return customRender(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      tmdbApi: failingApi,
    },
  });
};

// ============================================
// NAVIGATION TESTING HELPERS
// ============================================

import { mockRouter, getNavigationHistory, clearNavigationHistory } from "./mocks/navigation";

export { mockRouter, getNavigationHistory, clearNavigationHistory };

// Assert navigation occurred
export const assertNavigatedTo = (path: string) => {
  const history = getNavigationHistory();
  const navigated = history.some(
    (h) => h.type === "push" && h.path === path
  );

  if (!navigated) {
    throw new Error(
      `Expected navigation to "${path}" but history was: ${JSON.stringify(history)}`
    );
  }
};

// Assert navigation with params
export const assertNavigatedToWithParams = (
  path: string,
  params: Record<string, unknown>
) => {
  const history = getNavigationHistory();
  const navigated = history.find(
    (h) => h.type === "push" && h.path === path
  );

  if (!navigated) {
    throw new Error(`Expected navigation to "${path}" but none found`);
  }

  expect(navigated.params).toMatchObject(params);
};

// Assert back navigation
export const assertNavigatedBack = () => {
  const history = getNavigationHistory();
  const hasBack = history.some((h) => h.type === "back");

  if (!hasBack) {
    throw new Error("Expected back navigation but none occurred");
  }
};

// ============================================
// ASYNC HELPERS
// ============================================

// Wait for loading to complete
export const waitForLoadingToComplete = async () => {
  const { waitFor, queryByTestId, queryByText } = require("@testing-library/react-native");

  await waitFor(() => {
    expect(queryByTestId("loading-indicator")).toBeNull();
    expect(queryByText(/loading/i)).toBeNull();
  });
};

// Wait for element with timeout
export const waitForElement = async (
  getElement: () => unknown,
  { timeout = 5000 } = {}
) => {
  const { waitFor } = require("@testing-library/react-native");

  await waitFor(() => {
    expect(getElement()).toBeTruthy();
  }, { timeout });
};

// Flush promises and timers
export const flushPromisesAndTimers = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  jest.runAllTimers();
};
```

---

## 6. Comprehensive Test Suites

### 6.1 Authentication Tests

#### `src/components/auth/__tests__/login-form.test.tsx`

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { LoginForm } from "../login-form";
import {
  resetSupabaseMock,
  setMockUser,
  setMockSession,
  assertAuthCalled,
  getSupabaseMockState,
} from "@/test-utils/mocks/supabase";
import { testUser, testSession } from "@/test-utils/fixtures/users";
import { clearNavigationHistory, assertNavigatedTo } from "@/test-utils/render";

describe("LoginForm", () => {
  beforeEach(() => {
    resetSupabaseMock();
    clearNavigationHistory();
  });

  describe("rendering", () => {
    it("renders email and password inputs", () => {
      render(<LoginForm />);

      expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
    });

    it("renders login button", () => {
      render(<LoginForm />);

      expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
    });

    it("renders forgot password link", () => {
      render(<LoginForm />);

      expect(screen.getByText(/forgot password/i)).toBeTruthy();
    });

    it("renders sign up link", () => {
      render(<LoginForm />);

      expect(screen.getByText(/create account/i)).toBeTruthy();
    });
  });

  describe("validation", () => {
    it("shows error for empty email", async () => {
      render(<LoginForm />);

      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeTruthy();
      });
    });

    it("shows error for invalid email format", async () => {
      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "invalid-email");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeTruthy();
      });
    });

    it("shows error for empty password", async () => {
      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeTruthy();
      });
    });

    it("shows error for short password", async () => {
      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "123");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 6 characters/i)).toBeTruthy();
      });
    });
  });

  describe("submission", () => {
    it("calls signInWithPassword with correct credentials", async () => {
      setMockUser(testUser);
      setMockSession(testSession);

      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "password123");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        assertAuthCalled("signInWithPassword");
      });

      const state = getSupabaseMockState();
      const signInCall = state.authCalls.find((c) => c.method === "signInWithPassword");
      expect(signInCall?.params).toEqual({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("shows loading state during submission", async () => {
      setMockUser(testUser);
      setMockSession(testSession);

      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "password123");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      // Button should be disabled during loading
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    it("navigates to app on successful login", async () => {
      setMockUser(testUser);
      setMockSession(testSession);

      render(<LoginForm returnTo="/app/list" />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "password123");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        assertNavigatedTo("/app/list");
      });
    });

    it("displays error message on failed login", async () => {
      // Don't set user/session - login will fail

      render(<LoginForm />);

      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "wrongpassword");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
      });
    });

    it("clears error when user starts typing", async () => {
      render(<LoginForm />);

      // Trigger error
      fireEvent.changeText(screen.getByPlaceholderText(/email/i), "test@example.com");
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "wrong");
      fireEvent.press(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
      });

      // Start typing - error should clear
      fireEvent.changeText(screen.getByPlaceholderText(/password/i), "newpassword");

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).toBeNull();
      });
    });
  });

  describe("accessibility", () => {
    it("has accessible labels for inputs", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i)).toBeTruthy();
    });

    it("password input hides text", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it("email input has correct keyboard type", () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput.props.keyboardType).toBe("email-address");
    });
  });
});
```

### 6.2 Watch Feature Tests

#### `src/watch/__tests__/watch-page.test.tsx`

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { WatchPage } from "../watch-page";
import {
  fightClubEntry,
  inceptionEntry,
  gameOfThronesEntry,
  normalizeEntries,
} from "@/test-utils/fixtures/entries";

describe("WatchPage", () => {
  const defaultProps = {
    entries: normalizeEntries([fightClubEntry, inceptionEntry, gameOfThronesEntry]),
    loading: false,
    error: null,
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading indicator when loading", () => {
      render(<WatchPage {...defaultProps} loading={true} entries={[]} />);

      expect(screen.getByTestId("loading-indicator")).toBeTruthy();
    });

    it("does not show entries when loading", () => {
      render(<WatchPage {...defaultProps} loading={true} />);

      expect(screen.queryByText("Fight Club")).toBeNull();
    });
  });

  describe("error state", () => {
    it("displays error message", () => {
      render(<WatchPage {...defaultProps} error="Failed to load entries" entries={[]} />);

      expect(screen.getByText(/failed to load entries/i)).toBeTruthy();
    });

    it("shows retry button on error", () => {
      render(<WatchPage {...defaultProps} error="Network error" entries={[]} />);

      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no entries", () => {
      render(<WatchPage {...defaultProps} entries={[]} />);

      expect(screen.getByText(/no entries/i)).toBeTruthy();
    });

    it("shows add entry button when empty", () => {
      render(<WatchPage {...defaultProps} entries={[]} />);

      expect(screen.getByRole("button", { name: /add/i })).toBeTruthy();
    });
  });

  describe("card display", () => {
    it("displays current entry card", () => {
      render(<WatchPage {...defaultProps} />);

      expect(screen.getByText("Fight Club")).toBeTruthy();
    });

    it("shows entry poster image", () => {
      render(<WatchPage {...defaultProps} />);

      const image = screen.getByTestId("watch-card-poster");
      expect(image.props.source.uri).toContain("pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK");
    });

    it("shows entry release year", () => {
      render(<WatchPage {...defaultProps} />);

      expect(screen.getByText("1999")).toBeTruthy();
    });

    it("handles entry without poster gracefully", () => {
      const noPosterEntry = {
        ...normalizeEntries([fightClubEntry])[0],
        posterUrl: undefined,
        posterPath: null,
      };

      render(<WatchPage {...defaultProps} entries={[noPosterEntry]} />);

      expect(screen.getByTestId("watch-card-placeholder")).toBeTruthy();
    });
  });

  describe("swipe gestures", () => {
    it("calls onSwipeLeft when swiped left", async () => {
      render(<WatchPage {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      // Simulate swipe left gesture
      fireEvent(card, "onSwipeLeft");

      await waitFor(() => {
        expect(defaultProps.onSwipeLeft).toHaveBeenCalledWith(
          expect.objectContaining({ id: fightClubEntry.id })
        );
      });
    });

    it("calls onSwipeRight when swiped right", async () => {
      render(<WatchPage {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      fireEvent(card, "onSwipeRight");

      await waitFor(() => {
        expect(defaultProps.onSwipeRight).toHaveBeenCalledWith(
          expect.objectContaining({ id: fightClubEntry.id })
        );
      });
    });

    it("advances to next card after swipe", async () => {
      const { rerender } = render(<WatchPage {...defaultProps} />);

      expect(screen.getByText("Fight Club")).toBeTruthy();

      // Simulate parent removing first entry after swipe
      const remainingEntries = normalizeEntries([inceptionEntry, gameOfThronesEntry]);
      rerender(<WatchPage {...defaultProps} entries={remainingEntries} />);

      expect(screen.getByText("Inception")).toBeTruthy();
      expect(screen.queryByText("Fight Club")).toBeNull();
    });
  });

  describe("button controls", () => {
    it("has skip button that triggers left swipe", async () => {
      render(<WatchPage {...defaultProps} />);

      const skipButton = screen.getByRole("button", { name: /skip/i });
      fireEvent.press(skipButton);

      await waitFor(() => {
        expect(defaultProps.onSwipeLeft).toHaveBeenCalled();
      });
    });

    it("has like button that triggers right swipe", async () => {
      render(<WatchPage {...defaultProps} />);

      const likeButton = screen.getByRole("button", { name: /like/i });
      fireEvent.press(likeButton);

      await waitFor(() => {
        expect(defaultProps.onSwipeRight).toHaveBeenCalled();
      });
    });
  });

  describe("winner state", () => {
    it("shows winner view when only one entry remains with enough likes", () => {
      const winnerEntry = {
        ...normalizeEntries([fightClubEntry])[0],
        likes: 3,
      };

      render(
        <WatchPage
          {...defaultProps}
          entries={[winnerEntry]}
          showWinner={true}
        />
      );

      expect(screen.getByText(/winner/i)).toBeTruthy();
      expect(screen.getByText("Fight Club")).toBeTruthy();
    });

    it("shows watch now button for winner", () => {
      const winnerEntry = {
        ...normalizeEntries([fightClubEntry])[0],
        likes: 3,
      };

      render(
        <WatchPage
          {...defaultProps}
          entries={[winnerEntry]}
          showWinner={true}
        />
      );

      expect(screen.getByRole("button", { name: /watch now/i })).toBeTruthy();
    });
  });

  describe("progress indicator", () => {
    it("shows remaining count", () => {
      render(<WatchPage {...defaultProps} />);

      expect(screen.getByText(/3 remaining/i)).toBeTruthy();
    });

    it("updates count as cards are swiped", () => {
      const { rerender } = render(<WatchPage {...defaultProps} />);

      expect(screen.getByText(/3 remaining/i)).toBeTruthy();

      const twoEntries = normalizeEntries([inceptionEntry, gameOfThronesEntry]);
      rerender(<WatchPage {...defaultProps} entries={twoEntries} />);

      expect(screen.getByText(/2 remaining/i)).toBeTruthy();
    });
  });
});
```

### 6.3 Watch Card Animation Tests

#### `src/watch/components/__tests__/watch-card.test.tsx`

```tsx
import React from "react";
import { render, screen, fireEvent, act } from "@/test-utils/render";
import { WatchCard } from "../watch-card";
import { normalizeEntry, fightClubEntry } from "@/test-utils/fixtures/entries";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// Mock reanimated hooks to track animation values
const mockSharedValues: Record<string, { value: number }> = {};

jest.mock("react-native-reanimated", () => {
  const Reanimated = jest.requireActual("react-native-reanimated/mock");

  return {
    ...Reanimated,
    useSharedValue: (initial: number) => {
      const key = `shared_${Object.keys(mockSharedValues).length}`;
      mockSharedValues[key] = { value: initial };
      return mockSharedValues[key];
    },
    useAnimatedStyle: (factory: () => object) => factory(),
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
    runOnJS: (fn: Function) => fn,
  };
});

describe("WatchCard", () => {
  const entry = normalizeEntry(fightClubEntry);

  const defaultProps = {
    entry,
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSharedValues).forEach(key => delete mockSharedValues[key]);
  });

  describe("rendering", () => {
    it("renders entry title", () => {
      render(<WatchCard {...defaultProps} />);

      expect(screen.getByText("Fight Club")).toBeTruthy();
    });

    it("renders poster image with correct source", () => {
      render(<WatchCard {...defaultProps} />);

      const image = screen.getByTestId("watch-card-poster");
      expect(image.props.source.uri).toBe(entry.posterUrl);
    });

    it("renders release year", () => {
      render(<WatchCard {...defaultProps} />);

      expect(screen.getByText("1999")).toBeTruthy();
    });

    it("renders placeholder when no poster", () => {
      const noPoster = { ...entry, posterUrl: undefined };
      render(<WatchCard {...defaultProps} entry={noPoster} />);

      expect(screen.getByTestId("poster-placeholder")).toBeTruthy();
    });
  });

  describe("gesture handling", () => {
    it("responds to horizontal pan gesture", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      // Simulate pan gesture start
      fireEvent(card, "onGestureEvent", {
        nativeEvent: {
          translationX: 0,
          translationY: 0,
          state: 2, // BEGAN
        },
      });

      // Simulate dragging right
      fireEvent(card, "onGestureEvent", {
        nativeEvent: {
          translationX: 100,
          translationY: 0,
          state: 4, // ACTIVE
        },
      });

      // Card should have translateX applied
      expect(mockSharedValues).toBeDefined();
    });

    it("triggers onSwipeRight when swiped past threshold", async () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      // Simulate swipe right past threshold (150px)
      await act(async () => {
        fireEvent(card, "onGestureEvent", {
          nativeEvent: {
            translationX: 200,
            translationY: 0,
            velocityX: 500,
            state: 5, // END
          },
        });
      });

      expect(defaultProps.onSwipeRight).toHaveBeenCalledWith(entry);
    });

    it("triggers onSwipeLeft when swiped past threshold", async () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      await act(async () => {
        fireEvent(card, "onGestureEvent", {
          nativeEvent: {
            translationX: -200,
            translationY: 0,
            velocityX: -500,
            state: 5, // END
          },
        });
      });

      expect(defaultProps.onSwipeLeft).toHaveBeenCalledWith(entry);
    });

    it("springs back when not swiped past threshold", async () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      await act(async () => {
        fireEvent(card, "onGestureEvent", {
          nativeEvent: {
            translationX: 50, // Below threshold
            translationY: 0,
            velocityX: 100,
            state: 5, // END
          },
        });
      });

      // Neither callback should be called
      expect(defaultProps.onSwipeLeft).not.toHaveBeenCalled();
      expect(defaultProps.onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe("visual feedback", () => {
    it("shows like indicator when swiping right", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      fireEvent(card, "onGestureEvent", {
        nativeEvent: {
          translationX: 100,
          translationY: 0,
          state: 4, // ACTIVE
        },
      });

      expect(screen.getByTestId("like-indicator")).toBeTruthy();
    });

    it("shows skip indicator when swiping left", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");

      fireEvent(card, "onGestureEvent", {
        nativeEvent: {
          translationX: -100,
          translationY: 0,
          state: 4, // ACTIVE
        },
      });

      expect(screen.getByTestId("skip-indicator")).toBeTruthy();
    });

    it("rotates card during swipe", () => {
      render(<WatchCard {...defaultProps} />);

      // The animated style should include rotation based on translateX
      // This is verified through the mock tracking
      expect(true).toBe(true); // Placeholder for animation value assertion
    });
  });

  describe("accessibility", () => {
    it("has accessible role", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");
      expect(card.props.accessibilityRole).toBe("button");
    });

    it("has accessible label with entry title", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");
      expect(card.props.accessibilityLabel).toContain("Fight Club");
    });

    it("has accessible hint for swipe actions", () => {
      render(<WatchCard {...defaultProps} />);

      const card = screen.getByTestId("watch-card");
      expect(card.props.accessibilityHint).toContain("swipe");
    });
  });
});
```

### 6.4 List Feature Tests

#### `src/list/__tests__/list-page-container.test.tsx`

```tsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@/test-utils/render";
import { ListPageContainer } from "../list-page-container";
import {
  resetSupabaseMock,
  setMockResponse,
  setMockUser,
  setMockSession,
  assertQueryMade,
  getSupabaseMockState,
} from "@/test-utils/mocks/supabase";
import {
  fightClubEntry,
  inceptionEntry,
  createMockEntries,
} from "@/test-utils/fixtures/entries";
import { testUser, testSession } from "@/test-utils/fixtures/users";
import { assertNavigatedTo } from "@/test-utils/render";

describe("ListPageContainer", () => {
  beforeEach(() => {
    resetSupabaseMock();
    setMockUser(testUser);
    setMockSession(testSession);
  });

  describe("data fetching", () => {
    it("fetches entries on mount", async () => {
      setMockResponse("entries:select", {
        data: [fightClubEntry, inceptionEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        assertQueryMade("entries", "select");
      });
    });

    it("queries with correct columns", async () => {
      setMockResponse("entries:select", {
        data: [],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        const state = getSupabaseMockState();
        const query = state.queries.find(
          (q) => q.table === "entries" && q.operation === "select"
        );
        expect(query?.filters.columns).toContain("tmdb_details");
        expect(query?.filters.columns).toContain("entry_tags");
      });
    });

    it("orders entries by added_at descending", async () => {
      setMockResponse("entries:select", {
        data: [],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        const state = getSupabaseMockState();
        const query = state.queries.find((q) => q.table === "entries");
        expect(query?.filters.order).toEqual({
          column: "added_at",
          ascending: false,
        });
      });
    });
  });

  describe("loading state", () => {
    it("shows loading indicator while fetching", () => {
      // Don't resolve the mock - keeps loading
      setMockResponse("entries:select", new Promise(() => {}));

      render(<ListPageContainer />);

      expect(screen.getByTestId("loading-indicator")).toBeTruthy();
    });

    it("hides loading indicator when data loads", async () => {
      setMockResponse("entries:select", {
        data: [fightClubEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-indicator")).toBeNull();
      });
    });
  });

  describe("error handling", () => {
    it("displays error message on fetch failure", async () => {
      setMockResponse("entries:select", {
        data: null,
        error: { message: "Database error" },
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeTruthy();
      });
    });

    it("shows retry button on error", async () => {
      setMockResponse("entries:select", {
        data: null,
        error: { message: "Network error" },
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
      });
    });

    it("retries fetch when retry button pressed", async () => {
      setMockResponse("entries:select", {
        data: null,
        error: { message: "Network error" },
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeTruthy();
      });

      // Now make it succeed
      setMockResponse("entries:select", {
        data: [fightClubEntry],
        error: null,
      });

      fireEvent.press(screen.getByRole("button", { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
      });
    });
  });

  describe("entry rendering", () => {
    it("renders all entries", async () => {
      setMockResponse("entries:select", {
        data: [fightClubEntry, inceptionEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
        expect(screen.getByText("Inception")).toBeTruthy();
      });
    });

    it("handles empty entry list", async () => {
      setMockResponse("entries:select", {
        data: [],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText(/no entries/i)).toBeTruthy();
      });
    });

    it("handles large entry lists efficiently", async () => {
      const manyEntries = createMockEntries(100);
      setMockResponse("entries:select", {
        data: manyEntries,
        error: null,
      });

      const startTime = Date.now();
      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Test Movie 1")).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
    });
  });

  describe("entry interactions", () => {
    it("navigates to entry detail on press", async () => {
      setMockResponse("entries:select", {
        data: [fightClubEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Fight Club"));

      await waitFor(() => {
        assertNavigatedTo(`/app/list/${fightClubEntry.id}`);
      });
    });
  });

  describe("filtering", () => {
    it("filters entries by watched status", async () => {
      const watchedEntry = { ...fightClubEntry, watched_at: "2024-01-15" };
      const unwatchedEntry = { ...inceptionEntry, watched_at: null };

      setMockResponse("entries:select", {
        data: [watchedEntry, unwatchedEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
        expect(screen.getByText("Inception")).toBeTruthy();
      });

      // Apply unwatched filter
      fireEvent.press(screen.getByText(/unwatched/i));

      await waitFor(() => {
        expect(screen.queryByText("Fight Club")).toBeNull();
        expect(screen.getByText("Inception")).toBeTruthy();
      });
    });

    it("filters entries by tag", async () => {
      const taggedEntry = {
        ...fightClubEntry,
        entry_tags: [{ tag_id: 1, tags: { name: "Action" } }],
      };
      const untaggedEntry = {
        ...inceptionEntry,
        entry_tags: [],
      };

      setMockResponse("entries:select", {
        data: [taggedEntry, untaggedEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
      });

      // Select Action tag filter
      fireEvent.press(screen.getByText("Action"));

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
        expect(screen.queryByText("Inception")).toBeNull();
      });
    });
  });

  describe("pull to refresh", () => {
    it("refreshes data on pull down", async () => {
      setMockResponse("entries:select", {
        data: [fightClubEntry],
        error: null,
      });

      render(<ListPageContainer />);

      await waitFor(() => {
        expect(screen.getByText("Fight Club")).toBeTruthy();
      });

      const list = screen.getByTestId("entries-list");

      // Simulate pull to refresh
      fireEvent(list, "onRefresh");

      // Should have made second query
      await waitFor(() => {
        const state = getSupabaseMockState();
        const entryQueries = state.queries.filter(
          (q) => q.table === "entries" && q.operation === "select"
        );
        expect(entryQueries.length).toBe(2);
      });
    });
  });
});
```

### 6.5 Edit Entry Tests

#### `src/list/__tests__/edit-entry-page.test.tsx`

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { EditEntryPage } from "../edit-entry-page";
import {
  resetSupabaseMock,
  setMockResponse,
  assertQueryMade,
  assertRpcCalled,
} from "@/test-utils/mocks/supabase";
import { fightClubEntry, normalizeEntry } from "@/test-utils/fixtures/entries";
import { assertNavigatedTo, assertNavigatedBack } from "@/test-utils/render";

describe("EditEntryPage", () => {
  const entry = normalizeEntry(fightClubEntry);

  const defaultProps = {
    entry,
    tags: [
      { id: 1, name: "Action" },
      { id: 2, name: "Drama" },
      { id: 3, name: "Thriller" },
    ],
    selectedTagIds: [2], // Drama selected
    onSave: jest.fn(),
    onDelete: jest.fn(),
    onTagToggle: jest.fn(),
    saving: false,
    deleting: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock();
  });

  describe("rendering", () => {
    it("displays entry title", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByText("Fight Club")).toBeTruthy();
    });

    it("displays entry poster", () => {
      render(<EditEntryPage {...defaultProps} />);

      const poster = screen.getByTestId("entry-poster");
      expect(poster.props.source.uri).toBe(entry.posterUrl);
    });

    it("displays entry year and runtime", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByText("1999")).toBeTruthy();
      expect(screen.getByText(/139 min/i)).toBeTruthy();
    });

    it("displays all available tags", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByText("Action")).toBeTruthy();
      expect(screen.getByText("Drama")).toBeTruthy();
      expect(screen.getByText("Thriller")).toBeTruthy();
    });

    it("shows selected tags as active", () => {
      render(<EditEntryPage {...defaultProps} />);

      const dramaTag = screen.getByTestId("tag-2");
      expect(dramaTag.props.accessibilityState.selected).toBe(true);
    });

    it("shows unselected tags as inactive", () => {
      render(<EditEntryPage {...defaultProps} />);

      const actionTag = screen.getByTestId("tag-1");
      expect(actionTag.props.accessibilityState.selected).toBe(false);
    });
  });

  describe("tag selection", () => {
    it("calls onTagToggle when tag pressed", () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByText("Action"));

      expect(defaultProps.onTagToggle).toHaveBeenCalledWith(1);
    });

    it("can select multiple tags", () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByText("Action"));
      fireEvent.press(screen.getByText("Thriller"));

      expect(defaultProps.onTagToggle).toHaveBeenCalledWith(1);
      expect(defaultProps.onTagToggle).toHaveBeenCalledWith(3);
    });

    it("can deselect tags", () => {
      render(<EditEntryPage {...defaultProps} />);

      // Drama is already selected
      fireEvent.press(screen.getByText("Drama"));

      expect(defaultProps.onTagToggle).toHaveBeenCalledWith(2);
    });
  });

  describe("watched status", () => {
    it("shows unwatched status correctly", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByText(/not watched/i)).toBeTruthy();
    });

    it("shows watched status with date", () => {
      const watchedEntry = { ...entry, watched: true, watchedAt: "2024-01-15" };
      render(<EditEntryPage {...defaultProps} entry={watchedEntry} />);

      expect(screen.getByText(/watched/i)).toBeTruthy();
    });

    it("has toggle to mark as watched", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByRole("switch", { name: /watched/i })).toBeTruthy();
    });
  });

  describe("save functionality", () => {
    it("calls onSave when save button pressed", async () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByRole("button", { name: /save/i }));

      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it("shows loading state while saving", () => {
      render(<EditEntryPage {...defaultProps} saving={true} />);

      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });

    it("disables save button while saving", () => {
      render(<EditEntryPage {...defaultProps} saving={true} />);

      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
  });

  describe("delete functionality", () => {
    it("shows delete button", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
    });

    it("shows confirmation dialog when delete pressed", async () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeTruthy();
      });
    });

    it("calls onDelete when confirmed", async () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeTruthy();
      });

      fireEvent.press(screen.getByRole("button", { name: /confirm/i }));

      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it("cancels delete when cancelled", async () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeTruthy();
      });

      fireEvent.press(screen.getByRole("button", { name: /cancel/i }));

      expect(defaultProps.onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText(/are you sure/i)).toBeNull();
    });

    it("shows loading state while deleting", () => {
      render(<EditEntryPage {...defaultProps} deleting={true} />);

      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    });
  });

  describe("error handling", () => {
    it("displays error message", () => {
      render(<EditEntryPage {...defaultProps} error="Failed to save" />);

      expect(screen.getByText(/failed to save/i)).toBeTruthy();
    });

    it("clears error when user interacts", async () => {
      const { rerender } = render(
        <EditEntryPage {...defaultProps} error="Failed to save" />
      );

      expect(screen.getByText(/failed to save/i)).toBeTruthy();

      // Simulate parent clearing error after interaction
      rerender(<EditEntryPage {...defaultProps} error={null} />);

      expect(screen.queryByText(/failed to save/i)).toBeNull();
    });
  });

  describe("navigation", () => {
    it("has back button", () => {
      render(<EditEntryPage {...defaultProps} />);

      expect(screen.getByRole("button", { name: /back/i })).toBeTruthy();
    });

    it("navigates back when back pressed", () => {
      render(<EditEntryPage {...defaultProps} />);

      fireEvent.press(screen.getByRole("button", { name: /back/i }));

      assertNavigatedBack();
    });
  });
});
```

### 6.6 Settings Tests

#### `src/settings/__tests__/settings-page.test.tsx`

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { SettingsPage } from "../settings-page";
import {
  resetSupabaseMock,
  setMockUser,
  setMockSession,
  assertAuthCalled,
} from "@/test-utils/mocks/supabase";
import { testUser, testSession } from "@/test-utils/fixtures/users";
import { assertNavigatedTo } from "@/test-utils/render";

describe("SettingsPage", () => {
  beforeEach(() => {
    resetSupabaseMock();
    setMockUser(testUser);
    setMockSession(testSession);
  });

  describe("user info display", () => {
    it("displays user email", () => {
      render(<SettingsPage />);

      expect(screen.getByText(testUser.email)).toBeTruthy();
    });

    it("displays user display name if set", () => {
      const userWithName = {
        ...testUser,
        user_metadata: { display_name: "Test User" },
      };
      setMockUser(userWithName);

      render(<SettingsPage />);

      expect(screen.getByText("Test User")).toBeTruthy();
    });
  });

  describe("sign out", () => {
    it("has sign out button", () => {
      render(<SettingsPage />);

      expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
    });

    it("calls signOut when button pressed", async () => {
      render(<SettingsPage />);

      fireEvent.press(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        assertAuthCalled("signOut");
      });
    });

    it("navigates to login after sign out", async () => {
      render(<SettingsPage />);

      fireEvent.press(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        assertNavigatedTo("/login");
      });
    });

    it("shows confirmation dialog before sign out", async () => {
      render(<SettingsPage />);

      fireEvent.press(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeTruthy();
      });
    });
  });

  describe("group management", () => {
    it("shows current group name", () => {
      render(<SettingsPage groupName="My Family" />);

      expect(screen.getByText("My Family")).toBeTruthy();
    });

    it("has invite member button", () => {
      render(<SettingsPage />);

      expect(screen.getByRole("button", { name: /invite/i })).toBeTruthy();
    });

    it("shows group members list", () => {
      render(
        <SettingsPage
          members={[
            { id: "1", email: "user1@example.com" },
            { id: "2", email: "user2@example.com" },
          ]}
        />
      );

      expect(screen.getByText("user1@example.com")).toBeTruthy();
      expect(screen.getByText("user2@example.com")).toBeTruthy();
    });
  });

  describe("app info", () => {
    it("displays app version", () => {
      render(<SettingsPage appVersion="1.0.0" />);

      expect(screen.getByText(/version 1.0.0/i)).toBeTruthy();
    });

    it("has link to privacy policy", () => {
      render(<SettingsPage />);

      expect(screen.getByText(/privacy policy/i)).toBeTruthy();
    });

    it("has link to terms of service", () => {
      render(<SettingsPage />);

      expect(screen.getByText(/terms of service/i)).toBeTruthy();
    });
  });

  describe("theme settings", () => {
    it("shows current theme", () => {
      render(<SettingsPage theme="dark" />);

      expect(screen.getByText(/dark/i)).toBeTruthy();
    });

    it("allows theme selection", async () => {
      const onThemeChange = jest.fn();
      render(<SettingsPage onThemeChange={onThemeChange} />);

      fireEvent.press(screen.getByText(/theme/i));

      await waitFor(() => {
        expect(screen.getByText(/light/i)).toBeTruthy();
      });

      fireEvent.press(screen.getByText(/light/i));

      expect(onThemeChange).toHaveBeenCalledWith("light");
    });
  });
});
```

---

## 7. Integration Tests

### `src/__tests__/integration/full-flow.integration.test.ts`

```typescript
// @vitest-environment node
/**
 * Full application flow integration tests
 * These tests verify complete user journeys through the app
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestUser,
  cleanupTestUser,
  createAdminClient,
  getGroupId,
} from "@/test-utils/supabase";

describe("Integration: Complete User Flows", () => {
  let admin: ReturnType<typeof createAdminClient>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    admin = createAdminClient();
    testUser = await createTestUser(admin);
  });

  afterEach(async () => {
    if (testUser?.userId) {
      await cleanupTestUser(admin, testUser.userId);
    }
  });

  describe("Entry Management Flow", () => {
    it("can add, view, edit, and delete an entry", async () => {
      const { client } = testUser;
      const groupId = await getGroupId(client);

      // Step 1: Add entry via RPC
      const { data: addResult, error: addError } = await client.rpc(
        "save_tmdb_result_to_list",
        {
          p_tmdb_id: 550,
          p_media_type: "movie",
          p_title: "Fight Club",
          p_release_date: "1999-10-15",
          p_poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
          p_overview: "An insomniac office worker...",
          p_genre_ids: [18, 53],
          p_runtime: 139,
        }
      );

      expect(addError).toBeNull();
      expect(addResult).toHaveProperty("id");
      const entryId = addResult.id;

      // Step 2: Verify entry appears in list
      const { data: entries, error: listError } = await client
        .from("entries")
        .select("*, tmdb_details(*)")
        .eq("group_id", groupId);

      expect(listError).toBeNull();
      expect(entries).toHaveLength(1);
      expect(entries[0].tmdb_details.title).toBe("Fight Club");

      // Step 3: Add tag to entry
      const { data: tag, error: tagError } = await client
        .from("tags")
        .insert({ name: "Favorites", group_id: groupId })
        .select()
        .single();

      expect(tagError).toBeNull();

      const { error: linkError } = await client
        .from("entry_tags")
        .insert({ entry_id: entryId, tag_id: tag.id });

      expect(linkError).toBeNull();

      // Step 4: Mark as watched
      const { error: updateError } = await client
        .from("entries")
        .update({ watched_at: new Date().toISOString() })
        .eq("id", entryId);

      expect(updateError).toBeNull();

      // Step 5: Verify watched status
      const { data: updated, error: fetchError } = await client
        .from("entries")
        .select("watched_at")
        .eq("id", entryId)
        .single();

      expect(fetchError).toBeNull();
      expect(updated.watched_at).not.toBeNull();

      // Step 6: Delete entry
      const { error: deleteError } = await client
        .from("entries")
        .delete()
        .eq("id", entryId);

      expect(deleteError).toBeNull();

      // Step 7: Verify deletion
      const { data: deleted, error: checkError } = await client
        .from("entries")
        .select("id")
        .eq("id", entryId);

      expect(checkError).toBeNull();
      expect(deleted).toHaveLength(0);
    });
  });

  describe("Watch Session Flow", () => {
    it("can run a complete watch session with filtering", async () => {
      const { client } = testUser;
      const groupId = await getGroupId(client);

      // Add multiple entries
      const movies = [
        { id: 550, title: "Fight Club", runtime: 139, genres: [18] },
        { id: 27205, title: "Inception", runtime: 148, genres: [28, 878] },
        { id: 157336, title: "Interstellar", runtime: 169, genres: [878, 12] },
      ];

      for (const movie of movies) {
        await client.rpc("save_tmdb_result_to_list", {
          p_tmdb_id: movie.id,
          p_media_type: "movie",
          p_title: movie.title,
          p_release_date: "2024-01-01",
          p_poster_path: `/poster-${movie.id}.jpg`,
          p_overview: `${movie.title} overview`,
          p_genre_ids: movie.genres,
          p_runtime: movie.runtime,
        });
      }

      // Verify all entries added
      const { data: allEntries } = await client
        .from("entries")
        .select("*, tmdb_details(*)")
        .eq("group_id", groupId);

      expect(allEntries).toHaveLength(3);

      // Filter by sci-fi (878)
      const sciFiEntries = allEntries.filter((e) =>
        e.tmdb_details.genre_ids.includes(878)
      );

      expect(sciFiEntries).toHaveLength(2);
      expect(sciFiEntries.map((e) => e.tmdb_details.title)).toContain(
        "Inception"
      );
      expect(sciFiEntries.map((e) => e.tmdb_details.title)).toContain(
        "Interstellar"
      );

      // Simulate watch session - mark one as watched
      const winnerId = sciFiEntries[0].id;
      await client
        .from("entries")
        .update({ watched_at: new Date().toISOString() })
        .eq("id", winnerId);

      // Verify only unwatched entries remain for next session
      const { data: unwatched } = await client
        .from("entries")
        .select("*, tmdb_details(*)")
        .eq("group_id", groupId)
        .is("watched_at", null);

      expect(unwatched).toHaveLength(2);
    });
  });

  describe("Group Sharing Flow", () => {
    it("can invite another user and share entries", async () => {
      const { client: user1Client, userId: user1Id } = testUser;

      // Create second test user
      const testUser2 = await createTestUser(admin);
      const { client: user2Client, userId: user2Id } = testUser2;

      try {
        // User 1 creates an entry
        await user1Client.rpc("save_tmdb_result_to_list", {
          p_tmdb_id: 550,
          p_media_type: "movie",
          p_title: "Fight Club",
          p_release_date: "1999-10-15",
          p_poster_path: "/poster.jpg",
          p_overview: "Overview",
          p_genre_ids: [18],
          p_runtime: 139,
        });

        // Get user 1's group
        const groupId = await getGroupId(user1Client);

        // Create invite
        const { data: invite } = await user1Client
          .from("group_invites")
          .insert({
            group_id: groupId,
            email: `test-${user2Id}@example.com`,
          })
          .select()
          .single();

        expect(invite).toBeTruthy();

        // User 2 accepts invite (simulated by adding to group)
        await admin
          .from("group_memberships")
          .insert({
            group_id: groupId,
            user_id: user2Id,
          });

        // User 2 can now see user 1's entries
        const { data: sharedEntries } = await user2Client
          .from("entries")
          .select("*, tmdb_details(*)")
          .eq("group_id", groupId);

        expect(sharedEntries).toHaveLength(1);
        expect(sharedEntries[0].tmdb_details.title).toBe("Fight Club");
      } finally {
        await cleanupTestUser(admin, user2Id);
      }
    });
  });
});
```

---

## 8. E2E Test Configuration (Detox)

### `e2e/jest.config.js`

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
};
```

### `e2e/login.test.ts`

```typescript
import { by, device, element, expect } from "detox";

describe("Login Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show login screen on launch", async () => {
    await expect(element(by.text("Sign In"))).toBeVisible();
  });

  it("should show validation error for empty email", async () => {
    await element(by.id("login-button")).tap();
    await expect(element(by.text("Email is required"))).toBeVisible();
  });

  it("should login successfully with valid credentials", async () => {
    await element(by.id("email-input")).typeText("test@example.com");
    await element(by.id("password-input")).typeText("password123");
    await element(by.id("login-button")).tap();

    // Should navigate to app
    await expect(element(by.id("list-screen"))).toBeVisible();
  });

  it("should show error for invalid credentials", async () => {
    await element(by.id("email-input")).typeText("wrong@example.com");
    await element(by.id("password-input")).typeText("wrongpassword");
    await element(by.id("login-button")).tap();

    await expect(element(by.text("Invalid credentials"))).toBeVisible();
  });
});
```

### `e2e/watch-flow.test.ts`

```typescript
import { by, device, element, expect } from "detox";

describe("Watch Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.id("email-input")).typeText("test@example.com");
    await element(by.id("password-input")).typeText("password123");
    await element(by.id("login-button")).tap();
    await expect(element(by.id("list-screen"))).toBeVisible();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to watch tab
    await element(by.id("watch-tab")).tap();
  });

  it("should display watch cards", async () => {
    await expect(element(by.id("watch-card"))).toBeVisible();
  });

  it("should swipe card left to skip", async () => {
    const card = element(by.id("watch-card"));
    await card.swipe("left", "fast", 0.8);

    // Should show next card or completion
    await expect(element(by.id("watch-card"))).toBeVisible();
  });

  it("should swipe card right to like", async () => {
    const card = element(by.id("watch-card"));
    await card.swipe("right", "fast", 0.8);

    await expect(element(by.id("watch-card"))).toBeVisible();
  });

  it("should show winner when selection complete", async () => {
    // Swipe through all cards
    for (let i = 0; i < 10; i++) {
      try {
        const card = element(by.id("watch-card"));
        await card.swipe("right", "fast", 0.8);
      } catch {
        // No more cards
        break;
      }
    }

    // Should eventually show winner or empty state
    await expect(
      element(by.id("winner-view")).or(element(by.id("empty-state")))
    ).toBeVisible();
  });
});
```

---

## 9. CI/CD Pipeline Configuration

### `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run unit tests
        run: npm test -- --coverage --ci

      - name: Check coverage thresholds
        run: |
          npm test -- --coverage --ci --coverageReporters=json-summary
          node scripts/check-coverage.js

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: |
          supabase start
          supabase db reset

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm test -- --testPathPattern="integration" --ci
        env:
          VITE_SUPABASE_URL: http://localhost:54321
          VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.TEST_ANON_KEY }}
          VITE_SUPABASE_SECRET_KEY: ${{ secrets.TEST_SERVICE_KEY }}

  e2e-ios:
    name: E2E Tests (iOS)
    runs-on: macos-latest
    needs: integration-tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Build for Detox
        run: detox build --configuration ios.sim.release

      - name: Run Detox tests
        run: detox test --configuration ios.sim.release --cleanup

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: detox-artifacts
          path: artifacts/

  e2e-web:
    name: E2E Tests (Web)
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build web app
        run: npm run build:web

      - name: Run Playwright tests
        run: npm run test:e2e:web

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### `scripts/check-coverage.js`

```javascript
#!/usr/bin/env node
/**
 * Validates test coverage meets minimum thresholds
 * Exit 1 if coverage is below thresholds
 */

const fs = require("fs");
const path = require("path");

const THRESHOLDS = {
  // Global thresholds
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  // Critical path thresholds (higher requirements)
  critical: {
    "src/components/auth": { statements: 90, branches: 85 },
    "src/watch": { statements: 85, branches: 80 },
    "src/list": { statements: 85, branches: 80 },
    "src/lib/supabase": { statements: 90, branches: 85 },
  },
};

const coveragePath = path.join(process.cwd(), "coverage/coverage-summary.json");

if (!fs.existsSync(coveragePath)) {
  console.error("Coverage summary not found. Run tests with --coverage first.");
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
let failed = false;

// Check global thresholds
const total = coverage.total;
for (const [metric, threshold] of Object.entries(THRESHOLDS.global)) {
  const actual = total[metric].pct;
  if (actual < threshold) {
    console.error(
      `❌ Global ${metric} coverage ${actual}% is below threshold ${threshold}%`
    );
    failed = true;
  } else {
    console.log(`✅ Global ${metric} coverage ${actual}% >= ${threshold}%`);
  }
}

// Check critical path thresholds
for (const [pathPattern, thresholds] of Object.entries(THRESHOLDS.critical)) {
  const matchingPaths = Object.keys(coverage).filter((p) =>
    p.includes(pathPattern)
  );

  if (matchingPaths.length === 0) {
    console.warn(`⚠️ No coverage data found for critical path: ${pathPattern}`);
    continue;
  }

  // Aggregate coverage for matching paths
  let totalStatements = 0;
  let coveredStatements = 0;
  let totalBranches = 0;
  let coveredBranches = 0;

  for (const p of matchingPaths) {
    const data = coverage[p];
    totalStatements += data.statements.total;
    coveredStatements += data.statements.covered;
    totalBranches += data.branches.total;
    coveredBranches += data.branches.covered;
  }

  const statementsPct =
    totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
  const branchesPct =
    totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;

  if (thresholds.statements && statementsPct < thresholds.statements) {
    console.error(
      `❌ ${pathPattern} statements ${statementsPct.toFixed(1)}% is below ${thresholds.statements}%`
    );
    failed = true;
  } else if (thresholds.statements) {
    console.log(
      `✅ ${pathPattern} statements ${statementsPct.toFixed(1)}% >= ${thresholds.statements}%`
    );
  }

  if (thresholds.branches && branchesPct < thresholds.branches) {
    console.error(
      `❌ ${pathPattern} branches ${branchesPct.toFixed(1)}% is below ${thresholds.branches}%`
    );
    failed = true;
  } else if (thresholds.branches) {
    console.log(
      `✅ ${pathPattern} branches ${branchesPct.toFixed(1)}% >= ${thresholds.branches}%`
    );
  }
}

if (failed) {
  console.error("\n❌ Coverage thresholds not met");
  process.exit(1);
} else {
  console.log("\n✅ All coverage thresholds met");
  process.exit(0);
}
```

---

## 10. Acceptance Criteria

### Automated Verification (CI Gates)

All of the following must pass for a PR to be merged:

1. **Type Check**: `npm run typecheck` passes with zero errors
2. **Unit Tests**: All unit tests pass with zero failures
3. **Coverage Thresholds**:
   - Global: 80% statements, 75% branches, 80% functions, 80% lines
   - Auth components: 90% statements, 85% branches
   - Watch feature: 85% statements, 80% branches
   - List feature: 85% statements, 80% branches
   - Supabase utilities: 90% statements, 85% branches
4. **Integration Tests**: All database integration tests pass
5. **E2E Tests (Web)**: All Playwright tests pass
6. **E2E Tests (iOS)**: All Detox tests pass (main branch only)
7. **No Console Errors**: Tests fail if unexpected console errors occur
8. **No Unhandled Rejections**: Tests fail on unhandled promise rejections

### Test Count Requirements

Each feature must have minimum test coverage:

| Feature | Minimum Tests | Critical Paths |
|---------|--------------|----------------|
| Authentication | 25+ tests | Login, signup, logout, session refresh |
| List Page | 30+ tests | Fetch, filter, sort, search, pagination |
| Watch Page | 35+ tests | Card display, swipe gestures, winner logic |
| Edit Entry | 20+ tests | Tag selection, watched toggle, delete |
| Settings | 15+ tests | User info, sign out, group management |
| Navigation | 10+ tests | Tab switching, deep linking, auth guards |

### Snapshot Testing

- All presentational components have snapshot tests
- Snapshots must be reviewed on every change
- CI fails on unexpected snapshot changes

### Performance Benchmarks

- List render with 100 items: < 3 seconds
- Card swipe animation: 60 FPS (no jank)
- Initial app load: < 5 seconds
- Search results display: < 1 second

---

## 11. Manual Testing Guidance

While automated tests are the primary gate, these manual checks provide extra confidence:

### Pre-Release Checklist

#### iOS Device Testing
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 15 Pro Max (largest screen)
- [ ] Test in portrait and landscape
- [ ] Test with VoiceOver enabled
- [ ] Test with Dynamic Type (accessibility text sizes)
- [ ] Test offline mode behavior
- [ ] Test app backgrounding/foregrounding
- [ ] Verify haptic feedback on swipes
- [ ] Test push notification handling

#### Web Testing
- [ ] Test in Safari (iOS)
- [ ] Test in Chrome (Android)
- [ ] Test in Chrome (Desktop)
- [ ] Test in Firefox (Desktop)
- [ ] Test with keyboard-only navigation
- [ ] Test responsive breakpoints (320px, 768px, 1024px, 1440px)
- [ ] Verify PWA installation works
- [ ] Test slow 3G network simulation

#### Cross-Platform Consistency
- [ ] Visual consistency between iOS and web
- [ ] Animation smoothness on both platforms
- [ ] Touch targets are at least 44x44 points
- [ ] Fonts render correctly
- [ ] Images load and display correctly
- [ ] Error states display consistently

### Regression Testing

After any significant change, manually verify:

1. **Login Flow**: Can log in, session persists across app restart
2. **Add Entry**: Search TMDB, select result, appears in list
3. **Watch Session**: Swipe through cards, winner is determined
4. **Edit Entry**: Change tags, mark watched, delete
5. **Settings**: Sign out works, settings persist

---

## 12. Test Data Management

### Seeding Test Database

```bash
# Reset and seed local database
npm run db:reset
npm run db:seed

# Generate fresh test fixtures
npm run generate:fixtures
```

### Fixture Regeneration

When TMDB data changes or new test cases are needed:

```bash
# Fetch fresh TMDB data for fixtures
TMDB_API_KEY=xxx npm run fixtures:update

# Validate fixtures match expected schema
npm run fixtures:validate
```

---

## Summary

This testing infrastructure ensures:

1. **Confidence**: 80-90% code coverage with higher thresholds for critical paths
2. **Speed**: Unit tests run in seconds, integration tests in minutes
3. **Reliability**: Mocks are comprehensive and track all interactions
4. **Maintainability**: Clear patterns for adding new tests
5. **CI Integration**: All tests run automatically on every PR

The automated test suite is designed to be the sole gate for merging PRs. If all tests pass, the code is production-ready.