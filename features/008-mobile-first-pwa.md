# Feature Spec: Mobile-First Design & Progressive Web App (PWA)

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #1 (8a249e1), #3 (8200fbd)

## Overview

Video Clerk is designed as a mobile-first Progressive Web App (PWA) that provides a native-like experience on smartphones and tablets. The app handles mobile-specific challenges like safe area insets, viewport height variations, and touch interactions.

## Problem Statement

Modern mobile browsers and iOS in particular have unique layout challenges:
- **Safe area insets**: iOS notches, home indicators, and dynamic islands require padding
- **Viewport height**: Dynamic browser UI causes `100vh` to be unreliable
- **Home screen install**: Users want to add app to home screen for quick access
- **Touch interactions**: Different from desktop mouse interactions
- **Performance**: Mobile devices have less powerful CPUs

The app must feel native and work seamlessly across all mobile devices.

## Requirements

### Functional Requirements

1. **Safe Area Insets**
   - Respect iOS safe areas (notch, home indicator, status bar)
   - Prevent content from being obscured by device UI
   - Apply to header and navigation bar

2. **Viewport Handling**
   - Use stable viewport height units
   - Prevent content from being pushed off-screen by dynamic browser UI
   - Work in both portrait and landscape

3. **PWA Manifest**
   - App name and description
   - Icons for home screen (multiple sizes)
   - Display mode (standalone)
   - Theme color and background color
   - Start URL

4. **Mobile Meta Tags**
   - Viewport meta tag with proper configuration
   - Apple-specific meta tags
   - Theme color for browser chrome

5. **Touch Interactions**
   - Touch-friendly tap targets (minimum 44x44px)
   - Swipe gestures for card interactions
   - Prevent accidental scrolling during gestures
   - Visual feedback on touch

6. **Responsive Layout**
   - Mobile-first CSS (small screens first)
   - Breakpoints for tablet and desktop
   - Adapts to screen orientation

### Non-Functional Requirements

1. **Performance**: 60fps interactions on mid-range mobile devices
2. **Compatibility**: Works on iOS Safari, Chrome, Firefox, Samsung Internet
3. **Accessibility**: Touch targets meet WCAG AAA guidelines (44x44px)
4. **Install**: Can be added to home screen
5. **Offline**: Basic offline functionality (future)

## Design Decisions

### Decision 1: Mobile-First vs Desktop-First

**Options Considered**:
- A) Desktop-first (design for desktop, adapt to mobile)
- B) Mobile-first (design for mobile, enhance for desktop)
- C) Separate mobile and desktop apps
- D) Responsive but desktop-focused

**Decision**: Option B - Mobile-first

**Rationale**:
- Primary use case is couples deciding what to watch on couch (mobile)
- Easier to enhance small layouts than shrink large ones
- Forces focus on essential features
- Better performance on mobile (less to strip away)
- Matches CSS best practice (mobile-first media queries)
- Simpler codebase (one app, progressive enhancement)

### Decision 2: Safe Area Handling

**Options Considered**:
- A) Ignore safe areas (content may be obscured)
- B) Hardcoded padding for iOS
- C) CSS env(safe-area-inset-*)
- D) JavaScript-based detection

**Decision**: Option C - CSS env() variables

**Rationale**:
- Standard CSS feature (works on all platforms)
- Automatically adapts to device (iPhone X, iPhone 14 Pro, Android)
- No JavaScript needed
- Updates automatically on orientation change
- Fallback for browsers without safe areas (0px)

### Decision 3: Viewport Height Unit

**Options Considered**:
- A) vh (viewport height)
- B) dvh (dynamic viewport height)
- C) svh (small viewport height)
- D) lvh (large viewport height)
- E) Combination with fallback

**Decision**: Option C - svh with vh fallback

**Rationale**:
- `100vh` on iOS is taller than visible area (includes collapsed browser UI)
- `100dvh` changes dynamically (causes layout shift when scrolling)
- `100svh` is smallest stable height (always visible)
- Perfect for app shell (header + content + nav bar)
- Fallback to `vh` for older browsers
- Prevents bottom nav from being pushed off-screen

