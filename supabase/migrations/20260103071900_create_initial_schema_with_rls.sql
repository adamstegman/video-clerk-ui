create sequence "public"."entries_id_seq";

create sequence "public"."tags_id_seq";


  create table "public"."entries" (
    "id" integer not null default nextval('public.entries_id_seq'::regclass),
    "user_id" uuid not null,
    "title" character varying(255) not null,
    "tmdb_id" integer not null,
    "added_at" timestamp without time zone not null default now(),
    "watched_at" timestamp without time zone
      );


alter table "public"."entries" enable row level security;


  create table "public"."entry_tags" (
    "entry_id" integer not null,
    "tag_id" integer not null
      );


alter table "public"."entry_tags" enable row level security;


  create table "public"."tags" (
    "id" integer not null default nextval('public.tags_id_seq'::regclass),
    "name" character varying(50) not null,
    "user_id" uuid,
    "is_custom" boolean not null,
    "updated_at" timestamp without time zone not null default now()
      );


alter table "public"."tags" enable row level security;


  create table "public"."tmdb_details" (
    "tmdb_id" integer not null,
    "media_type" character varying(20) not null,
    "adult" boolean not null,
    "backdrop_path" character varying(255),
    "poster_path" character varying(255),
    "original_language" character varying(10) not null,
    "overview" text,
    "popularity" numeric(10,2),
    "vote_average" numeric(3,1),
    "vote_count" integer,
    "name" character varying(255),
    "original_name" character varying(255),
    "release_date" date,
    "origin_country" jsonb,
    "runtime_minutes" integer,
    "updated_at" timestamp without time zone not null default now()
      );


alter table "public"."tmdb_details" enable row level security;

alter sequence "public"."entries_id_seq" owned by "public"."entries"."id";

alter sequence "public"."tags_id_seq" owned by "public"."tags"."id";

CREATE UNIQUE INDEX entries_pkey ON public.entries USING btree (id);

CREATE UNIQUE INDEX entries_user_tmdb_unique ON public.entries USING btree (user_id, tmdb_id);

CREATE UNIQUE INDEX entry_tags_pkey ON public.entry_tags USING btree (entry_id, tag_id);

CREATE INDEX idx_entries_added_at ON public.entries USING btree (added_at);

CREATE INDEX idx_entries_tmdb_id ON public.entries USING btree (tmdb_id);

CREATE INDEX idx_entries_user_id ON public.entries USING btree (user_id);

CREATE INDEX idx_entries_watched_at ON public.entries USING btree (watched_at);

CREATE INDEX idx_entry_tags_entry_id ON public.entry_tags USING btree (entry_id);

CREATE INDEX idx_entry_tags_tag_id ON public.entry_tags USING btree (tag_id);

CREATE INDEX idx_tags_is_custom ON public.tags USING btree (is_custom);

CREATE INDEX idx_tags_name ON public.tags USING btree (name);

CREATE UNIQUE INDEX idx_tags_name_unique_tmdb ON public.tags USING btree (name) WHERE (is_custom = false);

CREATE UNIQUE INDEX idx_tags_name_user_unique_custom ON public.tags USING btree (name, user_id) WHERE (is_custom = true);

CREATE INDEX idx_tags_user_id ON public.tags USING btree (user_id);

CREATE INDEX idx_tmdb_details_media_type ON public.tmdb_details USING btree (media_type);

CREATE INDEX idx_tmdb_details_release_date ON public.tmdb_details USING btree (release_date);

CREATE INDEX idx_tmdb_details_runtime ON public.tmdb_details USING btree (runtime_minutes);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tmdb_details_pkey ON public.tmdb_details USING btree (tmdb_id);

alter table "public"."entries" add constraint "entries_pkey" PRIMARY KEY using index "entries_pkey";

alter table "public"."entry_tags" add constraint "entry_tags_pkey" PRIMARY KEY using index "entry_tags_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."tmdb_details" add constraint "tmdb_details_pkey" PRIMARY KEY using index "tmdb_details_pkey";

alter table "public"."entries" add constraint "entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "entries_user_id_fkey";

alter table "public"."entries" add constraint "entries_user_tmdb_unique" UNIQUE using index "entries_user_tmdb_unique";

alter table "public"."entries" add constraint "fk_tmdb_details" FOREIGN KEY (tmdb_id) REFERENCES public.tmdb_details(tmdb_id) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "fk_tmdb_details";

alter table "public"."entry_tags" add constraint "fk_entry" FOREIGN KEY (entry_id) REFERENCES public.entries(id) ON DELETE CASCADE not valid;

alter table "public"."entry_tags" validate constraint "fk_entry";

alter table "public"."entry_tags" add constraint "fk_tag" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."entry_tags" validate constraint "fk_tag";

alter table "public"."tags" add constraint "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."entries" to "anon";

grant insert on table "public"."entries" to "anon";

grant references on table "public"."entries" to "anon";

grant select on table "public"."entries" to "anon";

grant trigger on table "public"."entries" to "anon";

grant truncate on table "public"."entries" to "anon";

