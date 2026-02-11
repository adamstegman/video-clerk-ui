import { View, Text, StyleSheet } from 'react-native';

interface ProfileSectionProps {
  email: string | undefined;
}

export function ProfileSection({ email }: ProfileSectionProps) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {email?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.email}>{email || 'Not signed in'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f4f4f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
});
