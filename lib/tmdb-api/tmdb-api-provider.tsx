import { createContext, type ReactNode } from 'react';
import { TMDBAPI } from './tmdb-api';

export const TMDBAPIContext = createContext<TMDBAPI | null>(null);

export function TMDBAPIProvider({ children }: { children: ReactNode }) {
  const apiToken = process.env.EXPO_PUBLIC_TMDB_API_READ_TOKEN;

  if (!apiToken) {
    throw new Error('EXPO_PUBLIC_TMDB_API_READ_TOKEN is not set');
  }

  const api = new TMDBAPI(apiToken);

  return <TMDBAPIContext value={api}>{children}</TMDBAPIContext>;
}
