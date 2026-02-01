import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type TMDBConfig } from './tmdb-api';
import { TMDBAPIContext } from './tmdb-api-provider';

export interface TMDBConfigurationState extends TMDBConfig {
  error: string | null;
}

const emptyState: TMDBConfigurationState = {
  change_keys: [],
  images: {
    base_url: null,
    secure_base_url: null,
    backdrop_sizes: [],
    logo_sizes: [],
    poster_sizes: [],
    profile_sizes: [],
    still_sizes: [],
  },
  error: null,
};

export const TMDBConfigurationContext = createContext<TMDBConfigurationState>(emptyState);

export function TMDBConfiguration({ children }: { children: ReactNode }) {
  const api = useContext(TMDBAPIContext);
  const [config, setConfig] = useState<TMDBConfig>(emptyState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;

    async function fetchConfiguration() {
      if (!api) return;
      setError(null);

      try {
        const data = await api.fetchConfiguration();
        if (data) {
          setConfig({ ...data });
        }
      } catch (error) {
        console.error('Failed to fetch TMDB configuration', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    }

    fetchConfiguration();
  }, [api]);

  return <TMDBConfigurationContext value={{ ...config, error }}>{children}</TMDBConfigurationContext>;
}
