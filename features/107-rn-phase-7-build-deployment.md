# Phase 7: Build & Deployment Configuration

**Status**: Planned
**Estimated Effort**: 2-3 days
**Prerequisites**: Phase 1-6 complete

## Context

This phase configures the build and deployment pipelines for both web (GitHub Pages) and iOS (via EAS Build). The goal is to maintain continuous deployment to GitHub Pages while adding iOS build capabilities.

**Key Decisions**:
- **Web**: Build with Expo's static export, deploy to GitHub Pages
- **iOS**: Build with EAS Build, distribute via TestFlight
- **CI/CD**: GitHub Actions for automated builds and deployments

## Files to Create

| File | Purpose |
|------|---------|
| `eas.json` | EAS Build configuration |
| `.github/workflows/deploy-web.yml` | Web deployment workflow |
| `.github/workflows/build-ios.yml` | iOS build workflow |
| `scripts/build-web.sh` | Web build helper script |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add build scripts |
| `app.json` | Add EAS project ID |

## Files to Remove

| File | Reason |
|------|--------|
| `.github/workflows/deploy.yml` | Replace with new workflow |
| `.github/workflows/staging-preview.yml` | Update for Expo |

## Step-by-Step Instructions

### Step 1: Update package.json Scripts

Add/update build scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "expo start",
    "dev:web": "expo start --web",
    "dev:ios": "expo start --ios",
    "dev:android": "expo start --android",
    "build:web": "expo export --platform web",
    "build:ios:preview": "eas build --platform ios --profile preview",
    "build:ios:production": "eas build --platform ios --profile production",
    "build:android:preview": "eas build --platform android --profile preview",
    "submit:ios": "eas submit --platform ios",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:ci": "jest --ci --coverage",
    "lint": "eslint .",
    "prebuild": "expo prebuild",
    "clean": "rm -rf node_modules .expo dist ios android"
  }
}
```

### Step 2: Create EAS Configuration

Create `eas.json` in the project root:

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium",
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}",
        "EXPO_PUBLIC_TMDB_API_READ_TOKEN": "${EXPO_PUBLIC_TMDB_API_READ_TOKEN}"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}",
        "EXPO_PUBLIC_TMDB_API_READ_TOKEN": "${EXPO_PUBLIC_TMDB_API_READ_TOKEN}"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "${APPLE_ID}",
        "ascAppId": "${ASC_APP_ID}",
        "appleTeamId": "${APPLE_TEAM_ID}"
      }
    }
  }
}
```

### Step 3: Update app.json for EAS

Add EAS configuration to `app.json`:

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
      "bundleIdentifier": "com.videoclerk.app",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["videoclerk"]
          }
        ],
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#18181b"
      },
      "package": "com.videoclerk.app",
      "versionCode": 1
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "owner": "your-expo-username",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

**Note**: Replace `your-eas-project-id`, `your-expo-username` with actual values after running `eas init`.

### Step 4: Create Web Build Script

Create `scripts/build-web.sh`:

```bash
#!/bin/bash
set -e

echo "Building web application..."

# Export for web
npx expo export --platform web

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "Error: dist directory not created"
  exit 1
fi

# Create 404.html for SPA routing on GitHub Pages
cp dist/index.html dist/404.html

# Add CNAME file if domain is set
if [ -n "$PAGES_DOMAIN" ]; then
  echo "$PAGES_DOMAIN" > dist/CNAME
fi

echo "Web build complete!"
echo "Output directory: dist/"
ls -la dist/
```

Make it executable:
```bash
chmod +x scripts/build-web.sh
```

### Step 5: Create Web Deployment Workflow

Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

