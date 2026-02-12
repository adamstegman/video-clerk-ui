import { useColorScheme } from 'react-native';

const lightColors = {
  page: '#ffffff',
  surface: '#f4f4f5',
  surfaceSubtle: '#fafafa',
  input: '#f3f4f6',
  separator: '#e5e7eb',
  primary: '#4f46e5',
  primaryHeader: '#6366f1',
  primaryDisabled: '#a5b4fc',
  primarySubtle: '#eef2ff',
  primaryLight: '#e0e7ff',
  primaryMuted: '#c7d2fe',
  danger: '#ef4444',
  dangerSubtle: '#fef2f2',
  success: '#22c55e',
  warningSubtle: '#fef3c7',
  secondaryButton: '#ffffff',
  tabBar: '#fafafa',
  placeholder: '#52525b',
  overlay: 'rgba(0,0,0,0.3)',
  authCard: '#ffffff',
  authInput: '#ffffff',
  authSecondary: '#e5e7eb',
  featureCard: '#ffffff',
};

const darkColors: ThemeColors = {
  page: '#09090b',
  surface: '#18181b',
  surfaceSubtle: '#18181b',
  input: '#27272a',
  separator: '#3f3f46',
  primary: '#4f46e5',
  primaryHeader: '#6366f1',
  primaryDisabled: '#818cf8',
  primarySubtle: 'rgba(30,27,75,0.3)',
  primaryLight: '#1e1b4b',
  primaryMuted: '#312e81',
  danger: '#ef4444',
  dangerSubtle: 'rgba(127,29,29,0.2)',
  success: '#22c55e',
  warningSubtle: 'rgba(69,26,3,0.3)',
  secondaryButton: '#09090b',
  tabBar: '#27272a',
  placeholder: '#52525b',
  overlay: 'rgba(0,0,0,0.5)',
  authCard: '#27272a',
  authInput: '#3f3f46',
  authSecondary: '#3f3f46',
  featureCard: '#27272a',
};

export type ThemeColors = typeof lightColors;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
