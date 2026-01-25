import { Plus } from "lucide-react";
import { ActionLink } from "./action-link";
import { pageTitleClasses, sectionSpacingClasses, secondaryTextClasses, cn } from "../lib/utils";
import { SavedEntryRow, type SavedEntryRowData } from "./saved-entry-row";

export function ListPage({
  entries,
  loading,
  error,
}: {
  entries: SavedEntryRowData[];
  loading: boolean;
  error: string | null;
}) {
  const watchedStartIndex = entries.findIndex((entry) => entry.isWatched);
  const showWatchedHeader = watchedStartIndex > 0;

  return (
    <>
      <div className={sectionSpacingClasses}>
        <h2 className={pageTitleClasses}>List of Saved Items</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-4">
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
            {entries.flatMap((entry, index) => {
              const rows = [];
              if (showWatchedHeader && index === watchedStartIndex) {
                rows.push(
                  <h4
                    key="watched-header"
                    className={cn(
                      "pt-2 text-xs font-semibold uppercase tracking-wide",
                      secondaryTextClasses
                    )}
                  >
                    Watched
                  </h4>
                );
              }
              rows.push(<SavedEntryRow key={entry.id} entry={entry} />);
              return rows;
            })}
          </div>
        )}
      </div>
      <ActionLink to="/app/list/add">
        <Plus />
      </ActionLink>
    </>
  );
}
