import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface ProfileSectionProps {
  email: string | undefined;
}

export function ProfileSection({ email }: ProfileSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.profileSection, { backgroundColor: colors.page, borderBottomColor: colors.separator }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { color: colors.textOnColor }]}>
          {email?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={[styles.email, { color: colors.textPrimary }]}>{email || 'Not signed in'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
  },
});
