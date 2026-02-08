# Video Clerk Architecture

This document provides an in-depth look at the architecture of Video Clerk, a universal React Native application built with Expo for web and iOS.

## Table of Contents

1. [Overview](#overview)
2. [Universal Platform Architecture](#universal-platform-architecture)
3. [Routing Architecture](#routing-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [Data Layer](#data-layer)
6. [State Management](#state-management)
7. [Styling Architecture](#styling-architecture)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance Considerations](#performance-considerations)

---

## Overview

Video Clerk is built on Expo SDK 54, which provides a unified development platform for creating native iOS apps and progressive web apps from a single codebase. The architecture emphasizes:

- **Universal code**: Maximum code sharing between web and iOS
- **Type safety**: Strict TypeScript throughout
- **Separation of concerns**: Container/Presenter pattern
- **Scalability**: Feature-based organization
- **Developer experience**: Fast feedback loops with Metro bundler

### Technology Stack Summary

- **Framework**: Expo SDK 54 (React Native + Web)
- **Routing**: Expo Router v4 (file-based routing)
- **Backend**: Supabase (Postgres + Auth + RLS)
- **API**: TMDB API for movie/TV metadata
- **Bundler**: Metro
- **Testing**: Vitest + React Testing Library
- **Deployment**: GitHub Pages (web), EAS Build (iOS)

---

## Universal Platform Architecture

### React Native Web

The core of Video Clerk's universal architecture is `react-native-web`, which compiles React Native components to semantic HTML and CSS. This allows us to:

1. Write components once using React Native primitives (`View`, `Text`, `Pressable`)
2. Compile to web-compatible HTML/CSS automatically
3. Maintain consistent behavior across platforms

**Example**:
```typescript
// Same component works on web and iOS
import { View, Text, StyleSheet } from 'react-native';

export function Card() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Movie Title</Text>
    </View>
  );
}
```

On web, `View` becomes a `<div>` and `Text` becomes a `<span>`, with styles compiled to CSS classes.

### Platform-Specific Code

When needed, platform-specific code can be written using:

1. **Platform module**:
```typescript
import { Platform } from 'react-native';

const padding = Platform.select({
  ios: 16,
  android: 12,
  web: 20,
});
```

2. **Platform-specific files**:
```
component.tsx       # Shared code
component.ios.tsx   # iOS-specific
component.web.tsx   # Web-specific
```

Metro automatically picks the correct file for the target platform.

### Safe Areas and Insets

iOS requires handling safe areas (notches, home indicators). We use `react-native-safe-area-context`:

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen() {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Content automatically respects safe areas */}
    </SafeAreaView>
  );
}
```

On web, `SafeAreaView` renders as a regular `View` with no special behavior.

---

## Routing Architecture

### Expo Router (File-Based)

Expo Router v4 provides file-based routing similar to Next.js. Routes are defined by the file structure in `app/`:

```
app/
├── index.tsx               # / (landing page)
├── login.tsx               # /login
├── (app)/                  # Route group (no path segment)
│   ├── _layout.tsx         # Layout for /app/*
│   ├── list/
│   │   ├── index.tsx       # /app/list
│   │   ├── add.tsx         # /app/list/add
│   │   └── [entryId].tsx   # /app/list/:entryId
│   └── watch/
│       ├── index.tsx       # /app/watch
│       └── [entryId].tsx   # /app/watch/:entryId
└── invite/
    └── [code].tsx          # /invite/:code
```

### Route Groups

Parentheses `()` create **route groups** that organize routes without adding URL segments:
- `app/(app)/list/index.tsx` → `/app/list` (not `/app/(app)/list`)
- Used for grouping authenticated routes under a shared layout

### Navigation

Programmatic navigation uses the `router` object:

```typescript
import { router } from 'expo-router';

// Navigate forward
router.push('/app/list');
router.push(`/app/watch/${entryId}`);

// Replace (no back button)
router.replace('/login');

// Go back
router.back();
```

### Deep Linking

Expo Router handles deep linking automatically:
- Web: `/app/list` in browser
- iOS: `videoclerk://app/list` via Universal Links
- All routes work as deep links without additional configuration

### Layout Routes

Layouts (`_layout.tsx`) wrap child routes and persist across navigation:

```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="list" options={{ title: "List" }} />
      <Tabs.Screen name="watch" options={{ title: "Watch" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
```

This creates a bottom tab navigator for authenticated routes.

---

## Authentication & Authorization

### Supabase Auth

Video Clerk uses Supabase Auth with email magic links (passwordless authentication):

1. User enters email
2. Supabase sends magic link via email
3. User clicks link → redirected to app with auth token
4. Token stored in `SecureStore` (iOS) or `localStorage` (web)

### Auth Flow

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │
       ├─ Not authenticated → /login
       │
       └─ Authenticated
          │
          ▼
     ┌─────────────┐
     │   App       │
     │  (protected)│
     └─────────────┘
```

### Route Protection

The `app/(app)/_layout.tsx` file guards all nested routes:

```typescript
import { useEffect } from 'react';
import { router, Slot } from 'expo-router';
import { createClient } from '~/lib/supabase/client';

export default function AppLayout() {
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, []);

  return <Slot />;
}
```

If authentication fails, user is redirected to `/login`.

### Row Level Security (RLS)

Authorization is enforced at the database level using Supabase Row Level Security policies:

```sql
-- Users can only see entries from their group
CREATE POLICY "Users can view their group's entries"
  ON public.entries FOR SELECT
  USING (
    group_id IN (
      SELECT group_id
      FROM public.group_memberships
      WHERE user_id = auth.uid()
    )
  );
```

This ensures users can only access data they're authorized to see, even if client-side checks are bypassed.

---

## Data Layer

### Supabase Client

A shared Supabase client is created per session:

```typescript
// lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.generated.types';

export function createClient() {
  return createSupabaseClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

The `Database` generic provides full TypeScript types for all tables and columns.

### Database Schema

Video Clerk uses a Postgres database with the following core tables:

- **groups**: User groups for shared lists
- **group_memberships**: Many-to-many relationship between users and groups
- **entries**: Watch list items (movies/TV shows)
- **tmdb_details**: Cached TMDB API responses
- **tags**: User-defined tags
- **entry_tags**: Many-to-many relationship between entries and tags
- **group_invites**: Invitation codes for joining groups

### Data Fetching Pattern

Container components fetch data using Supabase:

```typescript
export function ListContainer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('entries')
          .select('*, tmdb_details(*), entry_tags(tags(*))')
          .order('added_at', { ascending: false });

        if (error) throw error;
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true };
  }, []);

  return <List entries={entries} loading={loading} />;
}
```

**Key patterns**:
- `cancelled` flag prevents state updates after unmount
- Explicit error handling
- Loading states
- TypeScript types from generated schema

### TMDB API Integration

Movie/TV metadata comes from TMDB API:

```typescript
// lib/tmdb-api/tmdb-api.ts
export class TMDBAPI {
  private baseURL = 'https://api.themoviedb.org/3';
  private bearerToken: string;

  async searchMulti(query: string) {
    return this.fetch<SearchResponse>(`/search/multi?query=${query}`);
  }

  async getMovieDetails(id: number) {
    return this.fetch<MovieDetails>(`/movie/${id}`);
  }

  private async fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: { Authorization: `Bearer ${this.bearerToken}` },
    });
    return response.json();
  }
}
```

TMDB responses are cached in the `tmdb_details` table to reduce API calls.

---

## State Management

### React Context

Global state is managed via React Context in a layered hierarchy:

```
Root (_layout.tsx)
├─ AppDataProvider (user, session)
│  └─ TMDBAPIProvider (API instance)
│     └─ TMDBConfiguration (image config)
│        └─ TMDBGenres (genre data)
│           └─ App routes
```

Each provider handles a specific concern:

**AppDataProvider**: User authentication state
```typescript
export const AppDataContext = createContext<AppData>({ user: null });

export function AppDataProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <AppDataContext.Provider value={{ user }}>
      {children}
    </AppDataContext.Provider>
  );
}
```

**TMDBAPIProvider**: TMDB API instance
```typescript
export const TMDBAPIContext = createContext<TMDBAPI | null>(null);

export function TMDBAPIProvider({ children }) {
  const api = useMemo(
    () => new TMDBAPI(process.env.EXPO_PUBLIC_TMDB_API_READ_TOKEN!),
    []
  );

  return (
    <TMDBAPIContext.Provider value={api}>
      {children}
    </TMDBAPIContext.Provider>
  );
}
```

### Local Component State

Feature-specific state uses React hooks:

```typescript
export function WatchDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // Component logic...
}
```

### Why Not Redux/MobX?

Video Clerk deliberately avoids state management libraries:
- **Simplicity**: Direct Supabase queries are easier to understand
- **Real-time**: Supabase provides real-time subscriptions if needed
- **Type safety**: Generated types make queries type-safe
- **Less boilerplate**: No actions, reducers, or observables

---

## Styling Architecture

### React Native StyleSheet

All styling uses the React Native `StyleSheet` API:

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});
```

**Benefits**:
- Type-safe (TypeScript validation)
- Performance (styles validated once)
- Cross-platform (works on web and iOS)
- Familiar (similar to CSS)

### Style Composition

Styles can be combined using arrays:

```typescript
<View style={[styles.button, isActive && styles.activeButton]} />
```

### Dynamic Styles

For truly dynamic values, use inline styles:

```typescript
<View style={[styles.card, { backgroundColor: color }]} />
```

### Platform-Specific Styles

```typescript
const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        letterSpacing: 0.5,
      },
      web: {
        fontFamily: 'system-ui',
      },
    }),
  },
});
```

### Why Not NativeWind/Tailwind?

While NativeWind exists, we use vanilla StyleSheet for:
- **Explicitness**: Clear what styles apply
- **Control**: No utility class conflicts
- **Performance**: No runtime class resolution
- **Standards**: Aligns with React Native docs

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  (Future: iOS simulator tests)
        └─────────┘
      ┌─────────────┐
      │ Integration │  (Supabase + real DB)
      └─────────────┘
    ┌─────────────────┐
    │   Unit Tests    │  (Mocked dependencies)
    └─────────────────┘
```

