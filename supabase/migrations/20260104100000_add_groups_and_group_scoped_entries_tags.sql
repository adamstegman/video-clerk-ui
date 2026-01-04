-- Add a "group" concept:
-- - All users belong to exactly one group via group_memberships (1:1 user->group)
-- - Entries belong to a group (not a user)
-- - Custom tags belong to a group (not a user); TMDB genre tags remain global (group_id NULL)
-- - Group invites allow a user to invite another user into their group (old group becomes orphaned)

create extension if not exists pgcrypto;

-- 1) Groups + membership
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp not null default now()
);

create table if not exists public.group_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  joined_at timestamp not null default now()
);

alter table public.group_memberships enable row level security;

drop policy if exists "Users can view their own group membership" on public.group_memberships;
create policy "Users can view their own group membership"
  on public.group_memberships
  for select
  to public
  using ((select auth.uid()) = user_id);

-- Helper to resolve current group id inside RLS policies and RPCs.
create or replace function public.current_user_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gm.group_id
  from public.group_memberships gm
  where gm.user_id = auth.uid()
$$;

grant execute on function public.current_user_group_id() to authenticated;

-- Ensure new users automatically get a personal group + membership row.
create or replace function public.handle_new_user_create_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  insert into public.groups default values returning id into v_group_id;
  insert into public.group_memberships(user_id, group_id) values (new.id, v_group_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_group on auth.users;
create trigger on_auth_user_created_create_group
  after insert on auth.users
  for each row
  execute function public.handle_new_user_create_group();

-- Backfill memberships for any existing users.
do $$
declare
  r record;
  v_group_id uuid;
begin
  for r in
    select u.id
    from auth.users u
    where not exists (
      select 1 from public.group_memberships gm where gm.user_id = u.id
    )
  loop
    insert into public.groups default values returning id into v_group_id;
    insert into public.group_memberships(user_id, group_id) values (r.id, v_group_id);
  end loop;
end $$;

-- 2) Entries become group-owned
alter table public.entries add column if not exists group_id uuid;

update public.entries e
set group_id = gm.group_id
from public.group_memberships gm
where gm.user_id = e.user_id
  and e.group_id is null;

alter table public.entries alter column group_id set not null;
alter table public.entries
  add constraint entries_group_id_fkey
  foreign key (group_id) references public.groups(id) on delete cascade;

-- Drop user ownership constraints/indexes and replace with group ownership.
alter table public.entries drop constraint if exists entries_user_id_fkey;
alter table public.entries drop constraint if exists entries_user_tmdb_unique;
drop index if exists public.entries_user_tmdb_unique;
drop index if exists public.idx_entries_user_id;

alter table public.entries drop column if exists user_id;

create index if not exists idx_entries_group_id on public.entries(group_id);
create unique index if not exists entries_group_tmdb_unique
  on public.entries(group_id, tmdb_id, media_type);
alter table public.entries add constraint entries_group_tmdb_unique unique using index entries_group_tmdb_unique;

-- Replace entries RLS policies with group-based access.
drop policy if exists "Users can delete their own entries" on public.entries;
drop policy if exists "Users can insert their own entries" on public.entries;
drop policy if exists "Users can update their own entries" on public.entries;
drop policy if exists "Users can view their own entries" on public.entries;

create policy "Group members can view group entries"
  on public.entries
  as permissive
  for select
  to public
  using (group_id = public.current_user_group_id());

create policy "Group members can insert group entries"
  on public.entries
  as permissive
  for insert
  to public
  with check (group_id = public.current_user_group_id());

create policy "Group members can update group entries"
  on public.entries
  as permissive
  for update
  to public
  using (group_id = public.current_user_group_id())
  with check (group_id = public.current_user_group_id());

create policy "Group members can delete group entries"
  on public.entries
  as permissive
  for delete
  to public
  using (group_id = public.current_user_group_id());

-- 3) Custom tags become group-owned; TMDB tags remain global
alter table public.tags add column if not exists group_id uuid references public.groups(id) on delete cascade;

-- Move existing custom tags from user ownership to group ownership.
update public.tags t
set group_id = gm.group_id
from public.group_memberships gm
where t.is_custom = true
  and t.user_id = gm.user_id
  and t.group_id is null;

-- After migration, tags are no longer user-owned.
alter table public.tags drop constraint if exists tags_user_id_fkey;
drop index if exists public.idx_tags_user_id;
drop index if exists public.idx_tags_name_user_unique_custom;
alter table public.tags drop column if exists user_id;

-- Uniqueness: custom tags unique per group, TMDB tags remain unique globally.
create unique index if not exists idx_tags_name_group_unique_custom
  on public.tags(name, group_id) where (is_custom = true);

-- Replace tags RLS policies to scope custom tags to group.
drop policy if exists "Authenticated users can create custom tags" on public.tags;
drop policy if exists "Users can update their own custom tags" on public.tags;
drop policy if exists "Users can delete their own custom tags" on public.tags;
-- Keep "Everyone can view tags" but tighten it to group-owned custom tags.
drop policy if exists "Everyone can view tags" on public.tags;