### Decision 4: PWA Manifest Configuration

**Options Considered**:
- A) No manifest (just web app)
- B) Minimal manifest (name and icon only)
- C) Full manifest with all options
- D) Different manifests for mobile/desktop

**Decision**: Option C - Full manifest

**Rationale**:
- Enables home screen installation
- Controls appearance when launched from home screen
- Standalone mode hides browser UI (feels native)
- Theme color matches app design
- Multiple icon sizes for different devices
- Standard web platform feature

### Decision 5: Icon Strategy

**Options Considered**:
- A) Single favicon only
- B) Multiple icon sizes manually created
- C) SVG icon with PNG fallbacks
- D) Icon generation service

**Decision**: Option C - SVG + PNG fallbacks

**Rationale**:
- SVG scales to any size (future-proof)
- PNG fallbacks for older devices
- Custom design reflects app purpose (TV + play button)
- Dark and light variants for different contexts
- Multiple sizes in manifest (192x192, 512x512)

### Decision 6: Touch Target Size

**Options Considered**:
- A) Standard button sizes (may be too small)
- B) 44x44px minimum (Apple HIG)
- C) 48x48px minimum (Material Design)
- D) Larger on mobile, smaller on desktop

**Decision**: Option B - 44x44px minimum

**Rationale**:
- Apple Human Interface Guidelines recommendation
- Accessible to users with motor impairments
- Reduces tap errors
- Comfortable for thumb use
- Applied to buttons, nav items, floating action button

### Decision 7: iOS Specific Handling

**Options Considered**:
- A) Ignore iOS quirks
- B) iOS-specific CSS with user-agent detection
- C) CSS feature detection only
- D) Apple meta tags where needed

**Decision**: Option D - Apple meta tags + CSS features

**Rationale**:
- `apple-mobile-web-app-capable` for standalone mode
- `apple-mobile-web-app-status-bar-style` for status bar
- Safe area insets via env() work on iOS and Android
- No need for user-agent detection
- Progressive enhancement

## Implementation Details

### Safe Area Insets

**Header** (`app/components/header/header.tsx`):
```css
padding-top: max(0.75rem, env(safe-area-inset-top));
```

**Navigation Bar** (`app/components/nav-bar/nav-bar.tsx`):
```css
padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
```

**How it works**:
- `env(safe-area-inset-top)` - Top safe area (notch, status bar)
- `env(safe-area-inset-bottom)` - Bottom safe area (home indicator)
- `max()` ensures minimum padding even without safe areas
- Automatically 0 on devices without safe areas

### Viewport Height

**App Shell** (`app/routes/app.tsx`):
```css
height: 100svh; /* Small viewport height */
height: 100vh; /* Fallback for older browsers */
```

**Why svh**:
- Stable height even when browser UI expands/collapses
- Prevents bottom nav from being pushed off-screen
- Better than dvh (which changes dynamically and causes jank)
- Implemented in #3 to fix iOS 26 issue

### PWA Manifest

**File**: `public/manifest.webmanifest`

```json
{
  "name": "Video Clerk",
  "short_name": "Video Clerk",
  "description": "Track what to watch, decide together",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/tv-minimal-play.light.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/tv-minimal-play.light.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Meta Tags

**File**: `app/root.tsx`

```html
<!-- Viewport configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- PWA -->
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#4f46e5" />

<!-- Apple-specific -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Video Clerk" />
<link rel="apple-touch-icon" href="/tv-minimal-play.light.png" />
```

**Key settings**:
- `viewport-fit=cover` - Enables safe area insets
- `apple-mobile-web-app-capable` - Standalone mode on iOS
- `theme-color` - Browser chrome color (matches app brand)

### Responsive Breakpoints

**Tailwind Configuration**:
- `sm`: 640px (large phones, small tablets)
- `md`: 768px (tablets, landscape phones)
- `lg`: 1024px (small desktops)
- `xl`: 1280px (desktops)

**Usage**:
```css
/* Mobile first (default) */
.button { padding: 0.5rem; }

