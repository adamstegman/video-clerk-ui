import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { createClient } from "../lib/supabase/client";
import { WatchPage } from "./watch-page";
import type { WatchCardEntry } from "./components/watch-card";

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
  entry_tags:
    | Array<{
        tags:
          | {
              name: string | null;
            }
          | Array<{
              name: string | null;
            }>
          | null;
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

function normalizeTagName(
  tags:
    | {
        name: string | null;
      }
    | Array<{
        name: string | null;
      }>
    | null
) {
  if (!tags) return null;
  return Array.isArray(tags) ? tags[0]?.name ?? null : tags.name ?? null;
}

export function WatchPageContainer() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const winnerEntryId = useMemo(() => {
    const raw = params.entryId;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }, [params.entryId]);

  const [entries, setEntries] = useState<WatchCardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locationWinnerEntry =
    (location.state as { winnerEntry?: WatchCardEntry } | null)?.winnerEntry ?? null;
  const [winnerEntry, setWinnerEntry] = useState<WatchCardEntry | null>(locationWinnerEntry);
  const [winnerLoading, setWinnerLoading] = useState(false);
  const [winnerError, setWinnerError] = useState<string | null>(null);

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
            ),
            entry_tags (
              tags (
                name
              )
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
        const tags =
          row.entry_tags
            ?.map((et) => normalizeTagName(et.tags))
            .filter((n): n is string => !!n) ?? [];
        return {
          id: row.id,
          title,
          overview: details?.overview ?? null,
          releaseYear: getReleaseYear(details?.release_date ?? null),
          posterPath: details?.poster_path ?? null,
          backdropPath: details?.backdrop_path ?? null,
          mediaType: row.media_type,
          tags,
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
    const run = async () => {
      await load();
    };
    run();
    return () => {
      // no-op
    };
  }, [load]);

  const loadWinner = useCallback(
    async (id: number) => {
      setWinnerLoading(true);
      setWinnerError(null);
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
              ),
              entry_tags (
                tags (
                  name
                )
              )
            `
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setWinnerEntry(null);
          setWinnerError("Could not find that entry.");
          return;
        }

        const row = data as unknown as EntriesQueryRow;
        const details = normalizeDetails(row.tmdb_details);
        const title = details?.name || "Untitled";
        const tags =
          row.entry_tags
            ?.map((et) => normalizeTagName(et.tags))
            .filter((n): n is string => !!n) ?? [];
        setWinnerEntry({
          id: row.id,
          title,
          overview: details?.overview ?? null,
          releaseYear: getReleaseYear(details?.release_date ?? null),
          posterPath: details?.poster_path ?? null,
          backdropPath: details?.backdrop_path ?? null,
          mediaType: row.media_type,
          tags,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" &&
                err !== null &&
                "message" in err &&
                typeof (err as { message?: unknown }).message === "string"
              ? String((err as { message: string }).message)
              : "Failed to load selected entry";
        setWinnerEntry(null);
        setWinnerError(message);
      } finally {
        setWinnerLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!winnerEntryId) {
      setWinnerEntry(null);
      setWinnerError(null);
      setWinnerLoading(false);
      return;
    }

    if (locationWinnerEntry?.id === winnerEntryId) {
      if (winnerEntry?.id !== winnerEntryId) {
        setWinnerEntry(locationWinnerEntry);
      }
      setWinnerError(null);
      setWinnerLoading(false);
      return;
    }

    // If we already have it (e.g. from immediate navigation), don't refetch.
    if (winnerEntry?.id === winnerEntryId) return;
    void loadWinner(winnerEntryId);
  }, [loadWinner, locationWinnerEntry, winnerEntry?.id, winnerEntryId]);

  const goToWinner = useCallback(
    (entry: WatchCardEntry) => {
      setWinnerEntry(entry);
      navigate(`/app/watch/${entry.id}`, { state: { winnerEntry: entry } });
    },
    [navigate]
  );

  const markWatched = useCallback(
    async (entryId: number) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("entries")
        .update({ watched_at: new Date().toISOString() })
        .eq("id", entryId);
      if (error) throw error;

      navigate("/app/watch");
      await load();
    },
    [load, navigate]
  );

  return (
    <WatchPage
      initialEntries={entries}
      loading={loading}
      error={error}
      onReload={load}
      winnerEntryId={winnerEntryId}
      winnerEntry={winnerEntry}
      winnerLoading={winnerLoading}
      winnerError={winnerError}
      onGoToWinner={goToWinner}
      onMarkWatched={markWatched}
      onBackToCards={() => navigate("/app/watch")}
    />
  );
}

