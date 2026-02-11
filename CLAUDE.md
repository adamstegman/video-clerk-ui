# CLAUDE.md - AI Assistant Guide for Video Clerk UI

This document provides comprehensive guidance for AI assistants working on the Video Clerk codebase. It covers architecture, conventions, workflows, and common patterns.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Architectural Patterns](#architectural-patterns)
6. [Coding Conventions](#coding-conventions)
7. [Testing Guidelines](#testing-guidelines)
8. [Common Tasks](#common-tasks)
9. [Deployment](#deployment)
10. [Important Files Reference](#important-files-reference)
11. [Documented Solutions (REQUIRED)](#documented-solutions-required)

---

## Project Overview

**Video Clerk** is a universal React Native application that solves the "what do we watch?" problem by separating:
- **Discovery Phase**: Adding shows/movies to a list when you hear about them
- **Decision Phase**: Filtering that list based on current mood to find a winner

Built with Expo for web and iOS from a single codebase.

### Key Features
- User authentication via Supabase Auth
- Multi-user support with group-based sharing
- TMDB API integration for movie/TV metadata
- Card-swiping interface for choosing content
- Tag-based filtering and organization
- Group invitations for collaborative lists
- Cross-platform: Works on web (GitHub Pages) and iOS (App Store)

### Architecture Philosophy
- **Universal platform** - single codebase for web and iOS
- **Mobile-first design** with safe area insets
- **Static export** (no SSR) for simplified web deployment
- **Container/Presenter pattern** for separation of concerns
- **Feature-based folder structure** for maintainability
- **Minimal dependencies** - direct Supabase client calls, no GraphQL/query libraries

---

## Technology Stack

### Core Framework
- **Expo SDK 54** - React Native + Web universal platform
- **React Native** - Cross-platform UI framework
- **React 18.3** - UI library (via React Native)
- **Expo Router v4** - File-based routing for universal apps
- **TypeScript 5.9** - Type safety with strict mode
- **Metro** - Bundler for React Native

### Backend & Data
- **Supabase** - Postgres database, authentication, RLS
- **@supabase/supabase-js 2.89** - Supabase JavaScript client
- Generated TypeScript types from database schema

### Styling
- **React Native StyleSheet** - Cross-platform styling API
- **react-native-web** - Compiles React Native to web CSS

### UI Components
- **@expo/vector-icons** - Icon library
- Custom components built with React Native primitives (View, Text, Pressable, etc.)

### Testing
- **Vitest 2.0** - Test runner
- **@testing-library/react** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for unit tests

### Development Tools
- **@dotenvx/dotenvx** - Environment variable management
- **Supabase CLI** - Local development database
- **EAS Build** - Expo Application Services for iOS builds
- **EAS Submit** - App Store submission automation

---

## Project Structure

```
video-clerk/
├── app/                          # Expo Router routes
│   ├── (app)/                    # Protected routes (requires auth)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── list/                 # List feature
│   │   │   ├── index.tsx         # List view
│   │   │   ├── add.tsx           # Add entry
│   │   │   └── [entryId].tsx     # Edit entry
│   │   ├── watch/                # Watch feature
│   │   │   ├── index.tsx         # Watch deck
│   │   │   └── [entryId].tsx     # Watch details
│   │   └── settings.tsx          # Settings
│   ├── invite/                   # Group invites
│   │   └── [code].tsx            # Invite handler
│   ├── login.tsx                 # Authentication
│   ├── index.tsx                 # Landing/marketing page
│   └── _layout.tsx               # Root layout
│
├── lib/                          # Shared libraries
│   ├── supabase/                 # Supabase client + types
│   │   ├── client.ts             # createClient() factory
│   │   └── database.generated.types.ts
│   ├── tmdb-api/                 # TMDB API wrapper
│   │   ├── tmdb-api.ts           # TMDBAPI class
│   │   ├── tmdb-api-provider.tsx
│   │   ├── tmdb-configuration.tsx
│   │   └── tmdb-genres.tsx
│   └── utils/                    # Utilities
│       └── error-handling.ts
│
├── components/                   # Shared UI components
│   ├── header/
│   ├── nav-bar/
│   ├── auth/                     # Composable auth form blocks
│   └── *.tsx
│
├── assets/                       # Images and icons
│   ├── icon.png
│   └── splash.png
│
├── supabase/                     # Database schema
│   ├── config.toml               # Local Supabase config
│   ├── schemas/                  # Schema definitions
│   │   ├── 00_groups.sql
│   │   ├── 01_tags.sql
│   │   ├── 02_tmdb_details.sql
│   │   ├── 03_entries.sql
│   │   └── ...
│   └── migrations/               # Migration history
│
├── .github/workflows/            # CI/CD
│   ├── deploy.yml                # Production deployment
│   ├── staging-preview.yml       # PR previews
│   └── tests.yml                 # Tests
│
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── metro.config.js               # Metro bundler config
├── package.json
├── tsconfig.json
└── vitest.setup.ts
```

### Feature-Based Organization

Each feature (list, watch, settings) is organized as:
- **Routes**: In `app/(app)/feature-name/` directory
  - `index.tsx` - Main feature route
  - `[param].tsx` - Dynamic routes
- **Business logic**: In `lib/feature-name/` directory
  - Container components with data fetching
  - Presentational components
  - Feature-specific utilities
- **Tests**: Co-located with components (`*.test.tsx`, `*.integration.test.ts`)

---

## Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Start local Supabase (Docker required)
npx supabase start

# Create .env file with output from supabase start
# Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SECRET_KEY, and EXPO_PUBLIC_TMDB_API_READ_TOKEN
```

### Development Commands

```bash
# Start Expo development server
npm start

# Then choose your platform:
# - Press 'w' to open in web browser
# - Press 'i' to open in iOS simulator
# - Press 'a' to open in Android emulator
# - Scan QR code with Expo Go app on physical device

# Or start directly for a specific platform:
npm run web      # Web only (http://localhost:8081)
npm run ios      # iOS only
npm run android  # Android only

# Run type checking
npm run typecheck

# Run tests (unit only)
npm test -- --exclude "**/*.integration.test.*"

# Run integration tests (requires local Supabase)
npm test -- integration.test

# Build for production (web)
npm run build:web

# Build for iOS
eas build --platform ios --profile production
```

### Database Workflow

```bash
# Make schema changes in supabase/schemas/*.sql

# Generate migration
npx supabase stop
npx supabase db diff -f <update_description>

# Apply migration locally
npx supabase start
npx supabase db reset

# Regenerate TypeScript types
npx supabase gen types typescript --local > lib/supabase/database.generated.types.ts

# Push to production
npx supabase db push
```

### Environment Variables

**Local Development** (`.env`):
```bash
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
EXPO_PUBLIC_TMDB_API_READ_TOKEN=eyJh...
```

**Production** (GitHub Secrets):
- `VITE_SUPABASE_URL` - Production Supabase URL (mapped to `EXPO_PUBLIC_SUPABASE_URL` in workflows)
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Production anon key (mapped to `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- `VITE_TMDB_API_READ_TOKEN` - TMDB API read token (mapped to `EXPO_PUBLIC_TMDB_API_READ_TOKEN`)
- `PAGES_DOMAIN` (Variable) - Custom domain for GitHub Pages (`video-clerk.adamstegman.com`)

*Note: Secret names use `VITE_` prefix for backward compatibility, but are mapped to `EXPO_PUBLIC_` in workflows.*

---

## Architectural Patterns

### 1. File-System Based Routing (Expo Router)

Routes are automatically generated from files in `app/`:

**Naming Convention**:
- `app/index.tsx` → `/`
- `app/login.tsx` → `/login`
- `app/(app)/list/index.tsx` → `/app/list`
- `app/(app)/watch/[entryId].tsx` → `/app/watch/:entryId`
- `app/invite/[code].tsx` → `/invite/:code`

Parentheses `()` create route groups without adding path segments.

**Route Files Export**:
```typescript
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

// Component
export default function MyRoute() {
  return (
    <View>
      <Text>Content</Text>
    </View>
  );
}

// Layout with navigation options
export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Page Title"
      }}
    />
  );
}
```

**Navigation**:
```typescript
import { router } from 'expo-router';

// Navigate
router.push('/app/list');

// Navigate with params
router.push(`/app/watch/${entryId}`);

// Go back
router.back();
```

### 2. Container/Presenter Pattern

**Purpose**: Separate data fetching from UI rendering

**Container Component** (`*-container.tsx`):
```typescript
// lib/list/list-container.tsx
import { useState, useEffect } from 'react';
import { createClient } from '~/lib/supabase/client';

export function ListContainer() {
  const [entries, setEntries] = useState<SavedEntryRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("entries")
          .select("...")
          .order("added_at", { ascending: false });

        if (error) throw error;
        const normalized = normalizeData(data);
        if (!cancelled) setEntries(normalized);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true };
  }, []);

  return <List entries={entries} loading={loading} error={error} />;
}
```

**Presentational Component**:
```typescript
// lib/list/list.tsx
import { View, Text, ActivityIndicator, FlatList } from 'react-native';

interface ListProps {
  entries: SavedEntryRowData[];
  loading: boolean;
  error: string | null;
}

export function List({ entries, loading, error }: ListProps) {
  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{error}</Text>;

  return (
    <FlatList
      data={entries}
      renderItem={({ item }) => <EntryRow entry={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}
```

**Key Principles**:
- Use `cancelled` flag to prevent state updates after unmount
- Normalize data inconsistencies (Supabase can return single object or array)
- Presentational components are pure and easy to test

### 3. State Management via React Context

**Global State Hierarchy**:
```
AppDataProvider (user)
  └─ TMDBAPIProvider (API instance)
      └─ TMDBConfiguration (image config)
          └─ TMDBGenres (genre data)
              └─ App routes
```

**Context Pattern**:
```typescript
// Create context
export const AppDataContext = createContext<AppData>({ user: null });

// Provider component
export function AppDataProvider({ data, children }: { data: AppData; children: ReactNode }) {
  return <AppDataContext value={data}>{children}</AppDataContext>;
}

// Usage
const { user } = useContext(AppDataContext);
```

**When to Use**:
- **Context**: Global state needed by many components (user, API instances, config)
- **Component State**: Feature-specific state (form inputs, loading states)

### 4. Authentication Guard

All routes under `app/(app)/*` require authentication via the `(app)/_layout.tsx` file:

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

The `(app)` route group requires authentication, while `/login` and `/invite` routes are public.

### 5. Supabase Client Usage

**Create client** (app/lib/supabase/client.ts:4-9):
```typescript
const supabase = createClient();
```

**Typed queries**:
```typescript
const { data, error } = await supabase
  .from("entries")
  .select("id, added_at, watched_at, tmdb_details(*), entry_tags(tag_id, tags(name))")
  .eq("group_id", groupId)
  .order("added_at", { ascending: false });
```

**RPC calls**:
```typescript
const { data, error } = await supabase.rpc('save_tmdb_result_to_list', {
  p_tmdb_id: 550,
  p_media_type: 'movie',
  p_title: 'Fight Club',
  // ...
});
```

**Error handling**:
```typescript
if (error) {
  throw new Error(error.message);
}
```

### 6. Data Normalization

Supabase relationships can return single object or array. Always normalize:

```typescript
function normalizeDetails(details: TmdbDetail | TmdbDetail[] | null): TmdbDetail | null {
  if (!details) return null;
  return Array.isArray(details) ? details[0] ?? null : details;
}
```

---

## Coding Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `WatchCard`, `ListContainer` |
| Files (components) | kebab-case | `watch-card.tsx`, `list-container.tsx` |
| Route files | directory-based | `app/(app)/list/index.tsx`, `app/(app)/watch/[entryId].tsx` |
| Types/Interfaces | PascalCase | `WatchCardEntry`, `EditEntryData` |
| Functions | camelCase | `getReleaseYear`, `normalizeDetails` |
| Constants | UPPER_SNAKE_CASE | `SUPABASE_URL`, `TMDB_API_READ_TOKEN` |

### Import Aliases

TypeScript path alias (tsconfig.json):
```typescript
// Use ~/... for app/ imports
import { cn } from '~/lib/utils';
import { createClient } from '~/lib/supabase/client';
```

### Styling Patterns

**React Native StyleSheet**:
```typescript
import { View, Text, StyleSheet } from 'react-native';

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});
```

**Combining styles**:
```typescript
<View style={[styles.base, isActive && styles.active]} />
```

**Inline styles for dynamic values**:
```typescript
<View style={[styles.container, { backgroundColor: color }]} />
```

**Cross-platform styling**:
```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  text: {
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
      web: { fontFamily: 'system-ui' },
    }),
  },
});
```

### Component Structure

**Typical component file**:
```typescript
// 1. Imports
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// 2. Types/Interfaces
interface MyComponentProps {
  data: string[];
  onSelect: (id: number) => void;
}

// 3. Helper functions (if needed)
function formatData(data: string[]): string[] {
  return data.map(d => d.trim());
}

// 4. Component
export function MyComponent({ data, onSelect }: MyComponentProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <Pressable key={index} onPress={() => onSelect(index)}>
          <Text>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// 5. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase.from("table").select();
  if (error) throw error;
  // Process data
} catch (err) {
  const message = err instanceof Error
    ? err.message
    : typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: string }).message)
      : "An unexpected error occurred";
  setError(message);
}
```

---

## Testing Guidelines

### Test File Naming

- **Unit tests**: `*.test.tsx` or `*.test.ts`
- **Integration tests**: `*.integration.test.ts`

### Unit Test Pattern

**Mock Supabase client**:
```typescript
const mockOrder = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ order: mockOrder })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));

vi.mock("~/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe("ListPageContainer", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockOrder.mockReset();
  });

  it("renders saved entries", async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 1, /* ... */ }],
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Test Entry")).toBeInTheDocument();
    });
  });
});
```

**Render helper**:
```typescript
import { render } from '@testing-library/react';
import { TMDBConfigurationContext } from '~/lib/tmdb-api/tmdb-configuration';

function renderWithProviders(component: React.ReactElement) {
  return render(
    <TMDBConfigurationContext.Provider value={mockConfig}>
      {component}
    </TMDBConfigurationContext.Provider>
  );
}

// Usage
renderWithProviders(<ListContainer />);
```

**Mock Expo Router**:
```typescript
// Mock expo-router navigation
vi.mock('expo-router', () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
  useLocalSearchParams: () => ({}),
}));
```

### Integration Test Pattern

**Important**: Add `@vitest-environment node` comment:
```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestUser, cleanupTestUser, createAdminClient } from '~/test-utils/supabase';

describe('Application-level: feature name', () => {
  it('does something with real database', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed } = testUser;

    try {
      const { data, error } = await authed
        .from('entries')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
    } finally {
      await cleanupTestUser(admin, testUser.userId);
    }
  });
});
```

### Test Utilities

**Available helpers** (app/test-utils/supabase.ts):
- `createAdminClient()` - Admin Supabase client
- `createTestUser(admin)` - Create test user with auth
- `getGroupId(client)` - Get user's group ID
- `cleanupTestUser(admin, userId)` - Delete test user

### Running Tests

```bash
# Unit tests only (fast, no external deps)
npm test -- --exclude "**/*.integration.test.*"

# Integration tests only (requires Supabase)
npm test -- integration.test

# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test -- list-page.test.tsx
```

### CI/CD Testing

**GitHub Actions** (.github/workflows/tests.yml):
1. **Unit tests**: Run on every push/PR (no Supabase required)
2. **Integration tests**: Run after unit tests pass (starts local Supabase in Docker)

---

## Common Tasks

### Adding a New Feature

1. **Create route file**: `app/(app)/my-feature/index.tsx` (for `/app/my-feature`)
2. **Create container component**: `lib/my-feature/my-feature-container.tsx`
3. **Create presenter component**: `lib/my-feature/my-feature.tsx`
4. **Create components**: `lib/my-feature/components/` for feature-specific components
5. **Add tests**: `lib/my-feature/__tests__/` or co-located `.test.tsx` files
6. **Add navigation**: Update `app/(app)/_layout.tsx` tab configuration if needed

### Adding a Database Table

1. **Create schema file**: `supabase/schemas/NN_table_name.sql`
2. **Define table** with RLS policies:
```sql
CREATE TABLE public.my_table (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their group's data
CREATE POLICY "Users can view their group's data"
  ON public.my_table FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid()));
```

3. **Generate migration**:
```bash
npx supabase stop
npx supabase db diff -f add_my_table
npx supabase start
npx supabase db reset
```

4. **Regenerate types**:
```bash
npx supabase gen types typescript --local > lib/supabase/database.generated.types.ts
```

5. **Push to production**:
```bash
npx supabase db push
```

### Adding a Shared Component

1. **Create file**: `app/components/my-component.tsx`
2. **Export component**:
```typescript
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

3. **Import and use**:
```typescript
import { MyComponent } from '~/components/my-component';
```

### Updating TMDB Integration

**TMDB API calls** go through `app/tmdb-api/tmdb-api.ts`:

```typescript
const api = useContext(TMDBAPIContext);
const results = await api.searchMulti(query);
```

**Add new API method**:
```typescript
// In tmdb-api.ts TMDBAPI class
async myNewMethod(param: string): Promise<MyResponse> {
  return this.fetch<MyResponse>(`/my/endpoint?param=${param}`);
}
```

---

## Deployment

### GitHub Pages (Web)

**Automatic deployment** on push to `main` branch via `.github/workflows/deploy.yml`.

**Required Secrets** (Settings → Secrets → Actions):
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Production anon key
- `VITE_TMDB_API_READ_TOKEN` - TMDB API token

**Required Variables**:
- `PAGES_DOMAIN` - Custom domain (`video-clerk.adamstegman.com`)

*Note: Secret names use `VITE_` prefix for backward compatibility, but are mapped to `EXPO_PUBLIC_` in workflows.*

**Setup**:
1. Add secrets/variables in GitHub
2. Enable GitHub Pages (Settings → Pages → Deploy from branch → `gh-pages` / root)
3. Configure custom domain in GitHub Pages settings (optional)
4. Enable workflow write permissions (Settings → Actions → General → Read and write permissions)

**Manual deployment**:
```bash
npm run build:web  # Exports to dist/
# Outputs to dist/ directory
```

### PR Staging Previews

**Automatic preview** on pull request via `.github/workflows/staging-preview.yml`.

- Preview URL: `https://yourdomain.com/staging/pr-<PR_NUMBER>/`
- Uses dynamic `baseUrl` configuration for subdirectory routing
- Automatically cleaned up when PR closes

### iOS App Store

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete iOS deployment guide.

**Quick start**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

**Requirements**:
- Apple Developer account
- App Store Connect setup
- iOS distribution certificate
- App-specific privacy manifest

---

## Important Files Reference

### Configuration Files

| File | Purpose | Key Settings |
|------|---------|--------------|
| `package.json` | Dependencies, scripts | Main: `expo-router/entry`, Expo SDK 54 |
| `tsconfig.json` | TypeScript config | Extends `expo/tsconfig.base`, path alias `~/*` → `app/*` |
| `app.json` | Expo config | App name, slug, platforms, experiments.baseUrl |
| `metro.config.js` | Metro bundler | Standard Expo Metro configuration |
| `eas.json` | EAS Build config | Build profiles (dev, preview, production) |
| `vitest.setup.ts` | Test setup | Testing library, error suppression |
| `supabase/config.toml` | Local Supabase | Port settings, API config |

### Key Application Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with context providers |
| `app/(app)/_layout.tsx` | Protected layout, auth guard, tab navigation |
| `lib/supabase/client.ts` | Supabase client factory |
| `lib/supabase/database.generated.types.ts` | Generated database types |
| `lib/tmdb-api/tmdb-api.ts` | TMDB API wrapper class |
| `lib/tmdb-api/tmdb-api-provider.tsx` | TMDB API context provider |
| `lib/utils/error-handling.ts` | Error handling utilities |

### Database Schema

Schema files in `supabase/schemas/`:
- `00_groups.sql` - Groups and memberships (multi-user support)
- `01_tags.sql` - Tags for entries
- `02_tmdb_details.sql` - TMDB metadata cache
- `03_entries.sql` - Main entries table
- `04_entry_tags.sql` - Junction table for entry-tag relationships
- `05_save_tmdb_result_rpc.sql` - RPC for saving entries
- `06_group_invites.sql` - Group invitation system

### GitHub Workflows

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/tests.yml` | Unit + integration tests | Push, PR |
| `.github/workflows/deploy.yml` | Production deployment | Push to `main` |
| `.github/workflows/staging-preview.yml` | PR preview deployment | PR open/update/close |

---

## Documented Solutions (REQUIRED)

The `docs/solutions/` directory contains institutional knowledge — lessons learned from past mistakes and workflow improvements. **Every AI agent (Claude, Cursor, Gemini, or any other) MUST consult these solutions at the start of every coding session and follow them throughout.**

### How to use documented solutions

1. **At session start**: Read all files in `docs/solutions/` to understand current workflow requirements
2. **During work**: Follow the solutions as mandatory workflow steps, not optional suggestions
3. **When you hit a problem**: Check if a documented solution already covers it before debugging from scratch
4. **When you solve a new problem**: If it's likely to recur, add a new solution file following the existing format

### Current solutions

| Solution | Summary |
|----------|---------|
| [`workflow-issues/commit-push-on-open-pr`](docs/solutions/workflow-issues/commit-push-on-open-pr-System-20260206.md) | Always commit and push when the current branch has an open PR |
| [`workflow-issues/update-docs-on-every-commit`](docs/solutions/workflow-issues/update-docs-on-every-commit-System-20260210.md) | Before each commit, verify that any docs changed in the PR still match the code |

### Solution file format

Solutions use YAML frontmatter for fast filtering by `tags`, `category`, `module`, and `symptoms`. See existing files for the template.

---

## Best Practices for AI Assistants

### When Reading Code

1. **Always read files before editing** - Use the Read tool first
2. **Check existing patterns** - Look at similar components for consistency
3. **Verify types** - Check `database.types.ts` for Supabase table structures
4. **Review tests** - Understand expected behavior from test files

### When Writing Code

1. **Follow container/presenter pattern** - Separate data fetching from UI
2. **Use type-safe Supabase queries** - Leverage generated types
3. **Handle loading/error states** - Always show loading and error UI
4. **Normalize Supabase data** - Handle single object or array returns
5. **Use cancellation flags** - Prevent state updates after unmount
6. **Export style constants** - Don't repeat Tailwind class combinations
7. **Write tests** - Add unit tests for new components

### When Modifying Database

1. **Never edit migrations directly** - Use `supabase db diff` to generate them
2. **Always include RLS policies** - Enforce group-based access control
3. **Regenerate types** - Run `supabase gen types` after schema changes
4. **Test migrations locally** - Use `supabase db reset` before pushing

### When Debugging

1. **Check browser console** - React and Supabase errors logged there
2. **Verify environment variables** - Check `.env` file exists and is correct
3. **Ensure Supabase is running** - Run `npx supabase status`
4. **Check RLS policies** - Common source of "no rows returned" issues
5. **Review network tab** - Check Supabase API calls and responses

---

## Questions & Support

- **Documentation**: See `README.md` for development setup and `DEPLOYMENT.md` for iOS deployment
- **Issues**: Check existing GitHub issues or create a new one
- **Schema Reference**: `lib/supabase/database.generated.types.ts` for all table structures
- **API Reference**: [Expo docs](https://docs.expo.dev/), [Expo Router docs](https://docs.expo.dev/router/introduction/), [Supabase docs](https://supabase.com/docs), [React Native docs](https://reactnative.dev/docs/getting-started)

---

**Last Updated**: 2026-02-10
