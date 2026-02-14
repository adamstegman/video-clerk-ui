import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type TMDBGenre, type TMDBGenreList } from './tmdb-api';
import { TMDBAPIContext } from './tmdb-api-provider';

export interface TMDBGenresState {
  movieGenres: TMDBGenre[];
  tvGenres: TMDBGenre[];
  error: string | null;
}

const emptyState: TMDBGenresState = {
  movieGenres: [],
  tvGenres: [],
  error: null,
};

export const TMDBGenresContext = createContext<TMDBGenresState>(emptyState);

export function TMDBGenres({ children }: { children: ReactNode }) {
  const api = useContext(TMDBAPIContext);
  const [movieGenres, setMovieGenres] = useState<TMDBGenre[]>([]);
  const [tvGenres, setTVGenres] = useState<TMDBGenre[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;

    async function fetchGenres() {
      if (!api) return;
      setError(null);

      try {
        const [movieData, tvData] = await Promise.all([
          api.fetchMovieGenres(),
          api.fetchTVGenres(),
        ]);

        if (movieData?.genres) {
          setMovieGenres(movieData.genres);
        }
        if (tvData?.genres) {
          setTVGenres(tvData.genres);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB genres', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    }

    fetchGenres();
  }, [api]);

  return (
    <TMDBGenresContext value={{ movieGenres, tvGenres, error }}>{children}</TMDBGenresContext>
  );
}
