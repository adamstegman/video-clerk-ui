import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../supabase/client';
import { InviteSuccess } from './invite-success';
import { InvitePrompt } from './invite-prompt';

export function InviteAcceptContainer() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
    if (!inviteId) return;

    try {
      setAccepting(true);
      setError(null);

      const { data: groupId, error } = await supabase.rpc('accept_group_invite', {
        p_invite_id: inviteId,
      });

      if (error) throw error;

      setSuccess(true);

      setTimeout(() => {
        router.replace('/(app)/list');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(message);
    } finally {
      setAccepting(false);
    }
  }

  function handleDecline() {
    router.replace('/');
  }

  if (success) {
    return <InviteSuccess />;
  }

  return (
    <InvitePrompt
      error={error}
      accepting={accepting}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}
