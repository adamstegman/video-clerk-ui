// @jest-environment node
import { describe, it, expect} from '@jest/globals';
import { createAdminClient, createTestUser, cleanupTestUser, getGroupId } from '../test-utils/supabase';

describe('Application-level: Save to List', () => {
  it('saves a TMDB result and creates all related database entries', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      const groupId = await getGroupId(authed);

      // Call the RPC to save a movie
      const { data: entryId, error: rpcError } = await authed.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: 550,
        p_media_type: 'movie',
        p_title: 'Fight Club',
        p_adult: false,
        p_backdrop_path: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
        p_poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        p_original_language: 'en',
        p_overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
        p_popularity: 63.869,
        p_vote_average: 8.433,
        p_vote_count: 27000,
        p_original_name: 'Fight Club',
        p_release_date: '1999-10-15',
        p_origin_country: ['US'],
        p_genre_ids: [18, 53, 35], // Drama, Thriller, Comedy
        p_genre_names: ['Drama', 'Thriller', 'Comedy'],
        p_runtime: 139,
      });

      expect(rpcError).toBeNull();
      expect(typeof entryId).toBe('number');

      // Verify the entry was created
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('*')
        .eq('group_id', groupId);

      expect(entriesError).toBeNull();
      expect(entries).toHaveLength(1);
      expect(entries![0].watched_at).toBeNull();

      // Verify tmdb_details was created
      const { data: tmdbDetails, error: tmdbError } = await authed
        .from('tmdb_details')
        .select('*')
        .eq('tmdb_id', 550)
        .eq('media_type', 'movie');

      expect(tmdbError).toBeNull();
      expect(tmdbDetails).toHaveLength(1);
      expect(tmdbDetails![0].name).toBe('Fight Club');
      expect(tmdbDetails![0].runtime).toBe(139);

      // Verify tags were created for the genres
      const { data: tags, error: tagsError } = await authed
        .from('tags')
        .select('*')
        .in('tmdb_id', [18, 53, 35]);

      expect(tagsError).toBeNull();
      expect(tags!.length).toBeGreaterThanOrEqual(3); // At least Drama, Thriller, Comedy

      // Verify entry_tags junction was created
      const { data: entryTags, error: entryTagsError } = await authed
        .from('entry_tags')
        .select('*')
        .eq('entry_id', entries![0].id);

      expect(entryTagsError).toBeNull();
      expect(entryTags!.length).toBe(3); // Should have 3 genre tags

      // Verify tag names match genre IDs
      const tagsByTmdbId = Object.fromEntries(
        tags!.map(t => [t.tmdb_id, t.name])
      );
      expect(tagsByTmdbId[18]).toBe('Drama');
      expect(tagsByTmdbId[53]).toBe('Thriller');
      expect(tagsByTmdbId[35]).toBe('Comedy');

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('does not create duplicate tmdb_details if movie already exists', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      // Save the same movie twice
      const movieParams = {
        p_tmdb_id: 550,
        p_media_type: 'movie',
        p_title: 'Fight Club',
        p_adult: false,
        p_backdrop_path: '/backdrop.jpg',
        p_poster_path: '/poster.jpg',
        p_original_language: 'en',
        p_overview: 'Test overview',
        p_popularity: 100.0,
        p_vote_average: 8.4,
        p_vote_count: 1000,
        p_original_name: 'Fight Club',
        p_release_date: '1999-10-15',
        p_origin_country: ['US'],
        p_genre_ids: [18],
        p_genre_names: ['Drama'],
        p_runtime: 139,
      };

      await authed.rpc('save_tmdb_result_to_list', movieParams);
      await authed.rpc('save_tmdb_result_to_list', movieParams);

      // Should only have one tmdb_details entry
      const { data: tmdbDetails, error } = await authed
        .from('tmdb_details')
        .select('*')
        .eq('tmdb_id', 550)
        .eq('media_type', 'movie');

      expect(error).toBeNull();
      expect(tmdbDetails).toHaveLength(1);

      // Should have only one entry (RPC uses ON CONFLICT to prevent duplicates)
      const groupId = await getGroupId(authed);
      const { data: entries, error: entriesError } = await authed
        .from('entries')
        .select('*')
        .eq('group_id', groupId);

      expect(entriesError).toBeNull();
      expect(entries).toHaveLength(1);

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });

  it('creates tags with correct genre names from tmdb_id', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    const { client: authed, userId } = testUser;

    try {
      // Save a movie with specific genres
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
        p_genre_ids: [18, 80], // Drama, Crime
        p_genre_names: ['Drama', 'Crime'],
        p_runtime: 142,
      });

      const { data: tags, error } = await authed
        .from('tags')
        .select('*')
        .in('tmdb_id', [18, 80]);

      expect(error).toBeNull();
      expect(tags).toHaveLength(2);

      const tagsByTmdbId = Object.fromEntries(
        tags!.map(t => [t.tmdb_id, t.name])
      );
      expect(tagsByTmdbId[18]).toBe('Drama');
      expect(tagsByTmdbId[80]).toBe('Crime');

    } finally {
      await cleanupTestUser(admin, userId);
    }
  });
});
