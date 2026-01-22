import type { MotionProps } from "motion/react";
import { ActionButton } from "../../components/action-button";
import { cn, secondaryTextClasses } from "../../lib/utils";
import { WatchCard, type WatchCardEntry } from "./watch-card";

export type WatchDeckHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
};

export function WatchDeckView({
  top,
  next,
  likeOpacity,
  nopeOpacity,
  topMotionProps,
  stackTransition,
  handlers,
  onNope,
  onLike,
  isAnimatingOut,
  likedCount,
  likeGoal,
}: {
  top: WatchCardEntry | null;
  next: WatchCardEntry[];
  likeOpacity: number;
  nopeOpacity: number;
  topMotionProps: Pick<MotionProps, "animate" | "transition">;
  stackTransition: MotionProps["transition"];
  handlers: WatchDeckHandlers;
  onNope: () => void;
  onLike: () => void;
  isAnimatingOut: boolean;
  likedCount: number;
  likeGoal: number;
}) {
  const isDisabled = !top || isAnimatingOut || likedCount >= likeGoal;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <div className="relative flex-1 min-h-[440px] md:min-h-[520px]">
        {top && (
          <WatchCard
            entry={top}
            isTop={true}
            likeOpacity={likeOpacity}
            nopeOpacity={nopeOpacity}
            style={{ zIndex: 50 }}
            motionProps={topMotionProps}
            onPointerDown={handlers.onPointerDown}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerCancel}
            onTouchStart={handlers.onTouchStart}
            onTouchMove={handlers.onTouchMove}
            onTouchEnd={handlers.onTouchEnd}
            onTouchCancel={handlers.onTouchCancel}
          />
        )}

        {next.map((entry, idx) => (
          <WatchCard
            key={entry.id}
            entry={entry}
            isTop={false}
            likeOpacity={0}
            nopeOpacity={0}
            style={{ zIndex: 40 - idx }}
            motionProps={{
              animate: {
                x: 0,
                y: 10 + idx * 10,
                scale: 1 - (idx + 1) * 0.03,
                rotate: 0,
              },
              transition: stackTransition,
            }}
          />
        ))}
      </div>

      <div className="mt-4 flex-shrink-0 pb-2">
        <div className="flex w-full items-center justify-between gap-3">
          <ActionButton
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onNope}
            disabled={isDisabled}
          >
            Nope
          </ActionButton>
          <div className={cn("text-sm", secondaryTextClasses)}>
            Liked: <span className="font-semibold">{likedCount}</span>/{likeGoal || 3}
          </div>
          <ActionButton size="lg" className="flex-1" onClick={onLike} disabled={isDisabled}>
            Like
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
