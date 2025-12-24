import { createContext, useMemo, type ReactNode } from "react";

import { TMDBAPI } from "./tmdb-api";

export const TMDBAPIContext = createContext<TMDBAPI | null>(null);

export function TMDBAPIProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => {
    return new TMDBAPI(import.meta.env.VITE_TMDB_API_READ_TOKEN);
  }, []);

  return (
    <TMDBAPIContext value={api}>{children}</TMDBAPIContext>
  );
}
