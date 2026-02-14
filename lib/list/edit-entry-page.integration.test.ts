// @jest-environment node
import { describe, it, expect } from '@jest/globals';
import { createAdminClient, createTestUser, cleanupTestUser, getGroupId } from '../test-utils/supabase';

describe('Application-level: Edit Entry Page', () => {
  it('updates entry tags when saving', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create a test entry
      await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 550,
        p_media_type: 'movie',
        p_title: 'Fight Club',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test',
        p_popularity: 100.0,
        p_vote_average: 8.4,
        p_vote_count: 1000,
        p_original_name: 'Fight Club',
        p_release_date: '1999-10-15',
        p_origin_country: ['US'],
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 139,
      });

      // Get the entry ID
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('id')
        .eq('group_id', groupId)
        .limit(1);

      expect(entriesError).toBeNull();
      expect(entries).toHaveLength(1);
      const entryId = entries![0].id;

      // Create a custom tag
      const { data: customTag, error: tagError } = await authed
        .from('tags')
        .insert({
          name: 'Favorite',
          group_id: groupId,
          tmdb_id: null,
          is_custom: true,
        })
        .select('id')
        .single();

      expect(tagError).toBeNull();
      expect(customTag).not.toBeNull();

      // Clear existing entry_tags and add the custom tag
      await authed.from('entry_tags').delete().eq('entry_id', entryId);
      const { error: insertError } = await authed
        .from('entry_tags')
        .insert({ entry_id: entryId, tag_id: customTag!.id });

      expect(insertError).toBeNull();

      // Verify the entry_tags were updated
      const { data: updatedEntryTags, error: fetchError } = await authed
        .from('entry_tags')
        .select('tag_id')
        .eq('entry_id', entryId);

      expect(fetchError).toBeNull();
      expect(updatedEntryTags).toHaveLength(1);
      expect(updatedEntryTags![0].tag_id).toBe(customTag!.id);

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('marks entry as watched when toggling watched status', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create a test entry
      await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 278,
        p_media_type: 'movie',
        p_title: 'The Shawshank Redemption',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test',
        p_popularity: 100.0,
        p_vote_average: 8.7,
        p_vote_count: 1000,
        p_original_name: 'The Shawshank Redemption',
        p_release_date: '1994-09-23',
        p_origin_country: ['US'],
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 142,
      });

      // Get the entry
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('id, watched_at')
        .eq('group_id', groupId)
        .limit(1);

      expect(entriesError).toBeNull();
      expect(entries).toHaveLength(1);
      expect(entries![0].watched_at).toBeNull();

      const entryId = entries![0].id;

      // Mark as watched
      const { error: updateError } = await authed
        .from('entries')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', entryId)
        .eq('group_id', groupId);

      expect(updateError).toBeNull();

      // Verify it's marked as watched
      const { data: watchedEntry, error: fetchError } = await authed
        .from('entries')
        .select('watched_at')
        .eq('id', entryId)
        .single();

      expect(fetchError).toBeNull();
      expect(watchedEntry!.watched_at).not.toBeNull();

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('deletes entry when delete is triggered', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create a test entry
      await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 550,
        p_media_type: 'movie',
        p_title: 'Fight Club',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test',
        p_popularity: 100.0,
        p_vote_average: 8.4,
        p_vote_count: 1000,
        p_original_name: 'Fight Club',
        p_release_date: '1999-10-15',
        p_origin_country: ['US'],
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 139,
      });

      // Get the entry ID
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('id')
        .eq('group_id', groupId)
        .limit(1);

      expect(entriesError).toBeNull();
      expect(entries).toHaveLength(1);
      const entryId = entries![0].id;

      // Delete the entry
      const { error: deleteError } = await authed
        .from('entries')
        .delete()
        .eq('id', entryId)
        .eq('group_id', groupId);

      expect(deleteError).toBeNull();

      // Verify it's deleted
      const { data: deletedEntry, error: fetchError } = await authed
        .from('entries')
        .select('id')
        .eq('id', entryId);

      expect(fetchError).toBeNull();
      expect(deletedEntry).toHaveLength(0);

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('creates custom tags on the fly when saving', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create a custom tag directly
      const customTagName = 'Must Watch';
      const { data: createdTag, error: createError } = await authed
        .from('tags')
        .insert({
          name: customTagName,
          group_id: groupId,
          tmdb_id: null,
          is_custom: true,
        })
        .select('id, name, is_custom')
        .single();

      expect(createError).toBeNull();
      expect(createdTag).not.toBeNull();
      expect(createdTag!.name).toBe(customTagName);
      expect(createdTag!.is_custom).toBe(true);

      // Verify it appears in the tags list
      const { data: allTags, error: fetchError } = await authed
        .from('tags')
        .select('id, name, is_custom')
        .eq('group_id', groupId)
        .eq('is_custom', true);

      expect(fetchError).toBeNull();
      const customTag = allTags!.find((t) => t.name === customTagName);
      expect(customTag).toBeDefined();
      expect(customTag!.is_custom).toBe(true);

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });
});
