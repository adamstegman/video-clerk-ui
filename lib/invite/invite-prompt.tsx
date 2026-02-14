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
        <View style={[styles.iconContainer, { backgroundColor: colors.primarySubtle }]}>
          <Text style={styles.iconText}>📨</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Group Invitation</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          You've been invited to join a Video Clerk group.
        </Text>
        <Text style={[styles.description, { color: colors.textTertiary }]}>
          Accepting this invitation will let you share your watch list with other group members.
        </Text>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.dangerSubtle, borderColor: colors.borderDanger }]}>
            <Text style={[styles.errorText, { color: colors.textDangerStrong }]}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.border },
              pressed && styles.buttonPressed,
            ]}
            onPress={onDecline}
            disabled={accepting}
          >
            <Ionicons name="close" size={20} color={colors.textLabel} />
            <Text style={[styles.secondaryButtonText, { color: colors.textLabel }]}>Decline</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={onAccept}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color={colors.textOnColor} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.textOnColor} />
                <Text style={[styles.primaryButtonText, { color: colors.textOnColor }]}>Accept</Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
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
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
