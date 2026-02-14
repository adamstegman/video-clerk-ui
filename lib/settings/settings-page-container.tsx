import { useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../supabase/client';
import type { User } from '@supabase/supabase-js';
import { SettingsPage } from './settings-page';
import type { GroupMember, PendingInvite } from './group-section';

export function SettingsPageContainer() {
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

      const baseUrl = typeof window !== 'undefined' && window.location
        ? window.location.origin
        : 'https://video-clerk.adamstegman.com';
      const link = `${baseUrl}/invite/${inviteId}`;

      setInviteLink(link);
      setInviteEmail('');
      Alert.alert('Success', 'Invitation created! Share the link below.');

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

  function handleInviteEmailChange(text: string) {
    setInviteEmail(text);
    if (inviteLink) {
      setInviteLink(null);
      setCopySuccess(false);
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
    <SettingsPage
      user={user}
      groupMembers={groupMembers}
      loadingMembers={loadingMembers}
      pendingInvites={pendingInvites}
      loadingInvites={loadingInvites}
      inviteEmail={inviteEmail}
      onInviteEmailChange={handleInviteEmailChange}
      inviting={inviting}
      inviteLink={inviteLink}
      copySuccess={copySuccess}
      onInvite={handleInvite}
      onCopyInviteLink={handleCopyInviteLink}
      onShareInvite={handleShareInvite}
      onSignOut={handleSignOut}
    />
  );
}
