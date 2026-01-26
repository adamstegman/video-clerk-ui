# Phase 3: Styling Migration (Tailwind CSS to NativeWind)

**Status**: Planned
**Estimated Effort**: 3-4 days
**Prerequisites**: Phase 1 & 2 complete (project setup, routing)

## Context

This phase migrates the styling system from Tailwind CSS 4 (web) to NativeWind 4 (React Native). NativeWind allows using Tailwind CSS classes in React Native, but there are key differences in how styles are applied and which utilities are supported.

**Key Differences**:
- Web uses `div`, `span`, etc. → React Native uses `View`, `Text`
- Web CSS supports all Tailwind utilities → NativeWind has some limitations
- Web uses `className` on any element → RN requires `className` on RN components
- CSS `calc()` expressions → Must use JavaScript calculations
- CSS `env()` for safe areas → Must use `useSafeAreaInsets()` hook
- Pseudo-classes (`:hover`, `:focus`) → Limited or different in RN

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/utils.ts` | Update utility functions for RN compatibility |
| All component files | Update class names for NativeWind compatibility |

## Files to Reference

These existing files contain styling patterns to convert:

| Current File | Key Patterns |
|--------------|-------------|
| `app/lib/utils.ts` | Style utility functions, class constants |
| `app/components/header/header.tsx` | Safe area handling with CSS `env()` |
| `app/components/nav-bar/nav-bar.tsx` | Bottom safe area, fixed positioning |
| `app/watch/watch-page.tsx` | Complex responsive layouts |
| `app/list/saved-entry-row.tsx` | Row layouts with images |

## Step-by-Step Instructions

### Step 1: Update utils.ts

Create/update `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind merge support.
 * Works identically in web and React Native with NativeWind.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Style Constants
// ============================================
// These remain compatible with NativeWind

/** Page title styling */
export const pageTitleClasses = "text-lg font-bold text-white";

/** Section spacing */
export const sectionSpacingClasses = "mt-6";

/** Secondary/muted text */
export const secondaryTextClasses = "text-sm text-zinc-400";

/** Primary headings */
export const primaryHeadingClasses = "text-xl font-semibold text-white";

/** Error message text */
export const errorTextClasses = "text-sm text-red-500";

/** Success message text */
export const successTextClasses = "text-sm text-green-500";

// ============================================
// React Native Specific Helpers
// ============================================

/**
 * Common button base classes
 */
export const buttonBaseClasses = "rounded-lg px-4 py-3 active:opacity-80";

/**
 * Primary button (indigo)
 */
export const primaryButtonClasses = cn(buttonBaseClasses, "bg-indigo-600");

/**
 * Secondary button (zinc)
 */
export const secondaryButtonClasses = cn(buttonBaseClasses, "bg-zinc-800");

/**
 * Destructive button (red)
 */
export const destructiveButtonClasses = cn(buttonBaseClasses, "bg-red-600");

/**
 * Card/container base classes
 */
export const cardClasses = "rounded-xl bg-zinc-900 p-4";

/**
 * Input field classes
 */
export const inputClasses = "rounded-lg bg-zinc-800 px-4 py-4 text-white";
```

### Step 2: Understand NativeWind Limitations

**Supported (works as-is)**:
- Colors: `bg-zinc-900`, `text-white`, `border-zinc-700`
- Spacing: `p-4`, `m-2`, `gap-4`
- Sizing: `w-full`, `h-12`, `min-h-screen`
- Flexbox: `flex`, `flex-row`, `items-center`, `justify-between`
- Typography: `text-lg`, `font-bold`, `text-center`
- Borders: `rounded-lg`, `border`, `border-zinc-700`
- Opacity: `opacity-50`, `opacity-0`

**Not Supported / Different**:
| Web Tailwind | NativeWind Alternative |
|--------------|----------------------|
| `hover:bg-zinc-800` | Use `Pressable` with `pressed` state |
| `focus:ring-2` | Not supported; use border color change |
| `transition-colors` | Use Reanimated for animations |
| `animate-spin` | Use Reanimated rotation |
| `divide-y` | Apply borders individually |
| `line-clamp-2` | Use `numberOfLines={2}` prop |
| `truncate` | Use `numberOfLines={1}` |
| `overflow-hidden` | Works but clipping differs |
| `fixed`, `sticky` | Use absolute or different layout |
| CSS Grid | Use flexbox (RN doesn't support grid) |
| `calc()` | Compute in JS |
| `env(safe-area-*)` | Use `useSafeAreaInsets()` |

### Step 3: Safe Area Handling Pattern

**Current (CSS-based)**:
```tsx
<header className="pt-[calc(env(safe-area-inset-top)+1rem)]">
```

**New (Hook-based)**:
```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 16 }} className="bg-zinc-950">
      {/* content */}
    </View>
  );
}
```

**Create a helper hook** at `src/hooks/use-safe-padding.ts`:

```typescript
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";

