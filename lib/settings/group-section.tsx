import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/colors';
import { GroupMembers } from './group-members';
import { PendingInvitations } from './pending-invitations';
import { InviteForm } from './invite-form';

export interface GroupMember {
  user_id: string;
  email: string;
  joined_at: string;
}

export interface PendingInvite {
  id: string;
  invited_email: string;
  created_at: string;
}

interface GroupSectionProps {
  currentUserId: string | undefined;
  groupMembers: GroupMember[];
  loadingMembers: boolean;
  pendingInvites: PendingInvite[];
  loadingInvites: boolean;
  inviteEmail: string;
  onInviteEmailChange: (text: string) => void;
  inviting: boolean;
  inviteLink: string | null;
  copySuccess: boolean;
  onInvite: () => void;
  onCopyInviteLink: () => void;
  onShareInvite: () => void;
}

export function GroupSection({
  currentUserId,
  groupMembers,
  loadingMembers,
  pendingInvites,
  loadingInvites,
  inviteEmail,
  onInviteEmailChange,
  inviting,
  inviteLink,
  copySuccess,
  onInvite,
  onCopyInviteLink,
  onShareInvite,
}: GroupSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>GROUP</Text>
      </View>
      <View style={[styles.groupSection, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
        <GroupMembers
          currentUserId={currentUserId}
          members={groupMembers}
          loading={loadingMembers}
        />
        <PendingInvitations
          invites={pendingInvites}
          loading={loadingInvites}
        />
        <InviteForm
          inviteEmail={inviteEmail}
          onInviteEmailChange={onInviteEmailChange}
          inviting={inviting}
          inviteLink={inviteLink}
          copySuccess={copySuccess}
          onInvite={onInvite}
          onCopyInviteLink={onCopyInviteLink}
          onShareInvite={onShareInvite}
        />
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
  groupSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
});
