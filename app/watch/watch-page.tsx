import { useEffect, useRef, useState } from "react";
import type { MotionProps } from "motion/react";
import type { WatchCardEntry } from "./components/watch-card";
import { WatchDeckView, type WatchDeckHandlers } from "./components/watch-deck-view";
import { WatchEmptyState } from "./components/watch-empty-state";
import { WatchHeader } from "./components/watch-header";
import { WatchLoadingState } from "./components/watch-loading-state";
import { WatchPickerView } from "./components/watch-picker-view";
import { WatchWinnerView } from "./components/watch-winner-view";

type SwipeDecision = "like" | "nope";
type DragInputType = "pointer" | "touch";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getPointerXY(e: React.PointerEvent) {
  return { x: e.clientX, y: e.clientY };
}

function getTouchXY(touch: React.Touch) {
  return { x: touch.clientX, y: touch.clientY };
}

function findTouchById(touches: React.TouchList, id: number) {
  for (let i = 0; i < touches.length; i += 1) {
    const touch = touches.item(i);
    if (touch && touch.identifier === id) return touch;
  }
  return null;
}

export function WatchPage({
  initialEntries,
  loading,
  error,
  onReload,
  winnerEntryId,
  winnerEntry,
  winnerLoading,
  winnerError,
  onGoToWinner,
  onMarkWatched,
  onBackToCards,
}: {
  initialEntries: WatchCardEntry[];
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
  winnerEntryId: number | null;
  winnerEntry: WatchCardEntry | null;
  winnerLoading: boolean;
  winnerError: string | null;
  onGoToWinner: (entry: WatchCardEntry) => void;
  onMarkWatched: (entryId: number) => Promise<void>;
  onBackToCards: () => void;
}) {
  const [deck, setDeck] = useState<WatchCardEntry[]>([]);
  const [liked, setLiked] = useState<WatchCardEntry[]>([]);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [markingWatched, setMarkingWatched] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  const [drag, setDrag] = useState<{
    activeId: number | null;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    isDragging: boolean;
    animatingOut: boolean;
    decision: SwipeDecision | null;
  }>({
    activeId: null,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
    isDragging: false,
    animatingOut: false,
    decision: null,
  });

  const swipeTimeoutRef = useRef<number | null>(null);
  const activePointerRef = useRef<{ id: number | null; type: DragInputType | null }>({
    id: null,
    type: null,
  });

  const resetLocalFlow = () => {
    setDeck(initialEntries);
    setLiked([]);
    setChosenId(null);
    setMarkError(null);
    setMarkingWatched(false);
    activePointerRef.current = { id: null, type: null };
    setDrag({
      activeId: null,
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0,
      isDragging: false,
      animatingOut: false,
      decision: null,
    });
  };

  useEffect(() => {
    // Reset local flow when data reloads.
    resetLocalFlow();
  }, [initialEntries]);

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    };
  }, []);

  const top = deck[0] ?? null;
  const visibleCards = deck.slice(0, 4); // just for stacked look

  const swipeThreshold = 110;
  const likeGoal =
    initialEntries.length === 0 ? 0 : initialEntries.length < 3 ? 1 : 3;
  const isDeckExhausted = deck.length === 0;
  const canPickWithRemainingLikes =
    isDeckExhausted && liked.length > 0 && liked.length < 3;
  const isInPickMode = likeGoal > 0 && (liked.length >= likeGoal || canPickWithRemainingLikes);

  const isTopActive = !!top && drag.activeId === top.id;
  const activeDx = isTopActive ? drag.dx : 0;
  const activeDy = isTopActive ? drag.dy : 0;
  const likeOpacity = top ? clamp(Math.max(0, activeDx) / swipeThreshold, 0, 1) : 0;
  const nopeOpacity = top ? clamp(Math.max(0, -activeDx) / swipeThreshold, 0, 1) : 0;
  const stackTransition: MotionProps["transition"] = { duration: 0.32, ease: "easeInOut" };
  const swipeOutTransition: MotionProps["transition"] = { duration: 0.26, ease: "easeInOut" };
  const snapBackTransition: MotionProps["transition"] = {
    type: "spring",
    stiffness: 220,
    damping: 30,
  };
  const topTransition: MotionProps["transition"] = !isTopActive
    ? stackTransition
    : drag.isDragging
      ? { duration: 0 }
      : drag.animatingOut
        ? swipeOutTransition
        : snapBackTransition;

  const startDrag = (
    point: { x: number; y: number },
    pointerId: number,
    type: DragInputType
  ): boolean => {
    if (
      !top ||
      drag.animatingOut ||
      liked.length >= likeGoal ||
      drag.isDragging ||
      activePointerRef.current.id !== null
    ) {
      return false;
    }
    activePointerRef.current = { id: pointerId, type };
    setDrag((d) => ({
      ...d,
      activeId: top.id,
      startX: point.x,
      startY: point.y,
      dx: 0,
      dy: 0,
      isDragging: true,
      animatingOut: false,
      decision: null,
    }));
    return true;
  };

  const updateDrag = (point: { x: number; y: number }, pointerId: number, type: DragInputType) => {
    if (!top) return;
    if (!drag.isDragging) return;
    if (drag.activeId !== top.id) return;
    const active = activePointerRef.current;
    if (active.id !== pointerId || active.type !== type) return;
    setDrag((d) => ({ ...d, dx: point.x - d.startX, dy: point.y - d.startY }));
  };

  const endDrag = (point: { x: number; y: number }, pointerId: number, type: DragInputType) => {
    const active = activePointerRef.current;
    if (active.id !== pointerId || active.type !== type) return;
    activePointerRef.current = { id: null, type: null };
    if (!top) return;
    if (!drag.isDragging) return;
    if (drag.activeId !== top.id) return;
    const dx = point.x - drag.startX;
    if (dx > swipeThreshold) return animateOut("like");
    if (dx < -swipeThreshold) return animateOut("nope");
    setDrag((d) => ({ ...d, isDragging: false, dx: 0, dy: 0 }));
  };

  const cancelDrag = (type: DragInputType) => {
    if (activePointerRef.current.type !== type) return;
    activePointerRef.current = { id: null, type: null };
    setDrag((d) => ({ ...d, isDragging: false, dx: 0, dy: 0 }));
  };

  function animateOut(decision: SwipeDecision) {
    if (!top) return;
    activePointerRef.current = { id: null, type: null };
    const outX = decision === "like" ? 420 : -420;
    setDrag((d) => ({
      ...d,
      animatingOut: true,
      decision,
      dx: outX,
      dy: d.dy,
      isDragging: false,
      activeId: top.id,
    }));

    if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    swipeTimeoutRef.current = window.setTimeout(() => {
      setDeck((prev) => prev.slice(1));
      if (decision === "like") {
        setLiked((prev) => (prev.length >= likeGoal ? prev : [...prev, top]));
      }
      setDrag({
        activeId: null,
        startX: 0,
        startY: 0,
        dx: 0,
        dy: 0,
        isDragging: false,
        animatingOut: false,
        decision: null,
      });
    }, 220);
  }

  async function markWatched(entryId: number) {
    setMarkingWatched(true);
    setMarkError(null);
    try {
      await onMarkWatched(entryId);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
            ? String((err as { message: string }).message)
            : "Failed to mark watched";
      setMarkError(message);
    } finally {
      setMarkingWatched(false);
    }
  }

  const isWinnerMode = winnerEntryId !== null;
  const topMotionProps: Pick<MotionProps, "animate" | "transition"> = {
    animate: { x: activeDx, y: activeDy, rotate: activeDx / 14, scale: 1 },
    transition: topTransition,
  };
  const deckHandlers: WatchDeckHandlers = {
    onPointerDown: (e) => {
      const started = startDrag(getPointerXY(e), e.pointerId, "pointer");
      if (!started) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore unsupported pointer capture.
      }
    },
    onPointerMove: (e) => {
      updateDrag(getPointerXY(e), e.pointerId, "pointer");
    },
    onPointerUp: (e) => {
      endDrag(getPointerXY(e), e.pointerId, "pointer");
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore unsupported pointer capture.
      }
    },
    onPointerCancel: (e) => {
      cancelDrag("pointer");
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore unsupported pointer capture.
      }
    },
    onTouchStart: (e) => {
      if (activePointerRef.current.id !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      startDrag(getTouchXY(touch), touch.identifier, "touch");
    },
    onTouchMove: (e) => {
      const active = activePointerRef.current;
      if (active.type !== "touch" || active.id === null) return;
      const touch =
        findTouchById(e.touches, active.id) ?? findTouchById(e.changedTouches, active.id);
      if (!touch) return;
      if (drag.isDragging && e.cancelable) {
        e.preventDefault();
      }
      updateDrag(getTouchXY(touch), active.id, "touch");
    },
    onTouchEnd: (e) => {
      const active = activePointerRef.current;
      if (active.type !== "touch" || active.id === null) return;
      const touch = findTouchById(e.changedTouches, active.id);
      if (!touch) {
        cancelDrag("touch");
        return;
      }
      endDrag(getTouchXY(touch), active.id, "touch");
    },
    onTouchCancel: () => {
      cancelDrag("touch");
    },
  };
  const handleChooseWinner = () => {
    if (!chosenId) return;
    const entry = liked.find((e) => e.id === chosenId);
    if (!entry) return;
    setMarkError(null);
    onGoToWinner(entry);
  };

  return (
    <div className="flex h-full flex-col">
      <WatchHeader subtitle="Swipe right to like, left to skip. Pick 1 once you have enough likes." />

      <div className="flex-1 min-h-0 pb-4 overflow-y-auto">
        {isWinnerMode ? (
          <WatchWinnerView
            winnerEntry={winnerEntry}
            winnerLoading={winnerLoading}
            winnerError={winnerError}
            markError={markError}
            markingWatched={markingWatched}
            onBackToCards={onBackToCards}
            onMarkWatched={(entryId) => void markWatched(entryId)}
          />
        ) : (
          <>
            {loading && !error && deck.length === 0 && <WatchLoadingState />}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {!loading && !error && isDeckExhausted && liked.length === 0 && (
              <WatchEmptyState onReload={onReload} />
            )}

            {isInPickMode ? (
              <WatchPickerView
                liked={liked}
                likeGoal={likeGoal}
                chosenId={chosenId}
                markingWatched={markingWatched}
                onChooseId={setChosenId}
                onStartOver={resetLocalFlow}
                onChooseWinner={handleChooseWinner}
              />
            ) : (
              <WatchDeckView
                cards={visibleCards}
                likeOpacity={likeOpacity}
                nopeOpacity={nopeOpacity}
                topMotionProps={topMotionProps}
                stackTransition={stackTransition}
                handlers={deckHandlers}
                onNope={() => animateOut("nope")}
                onLike={() => animateOut("like")}
                isAnimatingOut={drag.animatingOut}
                likedCount={liked.length}
                likeGoal={likeGoal}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
