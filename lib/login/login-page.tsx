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
          <Text style={[styles.logoText, { color: colors.textPrimary }]}>Video Clerk</Text>
        </Pressable>
      </Link>

      <View style={styles.formWrapper}>
        <View style={[styles.card, { backgroundColor: colors.authCard, borderColor: colors.separator }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Login</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter your email below to login to your account
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textLabel }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.authInput, borderColor: colors.borderInput, color: colors.textPrimary, outlineColor: colors.primary }]}
              placeholder="me@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textLabel }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.authInput, borderColor: colors.borderInput, color: colors.textPrimary, outlineColor: colors.primary }]}
              placeholder=""
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSubtle, borderColor: colors.borderDanger }]}>
              <Text style={[styles.errorText, { color: colors.textDangerStrong }]}>{error}</Text>
            </View>
          )}

          <Pressable
            testID="login-button"
            style={[styles.button, { backgroundColor: colors.primaryHeader }, loading && { backgroundColor: colors.primaryDisabled }]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnColor} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textOnColor }]}>Login</Text>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 16,
  },
  errorBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
