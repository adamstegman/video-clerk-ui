import { useContext, useState, useEffect, useCallback } from 'react';

import { TMDBSearch } from './tmdb-search';
import { type TMDBGenre, type TMDBSearchResult as TMDBRawSearchResult } from '../tmdb-api/tmdb-api';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';
import { TMDBGenresContext } from '../tmdb-api/tmdb-genres';

export enum TMDBMediaType {
  MOVIE = 'movie',
  TV = 'tv',
}

export interface TMDBSearchResultItem
  extends Omit<
    TMDBRawSearchResult,
    'genre_ids' | 'title' | 'first_air_date' | 'name' | 'release_date'
  > {
  genre_tags: { id: number; name: string }[];
  genres: string[];
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
  let genre_tags: { id: number; name: string }[] = [];
  if (result.media_type === TMDBMediaType.MOVIE) {
    genre_tags = result.genre_ids
      .map((genre_id: number) => {
        const genre = genreData.movieGenres.find((g: TMDBGenre) => g.id === genre_id);
        return genre ? { id: genre.id, name: genre.name } : null;
      })
      .filter((tag): tag is { id: number; name: string } => !!tag);
  } else if (result.media_type === TMDBMediaType.TV) {
    genre_tags = result.genre_ids
      .map((genre_id: number) => {
        const genre = genreData.tvGenres.find((g: TMDBGenre) => g.id === genre_id);
        return genre ? { id: genre.id, name: genre.name } : null;
      })
      .filter((tag): tag is { id: number; name: string } => !!tag);
  }

  const release_date = result.release_date || result.first_air_date || ''; // movie || tv
  const name = result.name || result.title || ''; // tv || movie
  const genres = genre_tags.map((t) => t.name);
  return {
    ...result,
    genre_tags,
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

  const handleSearch = useCallback(async (term: string) => {
    setError(null);
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (!api) {
      setError('TMDB API is not available. Please refresh the page.');
      setLoading(false);
      return;
    }

    setLoading(true);
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
  }, [api, genreData]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return <TMDBSearch onSearch={handleSearch} results={results} error={error} loading={loading} initialQuery={initialQuery} />;
}
