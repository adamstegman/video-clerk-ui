import { View, Text, StyleSheet } from 'react-native';
import type { PendingInvite } from './group-section';

interface PendingInvitationsProps {
  invites: PendingInvite[];
  loading: boolean;
}

export function PendingInvitations({ invites, loading }: PendingInvitationsProps) {
  if (!loading && invites.length === 0) return null;

  return (
    <View style={[styles.tableRow, styles.tableRowBorder]}>
      <Text style={styles.tableLabel}>Pending</Text>
      <View style={styles.tableContent}>
        {loading ? (
          <Text style={styles.tableText}>Loading...</Text>
        ) : (
          invites.map((invite) => (
            <Text key={invite.id} style={styles.tableText}>
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
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
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
});
