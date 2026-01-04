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

describeIf('Application-level: group invites (Supabase)', () => {
  it('allows a user to invite another into their group and share entries', async () => {
    const url = SUPABASE_URL!;
    const publishableKey = SUPABASE_PUBLISHABLE_KEY!;
    const secretKey = SUPABASE_SECRET_KEY!;

    const admin = createClient<Database>(url, secretKey);

    const email1 = `test-${crypto.randomUUID()}@example.com`;
    const email2 = `test-${crypto.randomUUID()}@example.com`;
    const password1 = `pw-${crypto.randomUUID()}`;
    const password2 = `pw-${crypto.randomUUID()}`;

    const { data: created1, error: createUserError1 } = await admin.auth.admin.createUser({
      email: email1,
      password: password1,
      email_confirm: true,
    });
    expect(createUserError1).toBeNull();
    expect(created1.user).toBeTruthy();

    const { data: created2, error: createUserError2 } = await admin.auth.admin.createUser({
      email: email2,
      password: password2,
      email_confirm: true,
    });
    expect(createUserError2).toBeNull();
    expect(created2.user).toBeTruthy();

    const userId1 = created1.user!.id;
    const userId2 = created2.user!.id;

    const authed1 = createClient<Database>(url, publishableKey);
    const authed2 = createClient<Database>(url, publishableKey);

    const getGroupId = async (client: ReturnType<typeof createClient<Database>>) => {
      const { data, error } = await client.from('group_memberships').select('group_id').single();
      expect(error).toBeNull();
      expect(data?.group_id).toBeTruthy();
      return data!.group_id as string;
    };

    const tmdbId = Math.floor(Math.random() * 1_000_000) + 10_000;

    try {
      const { error: signInError1 } = await authed1.auth.signInWithPassword({
        email: email1,
        password: password1,
      });
      expect(signInError1).toBeNull();

      const { error: signInError2 } = await authed2.auth.signInWithPassword({
        email: email2,
        password: password2,
      });
      expect(signInError2).toBeNull();

      const groupId1 = await getGroupId(authed1);
      const groupId2 = await getGroupId(authed2);
      expect(groupId2).not.toBe(groupId1);

      // Create an entry as user1 in their group.
      const { error: saveError } = await authed1.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: tmdbId,
        p_media_type: 'movie',
        p_title: 'Group Sharing Test',
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
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 139,
      });
      expect(saveError).toBeNull();

      // User1 invites user2, then user2 accepts (moving into user1's group).
      const { data: inviteId, error: inviteError } = await authed1.rpc('create_group_invite', {
        p_invited_email: email2,
      });
      expect(inviteError).toBeNull();
      expect(inviteId).toBeTruthy();

      const { data: acceptedGroupId, error: acceptError } = await authed2.rpc('accept_group_invite', {
        p_invite_id: String(inviteId),
      });
      expect(acceptError).toBeNull();
      expect(String(acceptedGroupId)).toBe(groupId1);

      const groupId2After = await getGroupId(authed2);
      expect(groupId2After).toBe(groupId1);

      // User2 can now see user1's entry because entries are group-owned and RLS is group-based.
      const { data: entries, error: entriesError } = await authed2
        .from('entries')
        .select('id, group_id, tmdb_id, media_type')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', 'movie');

      expect(entriesError).toBeNull();
      expect(entries?.length).toBe(1);
      expect(entries?.[0].group_id).toBe(groupId1);
    } finally {
      await admin.auth.admin.deleteUser(userId1);
      await admin.auth.admin.deleteUser(userId2);
    }
  }, 30_000);
});

