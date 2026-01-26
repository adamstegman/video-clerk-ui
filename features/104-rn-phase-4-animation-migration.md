# Phase 4: Animation Migration (motion to Reanimated)

**Status**: Planned
**Estimated Effort**: 3-4 days
**Prerequisites**: Phase 1, 2 & 3 complete

## Context

This phase migrates animations from the `motion` library (Framer Motion successor) to React Native Reanimated 3. This is one of the most complex phases because the watch page card swiping involves sophisticated gesture handling and spring physics animations.

**Key Concepts**:
- **Shared Values**: Animated values that run on UI thread (`useSharedValue`)
- **Animated Styles**: Styles derived from shared values (`useAnimatedStyle`)
- **Gestures**: Touch handling via react-native-gesture-handler
- **Worklets**: Functions that run on UI thread (marked with `'worklet'`)
- **runOnJS**: Call JS functions from worklets

## Current Animation Implementation

The watch page (`app/watch/watch-page.tsx`) contains ~280 lines of animation logic:

1. **Card dragging**: Pointer/touch events update position in real-time
2. **Card rotation**: Rotation based on horizontal drag distance
3. **Like/Nope stamps**: Opacity changes based on drag direction
4. **Spring snap-back**: If not past threshold, card snaps back
5. **Swipe-out animation**: Card flies off screen when decision made
6. **Stack effect**: Background cards have scale/position offset

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/watch/hooks/use-card-swipe.ts` | Swipe gesture logic |
| `src/features/watch/components/swipeable-card.tsx` | Animated card wrapper |
| `src/features/watch/components/card-stack.tsx` | Stacked cards display |
| `src/features/watch/components/like-nope-stamp.tsx` | Animated stamps |

## Files to Reference

| Current File | Key Logic |
|--------------|-----------|
| `app/watch/watch-page.tsx:78-180` | Drag event handlers |
| `app/watch/watch-page.tsx:182-220` | Animation execution |
| `app/watch/watch-page.tsx:275-340` | Card rendering with transform |
| `app/watch/components/watch-card.tsx` | Card UI structure |
| `app/watch/components/watch-deck-view.tsx` | Deck layout |

## Step-by-Step Instructions

### Step 1: Understand Current Animation Flow

**Current flow** (from `app/watch/watch-page.tsx`):

```typescript
// State tracking drag
const [dragState, setDragState] = useState({
  activeDx: 0,
  activeDy: 0,
  isDragging: false,
  decision: null,
  animatingOut: false,
});

// On pointer/touch move
const handleMove = (clientX, clientY) => {
  const dx = clientX - startX;
  const dy = clientY - startY;
  setDragState(prev => ({ ...prev, activeDx: dx, activeDy: dy }));
};

// Card style based on drag
style={{
  transform: `translateX(${activeDx}px) translateY(${activeDy}px) rotate(${activeDx / 14}deg)`,
  transition: isDragging ? 'none' : 'transform 0.22s ease-out',
}}
```

**New flow** (Reanimated):

```typescript
// Shared values (run on UI thread)
const translateX = useSharedValue(0);
const translateY = useSharedValue(0);

// Gesture handler
const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  })
  .onEnd((e) => {
    // Decide: swipe out or snap back
  });

// Animated style
const cardStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { rotate: `${translateX.value / 14}deg` },
  ],
}));
```

### Step 2: Create Card Swipe Hook

Create `src/features/watch/hooks/use-card-swipe.ts`:

```typescript
import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";

const SWIPE_THRESHOLD = 110;
const SWIPE_OUT_DURATION = 220;
const SWIPE_OUT_X = 420;

export type SwipeDirection = "left" | "right";

interface UseCardSwipeOptions {
  onSwipe: (direction: SwipeDirection) => void;
  enabled?: boolean;
}

