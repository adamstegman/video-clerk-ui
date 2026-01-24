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

---

## Project Overview

**Video Clerk** is a mobile-first web application that solves the "what do we watch?" problem by separating:
- **Discovery Phase**: Adding shows/movies to a list when you hear about them
- **Decision Phase**: Filtering that list based on current mood to find a winner

### Key Features
- User authentication via Supabase Auth
- Multi-user support with group-based sharing
- TMDB API integration for movie/TV metadata
- Card-swiping interface for choosing content
- Tag-based filtering and organization
- Group invitations for collaborative lists

### Architecture Philosophy
- **Mobile-first responsive design** with safe area insets
- **SPA mode** (no SSR) for simplified deployment
- **Container/Presenter pattern** for separation of concerns
- **Feature-based folder structure** for maintainability
- **Minimal dependencies** - direct Supabase client calls, no GraphQL/query libraries

---

## Technology Stack

### Core Framework
- **React 19.2** - UI library
- **React Router 7** - Routing with file-system based routes (`@react-router/fs-routes`)
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7** - Build tool and dev server

### Backend & Data
- **Supabase** - Postgres database, authentication, RLS
- **@supabase/supabase-js 2.89** - Supabase JavaScript client
- Generated TypeScript types from database schema

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **clsx** - Conditional class composition
- **tailwind-merge** - Conflicting class resolution
- **motion** (Framer Motion successor) - Animations

### UI Components
- **lucide-react** - Icon library
- Custom components (no component library like MUI/Chakra)

### Testing
- **Vitest 2.0** - Test runner
- **@testing-library/react 16.3** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for unit tests

### Development Tools
- **@dotenvx/dotenvx** - Environment variable management
- **Supabase CLI** - Local development database

---

## Project Structure

```
video-clerk-ui/
├── app/                          # Application source code
│   ├── routes/                   # Route files (fs-routes pattern)
│   │   ├── _index.tsx           # Landing/marketing page
│   │   ├── login.tsx            # Auth routes
│   │   ├── app.tsx              # Protected app layout + clientLoader auth guard
│   │   ├── app.list.tsx         # List feature routes
│   │   ├── app.watch.tsx        # Watch feature routes
│   │   └── app.settings.tsx     # Settings route
│   │
│   ├── list/                    # List feature (all list-related code)
│   │   ├── list-page-container.tsx
│   │   ├── list-page.tsx
│   │   ├── add-to-list-page.tsx
│   │   ├── edit-entry-page-container.tsx
│   │   ├── saved-entry-row.tsx
│   │   └── *.test.tsx
│   │
│   ├── watch/                   # Watch feature (card swiping)
│   │   ├── watch-page-container.tsx
│   │   ├── watch-page.tsx
│   │   ├── components/
│   │   │   ├── watch-card.tsx
│   │   │   ├── watch-deck-view.tsx
│   │   │   ├── watch-picker-view.tsx
│   │   │   └── watch-winner-view.tsx
│   │   └── *.test.tsx
│   │
│   ├── settings/                # Settings feature
│   │   ├── settings-page.tsx
│   │   └── *.test.tsx
│   │
│   ├── components/              # Shared UI components
│   │   ├── header/
│   │   ├── nav-bar/
│   │   ├── auth/                # Composable auth form blocks
│   │   └── *.tsx
│   │
│   ├── tmdb-api/               # TMDB API integration
│   │   ├── tmdb-api.ts         # TMDBAPI class
│   │   ├── tmdb-api-provider.tsx
│   │   ├── tmdb-configuration.tsx
│   │   └── tmdb-genres.tsx
│   │
│   ├── lib/                    # Utilities & clients
│   │   ├── utils.ts            # Styling utilities (cn, class constants)
│   │   └── supabase/
│   │       ├── client.ts       # createClient() factory
│   │       └── database.types.ts
│   │
│   ├── app-data/               # Global app context
│   │   └── app-data-provider.tsx
│   │
│   ├── test-utils/             # Testing utilities
│   │   └── supabase.ts
│   │
│   ├── root.tsx                # Root layout & error boundary
│   ├── app.css                 # Global styles
│   └── routes.ts               # Route config (auto-generated)
│
├── supabase/                   # Database schema & migrations
│   ├── config.toml             # Local Supabase config
│   ├── schemas/                # Schema definitions (SQL)
│   │   ├── 00_groups.sql
│   │   ├── 01_tags.sql
│   │   ├── 02_tmdb_details.sql
│   │   ├── 03_entries.sql
│   │   └── ...
│   └── migrations/             # Migration history
│
├── public/                     # Static assets
│   └── 404.html               # SPA routing fallback
│
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── tests.yml          # Unit & integration tests
│       ├── deploy.yml         # Production deployment
│       └── staging-preview.yml # PR previews
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── react-router.config.ts
└── vitest.setup.ts
```