interface SafePaddingOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Returns style object with safe area insets + additional padding
 */
export function useSafePadding(options: SafePaddingOptions = {}) {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      paddingTop: insets.top + (options.top ?? 0),
      paddingBottom: insets.bottom + (options.bottom ?? 0),
      paddingLeft: insets.left + (options.left ?? 0),
      paddingRight: insets.right + (options.right ?? 0),
    }),
    [insets, options.top, options.bottom, options.left, options.right]
  );
}

/**
 * Returns only top padding with safe area
 */
export function useSafeTopPadding(additional: number = 0) {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => ({ paddingTop: insets.top + additional }),
    [insets.top, additional]
  );
}

/**
 * Returns only bottom padding with safe area
 */
export function useSafeBottomPadding(additional: number = 0) {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => ({ paddingBottom: insets.bottom + additional }),
    [insets.bottom, additional]
  );
}
```

### Step 4: Button/Pressable Styling Pattern

**Current (HTML button with hover)**:
```tsx
<button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg">
  Click me
</button>
```

**New (Pressable with pressed state)**:
```tsx
import { Pressable, Text } from "react-native";

<Pressable
  className="rounded-lg bg-indigo-600 px-4 py-3 active:bg-indigo-500"
  onPress={handlePress}
>
  <Text className="text-center font-semibold text-white">Click me</Text>
</Pressable>
```

**Or with dynamic styling**:
```tsx
<Pressable
  className={({ pressed }) =>
    cn(
      "rounded-lg px-4 py-3",
      pressed ? "bg-indigo-500" : "bg-indigo-600"
    )
  }
  onPress={handlePress}
>
  {({ pressed }) => (
    <Text className={cn("text-center font-semibold", pressed ? "text-white/80" : "text-white")}>
      Click me
    </Text>
  )}
</Pressable>
```

### Step 5: Text Truncation Pattern

**Current (CSS)**:
```tsx
<p className="truncate">Long text that might overflow...</p>
<p className="line-clamp-2">Multi-line text with clamp...</p>
```

**New (React Native props)**:
```tsx
<Text className="text-white" numberOfLines={1}>
  Long text that might overflow...
</Text>
<Text className="text-white" numberOfLines={2}>
  Multi-line text with clamp...
</Text>
```

### Step 6: Image Styling Pattern

**Current (HTML img)**:
```tsx
<img
  src={posterUrl}
  alt={title}
  className="w-16 h-24 rounded-lg object-cover"
/>
```

**New (React Native Image or expo-image)**:
```tsx
import { Image } from "expo-image";

<Image
  source={{ uri: posterUrl }}
  className="h-24 w-16 rounded-lg"
  contentFit="cover"
  alt={title}
/>
```

**Note**: Install `expo-image` for better performance:
```bash
npx expo install expo-image
```

### Step 7: List/ScrollView Pattern

**Current (HTML with div)**:
```tsx
<div className="flex-1 overflow-y-auto">
  {items.map(item => <div key={item.id}>...</div>)}
</div>
```

**New (FlatList for performance)**:
```tsx
import { FlatList } from "react-native";

<FlatList
  data={items}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => <EntryRow entry={item} />}
  className="flex-1"
  contentContainerClassName="px-4 pb-4"
/>
```

**Or ScrollView for smaller lists**:
```tsx
import { ScrollView, View } from "react-native";

<ScrollView className="flex-1" contentContainerClassName="px-4 pb-4">
  {items.map(item => (
    <View key={item.id}>...</View>
  ))}
