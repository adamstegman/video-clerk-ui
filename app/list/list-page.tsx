import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionLink } from "./action-link";
import { createClient } from "../lib/supabase/client";
import { pageTitleClasses, sectionSpacingClasses, secondaryTextClasses, cn } from "../lib/utils";
import { SavedEntryRow, type SavedEntryRowData } from "./saved-entry-row";

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

export function ListPage() {
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

        const normalized = ((data ?? []) as EntriesQueryRow[]).map((row) => {
          const details = normalizeDetails(row.tmdb_details);
          const title = details?.name || "Untitled";
          const tags =
            row.entry_tags?.map((et) => et.tags?.name).filter((n): n is string => !!n) ?? [];

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
          setError(err instanceof Error ? err.message : "Failed to load list");
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

  return (
    <>
      <div className={sectionSpacingClasses}>
        <h2 className={pageTitleClasses}>List of saved items</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {loading && !error && entries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
              <p className={secondaryTextClasses}>Loading...</p>
            </div>
          </div>
        )}
        {error && <p className={cn("text-sm text-red-500", sectionSpacingClasses)}>{error}</p>}
        {!loading && !error && entries.length === 0 && (
          <p className={cn("text-sm", secondaryTextClasses)}>Your list is empty.</p>
        )}
        {!error && entries.length > 0 && (
          <div className="space-y-4 md:space-y-6">
            {entries.map((entry) => (
              <SavedEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
      <ActionLink to="/app/list/add">
        <Plus />
      </ActionLink>
    </>
  );
}