/* Tablet and up */
@media (min-width: 768px) {
  .button { padding: 1rem; }
}
```

### Touch Targets

**Navigation Items**:
```css
min-height: 44px;
min-width: 44px;
```

**Floating Action Button**:
```css
width: 56px;
height: 56px;
```

**Buttons**:
```css
min-height: 44px;
padding: 0.5rem 1rem;
```

## Testing Strategy

### Device Testing
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Android tablet (Chrome)
- Desktop (Chrome, Firefox, Safari)

### Testing Checklist
- [ ] App installs to home screen on iOS
- [ ] App installs to home screen on Android
- [ ] Standalone mode hides browser UI
- [ ] Safe areas respected on iPhone (notch, home indicator)
- [ ] Safe areas respected on Android (notch)
- [ ] Bottom nav not pushed off-screen in any orientation
- [ ] Touch targets are easy to tap
- [ ] No accidental scrolling during swipes
- [ ] Landscape mode works correctly
- [ ] Works on small phones (iPhone SE, Galaxy S10)
- [ ] Works on large phones (iPhone Pro Max, Galaxy S23 Ultra)
- [ ] Works on tablets (iPad, Galaxy Tab)
- [ ] Performance is smooth (60fps)

### Browser Compatibility
- iOS Safari 15+ ✅
- Chrome 100+ ✅
- Firefox 100+ ✅
- Samsung Internet 15+ ✅

## Performance Optimizations

1. **Viewport Units**: svh is more performant than dvh (no layout recalc on scroll)
2. **Touch Events**: preventDefault on drag to avoid scroll jank
3. **Hardware Acceleration**: CSS transforms for animations (GPU-accelerated)
4. **Image Optimization**: Use TMDB's smallest image sizes for mobile

## Accessibility

### Touch Targets
- Minimum 44x44px (exceeds WCAG AAA 24x24px)
- Sufficient spacing between targets
- Visual feedback on touch (hover states)

### Contrast
- High contrast text (WCAG AA compliant)
- Visible focus states
- Dark mode support (respects system preference)

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Focus management

## Browser-Specific Quirks

### iOS Safari
- **Safe areas**: Requires `viewport-fit=cover` meta tag
- **100vh bug**: Uses browser chrome height, not visible height → Use svh
- **Scroll behavior**: Bouncy scroll can interfere with gestures
- **Home indicator**: 34px safe area at bottom on iPhone X+

### Android Chrome
- **Address bar**: Hides on scroll (dvh would cause jank)
- **Safe areas**: Smaller notch safe areas than iOS
- **Install prompt**: Shows automatically if criteria met

### Desktop Browsers
- **No safe areas**: env() returns 0px (ignored)
- **svh = vh**: Same behavior on desktop
- **Mouse vs Touch**: Different interaction patterns

## Future Enhancements

- **Service Worker**: Offline support, cache TMDB images
- **App Shortcuts**: Quick actions from home screen icon
- **Share Target**: Accept shared links from other apps
- **Background Sync**: Sync data when offline
- **Push Notifications**: Notify when group member adds entry
- **Badging**: Show unread count on app icon
- **Install Prompt**: Custom install prompt UI
- **App Update**: Notify user when new version available
- **Splash Screen**: Custom splash screen (white screen currently)
- **Dark Mode**: Automatic or manual dark mode toggle

## Notes

- **iOS 26 Fix**: #3 changed from `h-screen` to `h-svh` to fix nav bar being pushed off-screen
- **Safe Area Support**: Added in #1 to handle iPhone notches and home indicators
- **Manifest Location**: `/public/manifest.webmanifest` (served at root)
- **Icon Design**: Custom TV + play icon designed for app branding
- **Standalone Detection**: Can detect if app is running in standalone mode via `window.matchMedia('(display-mode: standalone)')`

## References

- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Viewport Units](https://caniuse.com/viewport-unit-variants)
- [PWA Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
