import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Share, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users, UserPlus, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface GroupMember {
  user_id: string;
  email: string;
  joined_at: string;
}

interface PendingInvite {
  id: string;
  invited_email: string;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    loadGroupMembers();
    loadPendingInvites();
  }, []);

  async function loadGroupMembers() {
    try {
      setLoadingMembers(true);
      const { data, error } = await supabase.rpc('get_group_members');
      if (error) throw error;
      setGroupMembers(data || []);
    } catch (err) {
      console.error('Failed to load group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadPendingInvites() {
    try {
      setLoadingInvites(true);
      const { data, error } = await supabase.rpc('get_pending_group_invites');
      if (error) throw error;
      setPendingInvites(data || []);
    } catch (err) {
      console.error('Failed to load pending invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      const { data: inviteId, error } = await supabase.rpc('create_group_invite', {
        p_invited_email: email,
      });

      if (error) throw error;

      // Generate shareable link
      // For web, use window.location.origin, for native use a placeholder or configured URL
      const baseUrl = typeof window !== 'undefined' && window.location
        ? window.location.origin
        : 'https://videoclerk.app'; // Replace with your actual domain
      const link = `${baseUrl}/invite/${inviteId}`;

      setInviteLink(link);
      setInviteEmail('');
      Alert.alert('Success', 'Invitation created! Share the link below.');

      // Reload pending invites list
      loadPendingInvites();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invitation';
      Alert.alert('Error', message);
    } finally {
      setInviting(false);
    }
  }

  async function handleShareInvite() {
    if (!inviteLink) return;

    try {
      await Share.share({
        message: `Join my Video Clerk group! Click this link to accept the invitation: ${inviteLink}`,
        title: 'Video Clerk Group Invitation',
      });
    } catch (shareError) {
      console.log('Share cancelled or failed:', shareError);
    }
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) return;

    try {
      await Clipboard.setStringAsync(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email || 'Not signed in'}</Text>
        </View>

        {/* Group Section */}
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
                groupMembers.map((member, index) => (
                  <View key={member.user_id} style={styles.emailRow}>
                    {member.user_id === user?.id && (
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
            onChangeText={(text) => {
              setInviteEmail(text);
              // Clear invite link when email changes
              if (inviteLink) {
                setInviteLink(null);
                setCopySuccess(false);
              }
            }}
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
            onPress={handleInvite}
            disabled={inviting || !!inviteLink}
          >
            <UserPlus size={20} color="#fff" />
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
                  onPress={handleCopyInviteLink}
                >
                  {copySuccess ? (
                    <>
                      <Check size={18} color="#22c55e" />
                      <Text style={styles.linkButtonTextSuccess}>Copied!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={18} color="#4f46e5" />
                      <Text style={styles.linkButtonText}>Copy</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && styles.inviteButtonPressed,
                  ]}
                  onPress={handleShareInvite}
                >
                  <UserPlus size={18} color="#fff" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
        </View>
        <View style={styles.accountSection}>
          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

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
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
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
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
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
  row: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: {
    backgroundColor: '#f9fafb',
  },
  rowText: {
    fontSize: 16,
    color: '#6b7280',
  },
  rowTextDanger: {
    fontSize: 16,
    color: '#ef4444',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberEmail: {
    fontSize: 15,
    color: '#1f2937',
  },
  memberBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