export function useCardSwipe({ onSwipe, enabled = true }: UseCardSwipeOptions) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const resetPosition = useCallback(() => {
    "worklet";
    translateX.value = withSpring(0, {
      stiffness: 220,
      damping: 30,
    });
    translateY.value = withSpring(0, {
      stiffness: 220,
      damping: 30,
    });
  }, [translateX, translateY]);

  const swipeOut = useCallback(
    (direction: SwipeDirection) => {
      "worklet";
      const targetX = direction === "right" ? SWIPE_OUT_X : -SWIPE_OUT_X;

      translateX.value = withTiming(
        targetX,
        {
          duration: SWIPE_OUT_DURATION,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(onSwipe)(direction);
          }
        }
      );
    },
    [translateX, onSwipe]
  );

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isActive.value = false;

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe threshold reached
        const direction: SwipeDirection =
          event.translationX > 0 ? "right" : "left";
        swipeOut(direction);
      } else {
        // Snap back to center
        resetPosition();
      }
    })
    .onFinalize(() => {
      isActive.value = false;
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 14}deg` },
    ],
  }));

  // Like stamp opacity (shows when swiping right)
  const likeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / SWIPE_THRESHOLD, 0), 1),
  }));

  // Nope stamp opacity (shows when swiping left)
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateX.value / SWIPE_THRESHOLD, 0), 1),
  }));

  // Manual swipe functions for button presses
  const swipeLeft = useCallback(() => {
    swipeOut("left");
  }, [swipeOut]);

  const swipeRight = useCallback(() => {
    swipeOut("right");
  }, [swipeOut]);

  // Reset for new card
  const reset = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  return {
    panGesture,
    cardStyle,
    likeStyle,
    nopeStyle,
    translateX,
    isActive,
    swipeLeft,
    swipeRight,
    reset,
  };
}
```

### Step 3: Create Like/Nope Stamp Component

Create `src/features/watch/components/like-nope-stamp.tsx`:

```typescript
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import type { AnimatedStyle } from "react-native-reanimated";

interface StampProps {
  type: "like" | "nope";
  style: AnimatedStyle;
}

export function LikeNopeStamp({ type, style }: StampProps) {
  const isLike = type === "like";

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 40,
          [isLike ? "left" : "right"]: 20,
          zIndex: 10,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <View
        className={`rounded-lg border-4 px-4 py-2 ${
          isLike
            ? "border-green-500 bg-green-500/20"
            : "border-red-500 bg-red-500/20"
        }`}
        style={{ transform: [{ rotate: isLike ? "-15deg" : "15deg" }] }}
      >
        <Text
          className={`text-2xl font-bold ${
            isLike ? "text-green-500" : "text-red-500"
          }`}
        >
          {isLike ? "LIKE" : "NOPE"}
        </Text>
      </View>
    </Animated.View>
  );
}
```

### Step 4: Create Swipeable Card Component

Create `src/features/watch/components/swipeable-card.tsx`:

```typescript
import { type ReactNode } from "react";
import Animated from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import { useCardSwipe, type SwipeDirection } from "../hooks/use-card-swipe";
import { LikeNopeStamp } from "./like-nope-stamp";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  enabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipe,
  enabled = true,
}: SwipeableCardProps) {
  const { panGesture, cardStyle, likeStyle, nopeStyle } = useCardSwipe({
    onSwipe,
    enabled,
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={cardStyle} className="relative">
        <LikeNopeStamp type="like" style={likeStyle} />
        <LikeNopeStamp type="nope" style={nopeStyle} />
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
```

### Step 5: Create Watch Card Component

Create `src/features/watch/components/watch-card.tsx`:

```typescript
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { cn } from "@/lib/utils";

export interface WatchCardEntry {
  id: number;
  title: string;
  releaseYear?: string;
  posterUrl?: string;
  genres?: string[];
  runtime?: number;
}

interface WatchCardProps {
  entry: WatchCardEntry;
  className?: string;
}

export function WatchCard({ entry, className }: WatchCardProps) {
  const { title, releaseYear, posterUrl, genres, runtime } = entry;

  return (
    <View
      className={cn(
        "overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl",
        className
      )}
    >
      {/* Poster */}
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          className="aspect-[2/3] w-full"
          contentFit="cover"
        />
      ) : (
        <View className="aspect-[2/3] w-full items-center justify-center bg-zinc-800">
          <Text className="text-zinc-500">No Poster</Text>
        </View>
      )}

      {/* Info overlay */}
      <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
        <Text className="text-xl font-bold text-white" numberOfLines={2}>
          {title}
        </Text>

        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          {releaseYear && (
            <Text className="text-sm text-zinc-300">{releaseYear}</Text>
          )}

          {runtime && (
            <>
              <Text className="text-zinc-500">•</Text>
              <Text className="text-sm text-zinc-300">
                {Math.floor(runtime / 60)}h {runtime % 60}m
              </Text>
            </>
          )}
        </View>

        {genres && genres.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1">
            {genres.slice(0, 3).map((genre) => (
              <View
                key={genre}
                className="rounded-full bg-zinc-700/80 px-2 py-0.5"
              >
                <Text className="text-xs text-zinc-300">{genre}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
```

### Step 6: Create Card Stack Component

Create `src/features/watch/components/card-stack.tsx`:

```typescript
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { SwipeableCard } from "./swipeable-card";
import { WatchCard, type WatchCardEntry } from "./watch-card";
import type { SwipeDirection } from "../hooks/use-card-swipe";

const MAX_VISIBLE_CARDS = 4;

interface CardStackProps {
  entries: WatchCardEntry[];
  onSwipe: (direction: SwipeDirection, entry: WatchCardEntry) => void;
}

export function CardStack({ entries, onSwipe }: CardStackProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 340); // Max 340px, with padding

  const handleSwipe = (direction: SwipeDirection) => {
    const topEntry = entries[0];
    if (topEntry) {
      onSwipe(direction, topEntry);
    }
  };

  // Only render top N cards for performance
  const visibleEntries = entries.slice(0, MAX_VISIBLE_CARDS);

  return (
    <View
      className="items-center justify-center"
      style={{ height: cardWidth * 1.5 + 40 }}
    >
      {visibleEntries.map((entry, index) => (
        <CardInStack
          key={entry.id}
          entry={entry}
          index={index}
          cardWidth={cardWidth}
          onSwipe={handleSwipe}
          isTop={index === 0}
        />
      ))}
    </View>
  );
}

interface CardInStackProps {
  entry: WatchCardEntry;
  index: number;
  cardWidth: number;
  onSwipe: (direction: SwipeDirection) => void;
  isTop: boolean;
}

function CardInStack({
  entry,
  index,
  cardWidth,
  onSwipe,
  isTop,
}: CardInStackProps) {
  // Stack effect: cards behind are smaller and offset
  const scale = 1 - index * 0.03;
  const translateY = index * 10;

  const stackStyle = useAnimatedStyle(() => ({
    transform: [{ scale }, { translateY }],
    zIndex: MAX_VISIBLE_CARDS - index,
  }));

  const cardContent = (
    <WatchCard entry={entry} style={{ width: cardWidth }} />
  );

  if (isTop) {
    // Only top card is swipeable
    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            width: cardWidth,
          },
          stackStyle,
        ]}
      >
        <SwipeableCard onSwipe={onSwipe}>{cardContent}</SwipeableCard>
      </Animated.View>
    );
  }

  // Background cards are static
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: cardWidth,
        },
        stackStyle,
      ]}
    >
      {cardContent}
    </Animated.View>
  );
}
```

### Step 7: Create Action Buttons for Swipe

Create `src/features/watch/components/swipe-buttons.tsx`:

```typescript
import { View, Pressable } from "react-native";
import { X, Heart } from "lucide-react-native";

interface SwipeButtonsProps {
  onNope: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function SwipeButtons({ onNope, onLike, disabled }: SwipeButtonsProps) {
  return (
    <View className="flex-row items-center justify-center gap-8 py-6">
      {/* Nope button */}
      <Pressable
        onPress={onNope}
        disabled={disabled}
        className="h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 active:bg-red-500/20 disabled:opacity-50"
      >
        <X color="#ef4444" size={32} />
      </Pressable>

      {/* Like button */}
      <Pressable
        onPress={onLike}
        disabled={disabled}
        className="h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 active:bg-green-500/20 disabled:opacity-50"
      >
        <Heart color="#22c55e" size={32} />
      </Pressable>
    </View>
  );
}
```

### Step 8: Update Watch Screen to Use New Components

Update `app/(app)/(tabs)/watch/index.tsx`:

```typescript
import { useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardStack } from "@/features/watch/components/card-stack";
import { SwipeButtons } from "@/features/watch/components/swipe-buttons";
import type { WatchCardEntry } from "@/features/watch/components/watch-card";
import type { SwipeDirection } from "@/features/watch/hooks/use-card-swipe";

// Mock data for testing (Phase 5 will fetch real data)
const MOCK_ENTRIES: WatchCardEntry[] = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    releaseYear: "1994",
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    genres: ["Drama"],
    runtime: 142,
  },
  {
    id: 2,
    title: "The Godfather",
    releaseYear: "1972",
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    genres: ["Drama", "Crime"],
    runtime: 175,
  },
  {
    id: 3,
    title: "The Dark Knight",
    releaseYear: "2008",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    genres: ["Action", "Crime", "Drama"],
    runtime: 152,
  },
];

export default function WatchScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<WatchCardEntry[]>(MOCK_ENTRIES);
  const [liked, setLiked] = useState<WatchCardEntry[]>([]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection, entry: WatchCardEntry) => {
      // Remove top card
      setEntries((prev) => prev.slice(1));

      // Track likes
      if (direction === "right") {
        setLiked((prev) => [...prev, entry]);
      }
    },
    []
  );

  const handleNope = useCallback(() => {
    if (entries.length > 0) {
      handleSwipe("left", entries[0]);
    }
  }, [entries, handleSwipe]);

  const handleLike = useCallback(() => {
    if (entries.length > 0) {
      handleSwipe("right", entries[0]);
    }
  }, [entries, handleSwipe]);

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Header */}
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-white">What to Watch?</Text>
        <Text className="text-sm text-zinc-400">
          {liked.length}/3 liked • {entries.length} remaining
        </Text>
      </View>

      {/* Card stack */}
      <View className="flex-1 items-center justify-center">
        {entries.length > 0 ? (
          <CardStack entries={entries} onSwipe={handleSwipe} />
        ) : (
          <View className="items-center">
            <Text className="text-lg text-zinc-400">No more cards!</Text>
            <Text className="mt-2 text-sm text-zinc-500">
              Liked {liked.length} entries
            </Text>
          </View>
        )}
      </View>

      {/* Swipe buttons */}
      {entries.length > 0 && (
        <SwipeButtons
          onNope={handleNope}
          onLike={handleLike}
          disabled={entries.length === 0}
        />
      )}
    </View>
  );
}
```

### Step 9: Add Entering/Exiting Animations

For cards entering the stack when one is removed, update `card-stack.tsx`:

```typescript
import Animated, {
  useAnimatedStyle,
  FadeIn,
  Layout,
} from "react-native-reanimated";

// In CardInStack component:
<Animated.View
  entering={FadeIn.duration(200)}
  layout={Layout.springify()}
  style={[/* ... */]}
>
```

### Step 10: Handle Button-Triggered Swipes

The hook needs to expose imperative swipe methods. Update `use-card-swipe.ts` to return `swipeLeft` and `swipeRight` functions, then pass refs or callbacks from parent.

Alternative approach using a ref:

```typescript
// In parent component
const cardSwipeRef = useRef<{ swipeLeft: () => void; swipeRight: () => void }>(null);

// In SwipeableCard
useImperativeHandle(ref, () => ({
  swipeLeft: () => swipeOut("left"),
  swipeRight: () => swipeOut("right"),
}));
```

### Step 11: Performance Optimization

Add these optimizations for smooth 60fps:

```typescript
// In useCardSwipe hook, wrap callbacks properly
const handleSwipeComplete = useCallback((direction: SwipeDirection) => {
  "worklet";
  runOnJS(onSwipe)(direction);
}, [onSwipe]);

// Use interpolate for smooth opacity transitions
const likeOpacity = useDerivedValue(() => {
  return interpolate(
    translateX.value,
    [0, SWIPE_THRESHOLD],
    [0, 1],
    Extrapolate.CLAMP
  );
});
```

## Test Guidance

### Manual Testing

1. **Swipe gestures**:
   - Drag card right past threshold → Card should fly off, "LIKE" shown
   - Drag card left past threshold → Card should fly off, "NOPE" shown
   - Drag and release before threshold → Card should snap back smoothly

2. **Button swipes**:
   - Tap heart button → Card should animate right and off screen
   - Tap X button → Card should animate left and off screen

3. **Visual feedback**:
   - While dragging right → "LIKE" stamp opacity increases
   - While dragging left → "NOPE" stamp opacity increases
   - Card rotates based on horizontal drag

4. **Stack behavior**:
   - Should see 4 cards stacked
   - Background cards slightly smaller and offset
   - When top card removed, next card becomes swipeable

5. **Performance**:
   - Animations should be smooth (60fps)
   - No jank or stuttering during drag
   - Test on older devices if possible

### Automated Testing

Create `__tests__/features/watch/use-card-swipe.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react-hooks";
import { useCardSwipe } from "@/features/watch/hooks/use-card-swipe";

describe("useCardSwipe", () => {
  it("initializes with zero translation", () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useCardSwipe({ onSwipe }));

    expect(result.current.translateX.value).toBe(0);
  });

  it("calls onSwipe when swipeLeft is called", async () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useCardSwipe({ onSwipe }));

    act(() => {
      result.current.swipeLeft();
    });

    // Wait for animation
    await new Promise((r) => setTimeout(r, 300));

    expect(onSwipe).toHaveBeenCalledWith("left");
  });
});
```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] `useCardSwipe` hook created with gesture handling
- [ ] `SwipeableCard` component wraps cards with gestures
- [ ] `WatchCard` component displays entry info
- [ ] `CardStack` component renders stacked cards
- [ ] `SwipeButtons` component for manual swipe
- [ ] `LikeNopeStamp` shows during swipe
- [ ] Swipe right past threshold → "like" callback fires
- [ ] Swipe left past threshold → "nope" callback fires
- [ ] Release before threshold → card snaps back
- [ ] Button presses trigger swipe animations
- [ ] Cards stack with scale/offset effect
- [ ] Animations run at 60fps (no jank)
- [ ] Card rotation follows horizontal drag
- [ ] Like/Nope stamp opacity follows drag
- [ ] Works on both web and iOS
- [ ] No TypeScript errors

## Troubleshooting

### Gestures not responding
1. Ensure `GestureHandlerRootView` wraps app in root layout
2. Check gesture is enabled (`enabled` prop)
3. Verify `GestureDetector` wraps the animated view

### Animation jank
1. Use `"worklet"` directive on functions running on UI thread
2. Don't call `setState` directly in gesture handlers (use `runOnJS`)
3. Reduce number of animated views

### Card not flying off
1. Check `SWIPE_OUT_X` is large enough to move card off screen
2. Verify animation duration and easing

### Stamps not showing
1. Check z-index/elevation on stamp views
2. Verify opacity animation is working (log values)

---

**Next Phase**: [Phase 5: Component Migrations](105-rn-phase-5-component-migrations.md)