grant update on table "public"."entries" to "anon";

grant delete on table "public"."entries" to "authenticated";

grant insert on table "public"."entries" to "authenticated";

grant references on table "public"."entries" to "authenticated";

grant select on table "public"."entries" to "authenticated";

grant trigger on table "public"."entries" to "authenticated";

grant truncate on table "public"."entries" to "authenticated";

grant update on table "public"."entries" to "authenticated";

grant delete on table "public"."entries" to "service_role";

grant insert on table "public"."entries" to "service_role";

grant references on table "public"."entries" to "service_role";

grant select on table "public"."entries" to "service_role";

grant trigger on table "public"."entries" to "service_role";

grant truncate on table "public"."entries" to "service_role";

grant update on table "public"."entries" to "service_role";

grant delete on table "public"."entry_tags" to "anon";

grant insert on table "public"."entry_tags" to "anon";

grant references on table "public"."entry_tags" to "anon";

grant select on table "public"."entry_tags" to "anon";

grant trigger on table "public"."entry_tags" to "anon";

grant truncate on table "public"."entry_tags" to "anon";

grant update on table "public"."entry_tags" to "anon";

grant delete on table "public"."entry_tags" to "authenticated";

grant insert on table "public"."entry_tags" to "authenticated";

grant references on table "public"."entry_tags" to "authenticated";

grant select on table "public"."entry_tags" to "authenticated";

grant trigger on table "public"."entry_tags" to "authenticated";

grant truncate on table "public"."entry_tags" to "authenticated";

grant update on table "public"."entry_tags" to "authenticated";

grant delete on table "public"."entry_tags" to "service_role";

grant insert on table "public"."entry_tags" to "service_role";

grant references on table "public"."entry_tags" to "service_role";

grant select on table "public"."entry_tags" to "service_role";

grant trigger on table "public"."entry_tags" to "service_role";

grant truncate on table "public"."entry_tags" to "service_role";

grant update on table "public"."entry_tags" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."tmdb_details" to "anon";

grant insert on table "public"."tmdb_details" to "anon";

grant references on table "public"."tmdb_details" to "anon";

grant select on table "public"."tmdb_details" to "anon";

grant trigger on table "public"."tmdb_details" to "anon";

grant truncate on table "public"."tmdb_details" to "anon";

grant update on table "public"."tmdb_details" to "anon";

grant delete on table "public"."tmdb_details" to "authenticated";

grant insert on table "public"."tmdb_details" to "authenticated";

grant references on table "public"."tmdb_details" to "authenticated";

grant select on table "public"."tmdb_details" to "authenticated";

grant trigger on table "public"."tmdb_details" to "authenticated";

grant truncate on table "public"."tmdb_details" to "authenticated";

grant update on table "public"."tmdb_details" to "authenticated";

grant delete on table "public"."tmdb_details" to "service_role";

grant insert on table "public"."tmdb_details" to "service_role";

grant references on table "public"."tmdb_details" to "service_role";

grant select on table "public"."tmdb_details" to "service_role";

grant trigger on table "public"."tmdb_details" to "service_role";

grant truncate on table "public"."tmdb_details" to "service_role";

grant update on table "public"."tmdb_details" to "service_role";


  create policy "Users can delete their own entries"
  on "public"."entries"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can insert their own entries"
  on "public"."entries"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own entries"
  on "public"."entries"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own entries"
  on "public"."entries"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete entry_tags for their own entries"
  on "public"."entry_tags"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can insert entry_tags for their own entries"
  on "public"."entry_tags"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can view entry_tags for their own entries"
  on "public"."entry_tags"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.entries
  WHERE ((entries.id = entry_tags.entry_id) AND (entries.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Authenticated users can create custom tags"
  on "public"."tags"
  as permissive
  for insert
  to public
with check (((( SELECT auth.role() AS role) = 'authenticated'::text) AND (is_custom = true) AND (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Everyone can view tags"
  on "public"."tags"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own custom tags"
  on "public"."tags"
  as permissive
  for delete
  to public
using (((( SELECT auth.uid() AS uid) = user_id) AND (is_custom = true)));



  create policy "Users can update their own custom tags"
  on "public"."tags"
  as permissive
  for update
  to public
using (((( SELECT auth.uid() AS uid) = user_id) AND (is_custom = true)))
with check (((( SELECT auth.uid() AS uid) = user_id) AND (is_custom = true)));



  create policy "Authenticated users can insert tmdb_details"
  on "public"."tmdb_details"
  as permissive
  for insert
  to public
with check ((( SELECT auth.role() AS role) = 'authenticated'::text));



  create policy "Authenticated users can update tmdb_details"
  on "public"."tmdb_details"
  as permissive
  for update
  to public
using ((( SELECT auth.role() AS role) = 'authenticated'::text))
with check ((( SELECT auth.role() AS role) = 'authenticated'::text));



  create policy "Everyone can view tmdb_details"
  on "public"."tmdb_details"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tmdb_details_updated_at BEFORE UPDATE ON public.tmdb_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


