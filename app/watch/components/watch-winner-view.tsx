import { ActionButton } from "../../components/action-button";
import { cn, secondaryTextClasses } from "../../lib/utils";
import { WatchCard, type WatchCardEntry } from "./watch-card";

export function WatchWinnerView({
  winnerEntry,
  winnerLoading,
  winnerError,
  markError,
  markingWatched,
  onBackToCards,
  onMarkWatched,
}: {
  winnerEntry: WatchCardEntry | null;
  winnerLoading: boolean;
  winnerError: string | null;
  markError: string | null;
  markingWatched: boolean;
  onBackToCards: () => void;
  onMarkWatched: (entryId: number) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md lg:max-w-5xl">
      {winnerLoading && <p className={cn("text-sm", secondaryTextClasses)}>Loading selection…</p>}
      {winnerError && <p className="text-sm text-red-500">{winnerError}</p>}
      {!winnerLoading && !winnerError && winnerEntry && (
        <>
          <p className={cn("mb-3 text-sm", secondaryTextClasses)}>Selected to watch:</p>
          <div className="relative h-[520px] md:h-[560px] lg:h-[600px]">
            <WatchCard
              entry={winnerEntry}
              isTop={false}
              likeOpacity={0}
              nopeOpacity={0}
              style={{ zIndex: 1 }}
              motionProps={{
                animate: { x: 0, y: 0, rotate: 0, scale: 1 },
                transition: { duration: 0 },
              }}
            />
          </div>

          {markError && <p className="mt-3 text-sm text-red-500">{markError}</p>}

          <div className="mt-4 flex flex-wrap justify-evenly gap-3">
            <ActionButton
              variant="secondary"
              size="lg"
              className="min-w-[180px] flex-1"
              onClick={onBackToCards}
              disabled={markingWatched}
            >
              Back to cards
            </ActionButton>
            <ActionButton
              size="lg"
              className="min-w-[180px] flex-1"
              onClick={() => void onMarkWatched(winnerEntry.id)}
              loading={markingWatched}
              loadingText="Marking..."
            >
              Mark as Watched
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}
