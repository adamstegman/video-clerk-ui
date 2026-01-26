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

### Required Automated Tests

All tests must pass before this phase can be merged.

#### `scripts/__tests__/build-web.test.ts`

```typescript
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

describe("Web Build Script", () => {
  const distPath = path.join(process.cwd(), "dist");

  afterEach(() => {
    // Cleanup dist directory after tests
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true });
    }
  });

  describe("build output", () => {
    it("creates dist directory", () => {
      execSync("npm run build:web", { stdio: "pipe" });
      expect(fs.existsSync(distPath)).toBe(true);
    });

    it("creates index.html", () => {
      execSync("npm run build:web", { stdio: "pipe" });
      expect(fs.existsSync(path.join(distPath, "index.html"))).toBe(true);
    });

    it("creates 404.html for SPA routing", () => {
      execSync("./scripts/build-web.sh", { stdio: "pipe" });
      expect(fs.existsSync(path.join(distPath, "404.html"))).toBe(true);
    });

    it("index.html and 404.html have same content", () => {
      execSync("./scripts/build-web.sh", { stdio: "pipe" });

      const index = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      const notFound = fs.readFileSync(path.join(distPath, "404.html"), "utf-8");

      expect(index).toBe(notFound);
    });
  });

  describe("CNAME file", () => {
    it("creates CNAME when PAGES_DOMAIN is set", () => {
      execSync("PAGES_DOMAIN=example.com ./scripts/build-web.sh", { stdio: "pipe" });
      expect(fs.existsSync(path.join(distPath, "CNAME"))).toBe(true);
      expect(fs.readFileSync(path.join(distPath, "CNAME"), "utf-8").trim()).toBe("example.com");
    });

    it("does not create CNAME when PAGES_DOMAIN is not set", () => {
      execSync("./scripts/build-web.sh", { stdio: "pipe" });
      expect(fs.existsSync(path.join(distPath, "CNAME"))).toBe(false);
    });
  });
});
```

#### `__tests__/config/eas-config.test.ts`

```typescript
import * as fs from "fs";
import * as path from "path";

describe("EAS Configuration", () => {
  const easConfigPath = path.join(process.cwd(), "eas.json");
  let easConfig: any;

  beforeAll(() => {
    const content = fs.readFileSync(easConfigPath, "utf-8");
    easConfig = JSON.parse(content);
  });

  describe("build profiles", () => {
    it("has development profile", () => {
      expect(easConfig.build.development).toBeDefined();
    });

    it("has preview profile", () => {
      expect(easConfig.build.preview).toBeDefined();
    });

    it("has production profile", () => {
      expect(easConfig.build.production).toBeDefined();
    });
  });

  describe("environment variables", () => {
    it("preview profile includes required env vars", () => {
      const env = easConfig.build.preview.env;
      expect(env.EXPO_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(env.EXPO_PUBLIC_TMDB_API_READ_TOKEN).toBeDefined();
    });

    it("production profile includes required env vars", () => {
      const env = easConfig.build.production.env;
      expect(env.EXPO_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(env.EXPO_PUBLIC_TMDB_API_READ_TOKEN).toBeDefined();
    });
  });

  describe("iOS configuration", () => {
    it("uses M1 resource class for faster builds", () => {
      expect(easConfig.build.preview.ios.resourceClass).toBe("m1-medium");
      expect(easConfig.build.production.ios.resourceClass).toBe("m1-medium");
    });
  });
});
```

#### `__tests__/config/app-config.test.ts`

