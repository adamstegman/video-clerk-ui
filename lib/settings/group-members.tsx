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
      <Text style={styles.tableLabel}>Members</Text>
      <View style={styles.tableContent}>
        {loading ? (
          <Text style={styles.tableText}>Loading...</Text>
        ) : members.length > 0 ? (
          members.map((member) => (
            <View key={member.user_id} style={styles.emailRow}>
              {member.user_id === currentUserId && (
                <Text style={[styles.youBadge, { backgroundColor: colors.primarySubtle }]}>You</Text>
              )}
              <Text style={styles.tableText}>{member.email}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.tableTextSecondary}>None</Text>
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
    color: '#1f2937',
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
    color: '#1f2937',
    textAlign: 'right',
  },
  tableTextSecondary: {
    fontSize: 15,
    color: '#9ca3af',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    // backgroundColor set inline via colors.primarySubtle
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
