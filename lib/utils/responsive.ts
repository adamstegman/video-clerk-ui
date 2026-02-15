import { useWindowDimensions } from 'react-native';

export const WIDE_BREAKPOINT = 768;

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
