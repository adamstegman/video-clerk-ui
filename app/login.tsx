import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(app)/list');
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account');
    }
  }

  async function handleMagicLink() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the magic link');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Magic Link'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          {mode !== 'magic' && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          )}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={
              mode === 'signin'
                ? handleSignIn
                : mode === 'signup'
                  ? handleSignUp
                  : handleMagicLink
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signin'
                  ? 'Sign In'
                  : mode === 'signup'
                    ? 'Sign Up'
                    : 'Send Magic Link'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.links}>
          {mode === 'signin' && (
            <>
              <Pressable onPress={() => setMode('signup')}>
                <Text style={styles.link}>Don't have an account? Sign up</Text>
              </Pressable>
              <Pressable onPress={() => setMode('magic')}>
                <Text style={styles.link}>Sign in with magic link</Text>
              </Pressable>
            </>
          )}
          {mode === 'signup' && (
            <Pressable onPress={() => setMode('signin')}>
              <Text style={styles.link}>Already have an account? Sign in</Text>
            </Pressable>
          )}
          {mode === 'magic' && (
            <Pressable onPress={() => setMode('signin')}>
              <Text style={styles.link}>Sign in with password</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  links: {
    marginTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  link: {
    color: '#4f46e5',
    fontSize: 14,
  },
});
