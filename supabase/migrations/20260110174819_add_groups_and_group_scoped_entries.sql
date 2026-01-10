drop policy "Users can delete their own entries" on "public"."entries";

drop policy "Users can insert their own entries" on "public"."entries";

drop policy "Users can update their own entries" on "public"."entries";

drop policy "Users can view their own entries" on "public"."entries";

drop policy "Users can delete entry_tags for their own entries" on "public"."entry_tags";

drop policy "Users can insert entry_tags for their own entries" on "public"."entry_tags";

drop policy "Users can view entry_tags for their own entries" on "public"."entry_tags";

drop policy "Authenticated users can create custom tags" on "public"."tags";

drop policy "Everyone can view tags" on "public"."tags";

drop policy "Users can delete their own custom tags" on "public"."tags";

drop policy "Users can update their own custom tags" on "public"."tags";

alter table "public"."entries" drop constraint "entries_user_id_fkey";

alter table "public"."entries" drop constraint "entries_user_tmdb_unique";

alter table "public"."tags" drop constraint "tags_user_id_fkey";

drop index if exists "public"."entries_user_tmdb_unique";

drop index if exists "public"."idx_entries_user_id";

drop index if exists "public"."idx_tags_name_user_unique_custom";

drop index if exists "public"."idx_tags_user_id";


  create table "public"."group_invites" (
    "id" uuid not null default gen_random_uuid(),
    "group_id" uuid not null,
    "invited_email" text not null,
    "invited_by" uuid not null,
    "created_at" timestamp without time zone not null default now(),
    "accepted_at" timestamp without time zone,
    "accepted_by" uuid
      );


alter table "public"."group_invites" enable row level security;


  create table "public"."group_memberships" (
    "user_id" uuid not null,
    "group_id" uuid not null,
    "joined_at" timestamp without time zone not null default now()
      );


alter table "public"."group_memberships" enable row level security;


  create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp without time zone not null default now()
      );


alter table "public"."groups" enable row level security;

alter table "public"."entries" drop column "user_id";

alter table "public"."entries" add column "group_id" uuid not null;

alter table "public"."tags" drop column "user_id";

alter table "public"."tags" add column "group_id" uuid;

CREATE UNIQUE INDEX entries_group_tmdb_unique ON public.entries USING btree (group_id, tmdb_id, media_type);

CREATE UNIQUE INDEX group_invites_pkey ON public.group_invites USING btree (id);

CREATE UNIQUE INDEX group_memberships_pkey ON public.group_memberships USING btree (user_id);

CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id);

CREATE INDEX idx_entries_group_id ON public.entries USING btree (group_id);

CREATE INDEX idx_group_invites_group_id ON public.group_invites USING btree (group_id);

CREATE INDEX idx_group_invites_invited_email ON public.group_invites USING btree (invited_email);

CREATE INDEX idx_tags_group_id ON public.tags USING btree (group_id);

CREATE UNIQUE INDEX idx_tags_name_group_unique_custom ON public.tags USING btree (name, group_id) WHERE (is_custom = true);

alter table "public"."group_invites" add constraint "group_invites_pkey" PRIMARY KEY using index "group_invites_pkey";

alter table "public"."group_memberships" add constraint "group_memberships_pkey" PRIMARY KEY using index "group_memberships_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."entries" add constraint "entries_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "entries_group_id_fkey";

alter table "public"."entries" add constraint "entries_group_tmdb_unique" UNIQUE using index "entries_group_tmdb_unique";

alter table "public"."group_invites" add constraint "group_invites_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."group_invites" validate constraint "group_invites_accepted_by_fkey";

alter table "public"."group_invites" add constraint "group_invites_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."group_invites" validate constraint "group_invites_group_id_fkey";

alter table "public"."group_invites" add constraint "group_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."group_invites" validate constraint "group_invites_invited_by_fkey";

alter table "public"."group_memberships" add constraint "group_memberships_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."group_memberships" validate constraint "group_memberships_group_id_fkey";

alter table "public"."group_memberships" add constraint "group_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."group_memberships" validate constraint "group_memberships_user_id_fkey";

