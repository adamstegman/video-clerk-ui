import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';

interface LoginPageProps {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function LoginPage({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]}>
      <Link href="/" asChild>
        <Pressable style={styles.logo}>
          <Ionicons name="tv-outline" size={22} color={colors.primaryHeader} />
          <Text style={styles.logoText}>Video Clerk</Text>
        </Pressable>
      </Link>

      <View style={styles.formWrapper}>
        <View style={[styles.card, { backgroundColor: colors.authCard, borderColor: colors.separator }]}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.description}>
            Enter your email below to login to your account
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.authInput }]}
              placeholder="me@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.authInput }]}
              placeholder=""
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSubtle }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            testID="login-button"
            style={[styles.button, { backgroundColor: colors.primaryHeader }, loading && { backgroundColor: colors.primaryDisabled }]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    position: 'absolute',
    top: 48,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
    color: '#1f2937',
  },
  errorBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
