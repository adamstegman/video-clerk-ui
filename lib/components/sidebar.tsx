import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors, type ThemeColors } from '../theme/colors';

interface SidebarProps {
  currentRoute: string;
}

const NAV_ITEMS = [
  { route: '/watch', label: 'Watch', icon: 'play' as const },
  { route: '/list', label: 'List', icon: 'list' as const },
  { route: '/settings', label: 'Settings', icon: 'settings-outline' as const },
];

export function Sidebar({ currentRoute }: SidebarProps) {
  const colors = useThemeColors();

  return (
    <View
      role="tablist"
      style={[styles.container, { backgroundColor: colors.tabBar, borderRightColor: colors.separator }]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentRoute.startsWith(item.route);
        return (
          <SidebarItem
            key={item.route}
            label={item.label}
            icon={item.icon}
            isActive={isActive}
            colors={colors}
            onPress={() => router.push(`/(app)${item.route}` as `/${string}`)}
          />
        );
      })}
    </View>
  );
}

function SidebarItem({
  label,
  icon,
  isActive,
  colors,
  onPress,
}: {
  label: string;
  icon: 'play' | 'list' | 'settings-outline';
  isActive: boolean;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="tab"
      aria-selected={isActive}
      style={[styles.item, isActive && { backgroundColor: colors.primarySubtle }]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={isActive ? colors.primary : colors.textTertiary}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.primary : colors.textTertiary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    paddingTop: 16,
    borderRightWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  item: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
