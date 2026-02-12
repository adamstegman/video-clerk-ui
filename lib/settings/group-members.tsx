import { View, Text, StyleSheet } from 'react-native';
import type { GroupMember } from './group-section';
import { useThemeColors } from '../theme/colors';

interface GroupMembersProps {
  currentUserId: string | undefined;
  members: GroupMember[];
  loading: boolean;
}

export function GroupMembers({ currentUserId, members, loading }: GroupMembersProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableLabel, { color: colors.textPrimary }]}>Members</Text>
      <View style={styles.tableContent}>
        {loading ? (
          <Text style={[styles.tableText, { color: colors.textPrimary }]}>Loading...</Text>
        ) : members.length > 0 ? (
          members.map((member) => (
            <View key={member.user_id} style={styles.emailRow}>
              {member.user_id === currentUserId && (
                <Text style={[styles.youBadge, { backgroundColor: colors.primarySubtle, color: colors.textBrandLight }]}>You</Text>
              )}
              <Text style={[styles.tableText, { color: colors.textPrimary }]}>{member.email}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.tableTextSecondary, { color: colors.textTertiary }]}>None</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  tableLabel: {
    fontSize: 15,
    fontWeight: '700',
    width: 100,
    paddingTop: 2,
  },
  tableContent: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-end',
  },
  tableText: {
    fontSize: 15,
    textAlign: 'right',
  },
  tableTextSecondary: {
    fontSize: 15,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