```typescript
import * as fs from "fs";
import * as path from "path";

describe("App Configuration", () => {
  const appConfigPath = path.join(process.cwd(), "app.json");
  let appConfig: any;

  beforeAll(() => {
    const content = fs.readFileSync(appConfigPath, "utf-8");
    appConfig = JSON.parse(content);
  });

  describe("expo config", () => {
    it("has name", () => {
      expect(appConfig.expo.name).toBe("Video Clerk");
    });

    it("has scheme for deep linking", () => {
      expect(appConfig.expo.scheme).toBe("videoclerk");
    });
  });

  describe("iOS config", () => {
    it("has bundle identifier", () => {
      expect(appConfig.expo.ios.bundleIdentifier).toBeDefined();
    });

    it("has URL scheme for deep linking", () => {
      const schemes = appConfig.expo.ios.infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes;
      expect(schemes).toContain("videoclerk");
    });
  });

  describe("web config", () => {
    it("uses static output", () => {
      expect(appConfig.expo.web.output).toBe("static");
    });

    it("uses metro bundler", () => {
      expect(appConfig.expo.web.bundler).toBe("metro");
    });
  });

  describe("EAS config", () => {
    it("has project ID", () => {
      expect(appConfig.expo.extra.eas.projectId).toBeDefined();
    });
  });
});
```

#### GitHub Actions Workflow Tests

```typescript
// __tests__/ci/workflows.test.ts
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

describe("GitHub Actions Workflows", () => {
  const workflowsDir = path.join(process.cwd(), ".github/workflows");

  describe("deploy-web.yml", () => {
    let workflow: any;

    beforeAll(() => {
      const content = fs.readFileSync(path.join(workflowsDir, "deploy-web.yml"), "utf-8");
      workflow = yaml.load(content);
    });

    it("triggers on push to main", () => {
      expect(workflow.on.push.branches).toContain("main");
    });

    it("has build job", () => {
      expect(workflow.jobs.build).toBeDefined();
    });

    it("has deploy job", () => {
      expect(workflow.jobs.deploy).toBeDefined();
    });

    it("runs typecheck", () => {
      const buildSteps = workflow.jobs.build.steps;
      const typecheckStep = buildSteps.find((s: any) => s.name?.includes("Type check"));
      expect(typecheckStep).toBeDefined();
    });

    it("runs tests", () => {
      const buildSteps = workflow.jobs.build.steps;
      const testStep = buildSteps.find((s: any) => s.name?.includes("test"));
      expect(testStep).toBeDefined();
    });
  });

  describe("build-ios.yml", () => {
    let workflow: any;

    beforeAll(() => {
      const content = fs.readFileSync(path.join(workflowsDir, "build-ios.yml"), "utf-8");
      workflow = yaml.load(content);
    });

    it("triggers on push to main", () => {
      expect(workflow.on.push.branches).toContain("main");
    });

    it("triggers on pull request", () => {
      expect(workflow.on.pull_request).toBeDefined();
    });

    it("uses expo github action", () => {
      const steps = workflow.jobs.build.steps;
      const expoStep = steps.find((s: any) => s.uses?.includes("expo/expo-github-action"));
      expect(expoStep).toBeDefined();
    });
  });
});
```

### CI Requirements

```yaml
jobs:
  phase-7-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci

      - name: Run config tests
        run: npm test -- --testPathPattern="config|ci/workflows" --coverage

      - name: Validate eas.json
        run: |
          if ! npx ajv validate -s node_modules/eas-cli/schema/eas.schema.json -d eas.json; then
            echo "eas.json is invalid"
            exit 1
          fi

      - name: Validate app.json
        run: |
          node -e "JSON.parse(require('fs').readFileSync('app.json'))"

      - name: Test web build
        run: npm run build:web
        env:
          EXPO_PUBLIC_SUPABASE_URL: http://localhost
          EXPO_PUBLIC_SUPABASE_ANON_KEY: test
          EXPO_PUBLIC_TMDB_API_READ_TOKEN: test

      - name: Verify build output
        run: |
          test -f dist/index.html || exit 1
          echo "Web build successful"
```

### Coverage Requirements

| File | Min Statements | Min Branches |
|------|---------------|--------------|
| `scripts/build-web.sh` | N/A (shell script) | N/A |
| `eas.json` | N/A (config) | N/A |
| `app.json` | N/A (config) | N/A |

### Local Verification

```bash
# Test web build locally
npm run build:web
npx serve dist
# Open http://localhost:3000

# Test EAS config
eas build:configure --platform ios
```

### Manual Verification (Optional)

For extra confidence:
1. **Push to main**: Web deploys to GitHub Pages
2. **Create PR**: Tests run, build completes
3. **Visit deployed URL**: App loads correctly

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
