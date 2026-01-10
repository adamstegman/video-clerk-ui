import { useContext, useMemo, useState } from "react";
import { Link, useSearchParams } from 'react-router'
import { sectionSpacingClasses, secondaryTextClasses, cn } from "~/lib/utils";
import { AppDataContext } from "../app-data/app-data-provider";
import { createClient } from "../lib/supabase/client";
import { ActionButton } from "../components/action-button";

export function SettingsPage() {
  const { user } = useContext(AppDataContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteParam = searchParams.get('invite');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCreating, setInviteCreating] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteEmailForCreatedInvite, setInviteEmailForCreatedInvite] = useState<string | null>(null);

  const [inviteAccepting, setInviteAccepting] = useState(false);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [inviteAcceptError, setInviteAcceptError] = useState<string | null>(null);

  const [copySuccess, setCopySuccess] = useState(false);

  const inviteLink = useMemo(() => {
    const id = inviteId ?? inviteParam;
    if (!id) return null;
    if (typeof window === 'undefined') return null;
    return `${window.location.origin}/app/settings?invite=${encodeURIComponent(id)}`;
  }, [inviteId, inviteParam]);

  const handleCreateInvite = async () => {
    if (!user) return;
    setInviteCreating(true);
    setInviteError(null);
    setInviteId(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('create_group_invite', {
        p_invited_email: inviteEmail,
      });
      if (error) throw error;
      setInviteId(String(data));
      setInviteEmailForCreatedInvite(inviteEmail.trim());
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setInviteCreating(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) return;
    if (!inviteParam) return;
    setInviteAccepting(true);
    setInviteAcceptError(null);
    setInviteAccepted(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('accept_group_invite', {
        p_invite_id: inviteParam,
      });
      if (error) throw error;
      setInviteAccepted(true);
      const next = new URLSearchParams(searchParams);
      next.delete('invite');
      setSearchParams(next, { replace: true });
    } catch (err) {
      setInviteAcceptError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setInviteAccepting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <>
      {user && (
        <p>
          Hello <span className="text-primary font-semibold">{user.email}</span>
        </p>
      )}
      {user && (
        <div className={sectionSpacingClasses}>
          <h2 className="text-base font-semibold">Group</h2>

          {inviteParam && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm">
                You have a pending group invite. Accepting it will move you into the inviter&apos;s group and
                leave your previous group orphaned.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ActionButton
                  onClick={handleAcceptInvite}
                  loading={inviteAccepting}
                  loadingText="Accepting…"
                >
                  Accept invite
                </ActionButton>
                {inviteAcceptError && <p className="text-sm text-red-600">{inviteAcceptError}</p>}
                {inviteAccepted && <p className="text-sm text-green-600">Invite accepted.</p>}
              </div>
            </div>
          )}

          <div className="mt-3 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm">Invite someone to join your group (they must accept while signed in).</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setInviteEmail(newEmail);
                  // Clear invite link if email changes
                  if (inviteId && inviteEmailForCreatedInvite && newEmail.trim() !== inviteEmailForCreatedInvite) {
                    setInviteId(null);
                    setInviteEmailForCreatedInvite(null);
                  }
                }}
                placeholder="friend@example.com"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <ActionButton
                onClick={handleCreateInvite}
                disabled={inviteEmail.trim().length === 0 || (inviteId !== null && inviteEmail.trim() === inviteEmailForCreatedInvite)}
                loading={inviteCreating}
                loadingText="Creating…"
              >
                Create invite
              </ActionButton>
            </div>
            {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
            {inviteLink && (
              <div className="mt-2">
                <p className="text-sm mb-1">Invite link:</p>
                <div className="flex items-center gap-2">
                  <pre className="flex-1 overflow-x-auto overflow-y-hidden text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 whitespace-nowrap">
                    {inviteLink}
                  </pre>
                  <ActionButton
                    onClick={handleCopyInviteLink}
                    completed={copySuccess}
                    completedText="Copied!"
                  >
                    Copy
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className={sectionSpacingClasses}>
        <Link
          to="/logout"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Log Out
        </Link>
      </div>
      <div className={sectionSpacingClasses}>
        <p className={cn("text-sm", secondaryTextClasses)}>
          This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
        </p>
      </div>
    </>
  );
}
