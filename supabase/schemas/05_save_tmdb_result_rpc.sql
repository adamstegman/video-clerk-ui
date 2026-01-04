-- RPC: persist a TMDB result into entries/tmdb_details/tags/entry_tags for the current group.
-- Notes:
-- - tags created from TMDB genres are shared (group_id NULL, is_custom = false)
-- - runtime is fetched from TMDB details by the UI before calling this RPC

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
set search_path = public
as $$
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
  integer[],
  text[],
  integer
) to authenticated;

