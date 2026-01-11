-- Table 6: group_invites (Invite a user into your group)

CREATE TABLE IF NOT EXISTS group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invited_email ON group_invites(invited_email);

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Keep invite rows private; use the RPCs below for creation/acceptance.
CREATE POLICY "No direct access to group invites"
  ON group_invites
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.create_group_invite(p_invited_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_email text;
  v_invite_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;

  v_group_id := public.current_user_group_id();
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No group membership' USING errcode = '28000';
  END IF;

  v_email := lower(btrim(p_invited_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Invited email is required' USING errcode = '22023';
  END IF;

  IF lower(coalesce(auth.jwt() ->> 'email', '')) = v_email THEN
    RAISE EXCEPTION 'Cannot invite yourself' USING errcode = '22023';
  END IF;

  -- Delete any existing pending invitations for the same email in this group
  DELETE FROM public.group_invites
  WHERE group_id = v_group_id
    AND lower(invited_email) = v_email
    AND accepted_at IS NULL;

  INSERT INTO public.group_invites(group_id, invited_email, invited_by)
  VALUES (v_group_id, v_email, v_user_id)
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_group_invite(p_invite_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_invite record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'No email on auth token' USING errcode = '28000';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.group_invites gi
  WHERE gi.id = p_invite_id
    AND gi.accepted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already accepted' USING errcode = '22023';
  END IF;

  IF lower(v_invite.invited_email) <> v_email THEN
    RAISE EXCEPTION 'Invite email does not match signed-in user' USING errcode = '28000';
  END IF;

  UPDATE public.group_memberships
  SET group_id = v_invite.group_id,
      joined_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.group_memberships(user_id, group_id)
    VALUES (v_user_id, v_invite.group_id);
  END IF;

  UPDATE public.group_invites
  SET accepted_at = now(),
      accepted_by = v_user_id
  WHERE id = p_invite_id;

  RETURN v_invite.group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_group_invite(uuid) TO authenticated;