### Unit Tests

Fast, isolated component tests with mocked dependencies:

```typescript
// watch-card.test.tsx
import { render, screen } from '@testing-library/react';
import { WatchCard } from './watch-card';

describe('WatchCard', () => {
  it('displays movie title', () => {
    const entry = { title: 'Inception', year: 2010 };
    render(<WatchCard entry={entry} />);
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });
});
```

**Mock Supabase**:
```typescript
vi.mock('~/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: mockData,
        error: null,
      })),
    })),
  }),
}));
```

### Integration Tests

Tests against a real local Supabase instance:

```typescript
// @vitest-environment node
import { createTestUser, cleanupTestUser } from '~/test-utils/supabase';

describe('Application-level: Watch feature', () => {
  it('filters entries by genre', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);

    try {
      const { client } = testUser;
      const { data } = await client
        .from('entries')
        .select('*')
        .contains('tmdb_details.genre_ids', [28]); // Action

      expect(data).toBeDefined();
      expect(data.every(e => e.tmdb_details.genre_ids.includes(28))).toBe(true);
    } finally {
      await cleanupTestUser(admin, testUser.userId);
    }
  });
});
```

### CI/CD Testing

GitHub Actions runs tests automatically:

```yaml
# .github/workflows/tests.yml
jobs:
  unit:
    - run: npm test -- --exclude "**/*.integration.test.*"

  integration:
    - run: npx supabase start
    - run: npm test -- integration.test
```

