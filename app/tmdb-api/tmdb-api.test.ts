import { afterEach, describe, expect, it, vi } from 'vitest';
import { TMDBAPI, type TMDBConfig, type TMDBSearchResults } from './tmdb-api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('TMDBAPI', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const api = new TMDBAPI('test-token');

  describe('fetchConfiguration', () => {
    it('should fetch and return the configuration', async () => {
      const mockConfig: TMDBConfig = {
        images: {
          base_url: 'http://image.tmdb.org/t/p/',
          secure_base_url: 'https://image.tmdb.org/t/p/',
          backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
          logo_sizes: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
          poster_sizes: ['w92', 'w154', 'w185', 'w300', 'w500', 'w780', 'original'],
          profile_sizes: ['w45', 'w185', 'h632', 'original'],
          still_sizes: ['w92', 'w185', 'w300', 'original'],
        },
        change_keys: [],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      const config = await api.fetchConfiguration();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/configuration',
        expect.objectContaining({
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
      expect(config).toEqual(mockConfig);
    });

    it('should throw an error if the fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(api.fetchConfiguration()).rejects.toThrow('Error 500: Internal Server Error');
    });
  });

  describe('multiSearch', () => {
    it('should fetch and return search results', async () => {
      const mockSearchResults: TMDBSearchResults = {
        page: 1,
        results: [],
        total_pages: 1,
        total_results: 0,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      });

      const results = await api.multiSearch('test-query');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/multi?query=test-query',
        expect.objectContaining({
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
      expect(results).toEqual(mockSearchResults);
    });

    it('should throw an error if the fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(api.multiSearch('test-query')).rejects.toThrow('Error 401: Unauthorized');
    });
  });
});
