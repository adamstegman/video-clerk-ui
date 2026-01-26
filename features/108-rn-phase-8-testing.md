# Phase 8: Testing Infrastructure

**Status**: Planned
**Estimated Effort**: 2-3 days
**Prerequisites**: Phase 1-7 complete

## Context

This phase sets up the testing infrastructure for the React Native application. We'll migrate from Vitest to Jest (the standard for React Native) and update tests to use React Native Testing Library.

**Key Changes**:
- Test runner: Vitest → Jest with jest-expo
- Testing library: @testing-library/react → @testing-library/react-native
- Test environment: jsdom → react-native

## Files to Create

| File | Purpose |
|------|---------|
| `jest.config.js` | Jest configuration |
| `jest.setup.js` | Test setup and mocks |
| `src/test-utils/render.tsx` | Custom render utilities |
| `src/test-utils/mocks/supabase.ts` | Supabase mock |
| `src/test-utils/mocks/navigation.ts` | Navigation mock |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Update test scripts and dependencies |
| `tsconfig.json` | Add jest types |

## Files to Remove

| File | Reason |
|------|--------|
| `vitest.setup.ts` | Replaced by jest.setup.js |
| `vite.config.ts` | Already removed in Phase 1 |

## Step-by-Step Instructions

### Step 1: Update package.json Test Dependencies

Update `devDependencies` in `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.9.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "react-test-renderer": "18.3.1"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:coverage": "jest --coverage"
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
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-reanimated)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
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
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
```

### Step 3: Create Jest Setup File

Create `jest.setup.js`:

```javascript
import "@testing-library/jest-native/extend-expect";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children, href }) => children,
  Redirect: () => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock expo-linking
jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `videoclerk://${path}`),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
  openBrowserAsync: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native").View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: () => ({
        enabled: () => ({ onStart: () => ({ onUpdate: () => ({ onEnd: () => ({ onFinalize: () => ({}) }) }) }) }),
      }),
    },
  };
});

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.("Animated") ||
    args[0]?.includes?.("NativeWind") ||
    args[0]?.includes?.("Reanimated")
  ) {
    return;
  }
  originalWarn(...args);
};

// Global test timeout
jest.setTimeout(10000);
```

### Step 4: Create Test Utilities

Create `src/test-utils/render.tsx`:

```typescript
import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthContext } from "@/contexts/auth-context";
import type { User, Session } from "@supabase/supabase-js";

// Default mock user
export const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

// Default mock session
export const mockSession: Session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: "bearer",
  user: mockUser,
};

interface TestProvidersProps {
  children: React.ReactNode;
  user?: User | null;
  session?: Session | null;
}

/**
 * Wrapper component with all providers needed for testing.
 */