Unit tests run on every push. Integration tests run after unit tests pass.

---

## Deployment Architecture

### Web (GitHub Pages)

```
┌─────────────┐
│ Push to     │
│ main branch │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ GitHub Actions   │
│ - npm ci         │
│ - expo export    │
│   --platform web │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Output: dist/    │
│ - index.html     │
│ - _expo/         │
│ - assets/        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Deploy to        │
│ gh-pages branch  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ GitHub Pages     │
│ video-clerk.     │
│ adamstegman.com  │
└──────────────────┘
```

**Key features**:
- Static export (no server required)
- Automatic deployment on merge to `main`
- Custom domain support
- HTTPS via GitHub Pages

### PR Staging Previews

Each pull request gets a preview deployment:

```
PR #123 → https://video-clerk.adamstegman.com/staging/pr-123/
```

**Implementation**:
1. Workflow detects PR open/update
2. Modifies `app.json` to set `experiments.baseUrl = '/staging/pr-123'`
3. Exports with custom base path
4. Deploys to `gh-pages` branch under `staging/pr-123/`
5. Cleans up when PR closes

### iOS (App Store)

```
┌─────────────┐
│ Developer   │
│ runs command│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ eas build        │
│ --platform ios   │
│ --profile prod   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ EAS Build Cloud  │
│ - Installs deps  │
│ - Compiles iOS   │
│ - Signs with     │
│   Apple certs    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ .ipa file        │
│ (iOS app)        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ eas submit       │
│ → TestFlight     │
│ → App Store      │
└──────────────────┘
```

