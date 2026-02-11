import { View, Text, StyleSheet, Pressable } from 'react-native';

interface AccountSectionProps {
  onSignOut: () => void;
}

export function AccountSection({ onSignOut }: AccountSectionProps) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
      </View>
      <View style={styles.accountSection}>
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountSection: {
    paddingHorizontal: 16,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
