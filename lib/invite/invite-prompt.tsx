import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';

interface InvitePromptProps {
  error: string | null;
  accepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function InvitePrompt({ error, accepting, onAccept, onDecline }: InvitePromptProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]}>
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📨</Text>
        </View>
        <Text style={styles.title}>Group Invitation</Text>
        <Text style={styles.subtitle}>
          You've been invited to join a Video Clerk group.
        </Text>
        <Text style={styles.description}>
          Accepting this invitation will let you share your watch list with other group members.
        </Text>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.dangerSubtle }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onDecline}
            disabled={accepting}
          >
            <Ionicons name="close" size={20} color="#374151" />
            <Text style={styles.secondaryButtonText}>Decline</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onAccept}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Accept</Text>
              </>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eef2ff', // primarySubtle - static since it's decorative
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2', // will be themed via inline style below
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5', // primary - stays same in dark
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
