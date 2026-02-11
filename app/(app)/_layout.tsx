import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
              height: 65,
              paddingTop: 4,
              paddingBottom: 4,
              backgroundColor: '#fff',
            },
          }}
        >
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
                  <Ionicons name="checkmark" size={24} color="#fff" style={{ marginRight: 16 }} />
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
                  <Ionicons name="chevron-back" size={24} color="#fff" />
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
