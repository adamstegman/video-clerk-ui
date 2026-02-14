// Load environment variables from .env file for tests
require('dotenv').config();

// Mock expo winter runtime to prevent import errors
jest.mock('expo/src/winter/runtime.native.ts', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal.ts', () => ({}), { virtual: true });

// Mock expo-secure-store (imported by lib/supabase/client.ts at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock @expo/vector-icons (used by 10+ components)
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ source, style }) => null,
}));

// Mock react-native-worklets first (reanimated dependency)
jest.mock('react-native-worklets', () => ({}));

// Mock react-native-reanimated (must be before react-native-gesture-handler)
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View: RNView, Text: RNText, ScrollView: RNScrollView } = require('react-native');

  const AnimatedView = React.forwardRef((props, ref) => React.createElement(RNView, { ...props, ref }));
  const AnimatedText = React.forwardRef((props, ref) => React.createElement(RNText, { ...props, ref }));
  const AnimatedScrollView = React.forwardRef((props, ref) => React.createElement(RNScrollView, { ...props, ref }));

  return {
    default: {
      View: AnimatedView,
      Text: AnimatedText,
      ScrollView: AnimatedScrollView,
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    useAnimatedGestureHandler: () => ({}),
    useAnimatedProps: () => ({}),
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDelay: (delay, value) => value,
    withSequence: (...values) => values[values.length - 1],
    withRepeat: (value) => value,
    runOnJS: (fn) => fn,
    cancelAnimation: jest.fn(),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    interpolate: (value) => value,
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const mockGesture = {
    onStart: jest.fn(function() { return this; }),
    onUpdate: jest.fn(function() { return this; }),
    onChange: jest.fn(function() { return this; }),
    onEnd: jest.fn(function() { return this; }),
    onFinalize: jest.fn(function() { return this; }),
  };

  return {
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
    Gesture: {
      Pan: () => mockGesture,
      Tap: () => mockGesture,
    },
    Swipeable: ({ children }) => children,
    RectButton: ({ children, onPress }) => children,
  };
});
