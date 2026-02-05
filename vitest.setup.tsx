import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock expo-secure-store (imported by lib/supabase/client.ts at module load)
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock lucide-react-native (used by 8+ components)
vi.mock('lucide-react-native', () => ({
  Users: () => null,
  UserPlus: () => null,
  Copy: () => null,
  Check: () => null,
  Search: () => null,
  Plus: () => null,
  X: () => null,
  ChevronRight: () => null,
  Trash2: () => null,
  Eye: () => null,
  Film: () => null,
  Tv: () => null,
  RotateCcw: () => null,
}));

// Mock expo-clipboard
vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn().mockResolvedValue(true),
  getStringAsync: vi.fn().mockResolvedValue(''),
}));

// Mock expo-image
vi.mock('expo-image', () => ({
  Image: ({ source, style }: { source: { uri: string }; style?: object }) => {
    const uri = source?.uri || '';
    // Return a simple div to avoid React warnings about invalid DOM nesting
    return null;
  },
}));

// Mock react-native-reanimated (must be before react-native-gesture-handler)
vi.mock('react-native-reanimated', () => {
  const View = ({ children, style }: { children?: React.ReactNode; style?: object }) => children;
  return {
    default: {
      View,
      Text: View,
      ScrollView: View,
      createAnimatedComponent: (component: unknown) => component,
    },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    useAnimatedGestureHandler: () => ({}),
    useAnimatedProps: () => ({}),
    withTiming: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withDelay: (delay: number, value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withRepeat: (value: unknown) => value,
    runOnJS: (fn: Function) => fn,
    cancelAnimation: vi.fn(),
    Easing: {
      linear: vi.fn(),
      ease: vi.fn(),
      quad: vi.fn(),
      cubic: vi.fn(),
      bezier: vi.fn(),
      in: vi.fn(),
      out: vi.fn(),
      inOut: vi.fn(),
    },
    interpolate: (value: number) => value,
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  };
});

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => {
  const mockGesture = {
    onStart: vi.fn(() => mockGesture),
    onUpdate: vi.fn(() => mockGesture),
    onChange: vi.fn(() => mockGesture),
    onEnd: vi.fn(() => mockGesture),
    onFinalize: vi.fn(() => mockGesture),
  };

  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: () => mockGesture,
      Tap: () => mockGesture,
    },
    Swipeable: ({ children }: { children: React.ReactNode }) => children,
    RectButton: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => children,
  };
});