</ScrollView>
```

### Step 8: Responsive Layout Patterns

**Current (Tailwind breakpoints)**:
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>
```

**New (useWindowDimensions)**:
```tsx
import { View, useWindowDimensions } from "react-native";

function ResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768; // md breakpoint

  return (
    <View className={cn("gap-4", isWide ? "flex-row" : "flex-col")}>
      <View className={isWide ? "flex-1" : "w-full"}>Left</View>
      <View className={isWide ? "flex-1" : "w-full"}>Right</View>
    </View>
  );
}
```

**Create breakpoint hook** at `src/hooks/use-breakpoint.ts`:

```typescript
import { useWindowDimensions } from "react-native";

export type Breakpoint = "sm" | "md" | "lg" | "xl";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();

  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  return "sm";
}

export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= breakpoints.md;
}
```

### Step 9: Dark Mode Handling

**Current (Tailwind dark mode)**:
```tsx
<div className="bg-white dark:bg-zinc-950 text-black dark:text-white">
```

**New (React Native with useColorScheme)**:

This app is dark-mode only, so this is simplified. If you need light mode support:

```tsx
import { useColorScheme, View, Text } from "react-native";

function ThemedComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null

  return (
    <View className={colorScheme === "dark" ? "bg-zinc-950" : "bg-white"}>
      <Text className={colorScheme === "dark" ? "text-white" : "text-black"}>
        Themed text
      </Text>
    </View>
  );
}
```

**For this app**: Since it's dark-mode only, continue using dark colors directly:
```tsx
<View className="bg-zinc-950">
  <Text className="text-white">Always dark</Text>
</View>
```

### Step 10: Animation Class Replacements

**CSS animations that need Reanimated** (handled in Phase 4):

| CSS Class | Reanimated Replacement |
|-----------|----------------------|
| `animate-spin` | `useAnimatedStyle` with rotation |
| `animate-pulse` | `useAnimatedStyle` with opacity |
| `transition-all` | `withTiming` or `withSpring` |
| `duration-200` | Pass duration to animation |

**Create a loading spinner component** at `src/components/spinner.tsx`:

```tsx
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Loader2 } from "lucide-react-native";

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = "#6366f1" }: SpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1, // infinite
      false // don't reverse
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}
```

### Step 11: Common Component Style Conversions

**Header Component**:

```tsx
// src/components/header.tsx
import { View, Text, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function Header({ title, showBack, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between bg-zinc-950 px-4 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center gap-3">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            className="rounded-full p-1 active:bg-zinc-800"
          >
            <ArrowLeft color="white" size={24} />
          </Pressable>
        )}
        <Text className="text-xl font-bold text-white">{title}</Text>
      </View>
      {rightAction}
    </View>
  );
}
```

**Entry Row Component** (placeholder until Phase 5):

```tsx
// src/features/list/entry-row.tsx
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { ChevronRight } from "lucide-react-native";
import { Link } from "expo-router";

interface EntryRowProps {
  id: number;
  title: string;
  year?: string;
  posterUrl?: string;
}

export function EntryRow({ id, title, year, posterUrl }: EntryRowProps) {
  return (
    <Link href={`/(app)/(tabs)/list/${id}`} asChild>
      <Pressable className="flex-row items-center gap-3 rounded-lg bg-zinc-900 p-3 active:bg-zinc-800">
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            className="h-16 w-11 rounded-md"
            contentFit="cover"
          />
        ) : (
          <View className="h-16 w-11 items-center justify-center rounded-md bg-zinc-800">
            <Text className="text-xs text-zinc-500">No img</Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
          {year && (
            <Text className="text-sm text-zinc-400">{year}</Text>
          )}
        </View>

        <ChevronRight color="#71717a" size={20} />
      </Pressable>
    </Link>
  );
}
```

### Step 12: Form Input Component

```tsx
// src/components/text-input-field.tsx
import { View, Text, TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface TextInputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextInputField({
  label,
  error,
  className,
  ...props
}: TextInputFieldProps) {
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-zinc-400">{label}</Text>
      )}
      <TextInput
        className={cn(
          "rounded-lg bg-zinc-800 px-4 py-4 text-white",
          error && "border border-red-500",
          className
        )}
        placeholderTextColor="#71717a"
        {...props}
      />
      {error && <Text className="text-sm text-red-500">{error}</Text>}
    </View>
  );
}
```

