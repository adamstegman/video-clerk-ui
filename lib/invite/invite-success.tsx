import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';

export function InviteSuccess() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]}>
      <View style={styles.centerContainer}>
        <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={48} color={colors.textOnColor} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Invitation Accepted!</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>You've joined the group.</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Redirecting to your list...</Text>
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
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
});
