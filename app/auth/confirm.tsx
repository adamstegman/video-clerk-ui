import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase/client';

function validateRedirectPath(path: string | null): string {
  const defaultPath = '/(app)/list';
  if (!path) return defaultPath;

  // Block absolute URLs, protocol-relative URLs, and paths that don't start with /
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return defaultPath;
  }

  // Only allow paths under /(app)/ or /auth/
  const allowedPrefixes = ['/(app)/', '/auth/'];
  if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return defaultPath;
  }

  return path;
}

export default function AuthConfirm() {
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    next?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { token_hash, type, next } = params;
    const redirectTo = validateRedirectPath(next ?? null);

    if (!token_hash || !type) {
      setError('Invalid magic link');
      return;
    }

    supabase.auth
      .verifyOtp({
        token_hash,
        type: type as 'email' | 'magiclink',
      })
      .then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          router.replace(redirectTo as '/(app)/list');
        }
      });
  }, [params]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Error</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Confirming your magic link...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});
