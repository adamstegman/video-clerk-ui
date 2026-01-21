import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, type MotionProps } from "framer-motion";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import { ActionButton } from "../components/action-button";
import { cn, pageTitleClasses, primaryHeadingClasses, secondaryTextClasses } from "../lib/utils";

export interface WatchCardEntry {
  id: number;
  title: string;
  overview: string | null;
  releaseYear: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: string;
  tags: string[];
}

type SwipeDecision = "like" | "nope";
type DragInputType = "pointer" | "touch";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getPointerXY(e: React.PointerEvent) {
  return { x: e.clientX, y: e.clientY };
}

function getTouchXY(touch: Touch) {
  return { x: touch.clientX, y: touch.clientY };
}

function findTouchById(touches: TouchList, id: number) {
  for (let i = 0; i < touches.length; i += 1) {
    const touch = touches.item(i);
    if (touch && touch.identifier === id) return touch;
  }
  return null;
}

function WatchCard({
  entry,
  isTop,
  style,
  motionProps,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  likeOpacity,
  nopeOpacity,
}: {
  entry: WatchCardEntry;
  isTop: boolean;
  style: React.CSSProperties;
  motionProps?: Pick<MotionProps, "animate" | "transition">;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchCancel?: (e: React.TouchEvent) => void;
  likeOpacity: number;
  nopeOpacity: number;
}) {
  const config = useContext(TMDBConfigurationContext);

  const posterSize = useMemo(() => {
    const sizes = config.images.poster_sizes;
    if (!sizes.length) return null;
    const idx = sizes.length > 4 ? 3 : sizes.length - 1;
    return sizes[idx] || sizes[0] || null;
  }, [config.images.poster_sizes]);

  const backdropSize = useMemo(() => {
    const sizes = config.images.backdrop_sizes;
    if (!sizes.length) return null;
    const idx = sizes.length > 2 ? 1 : sizes.length - 1;
    return sizes[idx] || sizes[0] || null;
  }, [config.images.backdrop_sizes]);

  const imageUrl =
    config.images.secure_base_url && (entry.backdropPath || entry.posterPath)
      ? entry.backdropPath && backdropSize
        ? `${config.images.secure_base_url}${backdropSize}${entry.backdropPath}`
        : entry.posterPath && posterSize
          ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
          : null
      : null;
  const mediaLabel =
    entry.mediaType === "movie" ? "Movie" : entry.mediaType === "tv" ? "TV" : entry.mediaType;
  const tagLabel = entry.tags.length > 0 ? ` | ${entry.tags.join(", ")}` : "";

  return (
    <motion.div
      className={cn(
        "absolute inset-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg",
        "overflow-hidden select-none touch-none",
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      )}
      style={style}
      animate={motionProps?.animate}
      transition={motionProps?.transition}
      initial={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      role={isTop ? "group" : undefined}
      aria-label={isTop ? `Swipe card for ${entry.title}` : undefined}
    >
      <div className="flex h-full w-full flex-col">
        {/* Media area: backdrop/poster only (keeps text readable below) */}
        <div className="relative w-full flex-none shrink-0 basis-[62%]">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={entry.title}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/0" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-800 to-zinc-700" />
          )}

          {/* Like / Nope stamps */}
          <div
            className="absolute left-4 top-4 rounded-lg border-2 border-emerald-300 bg-emerald-500/10 px-3 py-1 text-lg font-extrabold tracking-widest text-emerald-100"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </div>
          <div
            className="absolute right-4 top-4 rounded-lg border-2 border-rose-300 bg-rose-500/10 px-3 py-1 text-lg font-extrabold tracking-widest text-rose-100"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </div>
        </div>

        {/* Text area: solid background for readability */}
        <div className="flex-1 min-h-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 pt-5 pb-6">
          <div className="flex items-baseline gap-2">
            <h3 className={cn("text-xl font-bold", primaryHeadingClasses)}>{entry.title}</h3>
            {entry.releaseYear && (
              <span className={cn("text-sm", secondaryTextClasses)}>{entry.releaseYear}</span>
            )}
          </div>
          {entry.overview && (
            <p className={cn("mt-2 line-clamp-4 text-sm", secondaryTextClasses)}>{entry.overview}</p>
          )}
          <p className={cn("mt-3 text-xs", secondaryTextClasses)}>
            {mediaLabel}
            {tagLabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function WatchHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex-shrink-0 pb-2 pt-4">
      <h2 className={pageTitleClasses}>Watch</h2>
      <p className={cn("mt-1 text-sm", secondaryTextClasses)}>{subtitle}</p>
    </div>
  );
}

function WatchLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
        <p className={secondaryTextClasses}>Loading...</p>
      </div>
    </div>
  );
}

function WatchEmptyState({ onReload }: { onReload: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className={cn("text-sm", secondaryTextClasses)}>No unwatched items to swipe on.</p>
      <ActionButton size="lg" onClick={() => void onReload()}>
        Reload
      </ActionButton>
    </div>
  );
}

function WatchWinnerView({
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
    <div className="mx-auto w-full max-w-md">
      {winnerLoading && <p className={cn("text-sm", secondaryTextClasses)}>Loading selection…</p>}
      {winnerError && <p className="text-sm text-red-500">{winnerError}</p>}
      {!winnerLoading && !winnerError && winnerEntry && (
        <>
          <p className={cn("mb-3 text-sm", secondaryTextClasses)}>Selected to watch:</p>
          <div className="relative h-[520px] md:h-[560px]">
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

          <div className="mt-4 flex gap-2">
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
        </>
      )}
    </div>
  );
}

function WatchPickerView({
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
      <div className="grid gap-3 md:grid-cols-3">
        {(likeGoal === 1 ? liked : liked.slice(0, 3)).map((entry) => (
          <button
            key={entry.id}
            className={cn(
              "rounded-xl border p-4 text-left transition",
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
      <div className="flex gap-2">
        <ActionButton
          variant="secondary"
          size="lg"
          onClick={onStartOver}
          disabled={markingWatched}
        >
          Start over
        </ActionButton>
        <ActionButton size="lg" onClick={onChooseWinner} disabled={!chosenId}>
          Choose winner
        </ActionButton>
      </div>
    </div>
  );
}

type WatchDeckHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
};

function WatchDeckView({
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
  const next = deck.slice(1, 4); // just for stacked look

  const swipeThreshold = 110;
  const likeGoal =
    initialEntries.length === 0 ? 0 : initialEntries.length < 3 ? 1 : 3;
  const isInPickMode = likeGoal > 0 && liked.length >= likeGoal;

  const isTopActive = !!top && drag.activeId === top.id;
  const activeDx = isTopActive ? drag.dx : 0;
  const activeDy = isTopActive ? drag.dy : 0;
  const likeOpacity = top ? clamp(Math.max(0, activeDx) / swipeThreshold, 0, 1) : 0;
  const nopeOpacity = top ? clamp(Math.max(0, -activeDx) / swipeThreshold, 0, 1) : 0;
  const stackTransition: MotionProps["transition"] = { duration: 0.22, ease: "easeOut" };
  const swipeOutTransition: MotionProps["transition"] = { duration: 0.22, ease: "easeOut" };
  const snapBackTransition: MotionProps["transition"] = {
    type: "spring",
    stiffness: 320,
    damping: 26,
  };
  const topTransition: MotionProps["transition"] = !isTopActive
    ? { duration: 0 }
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

            {!loading && !error && deck.length === 0 && liked.length < likeGoal && (
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
                top={top}
                next={next}
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
