import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface AccountSectionProps {
  onSignOut: () => void;
}

export function AccountSection({ onSignOut }: AccountSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>ACCOUNT</Text>
      </View>
      <View style={styles.accountSection}>
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            { backgroundColor: colors.danger },
            pressed && styles.buttonPressed,
          ]}
          onPress={onSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: colors.textOnColor }]}>Sign Out</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 24,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountSection: {
    paddingHorizontal: 16,
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
