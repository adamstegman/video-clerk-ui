// @jest-environment node
import { describe, it, expect } from '@jest/globals';
import { createAdminClient, createTestUser, cleanupTestUser, getGroupId } from '../test-utils/supabase';

describe('Application-level: Watch Flow', () => {
  it('loads only unwatched entries', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create two entries: both unwatched initially
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

      // Mark one as watched
      const { data: entries } = await authed
        .from('entries')
        .select('id')
        .eq('group_id', groupId)
        .order('added_at', { ascending: false });

      expect(entries).toHaveLength(2);
      const watchedEntryId = entries![0].id;
      await authed
        .from('entries')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', watchedEntryId);

      // Query for unwatched entries (simulating watch page load)
      const { data: unwatched, error } = await authed
        .from('entries')
        .select('id, watched_at')
        .eq('group_id', groupId)
        .is('watched_at', null);

      expect(error).toBeNull();
      expect(unwatched).toHaveLength(1);
      expect(unwatched![0].watched_at).toBeNull();

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('filters entries by media type', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create a movie and a TV show
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

      await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 1396,
        p_media_type: 'tv',
        p_title: 'Breaking Bad',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test',
        p_popularity: 100.0,
        p_vote_average: 8.9,
        p_vote_count: 1000,
        p_original_name: 'Breaking Bad',
        p_release_date: '2008-01-20',
        p_origin_country: ['US'],
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 45,
      });

      // Filter by media type = movie
      const { data: movies, error: moviesError } = await authed
        .from('entries')
        .select('id, media_type')
        .eq('group_id', groupId)
        .eq('media_type', 'movie')
        .is('watched_at', null);

      expect(moviesError).toBeNull();
      expect(movies).toHaveLength(1);
      expect(movies![0].media_type).toBe('movie');

      // Filter by media type = tv
      const { data: tvShows, error: tvError } = await authed
        .from('entries')
        .select('id, media_type')
        .eq('group_id', groupId)
        .eq('media_type', 'tv')
        .is('watched_at', null);

      expect(tvError).toBeNull();
      expect(tvShows).toHaveLength(1);
      expect(tvShows![0].media_type).toBe('tv');

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('marks winner as watched and removes from unwatched list', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create an entry
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

      // Get the entry
      const { data: entries } = await authed
        .from('entries')
        .select('id, watched_at')
        .eq('group_id', groupId)
        .is('watched_at', null);

      expect(entries).toHaveLength(1);
      const entryId = entries![0].id;

      // Simulate marking as watched (the winner)
      const { error: updateError } = await authed
        .from('entries')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', entryId);

      expect(updateError).toBeNull();

      // Verify it's no longer in unwatched list
      const { data: unwatchedAfter, error: unwatchedError } = await authed
        .from('entries')
        .select('id')
        .eq('group_id', groupId)
        .is('watched_at', null);

      expect(unwatchedError).toBeNull();
      expect(unwatchedAfter).toHaveLength(0);

      // Verify it appears in watched list
      const { data: watchedList, error: watchedError } = await authed
        .from('entries')
        .select('id, watched_at')
        .eq('group_id', groupId)
        .not('watched_at', 'is', null);

      expect(watchedError).toBeNull();
      expect(watchedList).toHaveLength(1);
      expect(watchedList![0].id).toBe(entryId);
      expect(watchedList![0].watched_at).not.toBeNull();

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('filters entries by tags', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Create two entries with different genres
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
        p_genre_ids: [18, 53], // Drama, Thriller
        p_genre_names: ['Drama', 'Thriller'],
        p_runtime: 139,
      });

      await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 680,
        p_media_type: 'movie',
        p_title: 'Pulp Fiction',
        p_adult: false,
        p_backdrop_path: null,
        p_poster_path: null,
        p_original_language: 'en',
        p_overview: 'Test',
        p_popularity: 100.0,
        p_vote_average: 8.5,
        p_vote_count: 1000,
        p_original_name: 'Pulp Fiction',
        p_release_date: '1994-09-10',
        p_origin_country: ['US'],
        p_genre_ids: [18, 80], // Drama, Crime
        p_genre_names: ['Drama', 'Crime'],
        p_runtime: 154,
      });

      // Get tags for Drama (should be in both entries)
      const { data: dramaTags } = await authed
        .from('tags')
        .select('id')
        .eq('tmdb_id', 18)
        .limit(1);

      expect(dramaTags).toHaveLength(1);
      const dramaTagId = dramaTags![0].id;

      // Filter entries by Drama tag
      const { data: dramaEntries, error } = await authed
        .from('entries')
        .select('id, entry_tags!inner(tag_id)')
        .eq('group_id', groupId)
        .eq('entry_tags.tag_id', dramaTagId)
        .is('watched_at', null);

      expect(error).toBeNull();
      expect(dramaEntries!.length).toBeGreaterThanOrEqual(2);

      // Get tags for Thriller (should be only in Fight Club)
      const { data: thrillerTags } = await authed
        .from('tags')
        .select('id')
        .eq('tmdb_id', 53)
        .limit(1);

      expect(thrillerTags).toHaveLength(1);
      const thrillerTagId = thrillerTags![0].id;

      // Filter entries by Thriller tag
      const { data: thrillerEntries, error: thrillerError } = await authed
        .from('entries')
        .select('id, entry_tags!inner(tag_id)')
        .eq('group_id', groupId)
        .eq('entry_tags.tag_id', thrillerTagId)
        .is('watched_at', null);

      expect(thrillerError).toBeNull();
      expect(thrillerEntries).toHaveLength(1);

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });
});
