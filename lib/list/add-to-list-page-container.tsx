import { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import { TMDBGenresContext } from '../tmdb-api/tmdb-genres';
import { supabase } from '../supabase/client';
import type { TMDBSearchResult, TMDBGenre } from '../tmdb-api/tmdb-api';
import { AddToListPage } from './add-to-list-page';
import type { SearchResultItem } from './add-to-list-page';

export function AddToListPageContainer() {
  const api = useContext(TMDBAPIContext);
  const config = useContext(TMDBConfigurationContext);
  const genreData = useContext(TMDBGenresContext);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedTmdbIds, setSavedTmdbIds] = useState<Set<number>>(new Set());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchSavedIds = async () => {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('tmdb_details(tmdb_id)');

        if (error) throw error;

        const ids = new Set<number>();
        data?.forEach((entry: any) => {
          const details = entry.tmdb_details;
          if (details) {
            const tmdbId = Array.isArray(details) ? details[0]?.tmdb_id : details.tmdb_id;
            if (tmdbId) ids.add(tmdbId);
          }
        });

        setSavedTmdbIds(ids);
      } catch (err) {
        console.error('Failed to fetch saved IDs:', err);
      }
    };

    fetchSavedIds();
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      if (!api) {
        setError('TMDB API is not available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.multiSearch(searchQuery);
        const filtered = data.results
          .filter((r: TMDBSearchResult) => r.media_type === 'movie' || r.media_type === 'tv')
          .map((result: TMDBSearchResult) => {
            const genres =
              result.media_type === 'movie'
                ? result.genre_ids
                    .map((id) => genreData.movieGenres.find((g) => g.id === id))
                    .filter((g): g is TMDBGenre => !!g)
                : result.genre_ids
                    .map((id) => genreData.tvGenres.find((g) => g.id === id))
                    .filter((g): g is TMDBGenre => !!g);

            const displayName = result.title || result.name || 'Untitled';
            const releaseDate = result.release_date || result.first_air_date || '';
            const releaseYear = releaseDate ? releaseDate.split('-')[0] : '';

            return {
              ...result,
              genres,
              displayName,
              releaseYear,
            };
          });

        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [api, genreData]
  );

  function handleQueryChange(text: string) {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  }

  async function handleAddToList(result: SearchResultItem) {
    setSavingId(result.id);

    try {
      const { error } = await supabase.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: result.id,
        p_media_type: result.media_type,
        p_adult: result.adult,
        p_backdrop_path: result.backdrop_path,
        p_genre_ids: result.genre_ids,
        p_genre_names: result.genres.map((g) => g.name),
        p_original_language: result.original_language,
        p_original_name: result.original_name || null,
        p_overview: result.overview,
        p_popularity: result.popularity,
        p_poster_path: result.poster_path,
        p_release_date: result.release_date || result.first_air_date || null,
        p_title: result.displayName,
        p_vote_average: result.vote_average,
        p_vote_count: result.vote_count,
        p_runtime: null,
        p_origin_country: result.origin_country || null,
      });

      if (error) throw error;

      setSavedTmdbIds((prev) => new Set(prev).add(result.id));
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add to list');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AddToListPage
      query={query}
      onQueryChange={handleQueryChange}
      results={results}
      loading={loading}
      error={error}
      savingId={savingId}
      savedTmdbIds={savedTmdbIds}
      config={config}
      onAddToList={handleAddToList}
    />
  );
}
