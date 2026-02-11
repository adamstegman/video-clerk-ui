import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>GROUP</Text>
      </View>
      <View style={styles.groupSection}>
        {/* Group Members */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Members</Text>
          <View style={styles.tableContent}>
            {loadingMembers ? (
              <Text style={styles.tableText}>Loading...</Text>
            ) : groupMembers.length > 0 ? (
              groupMembers.map((member) => (
                <View key={member.user_id} style={styles.emailRow}>
                  {member.user_id === currentUserId && (
                    <Text style={styles.youBadge}>You</Text>
                  )}
                  <Text style={styles.tableText}>{member.email}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.tableTextSecondary}>None</Text>
            )}
          </View>
        </View>

        {/* Pending Invitations */}
        {(loadingInvites || pendingInvites.length > 0) && (
          <View style={[styles.tableRow, styles.tableRowBorder]}>
            <Text style={styles.tableLabel}>Pending</Text>
            <View style={styles.tableContent}>
              {loadingInvites ? (
                <Text style={styles.tableText}>Loading...</Text>
              ) : (
                pendingInvites.map((invite) => (
                  <Text key={invite.id} style={styles.tableText}>
                    {invite.invited_email}
                  </Text>
                ))
              )}
            </View>
          </View>
        )}

        {/* Invite Form */}
        <View style={[styles.subsectionHeader, styles.inviteFormHeader]}>
          <Text style={styles.subsectionHeaderText}>Invite to Group</Text>
          <Text style={styles.helpText}>They must accept while signed in</Text>
        </View>
        <TextInput
          style={styles.inviteInput}
          placeholder="friend@example.com"
          placeholderTextColor="#9ca3af"
          value={inviteEmail}
          onChangeText={onInviteEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!inviting}
        />
        <Pressable
          style={({ pressed }) => [
            styles.createInviteButton,
            (pressed || inviting || inviteLink) && styles.inviteButtonPressed,
          ]}
          onPress={onInvite}
          disabled={inviting || !!inviteLink}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.inviteButtonText}>
            {inviting ? 'Creating...' : 'Create Invite'}
          </Text>
        </Pressable>

        {inviteLink && (
          <View style={styles.inviteLinkContainer}>
            <Text style={styles.inviteLinkLabel}>Invite Link:</Text>
            <ScrollView
              horizontal
              style={styles.inviteLinkScroll}
              contentContainerStyle={styles.inviteLinkScrollContent}
            >
              <Text style={styles.inviteLinkText}>{inviteLink}</Text>
            </ScrollView>
            <View style={styles.inviteLinkActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.inviteButtonPressed,
                ]}
                onPress={onCopyInviteLink}
              >
                {copySuccess ? (
                  <>
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                    <Text style={styles.linkButtonTextSuccess}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="copy-outline" size={18} color="#4f46e5" />
                    <Text style={styles.linkButtonText}>Copy</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.shareButton,
                  pressed && styles.inviteButtonPressed,
                ]}
                onPress={onShareInvite}
              >
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>
        )}
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
  groupSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  subsectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  subsectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
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
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inviteFormHeader: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  inviteInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  createInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonPressed: {
    opacity: 0.7,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inviteLinkContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  inviteLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inviteLinkScroll: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    maxHeight: 60,
  },
  inviteLinkScrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inviteLinkText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#1f2937',
  },
  inviteLinkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
  },
  linkButtonTextSuccess: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
