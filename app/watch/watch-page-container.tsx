import { useCallback, useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { WatchPage, type WatchCardEntry } from "./watch-page";

type EntriesQueryRow = {
  id: number;
  added_at: string;
  media_type: string;
  watched_at: string | null;
  tmdb_details:
    | {
        poster_path: string | null;
        backdrop_path: string | null;
        overview: string | null;
        name: string | null;
        release_date: string | null;
      }
    | Array<{
        poster_path: string | null;
        backdrop_path: string | null;
        overview: string | null;
        name: string | null;
        release_date: string | null;
      }>
    | null;
};

function getReleaseYear(releaseDate: string | null | undefined) {
  if (!releaseDate) return "";
  const year = releaseDate.split("-")[0];
  return year || "";
}

function normalizeDetails(
  details: EntriesQueryRow["tmdb_details"]
): {
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  name: string | null;
  release_date: string | null;
} | null {
  if (!details) return null;
  return Array.isArray(details) ? details[0] ?? null : details;
}

export function WatchPageContainer() {
  const [entries, setEntries] = useState<WatchCardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
            id,
            added_at,
            media_type,
            watched_at,
            tmdb_details (
              poster_path,
              backdrop_path,
              overview,
              name,
              release_date
            )
          `
        )
        .is("watched_at", null)
        .order("added_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const normalized = ((data ?? []) as unknown as EntriesQueryRow[]).map((row) => {
        const details = normalizeDetails(row.tmdb_details);
        const title = details?.name || "Untitled";
        return {
          id: row.id,
          title,
          overview: details?.overview ?? null,
          releaseYear: getReleaseYear(details?.release_date ?? null),
          posterPath: details?.poster_path ?? null,
          backdropPath: details?.backdrop_path ?? null,
          mediaType: row.media_type,
        } satisfies WatchCardEntry;
      });

      setEntries(normalized);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
            ? String((err as { message: string }).message)
            : "Failed to load watch deck";
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await load();
    };
    run();
    return () => {
      cancelled = true;
      void cancelled;
    };
  }, [load]);

  return <WatchPage initialEntries={entries} loading={loading} error={error} onReload={load} />;
}

