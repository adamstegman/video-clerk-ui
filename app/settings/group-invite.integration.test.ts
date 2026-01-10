// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupTestUser,
  getGroupId,
  hasSupabaseEnv,
} from '~/test-utils/supabase';

const describeIf = hasSupabaseEnv ? describe : describe.skip;

describeIf('Application-level: group invites (Supabase)', () => {
  it('allows a user to invite another into their group and share entries', async () => {
    const admin = createAdminClient();
    const testUser1 = await createTestUser(admin);
    const testUser2 = await createTestUser(admin);
    const { client: authed1, userId: userId1, email: email1 } = testUser1;
    const { client: authed2, userId: userId2, email: email2 } = testUser2;

    const tmdbId = Math.floor(Math.random() * 1_000_000) + 10_000;

    try {
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
      await cleanupTestUser(admin, userId1);
      await cleanupTestUser(admin, userId2);
    }
  }, 30_000);
});