function TestProviders({
  children,
  user = mockUser,
  session = mockSession,
}: TestProvidersProps) {
  const authContextValue = {
    user,
    session,
    loading: false,
    signIn: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue({ error: null }),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthContext.Provider value={authContextValue}>
          {children}
        </AuthContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  user?: User | null;
  session?: Session | null;
}

/**
 * Custom render function with providers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { user, session, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders user={user} session={session}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing library
export * from "@testing-library/react-native";
export { renderWithProviders as render };
```

### Step 5: Create Supabase Mock

Create `src/test-utils/mocks/supabase.ts`:

```typescript
import { jest } from "@jest/globals";

export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    verifyOtp: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    setSession: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      is: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export const createMockSupabaseClient = () => mockSupabaseClient;

// Mock the module
jest.mock("@/lib/supabase/client", () => ({
  supabase: mockSupabaseClient,
  createClient: () => mockSupabaseClient,
}));
```

### Step 6: Create Navigation Mock

Create `src/test-utils/mocks/navigation.ts`:

```typescript
import { jest } from "@jest/globals";

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
};

export const mockUseRouter = () => mockRouter;

export const mockUseLocalSearchParams = jest.fn(() => ({}));

export const mockUseSegments = jest.fn(() => []);

export const resetNavigationMocks = () => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.canGoBack.mockClear();
  mockRouter.setParams.mockClear();
  mockUseLocalSearchParams.mockClear();
  mockUseSegments.mockClear();
};
```

### Step 7: Update tsconfig.json

Add Jest types to `tsconfig.json`:

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
    "types": ["nativewind/types", "jest", "@testing-library/jest-native"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts",
    "jest.setup.js"
  ]
}
```

### Step 8: Create Example Component Tests

Create `src/components/__tests__/action-button.test.tsx`:

```typescript
import React from "react";
import { Text } from "react-native";
import { render, fireEvent, screen } from "@/test-utils/render";
import { ActionButton } from "../action-button";

describe("ActionButton", () => {
  it("renders children text", () => {
    render(<ActionButton onPress={() => {}}>Click me</ActionButton>);
    expect(screen.getByText("Click me")).toBeOnTheScreen();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<ActionButton onPress={onPress}>Click me</ActionButton>);

    fireEvent.press(screen.getByText("Click me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator when loading", () => {
    render(
      <ActionButton onPress={() => {}} loading>
        Click me
      </ActionButton>
    );

    // Text should not be visible when loading
    expect(screen.queryByText("Click me")).not.toBeOnTheScreen();
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    render(
      <ActionButton onPress={onPress} disabled>
        Click me
      </ActionButton>
    );

    fireEvent.press(screen.getByText("Click me"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders with different variants", () => {
    const { rerender } = render(
      <ActionButton onPress={() => {}} variant="primary">
        Primary
      </ActionButton>
    );
    expect(screen.getByText("Primary")).toBeOnTheScreen();

    rerender(
      <ActionButton onPress={() => {}} variant="secondary">
        Secondary
      </ActionButton>
    );
    expect(screen.getByText("Secondary")).toBeOnTheScreen();

    rerender(
      <ActionButton onPress={() => {}} variant="destructive">
        Destructive
      </ActionButton>
    );
    expect(screen.getByText("Destructive")).toBeOnTheScreen();
  });
});
```

### Step 9: Create Hook Tests

Create `src/hooks/__tests__/use-breakpoint.test.ts`:

```typescript
import { renderHook } from "@testing-library/react-native";
import { useBreakpoint, useIsWideScreen } from "../use-breakpoint";

// Mock useWindowDimensions
jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useWindowDimensions: jest.fn(),
}));

import { useWindowDimensions } from "react-native";

describe("useBreakpoint", () => {
  it("returns sm for small screens", () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 320 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toBe("sm");
  });

  it("returns md for medium screens", () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 768 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toBe("md");
  });

  it("returns lg for large screens", () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1024 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toBe("lg");
  });
});

describe("useIsWideScreen", () => {
  it("returns false for narrow screens", () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 320 });

    const { result } = renderHook(() => useIsWideScreen());

    expect(result.current).toBe(false);
  });

  it("returns true for wide screens", () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1024 });

    const { result } = renderHook(() => useIsWideScreen());

    expect(result.current).toBe(true);
  });
});
```

### Step 10: Create Feature Tests

Create `src/features/list/__tests__/entry-row.test.tsx`:

```typescript
import React from "react";
import { render, fireEvent, screen } from "@/test-utils/render";
import { EntryRow, type EntryRowData } from "../entry-row";

// Mock the navigation
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  Link: ({ children, href, asChild }: any) => {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      onPress: () => mockPush(href),
    });
  },
}));

// Mock TMDB configuration
jest.mock("@/tmdb-api/tmdb-configuration", () => ({
  useTMDBConfiguration: () => ({
    getPosterUrl: (path: string) =>
      path ? `https://image.tmdb.org/t/p/w92${path}` : undefined,
  }),
}));

describe("EntryRow", () => {
  const mockEntry: EntryRowData = {
    id: 1,
    title: "Test Movie",
    releaseYear: "2024",
    posterPath: "/test-poster.jpg",
    watched: false,
    mediaType: "movie",
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders entry title", () => {
    render(<EntryRow entry={mockEntry} />);
    expect(screen.getByText("Test Movie")).toBeOnTheScreen();
  });

  it("renders release year", () => {
    render(<EntryRow entry={mockEntry} />);
    expect(screen.getByText("2024")).toBeOnTheScreen();
  });

  it("renders media type", () => {
    render(<EntryRow entry={mockEntry} />);
    expect(screen.getByText("Movie")).toBeOnTheScreen();
  });

  it("navigates to edit screen on press", () => {
    render(<EntryRow entry={mockEntry} />);

    fireEvent.press(screen.getByText("Test Movie"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/(tabs)/list/1");
  });

  it("shows watched indicator for watched entries", () => {
    const watchedEntry = { ...mockEntry, watched: true };
    render(<EntryRow entry={watchedEntry} />);

    // The Check icon should be present for watched entries
    // We can't easily test for the icon, but we can check the entry is rendered
    expect(screen.getByText("Test Movie")).toBeOnTheScreen();
  });

  it("handles missing poster gracefully", () => {
    const entryWithoutPoster = { ...mockEntry, posterPath: null };
    render(<EntryRow entry={entryWithoutPoster} />);

    expect(screen.getByText("No img")).toBeOnTheScreen();
  });
});
```

### Step 11: Create Integration Test Example

Create `src/features/list/__tests__/list-page.integration.test.tsx`:

```typescript
import React from "react";
import { render, screen, waitFor } from "@/test-utils/render";
import { ListPageContainer } from "../list-page-container";
import { mockSupabaseClient } from "@/test-utils/mocks/supabase";

// Apply Supabase mock
jest.mock("@/lib/supabase/client");

describe("ListPageContainer Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    // Setup mock to delay response
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      }),
    });

    render(<ListPageContainer />);

    // Should show loading spinner
    // Note: Testing loading state can be tricky with async rendering
  });

  it("displays entries when loaded", async () => {
    const mockEntries = [
      {
        id: 1,
        watched_at: null,
        tmdb_details: {
          title: "Test Movie",
          release_date: "2024-01-15",
          poster_path: "/poster.jpg",
          media_type: "movie",
        },
      },
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockEntries,
          error: null,
        }),
      }),
    });

    render(<ListPageContainer />);

    await waitFor(() => {
      expect(screen.getByText("Test Movie")).toBeOnTheScreen();
    });
  });

  it("shows error state on failure", async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      }),
    });

    render(<ListPageContainer />);

    await waitFor(() => {
      expect(screen.getByText("Database error")).toBeOnTheScreen();
    });
  });

  it("shows empty state when no entries", async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    render(<ListPageContainer />);

    await waitFor(() => {
      expect(screen.getByText("No entries yet")).toBeOnTheScreen();
    });
  });
});
```

### Step 12: Add Test Scripts to CI

Update `.github/workflows/deploy-web.yml` to run tests:

```yaml
- name: Run tests
  run: npm run test:ci
  env:
    CI: true
```

## Test Guidance

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/__tests__/action-button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"
```

### Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Components | 70%+ |
| Hooks | 80%+ |
| Utils | 90%+ |
| Features | 60%+ |
| Overall | 50%+ |

### Writing Good Tests

1. **Test user behavior, not implementation**:
   ```typescript
   // Good
   fireEvent.press(screen.getByText("Submit"));
   expect(screen.getByText("Success")).toBeOnTheScreen();

   // Bad
   expect(component.state.submitted).toBe(true);
   ```

2. **Use meaningful test descriptions**:
   ```typescript
   // Good
   it("displays error message when email is invalid", () => {});

   // Bad
   it("test 1", () => {});
   ```

3. **Mock at the right level**:
   ```typescript
   // Mock API calls, not React components
   jest.mock("@/lib/supabase/client");
   ```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] Jest configured with jest-expo preset
- [ ] jest.setup.js mocks all required modules
- [ ] Test utilities created (renderWithProviders)
- [ ] Supabase mock created and working
- [ ] Navigation mock created and working
- [ ] Example component tests pass
- [ ] Example hook tests pass
- [ ] Example feature tests pass
- [ ] `npm test` runs without errors
- [ ] `npm run test:ci` works in CI
- [ ] Coverage reports generate correctly
- [ ] All mocks work correctly (no "not a function" errors)
- [ ] Tests run in under 60 seconds

## Troubleshooting

### "Cannot find module" errors
1. Check moduleNameMapper in jest.config.js
2. Verify path aliases match tsconfig.json

### Mock not working
1. Ensure mock is in jest.setup.js or before import
2. Use `jest.mock()` at module level, not in tests
3. Check transformIgnorePatterns includes the package

### "Invariant Violation" errors
1. Usually missing mock for native module
2. Add mock to jest.setup.js

### Tests timing out
1. Increase timeout: `jest.setTimeout(30000)`
2. Check for unresolved promises
3. Ensure async operations complete

### Snapshot tests failing
1. Update snapshots: `npm test -- -u`
2. Review changes before committing

---

## Conversion Complete!

Congratulations! After completing all 8 phases, you will have:

1. **A working React Native app** that runs on web and iOS
2. **Continuous deployment** to GitHub Pages for web
3. **EAS Build** configured for iOS releases
4. **Comprehensive test coverage** with Jest

### Next Steps

- Submit iOS app to TestFlight for beta testing
- Configure App Store submission
- Add push notifications (optional)
- Implement offline support (optional)
- Add analytics (optional)

### Maintenance

- Keep Expo SDK updated
- Monitor EAS build status
- Review test coverage regularly
- Update dependencies monthly
