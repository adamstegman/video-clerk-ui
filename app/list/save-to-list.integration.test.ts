// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import type { Database } from '~/lib/supabase/database.types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const SUPABASE_SECRET_KEY = process.env.VITE_SUPABASE_SECRET_KEY;

const hasSupabaseEnv =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.length > 0 &&
  typeof SUPABASE_PUBLISHABLE_KEY === 'string' &&
  SUPABASE_PUBLISHABLE_KEY.length > 0 &&
  typeof SUPABASE_SECRET_KEY === 'string' &&
  SUPABASE_SECRET_KEY.length > 0;

const describeIf = hasSupabaseEnv ? describe : describe.skip;

describeIf('Application-level: save TMDB result to list (Supabase)', () => {
  it('creates entries, tmdb_details, tags (from genres), and entry_tags', async () => {
    const url = SUPABASE_URL!;
    const publishableKey = SUPABASE_PUBLISHABLE_KEY!;
    const secretKey = SUPABASE_SECRET_KEY!;

    const admin = createClient<Database>(url, secretKey);

    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = `pw-${crypto.randomUUID()}`;

    const { data: created, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(createUserError).toBeNull();
    expect(created.user).toBeTruthy();

    const userId = created.user!.id;

    try {
      const authed = createClient<Database>(url, publishableKey);

      const { error: signInError } = await authed.auth.signInWithPassword({
        email,
        password,
      });
      expect(signInError).toBeNull();

      const { data: rpcData, error: rpcError } = await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 550,
        p_media_type: 'movie',
        p_title: 'Fight Club',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test overview',
        p_popularity: 1.23,
        p_vote_average: 8.8,
        p_vote_count: 123,
        p_original_name: null,
        p_release_date: '1999-10-15',
        p_origin_country: null,
        p_genre_ids: [18, 53],
        p_genre_names: ['Drama', 'Thriller'],
        p_runtime: 139,
      });

      expect(rpcError).toBeNull();
      expect(typeof rpcData).toBe('number');

      // entries row for this user
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('id, user_id, tmdb_id, media_type')
        .eq('user_id', userId)
        .eq('tmdb_id', 550)
        .eq('media_type', 'movie');

      expect(entriesError).toBeNull();
      expect(entries?.length).toBe(1);
      const entryId = entries![0].id as number;

      // tmdb_details row keyed by (tmdb_id, media_type)
      const { data: details, error: detailsError } = await authed
        .from('tmdb_details')
        .select('tmdb_id, media_type, runtime, name')
        .eq('tmdb_id', 550)
        .eq('media_type', 'movie')
        .single();

      expect(detailsError).toBeNull();
      expect(details!.tmdb_id).toBe(550);
      expect(details!.media_type).toBe('movie');
      expect(details!.runtime).toBe(139);
      expect(details!.name).toBe('Fight Club');

      // tags created/upserted from genres (shared tags have user_id null, is_custom false)
      const { data: tags, error: tagsError } = await authed
        .from('tags')
        .select('id, name, tmdb_id, user_id, is_custom')
        .in('tmdb_id', [18, 53]);

      expect(tagsError).toBeNull();
      expect(tags?.length).toBe(2);

      for (const expected of [
        { tmdb_id: 18, name: 'Drama' },
        { tmdb_id: 53, name: 'Thriller' },
      ]) {
        const tag = tags!.find((t) => t.tmdb_id === expected.tmdb_id);
        expect(tag).toBeTruthy();
        expect(tag!.name).toBe(expected.name);
        expect(tag!.is_custom).toBe(false);
        expect(tag!.user_id).toBeNull();
      }

      // entry_tags rows link the entry to those tag ids
      const tagIds = tags!.map((t) => t.id);
      const { data: entryTags, error: entryTagsError } = await authed
        .from('entry_tags')
        .select('entry_id, tag_id')
        .eq('entry_id', entryId);

      expect(entryTagsError).toBeNull();
      expect(entryTags?.length).toBe(2);

      const entryTagIdSet = new Set(entryTags!.map((et) => et.tag_id));
      for (const tagId of tagIds) {
        expect(entryTagIdSet.has(tagId)).toBe(true);
      }
    } finally {
      // Cleanup: remove the user and their dependent rows (entries cascade).
      await admin.auth.admin.deleteUser(userId);
    }
  }, 30_000);
});
