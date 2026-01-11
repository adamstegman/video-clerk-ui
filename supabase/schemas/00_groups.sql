-- Table 0: groups + memberships (All users belong to exactly one group)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can view their own group
CREATE POLICY "Group members can view their group"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id
      FROM public.group_memberships
      WHERE user_id = (select auth.uid())
    )
  );

-- Block direct INSERT (groups are created through SECURITY DEFINER trigger function)
-- Note: SECURITY DEFINER functions bypass RLS, so the trigger will still work
CREATE POLICY "Groups cannot be directly inserted"
  ON groups FOR INSERT
  WITH CHECK (false);

-- Block direct UPDATE (groups should not be modified)
CREATE POLICY "Groups cannot be updated"
  ON groups FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Block direct DELETE (groups are deleted through CASCADE when memberships are deleted)
CREATE POLICY "Groups cannot be deleted"
  ON groups FOR DELETE
  USING (false);

-- Enable Row Level Security on group_memberships
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group membership"
  ON group_memberships FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.current_user_group_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select gm.group_id
  from public.group_memberships gm
  where gm.user_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_group_id() TO authenticated;

-- Ensure new users automatically get a personal group + membership row.
CREATE OR REPLACE FUNCTION public.handle_new_user_create_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  INSERT INTO public.groups DEFAULT VALUES RETURNING id INTO v_group_id;
  INSERT INTO public.group_memberships(user_id, group_id) VALUES (new.id, v_group_id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created_create_group
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_create_group();

-- Function to get all members of the current user's group with their emails
CREATE OR REPLACE FUNCTION public.get_group_members()
RETURNS TABLE (
  user_id uuid,
  email text,
  joined_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;

  v_group_id := public.current_user_group_id();
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No group membership' USING errcode = '28000';
  END IF;

  RETURN QUERY
  SELECT
    gm.user_id,
    coalesce(au.email::text, '') as email,
    gm.joined_at
  FROM public.group_memberships gm
  JOIN auth.users au ON au.id = gm.user_id
  WHERE gm.group_id = v_group_id
  ORDER BY gm.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_members() TO authenticated;

-- Function to get all pending invitations (not accepted) for the current user's group
CREATE OR REPLACE FUNCTION public.get_pending_group_invites()
RETURNS TABLE (
  id uuid,
  invited_email text,
  created_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28000';
  END IF;

  v_group_id := public.current_user_group_id();
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No group membership' USING errcode = '28000';
  END IF;

  RETURN QUERY
  SELECT
    gi.id,
    gi.invited_email,
    gi.created_at
  FROM public.group_invites gi
  WHERE gi.group_id = v_group_id
    AND gi.accepted_at IS NULL
  ORDER BY gi.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_group_invites() TO authenticated;
