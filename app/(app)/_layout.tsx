import { useEffect, useState } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../lib/supabase/client';
import { TMDBAPIProvider } from '../../lib/tmdb-api/tmdb-api-provider';
import { TMDBConfiguration } from '../../lib/tmdb-api/tmdb-configuration';
import { TMDBGenres } from '../../lib/tmdb-api/tmdb-genres';
import { useThemeColors } from '../../lib/theme/colors';
import { useIsWide } from '../../lib/utils/responsive';
import { Sidebar } from '../../lib/components/sidebar';
import type { User } from '@supabase/supabase-js';
import type { ThemeColors } from '../../lib/theme/colors';

interface CustomHeaderProps {
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  colors: ThemeColors;
}

function CustomHeader({ title, headerLeft, headerRight, colors }: CustomHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: colors.primaryHeader, paddingTop: insets.top }]}>
      <View style={styles.headerSide}>{headerLeft}</View>
      <Text role="heading" style={[styles.headerTitle, { color: colors.textOnColor }]} numberOfLines={1}>{title}</Text>
      <View style={styles.headerSide}>{headerRight}</View>
    </View>
  );
}

export default function AppLayout() {
  const colors = useThemeColors();
  const pathname = usePathname();
  const isWide = useIsWide();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        router.replace({ pathname: '/login', params: { redirect: pathname } });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.page }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TMDBAPIProvider>
      <TMDBConfiguration>
        <TMDBGenres>
          <View style={styles.root}>
            {isWide && <Sidebar currentRoute={pathname} />}
            <View style={styles.content}>
              <Tabs
                screenOptions={{
                  headerShown: true,
                  header: ({ options }) => (
                    <CustomHeader
                      title={options.headerTitle as string ?? options.title ?? ''}
                      headerLeft={options.headerLeft?.({ canGoBack: true, tintColor: colors.textOnColor })}
                      headerRight={options.headerRight?.({ canGoBack: true, tintColor: colors.textOnColor })}
                      colors={colors}
                    />
                  ),
                  sceneStyle: {
                    backgroundColor: colors.page,
                  },
                  tabBarActiveTintColor: colors.primary,
                  tabBarInactiveTintColor: colors.textTertiary,
                  tabBarLabelPosition: 'below-icon',
                  tabBarLabelStyle: {
                    fontSize: 12,
                    marginTop: 4,
                  },
                  tabBarStyle: isWide
                    ? { display: 'none' }
                    : {
                        borderTopWidth: 1,
                        borderTopColor: colors.separator,
                        height: 80,
                        paddingTop: 4,
                        paddingBottom: 16,
                        backgroundColor: colors.tabBar,
                      },
                }}
              >
                {/* Keep in sync with NAV_ITEMS in lib/components/sidebar.tsx */}
                <Tabs.Screen
                  name="watch/index"
                  options={{
                    title: 'Watch',
                    headerTitle: 'Watch',
                    tabBarIcon: ({ color, size }) => <Ionicons name="play" size={size} color={color} />,
                  }}
                />
                <Tabs.Screen
                  name="list/index"
                  options={{
                    title: 'List',
                    headerTitle: 'List of Saved Items',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
                  }}
                />
                <Tabs.Screen
                  name="settings/index"
                  options={{
                    title: 'Settings',
                    headerTitle: 'Settings',
                    tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
                  }}
                />
                {/* Hide nested routes from tab bar */}
                <Tabs.Screen
                  name="list/add/index"
                  options={{
                    href: null,
                    headerTitle: 'Add to List',
                    headerRight: () => (
                      <Pressable onPress={() => router.replace('/(app)/list')}>
                        <Ionicons name="checkmark" size={24} color={colors.textOnColor} style={{ marginRight: 16 }} />
                      </Pressable>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="list/[entryId]"
                  options={{
                    href: null,
                    headerTitle: 'Edit Entry',
                    headerLeft: () => (
                      <Pressable
                        onPress={() => router.replace('/(app)/list')}
                        style={{ padding: 12, marginLeft: 4 }}
                      >
                        <Ionicons name="chevron-back" size={24} color={colors.textOnColor} />
                      </Pressable>
                    ),
                  }}
                />
              </Tabs>
            </View>
          </View>
        </TMDBGenres>
      </TMDBConfiguration>
    </TMDBAPIProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  headerSide: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
});