alter table "public"."tags" add constraint "tags_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_group_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_group_invite(p_invite_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_group_invite(p_invited_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.current_user_group_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select gm.group_id
  from public.group_memberships gm
  where gm.user_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.get_group_members()
 RETURNS TABLE(user_id uuid, email text, joined_at timestamp without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_group_invites()
 RETURNS TABLE(id uuid, invited_email text, created_at timestamp without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_create_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group_id uuid;
BEGIN
  INSERT INTO public.groups DEFAULT VALUES RETURNING id INTO v_group_id;
  INSERT INTO public.group_memberships(user_id, group_id) VALUES (new.id, v_group_id);
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_tmdb_result_to_list(p_tmdb_id integer, p_media_type text, p_title text, p_adult boolean, p_backdrop_path text, p_poster_path text, p_original_language text, p_overview text, p_popularity numeric, p_vote_average numeric, p_vote_count integer, p_original_name text, p_release_date date, p_origin_country jsonb, p_genre_ids integer[], p_genre_names text[], p_runtime integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_group_id uuid;
  v_entry_id integer;
  v_tag_id integer;
  v_genre_id integer;
  v_genre_name text;
  v_i integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_group_id := public.current_user_group_id();
  if v_group_id is null then
    raise exception 'No group membership' using errcode = '28000';
  end if;

  insert into public.tmdb_details (
    tmdb_id,
    media_type,
    adult,
    backdrop_path,
    poster_path,
    original_language,
    overview,
    popularity,
    vote_average,
    vote_count,
    name,
    original_name,
    release_date,
    origin_country,
    runtime
  )
  values (
    p_tmdb_id,
    p_media_type,
    p_adult,
    p_backdrop_path,
    p_poster_path,
    p_original_language,
    p_overview,
    p_popularity,
    p_vote_average,
    p_vote_count,
    p_title,
    p_original_name,
    p_release_date,
    p_origin_country,
    p_runtime
  )
  on conflict (tmdb_id, media_type) do update set
    adult = excluded.adult,
    backdrop_path = excluded.backdrop_path,
    poster_path = excluded.poster_path,
    original_language = excluded.original_language,
    overview = excluded.overview,
    popularity = excluded.popularity,
    vote_average = excluded.vote_average,
    vote_count = excluded.vote_count,
    name = excluded.name,
    original_name = excluded.original_name,
    release_date = excluded.release_date,
    origin_country = excluded.origin_country,
    runtime = excluded.runtime;

  insert into public.entries (group_id, tmdb_id, media_type)
  values (v_group_id, p_tmdb_id, p_media_type)
  on conflict (group_id, tmdb_id, media_type) do update set
    tmdb_id = excluded.tmdb_id
  returning id into v_entry_id;

  if p_genre_ids is not null then
    for v_i in 1..coalesce(array_length(p_genre_ids, 1), 0) loop
      v_genre_id := p_genre_ids[v_i];
      v_genre_name := null;
      if p_genre_names is not null then
        v_genre_name := p_genre_names[v_i];
      end if;

      if v_genre_id is null then
        continue;
      end if;
      if v_genre_name is null or btrim(v_genre_name) = '' then
        continue;
      end if;

      insert into public.tags (name, tmdb_id, group_id, is_custom)
      values (v_genre_name, v_genre_id, null, false)
      -- Must match the partial unique index predicate on tags(tmdb_id)
      on conflict (tmdb_id) where (is_custom = false and tmdb_id is not null) do update set
        name = excluded.name
      returning id into v_tag_id;

      insert into public.entry_tags (entry_id, tag_id)
      values (v_entry_id, v_tag_id)
      on conflict do nothing;
    end loop;
  end if;

  return v_entry_id;
end;
$function$
;

grant delete on table "public"."group_invites" to "anon";

grant insert on table "public"."group_invites" to "anon";

grant references on table "public"."group_invites" to "anon";

grant select on table "public"."group_invites" to "anon";

grant trigger on table "public"."group_invites" to "anon";

grant truncate on table "public"."group_invites" to "anon";

grant update on table "public"."group_invites" to "anon";

grant delete on table "public"."group_invites" to "authenticated";

grant insert on table "public"."group_invites" to "authenticated";

grant references on table "public"."group_invites" to "authenticated";

grant select on table "public"."group_invites" to "authenticated";

grant trigger on table "public"."group_invites" to "authenticated";

grant truncate on table "public"."group_invites" to "authenticated";

grant update on table "public"."group_invites" to "authenticated";

grant delete on table "public"."group_invites" to "service_role";

grant insert on table "public"."group_invites" to "service_role";

grant references on table "public"."group_invites" to "service_role";

grant select on table "public"."group_invites" to "service_role";

grant trigger on table "public"."group_invites" to "service_role";

grant truncate on table "public"."group_invites" to "service_role";

grant update on table "public"."group_invites" to "service_role";

grant delete on table "public"."group_memberships" to "anon";

grant insert on table "public"."group_memberships" to "anon";

grant references on table "public"."group_memberships" to "anon";

grant select on table "public"."group_memberships" to "anon";

grant trigger on table "public"."group_memberships" to "anon";

grant truncate on table "public"."group_memberships" to "anon";

grant update on table "public"."group_memberships" to "anon";

grant delete on table "public"."group_memberships" to "authenticated";

grant insert on table "public"."group_memberships" to "authenticated";

grant references on table "public"."group_memberships" to "authenticated";

grant select on table "public"."group_memberships" to "authenticated";

grant trigger on table "public"."group_memberships" to "authenticated";

grant truncate on table "public"."group_memberships" to "authenticated";

grant update on table "public"."group_memberships" to "authenticated";

grant delete on table "public"."group_memberships" to "service_role";

grant insert on table "public"."group_memberships" to "service_role";

grant references on table "public"."group_memberships" to "service_role";

grant select on table "public"."group_memberships" to "service_role";

grant trigger on table "public"."group_memberships" to "service_role";

grant truncate on table "public"."group_memberships" to "service_role";

grant update on table "public"."group_memberships" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant references on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant trigger on table "public"."groups" to "anon";

grant truncate on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant references on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant trigger on table "public"."groups" to "authenticated";

grant truncate on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant references on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant trigger on table "public"."groups" to "service_role";

grant truncate on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";


  create policy "Group members can delete group entries"
  on "public"."entries"
  as permissive
  for delete
  to public
using ((group_id = public.current_user_group_id()));



  create policy "Group members can insert group entries"
  on "public"."entries"
  as permissive
  for insert
  to public
with check ((group_id = public.current_user_group_id()));



  create policy "Group members can update group entries"
  on "public"."entries"
  as permissive
  for update
  to public
using ((group_id = public.current_user_group_id()))
with check ((group_id = public.current_user_group_id()));



  create policy "Group members can view group entries"
  on "public"."entries"
  as permissive
  for select
  to public
using ((group_id = public.current_user_group_id()));



  create policy "Group members can delete entry_tags for group entries"
  on "public"."entry_tags"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.group_id = public.current_user_group_id())))));



  create policy "Group members can insert entry_tags for group entries"
  on "public"."entry_tags"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.group_id = public.current_user_group_id())))));



  create policy "Group members can view entry_tags for group entries"
  on "public"."entry_tags"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.group_id = public.current_user_group_id())))));



  create policy "No direct access to group invites"
  on "public"."group_invites"
  as restrictive
  for all
  to public
