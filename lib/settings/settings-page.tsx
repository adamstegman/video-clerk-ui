import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { ProfileSection } from './profile-section';
import { GroupSection } from './group-section';
import type { GroupMember, PendingInvite } from './group-section';
import { AccountSection } from './account-section';

interface SettingsPageProps {
  user: User | null;
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
  onSignOut: () => void;
}

export function SettingsPage({
  user,
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
  onSignOut,
}: SettingsPageProps) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <ProfileSection email={user?.email} />

        <GroupSection
          currentUserId={user?.id}
          groupMembers={groupMembers}
          loadingMembers={loadingMembers}
          pendingInvites={pendingInvites}
          loadingInvites={loadingInvites}
          inviteEmail={inviteEmail}
          onInviteEmailChange={onInviteEmailChange}
          inviting={inviting}
          inviteLink={inviteLink}
          copySuccess={copySuccess}
          onInvite={onInvite}
          onCopyInviteLink={onCopyInviteLink}
          onShareInvite={onShareInvite}
        />

        <AccountSection onSignOut={onSignOut} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Video Clerk v1.0.0</Text>
          <Text style={styles.footerText}>
            This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
