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
  cards,
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
  cards: WatchCardEntry[];
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
  const top = cards[0] ?? null;
  const isDisabled = !top || isAnimatingOut || likedCount >= likeGoal;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <div className="relative flex-1 min-h-[440px] md:min-h-[520px]">
        {cards.map((entry, idx) => (
          <WatchCard
            key={entry.id}
            entry={entry}
            isTop={idx === 0}
            likeOpacity={idx === 0 ? likeOpacity : 0}
            nopeOpacity={idx === 0 ? nopeOpacity : 0}
            style={{ zIndex: 50 - idx }}
            motionProps={
              idx === 0
                ? topMotionProps
                : {
                    animate: {
                      x: 0,
                      y: 10 + idx * 10,
                      scale: 1 - (idx + 1) * 0.03,
                      rotate: 0,
                    },
                    transition: stackTransition,
                  }
            }
            onPointerDown={idx === 0 ? handlers.onPointerDown : undefined}
            onPointerMove={idx === 0 ? handlers.onPointerMove : undefined}
            onPointerUp={idx === 0 ? handlers.onPointerUp : undefined}
            onPointerCancel={idx === 0 ? handlers.onPointerCancel : undefined}
            onTouchStart={idx === 0 ? handlers.onTouchStart : undefined}
            onTouchMove={idx === 0 ? handlers.onTouchMove : undefined}
            onTouchEnd={idx === 0 ? handlers.onTouchEnd : undefined}
            onTouchCancel={idx === 0 ? handlers.onTouchCancel : undefined}
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