using (false)
with check (false);



  create policy "Users can view their own group membership"
  on "public"."group_memberships"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Group members can view their group"
  on "public"."groups"
  as permissive
  for select
  to public
using ((id IN ( SELECT group_memberships.group_id
   FROM public.group_memberships
  WHERE (group_memberships.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Groups cannot be deleted"
  on "public"."groups"
  as permissive
  for delete
  to public
using (false);



  create policy "Groups cannot be directly inserted"
  on "public"."groups"
  as permissive
  for insert
  to public
with check (false);



  create policy "Groups cannot be updated"
  on "public"."groups"
  as permissive
  for update
  to public
using (false)
with check (false);



  create policy "Group members can create custom tags"
  on "public"."tags"
  as permissive
  for insert
  to public
with check (((( SELECT auth.role() AS role) = 'authenticated'::text) AND (is_custom = true) AND (group_id = public.current_user_group_id())));



  create policy "Group members can delete group custom tags"
  on "public"."tags"
  as permissive
  for delete
  to public
using (((group_id = public.current_user_group_id()) AND (is_custom = true)));



  create policy "Group members can update group custom tags"
  on "public"."tags"
  as permissive
  for update
  to public
using (((group_id = public.current_user_group_id()) AND (is_custom = true)))
with check (((group_id = public.current_user_group_id()) AND (is_custom = true)));



  create policy "Users can view TMDB tags and their group's custom tags"
  on "public"."tags"
  as permissive
  for select
  to public
using (((is_custom = false) OR ((is_custom = true) AND (group_id = public.current_user_group_id()))));


CREATE TRIGGER on_auth_user_created_create_group AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_create_group();


