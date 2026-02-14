import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SwipeableCardProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: ReactNode;
}

const SWIPE_THRESHOLD = 120;
const SPRING_CONFIG = { stiffness: 300, damping: 20 };

export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  children,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;

      if (
        Math.abs(translateX.value) > SWIPE_THRESHOLD &&
        !hasTriggeredHaptic.value
      ) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      }
      if (Math.abs(translateX.value) < SWIPE_THRESHOLD) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onFinalize((event) => {
      const shouldDismiss =
        Math.abs(event.velocityX) > 500 ||
        Math.abs(translateX.value) > SWIPE_THRESHOLD;

      if (shouldDismiss) {
        const direction = translateX.value > 0 ? 1 : -1;
        const callback = direction > 0 ? onSwipeRight : onSwipeLeft;
        const exitX = direction * (SCREEN_WIDTH + 200);
        translateX.value = withTiming(exitX, { duration: 300 }, () => {
          runOnJS(callback)();
        });
        translateY.value = withTiming(translateY.value * 2, { duration: 300 });
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-200, 0, 200],
          [-15, 0, 15]
        )}deg`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={cardStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
