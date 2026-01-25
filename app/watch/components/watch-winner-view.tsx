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
    <div className="mx-auto flex h-full w-full max-w-md flex-col md:max-w-4xl md:flex-row md:items-stretch md:justify-center md:gap-6 lg:max-w-5xl lg:gap-8">
      {/* Left side button (large screens) */}
      <div className="hidden md:flex md:w-28 md:flex-col md:items-stretch md:justify-center lg:w-40">
        {winnerEntry && (
          <ActionButton
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onBackToCards}
            disabled={markingWatched}
          >
            Back to cards
          </ActionButton>
        )}
      </div>

      {/* Center content */}
      <div className="flex w-full flex-1 flex-col md:max-w-2xl">
        {winnerLoading && <p className={cn("text-sm", secondaryTextClasses)}>Loading selection…</p>}
        {winnerError && <p className="text-sm text-red-500">{winnerError}</p>}
        {!winnerLoading && !winnerError && winnerEntry && (
          <>
            <p className={cn("mb-3 text-sm", secondaryTextClasses)}>Selected to watch:</p>
            <div className="relative flex-1 min-h-[440px] md:min-h-[520px] lg:min-h-[560px]">
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

            {/* Mobile buttons */}
            <div className="mt-4 flex-shrink-0 pb-2 md:hidden">
              <div className="flex w-full gap-2">
                <ActionButton
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={onBackToCards}
                  disabled={markingWatched}
                >
                  Back to cards
                </ActionButton>
                <ActionButton
                  size="lg"
                  className="flex-1"
                  onClick={() => void onMarkWatched(winnerEntry.id)}
                  loading={markingWatched}
                  loadingText="Marking..."
                >
                  Mark as Watched
                </ActionButton>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right side button (large screens) */}
      <div className="hidden md:flex md:w-28 md:flex-col md:items-stretch md:justify-center lg:w-40">
        {winnerEntry && (
          <ActionButton
            size="lg"
            className="w-full"
            onClick={() => void onMarkWatched(winnerEntry.id)}
            loading={markingWatched}
            loadingText="Marking..."
          >
            Mark as Watched
          </ActionButton>
        )}
      </div>
    </div>
  );
}
