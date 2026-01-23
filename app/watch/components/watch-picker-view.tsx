import { ActionButton } from "../../components/action-button";
import { cn, primaryHeadingClasses, secondaryTextClasses } from "../../lib/utils";
import type { WatchCardEntry } from "./watch-card";

export function WatchPickerView({
  liked,
  likeGoal,
  chosenId,
  markingWatched,
  onChooseId,
  onStartOver,
  onChooseWinner,
}: {
  liked: WatchCardEntry[];
  likeGoal: number;
  chosenId: number | null;
  markingWatched: boolean;
  onChooseId: (id: number) => void;
  onStartOver: () => void;
  onChooseWinner: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className={cn("text-sm", secondaryTextClasses)}>
        You liked {liked.length}. Pick one to watch:
      </p>
      <div className="flex flex-col gap-3 px-1">
        {(likeGoal === 1 ? liked : liked.slice(0, 3)).map((entry) => (
          <button
            key={entry.id}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition",
              "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400",
              chosenId === entry.id ? "ring-2 ring-indigo-500" : ""
            )}
            onClick={() => onChooseId(entry.id)}
          >
            <div className={cn("font-semibold", primaryHeadingClasses)}>{entry.title}</div>
            {entry.releaseYear && (
              <div className={cn("text-sm", secondaryTextClasses)}>{entry.releaseYear}</div>
            )}
            {entry.overview && (
              <div className={cn("mt-2 text-sm line-clamp-3", secondaryTextClasses)}>
                {entry.overview}
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-around gap-3">
        <ActionButton
          variant="secondary"
          size="lg"
          className="min-w-[180px]"
          onClick={onStartOver}
          disabled={markingWatched}
        >
          Start over
        </ActionButton>
        <ActionButton
          size="lg"
          className="min-w-[180px]"
          onClick={onChooseWinner}
          disabled={!chosenId}
        >
          Choose winner
        </ActionButton>
      </div>
    </div>
  );
}