### Feature-Based Organization

Each feature (list, watch, settings) contains:
- **Container components**: Data fetching and state management (`*-container.tsx`)
- **Presentational components**: UI rendering (no suffix)
- **Feature-specific components**: In `components/` subdirectory
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
# Set VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
# VITE_SUPABASE_SECRET_KEY, and VITE_TMDB_API_READ_TOKEN
```

### Development Commands

```bash
# Start dev server with HMR (http://localhost:5173)
npm run dev

# Run type checking
npm run typecheck

# Run tests (unit only)
npm test -- --exclude "**/*.integration.test.*"

# Run integration tests (requires local Supabase)
npm test -- integration.test

# Build for production
npm run build

# Start production server
npm start
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
npx supabase gen types typescript --local > app/lib/supabase/database.generated.types.ts

# Push to production
npx supabase db push
```

### Environment Variables

**Local Development** (`.env`):
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
VITE_SUPABASE_SECRET_KEY=eyJ...
VITE_TMDB_API_READ_TOKEN=eyJh...
```

**Production** (GitHub Secrets):
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Production anon key
- `VITE_TMDB_API_READ_TOKEN` - TMDB API read token
- `PAGES_DOMAIN` (Variable) - Custom domain for GitHub Pages

---

## Architectural Patterns

### 1. File-System Based Routing

Routes are automatically generated from files in `app/routes/`:

**Naming Convention**:
- `app.list.tsx` → `/app/list` (layout route)
- `app.list._index.tsx` → `/app/list` (index route)
- `app.list.$entryId.tsx` → `/app/list/:entryId` (dynamic param)
- `app.list_.add.tsx` → `/app/add` (underscore escapes parent path)

**Route Files Export**:
```typescript
// Meta tags
export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Page Title" },
    { name: "description", content: "..." }
  ];
}

// Client-side data loader (runs before render)
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: await fetchData(params.id) };
}

// Component
export default function MyRoute() {
  return <div>Content</div>;
}

// Pass config to parent layout (app/routes/app.tsx:16-19)
export const handle: RouteHandle = {
  rightHeaderAction: {
    to: "/app/list",
    icon: <Check />,
  },
};
```

### 2. Container/Presenter Pattern

**Purpose**: Separate data fetching from UI rendering

**Container Component** (`*-container.tsx`):
```typescript
// app/list/list-page-container.tsx
export function ListPageContainer() {
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

  return <ListPage entries={entries} loading={loading} error={error} />;
}
```

**Presentational Component**:
```typescript
// app/list/list-page.tsx
interface ListPageProps {
  entries: SavedEntryRowData[];
  loading: boolean;
  error: string | null;
}

export function ListPage({ entries, loading, error }: ListPageProps) {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{entries.map(entry => ...)}</div>;
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

All routes under `/app/*` require authentication via `clientLoader` in `app/routes/app.tsx:21-31`:

```typescript
export async function clientLoader({ request }: { request: Request }): Promise<AppData | Response> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    const url = new URL(request.url);
    const returnTo = url.pathname + url.search;
    return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return data;
}
```

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
| Components | PascalCase | `WatchCard`, `ListPageContainer` |
| Files (components) | kebab-case | `watch-card.tsx`, `list-page-container.tsx` |
| Route files | dot notation | `app.list.$entryId.tsx` |
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

**Utility function** (app/lib/utils.ts:4-6):
```typescript
import { cn } from '~/lib/utils';

<div className={cn(
  "flex items-center",
  isActive && "bg-indigo-600",
  className
)} />
```

**Style constants** (app/lib/utils.ts:8-14):
```typescript
import { pageTitleClasses, errorTextClasses } from '~/lib/utils';

<h1 className={pageTitleClasses}>Title</h1>
<p className={errorTextClasses}>Error message</p>
```

**Available constants**:
- `pageTitleClasses` - Page titles
- `sectionSpacingClasses` - Section spacing
- `secondaryTextClasses` - Secondary text
- `primaryHeadingClasses` - Primary headings
- `errorTextClasses` - Error messages
- `successTextClasses` - Success messages

### Component Structure

**Typical component file**:
```typescript
// 1. Imports
import { useState } from 'react';
import type { ComponentProps } from './types';

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
    <div>
      {/* JSX */}
    </div>
  );
}
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
function renderWithProviders() {
  const router = createMemoryRouter([{
    path: "/app/list",
    element: (
      <TMDBConfigurationContext value={mockConfig}>
        <ListPageContainer />
      </TMDBConfigurationContext>
    ),
  }]);
  return render(<RouterProvider router={router} />);
}
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

