# Video Clerk

A universal React Native application for deciding what to watch together. Built with Expo for web and iOS from a single codebase.

## Features

- **Discover**: Save movies and TV shows when you hear about them
- **Decide**: Swipe through your list with filters to pick a winner
- **Share**: Collaborate with groups to build shared watch lists
- **Cross-platform**: Works on web (GitHub Pages) and iOS (App Store)

## Tech Stack

- **Framework**: Expo SDK 54 (React Native + Web)
- **Routing**: Expo Router v4 (file-based routing)
- **Backend**: Supabase (Postgres + Auth + RLS)
- **API**: TMDB API for movie/TV metadata
- **Styling**: React Native StyleSheet
- **Testing**: Vitest + React Testing Library
- **Deployment**: GitHub Pages (web), EAS Build (iOS)

## Development

### Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- iOS Simulator or physical device (optional, for iOS development)

### Installation

Install dependencies:

```bash
npm install
```

### Local Supabase Setup

Start a local Supabase instance:

```bash
npx supabase start
```

Create a `.env` file with the authentication keys from the command output:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SECRET_KEY=your-secret-key-here
EXPO_PUBLIC_TMDB_API_READ_TOKEN=your-tmdb-token-here
```

Get your TMDB API Read Token from [TMDB](https://www.themoviedb.org/settings/api).

### Development Server

Start the Expo development server:

```bash
npm start
```

Then choose your platform:
- Press `w` to open in web browser
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan QR code with Expo Go app on physical device

Or start directly for a specific platform:

```bash
npm run web      # Web only
npm run ios      # iOS only
npm run android  # Android only
```

Your web application will be available at `http://localhost:8081`.

## Building

### Web Production Build

Create a static web build for deployment:

```bash
npm run build:web
```

Output will be in the `dist/` directory.

### iOS Build

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete iOS deployment guide using EAS Build.

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios --profile production
```

## Testing

Run tests:

```bash
npm test
```

**Unit tests** run without external dependencies (fast).

**Integration tests** run against a local Supabase instance (Docker). The `.env` file is used locally. In CI, no GitHub secrets are required.

Run tests in watch mode:

```bash
npm test -- --watch
```

Run type checking:

```bash
npm run typecheck
```

## Database Management

### Generating Migrations

After making schema changes in `supabase/schemas/*.sql`:

```bash
# Stop and generate migration
npx supabase stop
npx supabase db diff -f <update_description>

# Apply locally
npx supabase start
npx supabase db reset

# Regenerate TypeScript types
npx supabase gen types typescript --local > lib/supabase/database.generated.types.ts

# Push to production
npx supabase db push
```

### Database Schema

Schema files are organized in `supabase/schemas/`:
- `00_groups.sql` - Groups and memberships
- `01_tags.sql` - Tags for entries
- `02_tmdb_details.sql` - TMDB metadata cache
- `03_entries.sql` - Watch list entries
- `04_entry_tags.sql` - Entry-tag relationships
- `05_save_tmdb_result_rpc.sql` - RPC functions
- `06_group_invites.sql` - Group invitation system

## Deployment

### GitHub Pages (Web)

Automatic deployment on push to `main` branch.

**Setup Instructions:**

1. **Configure GitHub Variables and Secrets:**
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add **Variables**:
     - `PAGES_DOMAIN` - Your custom domain (e.g., `videoclerk.app`)
   - Add **Secrets**:
     - `VITE_SUPABASE_URL` - Your production Supabase URL
     - `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Your Supabase anon key
     - `VITE_TMDB_API_READ_TOKEN` - Your TMDB API token

   *Note: Secret names use `VITE_` prefix for backward compatibility, but are mapped to `EXPO_PUBLIC_` in workflows.*

2. **Enable GitHub Pages:**
   - Go to **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/ (root)`**

3. **Enable Workflow Permissions:**
   - Go to **Settings** → **Actions** → **General**
   - Workflow permissions: **Read and write permissions**

4. **Configure Custom Domain (optional):**
   - After first deployment: **Settings** → **Pages** → Enter domain
   - DNS will be configured automatically

**Deployment happens automatically on push to `main`.**

Manual deployment:
1. Go to **Actions** tab
2. Select **Deploy to GitHub Pages**
3. Click **Run workflow**

### PR Staging Previews

Pull requests automatically deploy previews to:

```
https://your-domain.com/staging/pr-<NUMBER>/
```

Previews are automatically cleaned up when the PR closes.

### iOS App Store

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- App icons and splash screens
- EAS Build configuration
- TestFlight submission
- App Store submission
- Privacy labels

Quick start:

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

## Project Structure

```
video-clerk/
├── app/                          # Expo Router routes
│   ├── (app)/                    # Protected routes (requires auth)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── list/                 # List feature
│   │   ├── watch/                # Watch feature
│   │   └── settings.tsx          # Settings
│   ├── invite/                   # Group invites
│   ├── login.tsx                 # Authentication
│   └── _layout.tsx               # Root layout
├── lib/                          # Shared libraries
│   ├── supabase/                 # Supabase client + types
│   ├── tmdb-api/                 # TMDB API wrapper
│   └── utils/                    # Utilities
├── assets/                       # Images and icons
├── supabase/                     # Database schema
│   ├── schemas/                  # Schema definitions
│   └── migrations/               # Migration history
├── .github/workflows/            # CI/CD
│   ├── deploy.yml                # Production deployment
│   ├── staging-preview.yml       # PR previews
│   └── tests.yml                 # Tests
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
└── DEPLOYMENT.md                 # iOS deployment guide
```

## Architecture

### Universal Platform

Single codebase serves:
- **Web**: Static export deployed to GitHub Pages
- **iOS**: Native app distributed via App Store
- **Future**: Android (v2)

### Routing

File-based routing with Expo Router:
- `app/index.tsx` → `/`
- `app/login.tsx` → `/login`
- `app/(app)/list/index.tsx` → `/app/list`
- `app/(app)/watch/[entryId].tsx` → `/app/watch/:entryId`

Parentheses `()` create route groups without adding path segments.

### State Management

- **Global**: React Context (user, TMDB config)
- **Local**: Component state with hooks
- **Server**: Direct Supabase queries (no caching layer)

### Authentication

- Supabase Auth with magic links
- Universal Links for iOS deep linking (`/auth/*`, `/invite/*`)
- Expo SecureStore for tokens on iOS
- Web uses browser localStorage

### Styling

React Native StyleSheet API:
- Cross-platform styling
- Type-safe style objects
- No CSS-in-JS runtime
- Web compiled to CSS via react-native-web

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - iOS deployment guide
- [CLAUDE.md](./CLAUDE.md) - AI assistant guide
- [docs/architecture.md](./docs/architecture.md) - Architecture deep dive
- [docs/plans/](./docs/plans/) - Migration plans and decisions

## License

MIT

## Legal

This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
