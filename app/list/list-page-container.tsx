import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { ListPage } from "./list-page";
import type { SavedEntryRowData } from "./saved-entry-row";

type EntriesQueryRow = {
  id: number;
  added_at: string;
  tmdb_details:
    | {
        poster_path: string | null;
        name: string | null;
        release_date: string | null;
      }
    | Array<{
        poster_path: string | null;
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
): { poster_path: string | null; name: string | null; release_date: string | null } | null {
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

export function ListPageContainer() {
  const [entries, setEntries] = useState<SavedEntryRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
              tmdb_details (
                poster_path,
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
          .order("added_at", { ascending: false });

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
            releaseYear: getReleaseYear(details?.release_date ?? null),
            posterPath: details?.poster_path ?? null,
            tags,
          } satisfies SavedEntryRowData;
        });

        if (!cancelled) setEntries(normalized);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" &&
                  err !== null &&
                  "message" in err &&
                  typeof (err as { message?: unknown }).message === "string"
                ? String((err as { message: string }).message)
                : "Failed to load list";
          setError(message);
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ListPage entries={entries} loading={loading} error={error} />;
}