**EAS Build** handles:
- Native compilation in the cloud
- Certificate management
- Automatic version bumping
- TestFlight uploads

---

## Performance Considerations

### Web Performance

**Bundle Size**:
- Expo optimizes bundle with Metro bundler
- Tree-shaking removes unused code
- Code splitting via dynamic imports (if needed)

**Loading Performance**:
- Static export = fast CDN delivery
- Lazy load images with `<Image>` component
- Cache TMDB API responses in Supabase

**Runtime Performance**:
- React Native Web compiles to efficient DOM
- FlatList virtualizes long lists
- Memoization with `useMemo`/`useCallback`

### iOS Performance

**Native Performance**:
- React Native compiles to native iOS components
- 60fps animations via native drivers
- `FlatList` renders only visible items

**Memory Management**:
- Images loaded on-demand
- Cleanup effects prevent memory leaks
- Cancelled flags prevent stale state updates

### Database Performance

**Query Optimization**:
- Indexed columns (group_id, user_id, tmdb_id)
- Efficient joins with Supabase syntax
- Pagination for large result sets

**Caching**:
- TMDB responses cached in database
- Supabase client caches auth tokens
- React Query could be added for client-side caching (future)

---

## Scalability Considerations

### Adding Platforms

To add Android support:
1. Update `app.json` to include `android` in platforms
2. Add Android-specific config (icons, splash screens)
3. Run `eas build --platform android`
4. Most code works without changes (universal codebase)

### Feature Flags

For gradual feature rollouts:
```typescript
const FEATURES = {
  commentingEnabled: true,
  ratingsEnabled: false,
};

if (FEATURES.commentingEnabled) {
  // Show commenting UI
}
```

### Internationalization

Expo supports i18n via `expo-localization`:
```typescript
import * as Localization from 'expo-localization';

const locale = Localization.locale; // 'en-US', 'es-MX', etc.
```

### Real-Time Features

Supabase provides real-time subscriptions:
```typescript
const supabase = createClient();
const channel = supabase
  .channel('entries')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'entries'
  }, (payload) => {
    // Handle new entry
  })
  .subscribe();
```

---

## Future Architecture Improvements

### Considered for v2

1. **Offline Support**: Use AsyncStorage + sync queue for offline functionality
2. **Push Notifications**: Via Expo Notifications + Supabase real-time
3. **Image Optimization**: CDN with automatic resizing/format conversion
4. **Analytics**: Add Expo Analytics or PostHog
5. **Error Tracking**: Sentry for production error monitoring
6. **Client-Side Caching**: React Query for optimistic updates
7. **Background Sync**: Sync data in background on iOS

### Not Planned

- Server-side rendering (SSR): Conflicts with GitHub Pages
- GraphQL: Supabase REST API is sufficient
- Micro-frontends: App is small enough for monolith
- Redux/MobX: Direct queries are simpler

---

## Conclusion

Video Clerk's architecture prioritizes:
- **Universal code** for maximum productivity
- **Type safety** for fewer runtime errors
- **Simplicity** over premature abstraction
- **Standards** (React Native, Expo conventions)
- **Developer experience** (fast feedback, hot reload)

This architecture allows a single codebase to serve both web users (via GitHub Pages) and iOS users (via App Store) with minimal platform-specific code.

For questions or suggestions, see the main [README.md](../README.md) or [CLAUDE.md](../CLAUDE.md) files.