### Step 13: Action Button Component

```tsx
// src/components/action-button.tsx
import { Pressable, Text, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

interface ActionButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 active:bg-indigo-500",
  secondary: "bg-zinc-800 active:bg-zinc-700",
  destructive: "bg-red-600 active:bg-red-500",
  ghost: "bg-transparent active:bg-zinc-800",
};

export function ActionButton({
  onPress,
  children,
  variant = "primary",
  loading,
  disabled,
  className,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "rounded-lg px-4 py-3",
        variantClasses[variant],
        (disabled || loading) && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : typeof children === "string" ? (
        <Text className="text-center font-semibold text-white">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
```

### Step 14: Install expo-image

Run:
```bash
npx expo install expo-image
```

Update `app.json` plugins if needed (expo-image usually auto-configures).

## Test Guidance

### Visual Regression Testing

1. **Compare layouts**:
   - Take screenshots of current web app
   - Compare with React Native app on same screen size
   - Key screens: List view, Watch view, Settings, Login

2. **Test responsive breakpoints**:
   - Resize window/simulator to different sizes
   - Verify layouts adjust appropriately
   - Test portrait and landscape orientations

3. **Test safe areas**:
   - Test on iPhone with notch (iPhone X+)
   - Verify content doesn't overlap status bar
   - Verify tab bar respects home indicator

### Component Testing

Create `__tests__/components/action-button.test.tsx`:

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { ActionButton } from "@/components/action-button";

describe("ActionButton", () => {
  it("renders children text", () => {
    const { getByText } = render(
      <ActionButton onPress={() => {}}>Click me</ActionButton>
    );
    expect(getByText("Click me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionButton onPress={onPress}>Click me</ActionButton>
    );
    fireEvent.press(getByText("Click me"));
    expect(onPress).toHaveBeenCalled();
  });

  it("shows loading indicator when loading", () => {
    const { queryByText, getByTestId } = render(
      <ActionButton onPress={() => {}} loading>
        Click me
      </ActionButton>
    );
    expect(queryByText("Click me")).toBeNull();
    // ActivityIndicator should be present
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionButton onPress={onPress} disabled>
        Click me
      </ActionButton>
    );
    fireEvent.press(getByText("Click me"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

- [ ] All text is visible (not cut off, correct colors)
- [ ] Buttons respond to press with visual feedback
- [ ] Images load with correct aspect ratio
- [ ] Safe area insets respected on all screens
- [ ] Scrolling works smoothly
- [ ] Input fields show keyboard and accept text
- [ ] Dark background consistent throughout app

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] `src/lib/utils.ts` updated with RN-compatible utilities
- [ ] `src/hooks/use-safe-padding.ts` created
- [ ] `src/hooks/use-breakpoint.ts` created
- [ ] `src/components/spinner.tsx` created with Reanimated animation
- [ ] `src/components/header.tsx` created with safe area handling
- [ ] `src/components/action-button.tsx` created with variants
- [ ] `src/components/text-input-field.tsx` created
- [ ] `expo-image` installed and working
- [ ] All existing route screens use new styling patterns
- [ ] No hardcoded `env()` CSS expressions
- [ ] All safe areas handled with `useSafeAreaInsets()`
- [ ] Buttons use Pressable with press feedback
- [ ] Text uses numberOfLines for truncation
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] App renders correctly on web and iOS simulator

## Troubleshooting

### Styles not applying
1. Ensure `global.css` is imported in root layout
2. Clear Metro cache: `npx expo start --clear`
3. Verify className is on RN component (View, Text, etc.)

### Text not visible
In React Native, text must be inside `<Text>` component. Raw strings in View won't render.

### Image not showing
1. Check URI is valid (starts with http:// or https://)
2. For local images, use `require()` syntax
3. Ensure Image has explicit dimensions

### Safe area not working
Ensure `SafeAreaProvider` wraps the entire app in root layout.

---

**Next Phase**: [Phase 4: Animation Migration](104-rn-phase-4-animation-migration.md)
