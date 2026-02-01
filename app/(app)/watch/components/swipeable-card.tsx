import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';

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
        runOnJS(translateX.value > 0 ? onSwipeRight : onSwipeLeft)();
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
