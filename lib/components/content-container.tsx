import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useIsWide } from '../utils/responsive';

interface ContentContainerProps {
  children: ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

export function ContentContainer({ children, maxWidth = 960, style }: ContentContainerProps) {
  const isWide = useIsWide();

  return (
    <View
      style={[
        { flex: 1 },
        isWide && { maxWidth, alignSelf: 'center', width: '100%' },
        style,
      ]}
    >
      {children}
    </View>
  );
}
