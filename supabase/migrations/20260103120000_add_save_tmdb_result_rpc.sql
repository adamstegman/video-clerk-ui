-- Adds an RPC to persist a TMDB search result as an entry for the current user.
-- This function:
-- - upserts tmdb_details by tmdb_id
-- - inserts (or updates) entries for auth.uid()
-- - upserts TMDB-genre tags (is_custom = false) by name
-- - inserts entry_tags rows linking the entry to those tags

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
  p_genres text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_entry_id integer;
  v_tag_id integer;
  v_genre text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Upsert public TMDB details (shared across users).
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
    runtime_minutes
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
    null
  )
  on conflict (tmdb_id) do update set
    media_type = excluded.media_type,
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
    origin_country = excluded.origin_country;

  -- Insert (or update) the user's entry.
  insert into public.entries (user_id, title, tmdb_id)
  values (v_user_id, p_title, p_tmdb_id)
  on conflict (user_id, tmdb_id) do update set
    title = excluded.title
  returning id into v_entry_id;

  -- Upsert tags from the provided genre names and connect them to the entry.
  if p_genres is not null then
    foreach v_genre in array p_genres loop
      if v_genre is null or btrim(v_genre) = '' then
        continue;
      end if;

      insert into public.tags (name, user_id, is_custom)
      values (v_genre, null, false)
      on conflict (name) where (is_custom = false) do update set
        name = excluded.name
      returning id into v_tag_id;

      insert into public.entry_tags (entry_id, tag_id)
      values (v_entry_id, v_tag_id)
      on conflict do nothing;
    end loop;
  end if;

  return v_entry_id;
end;
$$;

grant execute on function public.save_tmdb_result_to_list(
  integer,
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  integer,
  text,
  date,
  jsonb,
  text[]
) to authenticated;

