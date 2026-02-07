import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Pressable } from 'react-native';
import { Play, List, Settings, Check, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase/client';
import { TMDBAPIProvider } from '../../lib/tmdb-api/tmdb-api-provider';
import { TMDBConfiguration } from '../../lib/tmdb-api/tmdb-configuration';
import { TMDBGenres } from '../../lib/tmdb-api/tmdb-genres';
import type { User } from '@supabase/supabase-js';

export default function AppLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        router.replace('/login');
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
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
          <Tabs
          screenOptions={{
            headerShown: true,
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              color: '#fff',
              fontWeight: '700',
            },
            tabBarActiveTintColor: '#4f46e5',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarLabelPosition: 'below-icon',
            tabBarLabelStyle: {
              fontSize: 12,
              marginTop: 4,
            },
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              height: 85,
              paddingTop: 10,
              paddingBottom: 10,
              backgroundColor: '#fff',
            },
          }}
        >
          <Tabs.Screen
            name="watch"
            options={{
              title: 'Watch',
              headerTitle: 'Watch',
              tabBarIcon: ({ color, size }) => <Play size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="list"
            options={{
              title: 'List',
              headerTitle: 'List of Saved Items',
              tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerTitle: 'Settings',
              tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
            }}
          />
          {/* Hide nested routes from tab bar */}
          <Tabs.Screen
            name="list/add"
            options={{
              href: null,
              headerTitle: 'Add to List',
              headerRight: () => (
                <Pressable onPress={() => router.replace('/(app)/list')}>
                  <Check size={24} color="#fff" style={{ marginRight: 16 }} />
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
                  <ChevronLeft size={24} color="#fff" />
                </Pressable>
              ),
            }}
          />
        </Tabs>
        </TMDBGenres>
      </TMDBConfiguration>
    </TMDBAPIProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
});
