import { useColorScheme } from 'react-native';

const lightColors = {
  // Backgrounds
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
  disabled: '#e4e4e7',

  // Text
  text: '#18181b',
  textPrimary: '#1f2937',
  textLabel: '#374151',
  textSecondary: '#6b7280',
  textMuted: '#71717a',
  textSubtle: '#52525b',
  textTertiary: '#9ca3af',
  textOnColor: '#ffffff',
  textDanger: '#ef4444',
  textDangerStrong: '#dc2626',
  textBrand: '#4f46e5',
  textBrandLight: '#6366f1',
  textSuccess: '#22c55e',
  textWarning: '#f59e0b',

  // Borders
  border: '#e5e7eb',
  borderInput: '#d1d5db',
  borderMuted: '#d4d4d8',
  borderDanger: '#fecaca',
  borderWarning: '#fde68a',
  borderPrimarySubtle: '#c7d2fe',
};

const darkColors: ThemeColors = {
  // Backgrounds
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
  disabled: '#3f3f46',

  // Text
  text: '#fafafa',
  textPrimary: '#f4f4f5',
  textLabel: '#d4d4d8',
  textSecondary: '#a1a1aa',
  textMuted: '#a1a1aa',
  textSubtle: '#a1a1aa',
  textTertiary: '#71717a',
  textOnColor: '#ffffff',
  textDanger: '#ef4444',
  textDangerStrong: '#f87171',
  textBrand: '#818cf8',
  textBrandLight: '#a5b4fc',
  textSuccess: '#22c55e',
  textWarning: '#f59e0b',

  // Borders
  border: '#3f3f46',
  borderInput: '#52525b',
  borderMuted: '#52525b',
  borderDanger: '#7f1d1d',
  borderWarning: '#78350f',
  borderPrimarySubtle: '#312e81',
};

export type ThemeColors = typeof lightColors;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
