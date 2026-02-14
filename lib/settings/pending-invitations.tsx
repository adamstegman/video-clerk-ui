import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/colors';
import type { PendingInvite } from './group-section';

interface PendingInvitationsProps {
  invites: PendingInvite[];
  loading: boolean;
}

export function PendingInvitations({ invites, loading }: PendingInvitationsProps) {
  const colors = useThemeColors();

  if (!loading && invites.length === 0) return null;

  return (
    <View style={[styles.tableRow, styles.tableRowBorder, { borderTopColor: colors.border }]}>
      <Text style={[styles.tableLabel, { color: colors.textPrimary }]}>Pending</Text>
      <View style={styles.tableContent}>
        {loading ? (
          <Text style={[styles.tableText, { color: colors.textPrimary }]}>Loading...</Text>
        ) : (
          invites.map((invite) => (
            <Text key={invite.id} style={[styles.tableText, { color: colors.textPrimary }]}>
              {invite.invited_email}
            </Text>
          ))
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
  tableRowBorder: {
    borderTopWidth: 1,
    paddingTop: 12,
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
});
