import { useContext, useState, useEffect, useCallback, useRef } from 'react';

import { TMDBSearch } from './tmdb-search';
import { type TMDBGenre, type TMDBSearchResult as TMDBRawSearchResult } from '../tmdb-api/tmdb-api';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';
import { TMDBGenresContext } from '../tmdb-api/tmdb-genres';
import { createClient } from '../lib/supabase/client';

export enum TMDBMediaType {
  MOVIE = 'movie',
  TV = 'tv',
}

export interface TMDBSearchResultItem
  extends Omit<
    TMDBRawSearchResult,
    'genre_ids' | 'title' | 'first_air_date' | 'name' | 'release_date'
  > {
  genres: TMDBGenre[];
  name: string;
  release_date: string;
  release_year: string;
  media_type_display: string;
}

const mediaTypeDisplay = {
  [TMDBMediaType.MOVIE]: 'Movie',
  [TMDBMediaType.TV]: 'TV Series',
};

function createSearchResultItem(
  result: TMDBRawSearchResult,
  genreData: { movieGenres: TMDBGenre[]; tvGenres: TMDBGenre[] }
): TMDBSearchResultItem {
  let genres: TMDBGenre[] = [];
  if (result.media_type === TMDBMediaType.MOVIE) {
    genres = result.genre_ids
      .map((genre_id: number) => genreData.movieGenres.find((g: TMDBGenre) => g.id === genre_id))
      .filter((genre: TMDBGenre | undefined) => !!genre);
  } else if (result.media_type === TMDBMediaType.TV) {
    genres = result.genre_ids
      .map((genre_id: number) => genreData.tvGenres.find((g: TMDBGenre) => g.id === genre_id))
      .filter((genre: TMDBGenre | undefined) => !!genre);
  }

  const release_date = result.release_date || result.first_air_date || ''; // movie || tv
  const name = result.name || result.title || ''; // tv || movie
  return {
    ...result,
    genres,
    // Keep the raw TMDB media_type ('movie' | 'tv') for persistence,
    // and provide a separate display value for UI rendering.
    media_type: result.media_type,
    media_type_display: mediaTypeDisplay[result.media_type as TMDBMediaType],
    name,
    release_date,
    release_year: release_date ? release_date.split('-')[0] : '',
  };
}

interface TMDBSearchContainerProps {
  initialQuery?: string;
}

export function TMDBSearchContainer({ initialQuery }: TMDBSearchContainerProps) {
  const api = useContext(TMDBAPIContext);
  const genreData = useContext(TMDBGenresContext);
  const [results, setResults] = useState<TMDBSearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savedEntryKeys, setSavedEntryKeys] = useState<Set<string>>(new Set());
  const requestIdRef = useRef(0);

  const entryKey = (tmdbId: number, mediaType: string) => `${mediaType}:${tmdbId}`;

  const fetchSavedEntryKeys = async (results: TMDBSearchResultItem[]) => {
    const ids = Array.from(new Set(results.map((r) => r.id)));
    if (ids.length === 0) return new Set<string>();

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error(userError);
      return new Set<string>();
    }
    if (!userData.user) return new Set<string>();

    const mediaTypes = Array.from(new Set(results.map((r) => r.media_type)));
    const { data, error } = await supabase
      .from('entries')
      .select('tmdb_id, media_type')
      .in('tmdb_id', ids)
      .in('media_type', mediaTypes);

    if (error) {
      console.error(error);
      return new Set<string>();
    }

    return new Set((data ?? []).map((row) => entryKey(row.tmdb_id as number, row.media_type as string)));
  };

  const handleSearch = useCallback(async (term: string) => {
    setError(null);
    if (!term) {
      setResults([]);
      setSavedEntryKeys(new Set());
      setLoading(false);
      return;
    }

    if (!api) {
      setError('TMDB API is not available. Please refresh the page.');
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setSavedEntryKeys(new Set());
    let results: TMDBSearchResultItem[] = [];
    try {
      const data = await api.multiSearch(term);
      if (data.results) {
        results = data.results
          .filter((result: any) => Object.values(TMDBMediaType).includes(result.media_type))
          .map((result: any) => createSearchResultItem(result, genreData));
      }
      results.sort((a, b) => b.popularity - a.popularity);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
    setResults(results);
    setLoading(false);

    // Non-blocking: show results immediately, then hydrate "already saved" state.
    fetchSavedEntryKeys(results)
      .then((keys) => {
        if (requestIdRef.current === requestId) {
          setSavedEntryKeys(keys);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [api, genreData]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return (
    <TMDBSearch
      onSearch={handleSearch}
      results={results}
      error={error}
      loading={loading}
      initialQuery={initialQuery}
      savedEntryKeys={savedEntryKeys}
    />
  );
}
