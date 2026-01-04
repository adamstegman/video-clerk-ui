import { useContext, useState, useEffect, useCallback, useRef } from 'react';

import { TMDBSearch } from './tmdb-search';
import { type TMDBGenre, type TMDBSearchResult as TMDBRawSearchResult } from '../tmdb-api/tmdb-api';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';
import { TMDBGenresContext } from '../tmdb-api/tmdb-genres';
import { AppDataContext } from '../app-data/app-data-provider';
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
  const { user } = useContext(AppDataContext);
  const [results, setResults] = useState<TMDBSearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedStatusWarning, setSavedStatusWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savedByMediaType, setSavedByMediaType] = useState<Map<string, Set<number>>>(new Map());
  const requestIdRef = useRef(0);

  const savedStatusWarningMessage =
    "Couldn't verify whether search results are already saved. Some results may show “Save” even if already saved.";

  const fetchSavedByMediaType = async (results: TMDBSearchResultItem[]) => {
    if (!user) return { map: new Map<string, Set<number>>(), warning: null as string | null };
    const ids = Array.from(new Set(results.map((r) => r.id)));
    if (ids.length === 0) return { map: new Map<string, Set<number>>(), warning: null as string | null };

    const supabase = createClient();
    // Deduplicate the media types so the `in('media_type', ...)` filter doesn't include redundant values.
    const mediaTypes = Array.from(new Set(results.map((r) => r.media_type)));
    const { data, error } = await supabase
      .from('entries')
      .select('tmdb_id, media_type')
      .eq('user_id', user.id)
      .in('tmdb_id', ids)
      .in('media_type', mediaTypes);

    if (error) {
      console.error(error);
      return { map: new Map<string, Set<number>>(), warning: savedStatusWarningMessage };
    }

    const map = new Map<string, Set<number>>();
    for (const row of data ?? []) {
      const mediaType = row.media_type as string;
      const tmdbId = row.tmdb_id as number;
      const set = map.get(mediaType) ?? new Set<number>();
      set.add(tmdbId);
      map.set(mediaType, set);
    }
    return { map, warning: null as string | null };
  };

  const handleSearch = useCallback(async (term: string) => {
    setError(null);
    if (!term) {
      setResults([]);
      setSavedByMediaType(new Map());
      setSavedStatusWarning(null);
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
    setSavedByMediaType(new Map());
    setSavedStatusWarning(null);
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
    fetchSavedByMediaType(results)
      .then(({ map, warning }) => {
        if (requestIdRef.current === requestId) {
          setSavedByMediaType(map);
          setSavedStatusWarning(warning);
        }
      })
      .catch((err) => {
        console.error(err);
        if (requestIdRef.current === requestId) {
          setSavedStatusWarning(savedStatusWarningMessage);
        }
      });
  }, [api, genreData, user]);

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
      savedStatusWarning={savedStatusWarning}
      loading={loading}
      initialQuery={initialQuery}
      savedByMediaType={savedByMediaType}
    />
  );
}