1. **Create feature directory**: `app/my-feature/`
2. **Create route file**: `app/routes/app.my-feature.tsx`
3. **Create container component**: `app/my-feature/my-feature-page-container.tsx`
4. **Create presenter component**: `app/my-feature/my-feature-page.tsx`
5. **Add tests**: `app/my-feature/my-feature-page.test.tsx`
6. **Add navigation**: Update `app/components/nav-bar/nav-bar.tsx`

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
npx supabase gen types typescript --local > app/lib/supabase/database.generated.types.ts
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

### GitHub Pages (Production)

**Automatic deployment** on push to `main` branch via `.github/workflows/deploy.yml`.

**Required Secrets** (Settings → Secrets → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_TMDB_API_READ_TOKEN`

**Required Variables**:
- `PAGES_DOMAIN` - Custom domain (e.g., `videoclerk.example.com`)

**Setup**:
1. Add secrets/variables in GitHub
2. Enable GitHub Pages (Settings → Pages → Deploy from branch → `gh-pages` / root)
3. Configure custom domain in GitHub Pages settings (optional)
4. Enable workflow write permissions (Settings → Actions → General → Read and write permissions)

### PR Staging Previews

**Automatic preview** on pull request via `.github/workflows/staging-preview.yml`.

- Preview URL: `https://yourdomain.com/staging/pr-<PR_NUMBER>/`
- Automatically cleaned up when PR closes

### Docker Deployment

Build and run Docker container:

```bash
docker build -t video-clerk .
docker run -p 3000:3000 video-clerk
```

Deploy to any platform supporting Docker (AWS ECS, Google Cloud Run, Fly.io, Railway, etc.).

### DIY Deployment

Deploy the built app to any Node.js hosting:

```bash
npm run build
# Deploy build/ directory
```

---

## Important Files Reference

### Configuration Files

| File | Purpose | Key Settings |
|------|---------|--------------|
| `package.json` | Dependencies, scripts | `type: "module"`, React Router 7, Supabase |
| `tsconfig.json` | TypeScript config | `strict: true`, path alias `~/*` → `app/*` |
| `vite.config.ts` | Build config | Base path support, Tailwind, test config |
| `react-router.config.ts` | Router config | `ssr: false`, basename for sub-paths |
| `vitest.setup.ts` | Test setup | Testing library, error suppression |
| `supabase/config.toml` | Local Supabase | Port settings, API config |

### Key Application Files

| File | Purpose |
|------|---------|
| `app/root.tsx` | Root layout, error boundary |
| `app/routes/app.tsx` | Protected layout, auth guard, context providers |
| `app/lib/supabase/client.ts` | Supabase client factory |
| `app/lib/supabase/database.types.ts` | Generated database types |
| `app/lib/utils.ts` | Styling utilities and constants |
| `app/app-data/app-data-provider.tsx` | User context provider |
| `app/tmdb-api/tmdb-api.ts` | TMDB API wrapper class |

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

- **Documentation**: See `README.md` for development setup
- **Issues**: Check existing GitHub issues or create a new one
- **Schema Reference**: `app/lib/supabase/database.types.ts` for all table structures
- **API Reference**: [React Router 7 docs](https://reactrouter.com/), [Supabase docs](https://supabase.com/docs)

---

**Last Updated**: 2026-01-24