create policy "Users can view TMDB tags and their group's custom tags"
  on public.tags
  as permissive
  for select
  to public
  using (
    (is_custom = false)
    or
    (is_custom = true and group_id = public.current_user_group_id())
  );

create policy "Group members can create custom tags"
  on public.tags
  as permissive
  for insert
  to public
  with check (
    (select auth.role()) = 'authenticated'
    and is_custom = true
    and group_id = public.current_user_group_id()
  );

create policy "Group members can update group custom tags"
  on public.tags
  as permissive
  for update
  to public
  using (is_custom = true and group_id = public.current_user_group_id())
  with check (is_custom = true and group_id = public.current_user_group_id());

create policy "Group members can delete group custom tags"
  on public.tags
  as permissive
  for delete
  to public
  using (is_custom = true and group_id = public.current_user_group_id());

-- 4) entry_tags policies become group-based via entries.group_id
drop policy if exists "Users can delete entry_tags for their own entries" on public.entry_tags;
drop policy if exists "Users can insert entry_tags for their own entries" on public.entry_tags;
drop policy if exists "Users can view entry_tags for their own entries" on public.entry_tags;

create policy "Group members can view entry_tags for group entries"
  on public.entry_tags
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.entries e
      where e.id = entry_tags.entry_id
        and e.group_id = public.current_user_group_id()
    )
  );

create policy "Group members can insert entry_tags for group entries"
  on public.entry_tags
  as permissive
  for insert
  to public
  with check (
    exists (
      select 1
      from public.entries e
      where e.id = entry_tags.entry_id
        and e.group_id = public.current_user_group_id()
    )
  );

create policy "Group members can delete entry_tags for group entries"
  on public.entry_tags
  as permissive
  for delete
  to public
  using (
    exists (
      select 1
      from public.entries e
      where e.id = entry_tags.entry_id
        and e.group_id = public.current_user_group_id()
    )
  );

-- 5) Update save_tmdb_result_to_list to save entries per-group instead of per-user
create or replace function public.save_tmdb_result_to_list(
  p_tmdb_id integer,
  p_media_type text,
  p_title text,
  p_adult boolean,
  p_backdrop_path text,
  p_poster_path text,
  p_original_language text,
  p_overview text,
  p_popularity numeric,
  p_vote_average numeric,
  p_vote_count integer,
  p_original_name text,
  p_release_date date,
  p_origin_country jsonb,
  p_genre_ids integer[],
  p_genre_names text[],
  p_runtime integer
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
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
$function$;

-- 6) Group invites + acceptance
create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp not null default now(),
  accepted_at timestamp,
  accepted_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_group_invites_group_id on public.group_invites(group_id);
create index if not exists idx_group_invites_invited_email on public.group_invites(invited_email);

alter table public.group_invites enable row level security;

-- Keep invite rows private; use RPCs below for creation/acceptance.
drop policy if exists "No direct access to group invites" on public.group_invites;
create policy "No direct access to group invites"
  on public.group_invites
  as restrictive
  for all
  to public
  using (false)
  with check (false);

create or replace function public.create_group_invite(p_invited_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group_id uuid;
  v_email text;
  v_invite_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_group_id := public.current_user_group_id();
  if v_group_id is null then
    raise exception 'No group membership' using errcode = '28000';
  end if;

  v_email := lower(btrim(p_invited_email));
  if v_email is null or v_email = '' then
    raise exception 'Invited email is required' using errcode = '22023';
  end if;

  -- Prevent inviting yourself.
  if lower(coalesce(auth.jwt() ->> 'email', '')) = v_email then
    raise exception 'Cannot invite yourself' using errcode = '22023';
  end if;

  insert into public.group_invites (group_id, invited_email, invited_by)
  values (v_group_id, v_email, v_user_id)
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

grant execute on function public.create_group_invite(text) to authenticated;

create or replace function public.accept_group_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_invite record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email is null or v_email = '' then
    raise exception 'No email on auth token' using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.group_invites gi
  where gi.id = p_invite_id
    and gi.accepted_at is null;

  if not found then
    raise exception 'Invite not found or already accepted' using errcode = '22023';
  end if;

  if lower(v_invite.invited_email) <> v_email then
    raise exception 'Invite email does not match signed-in user' using errcode = '28000';
  end if;

  update public.group_memberships
  set group_id = v_invite.group_id,
      joined_at = now()
  where user_id = v_user_id;

  if not found then
    insert into public.group_memberships(user_id, group_id)
    values (v_user_id, v_invite.group_id);
  end if;

  update public.group_invites
  set accepted_at = now(),
      accepted_by = v_user_id
  where id = p_invite_id;

  return v_invite.group_id;
end;
$$;

grant execute on function public.accept_group_invite(uuid) to authenticated;

