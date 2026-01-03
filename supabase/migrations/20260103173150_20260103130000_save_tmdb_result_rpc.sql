alter table "public"."entries" drop constraint "entries_user_tmdb_unique";

alter table "public"."entries" drop constraint "fk_tmdb_details";

alter table "public"."tmdb_details" drop constraint "tmdb_details_pkey";

drop index if exists "public"."entries_user_tmdb_unique";

drop index if exists "public"."idx_tmdb_details_runtime";

drop index if exists "public"."tmdb_details_pkey";

alter table "public"."entries" drop column "title";

alter table "public"."entries" add column "media_type" character varying(20) not null;

alter table "public"."tags" add column "tmdb_id" integer;

alter table "public"."tmdb_details" drop column "runtime_minutes";

alter table "public"."tmdb_details" add column "runtime" integer;

CREATE INDEX idx_entries_media_type ON public.entries USING btree (media_type);

CREATE UNIQUE INDEX idx_tags_tmdb_id_unique_tmdb ON public.tags USING btree (tmdb_id) WHERE ((is_custom = false) AND (tmdb_id IS NOT NULL));

CREATE UNIQUE INDEX entries_user_tmdb_unique ON public.entries USING btree (user_id, tmdb_id, media_type);

CREATE INDEX idx_tmdb_details_runtime ON public.tmdb_details USING btree (runtime);

CREATE UNIQUE INDEX tmdb_details_pkey ON public.tmdb_details USING btree (tmdb_id, media_type);

alter table "public"."tmdb_details" add constraint "tmdb_details_pkey" PRIMARY KEY using index "tmdb_details_pkey";

alter table "public"."entries" add constraint "entries_user_tmdb_unique" UNIQUE using index "entries_user_tmdb_unique";

alter table "public"."entries" add constraint "fk_tmdb_details" FOREIGN KEY (tmdb_id, media_type) REFERENCES public.tmdb_details(tmdb_id, media_type) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "fk_tmdb_details";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.save_tmdb_result_to_list(p_tmdb_id integer, p_media_type text, p_title text, p_adult boolean, p_backdrop_path text, p_poster_path text, p_original_language text, p_overview text, p_popularity numeric, p_vote_average numeric, p_vote_count integer, p_original_name text, p_release_date date, p_origin_country jsonb, p_genre_ids integer[], p_genre_names text[], p_runtime integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
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

  insert into public.entries (user_id, tmdb_id, media_type)
  values (v_user_id, p_tmdb_id, p_media_type)
  on conflict (user_id, tmdb_id, media_type) do update set
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

      insert into public.tags (name, tmdb_id, user_id, is_custom)
      values (v_genre_name, v_genre_id, null, false)
      on conflict (tmdb_id) where (is_custom = false) do update set
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