# Sets permissions for GITHUB_TOKEN
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:ci
        env:
          CI: true

      - name: Build web
        run: ./scripts/build-web.sh
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_TMDB_API_READ_TOKEN: ${{ secrets.TMDB_API_READ_TOKEN }}
          PAGES_DOMAIN: ${{ vars.PAGES_DOMAIN }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 6: Create iOS Build Workflow

Create `.github/workflows/build-ios.yml`:

```yaml
name: Build iOS App

on:
  push:
    branches: [main]
    paths:
      - "app/**"
      - "src/**"
      - "package.json"
      - "app.json"
      - "eas.json"
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      profile:
        description: "Build profile"
        required: true
        default: "preview"
        type: choice
        options:
          - preview
          - production

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Build iOS (Preview)
        if: github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && github.event.inputs.profile == 'preview')
        run: eas build --platform ios --profile preview --non-interactive
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_TMDB_API_READ_TOKEN: ${{ secrets.TMDB_API_READ_TOKEN }}

      - name: Build iOS (Production)
        if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.event.inputs.profile == 'production')
        run: eas build --platform ios --profile production --non-interactive
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_TMDB_API_READ_TOKEN: ${{ secrets.TMDB_API_READ_TOKEN }}

  submit:
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to App Store
        run: eas submit --platform ios --latest --non-interactive
        env:
          EXPO_APPLE_ID: ${{ secrets.APPLE_ID }}
          EXPO_ASC_APP_ID: ${{ secrets.ASC_APP_ID }}
          EXPO_APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          EXPO_ASC_API_KEY_ID: ${{ secrets.ASC_API_KEY_ID }}
          EXPO_ASC_API_KEY_ISSUER_ID: ${{ secrets.ASC_API_KEY_ISSUER_ID }}
          EXPO_ASC_API_KEY: ${{ secrets.ASC_API_KEY }}
```

### Step 7: Create PR Preview Workflow

Create `.github/workflows/pr-preview.yml`:

```yaml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:ci

      - name: Build web preview
        run: npx expo export --platform web
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EXPO_PUBLIC_TMDB_API_READ_TOKEN: ${{ secrets.TMDB_API_READ_TOKEN }}

      # Optional: Deploy to a preview URL
      # - name: Deploy preview
      #   uses: actions/upload-artifact@v4
      #   with:
      #     name: web-preview-${{ github.event.pull_request.number }}
      #     path: dist/

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Build successful! Web preview built and tests passed.'
            })
```

### Step 8: Initialize EAS Project

Run these commands to set up EAS:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS in the project
eas init

# Configure EAS build
eas build:configure
```

This will:
1. Create or link an Expo project
2. Generate a project ID
3. Update `app.json` with the project ID

### Step 9: Set Up GitHub Secrets

Add these secrets in GitHub repository settings (Settings > Secrets > Actions):

**Required for Web Deployment**:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `TMDB_API_READ_TOKEN` - TMDB API read token

**Required for iOS Builds**:
- `EXPO_TOKEN` - Expo access token (from expo.dev account settings)

**Required for App Store Submission** (optional):
- `APPLE_ID` - Your Apple ID email
- `ASC_APP_ID` - App Store Connect app ID
- `APPLE_TEAM_ID` - Apple Developer team ID
- `ASC_API_KEY_ID` - App Store Connect API key ID
- `ASC_API_KEY_ISSUER_ID` - API key issuer ID
- `ASC_API_KEY` - API key content (base64 encoded)

**Repository Variables**:
- `PAGES_DOMAIN` - Custom domain for GitHub Pages (optional)

### Step 10: Create Local Build Scripts

Create `scripts/build-local.sh` for local development builds:

```bash
#!/bin/bash
set -e

PLATFORM=${1:-"web"}

case $PLATFORM in
  "web")
    echo "Building web locally..."
    npx expo export --platform web
    echo "Build complete! Run 'npx serve dist' to preview."
    ;;
  "ios")
    echo "Building iOS locally (simulator)..."
    eas build --platform ios --profile development --local
    ;;
  "android")
    echo "Building Android locally..."
    eas build --platform android --profile development --local
    ;;
  *)
    echo "Usage: ./scripts/build-local.sh [web|ios|android]"
    exit 1
    ;;
esac
```

### Step 11: Create Environment Template

Create `.env.example`:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# TMDB API
EXPO_PUBLIC_TMDB_API_READ_TOKEN=your-tmdb-token

# Optional: For local Supabase development
# EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
# EXPO_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
```

### Step 12: Update .gitignore

Add build-related ignores:

```gitignore
# Build outputs
dist/
web-build/
build/

# EAS
.eas/

# Expo
.expo/
expo-env.d.ts

# Native builds (generated)
ios/
android/

# Environment files
.env
.env.local
.env.*.local

# Credentials (never commit)
*.p12
*.p8
*.mobileprovision
*.jks
```

## Test Guidance

### Local Build Testing

1. **Web build**:
   ```bash
   npm run build:web
   npx serve dist
   # Open http://localhost:3000
   ```

2. **iOS simulator build** (macOS only):
   ```bash
   eas build --platform ios --profile development --local
   # Opens in simulator
   ```

3. **Preview build**:
   ```bash
   eas build --platform ios --profile preview
   # Downloads .ipa file for device testing
   ```

### CI/CD Verification

1. **Push to main**:
   - Web should deploy to GitHub Pages
   - iOS build should start on EAS

2. **Create PR**:
   - Tests should run
   - Type check should pass
   - Preview build should complete

3. **Check deployment**:
   - Visit GitHub Pages URL
   - Verify app loads correctly
   - Check auth flow works

### EAS Build Verification

```bash
# Check build status
eas build:list

# View build logs
eas build:view

# Download build artifact
eas build:run
```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] `eas.json` created with all profiles
- [ ] `app.json` updated with EAS project ID
- [ ] Web build script creates working static export
- [ ] GitHub Actions workflow deploys web to Pages
- [ ] GitHub Actions workflow triggers EAS iOS builds
- [ ] PR preview workflow runs tests and type checks
- [ ] All required secrets configured in GitHub
- [ ] Local web build works: `npm run build:web`
- [ ] EAS build completes: `eas build --platform ios --profile preview`
- [ ] GitHub Pages deployment shows working app
- [ ] Environment variables properly injected in builds
- [ ] 404.html created for SPA routing

## Troubleshooting

### Web build fails with "export not supported"
Ensure `app.json` has `"web": { "output": "static" }`.

### EAS build fails with credentials error
Run `eas credentials` to set up iOS credentials interactively.

### GitHub Pages shows 404
1. Check Pages is enabled in repo settings
2. Verify `dist/404.html` exists
3. Check CNAME file if using custom domain

### Environment variables not in build
1. Verify secrets are set in GitHub
2. Check workflow passes secrets to build step
3. Ensure variables start with `EXPO_PUBLIC_`

### iOS build "not authorized"
1. Check EXPO_TOKEN is valid
2. Verify project ownership in Expo dashboard
3. Run `eas whoami` to confirm login

---

**Next Phase**: [Phase 8: Testing Infrastructure](108-rn-phase-8-testing.md)
