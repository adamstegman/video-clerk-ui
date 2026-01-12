import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import { cn, pageTitleClasses, primaryHeadingClasses, secondaryTextClasses } from "../lib/utils";

export interface WatchCardEntry {
  id: number;
  title: string;
  overview: string | null;
  releaseYear: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: string;
}

type SwipeDecision = "like" | "nope";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getPointerXY(e: React.PointerEvent) {
  return { x: e.clientX, y: e.clientY };
}

function WatchCard({
  entry,
  isTop,
  style,
  onPointerDown,
  likeOpacity,
  nopeOpacity,
}: {
  entry: WatchCardEntry;
  isTop: boolean;
  style: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
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

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg",
        "overflow-hidden select-none touch-none",
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      )}
      style={style}
      onPointerDown={onPointerDown}
      role={isTop ? "group" : undefined}
      aria-label={isTop ? `Swipe card for ${entry.title}` : undefined}
    >
      <div className="flex h-full w-full flex-col">
        {/* Media area: backdrop/poster only (keeps text readable below) */}
        <div className="relative h-[62%] w-full flex-none">
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
        <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
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
            {entry.mediaType === "movie" ? "Movie" : entry.mediaType === "tv" ? "TV" : entry.mediaType}
          </p>
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
}: {
  initialEntries: WatchCardEntry[];
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
}) {
  const [deck, setDeck] = useState<WatchCardEntry[]>([]);
  const [liked, setLiked] = useState<WatchCardEntry[]>([]);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [markingWatched, setMarkingWatched] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [markSuccess, setMarkSuccess] = useState(false);

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

  useEffect(() => {
    // Reset local flow when data reloads.
    setDeck(initialEntries);
    setLiked([]);
    setChosenId(null);
    setMarkingWatched(false);
    setMarkError(null);
    setMarkSuccess(false);
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
  }, [initialEntries]);

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    };
  }, []);

  const top = deck[0] ?? null;
  const next = deck.slice(1, 4); // just for stacked look

  const swipeThreshold = 110;
  const isInPickMode = liked.length >= 3 && !markSuccess;

  const likeOpacity = top ? clamp(Math.max(0, drag.dx) / swipeThreshold, 0, 1) : 0;
  const nopeOpacity = top ? clamp(Math.max(0, -drag.dx) / swipeThreshold, 0, 1) : 0;

  function animateOut(decision: SwipeDecision) {
    if (!top) return;
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
        setLiked((prev) => (prev.length >= 3 ? prev : [...prev, top]));
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
    setMarkSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("entries")
        .update({ watched_at: new Date().toISOString() })
        .eq("id", entryId);
      if (error) throw error;

      setMarkSuccess(true);
      await onReload();
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 pb-2 pt-4">
        <h2 className={pageTitleClasses}>Watch</h2>
        <p className={cn("mt-1 text-sm", secondaryTextClasses)}>
          Swipe right to like, left to skip. Pick 1 once you have 3 likes.
        </p>
      </div>

      <div className="flex-1 min-h-0 pb-4">
        {loading && !error && deck.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
              <p className={secondaryTextClasses}>Loading...</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && deck.length === 0 && liked.length < 3 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className={cn("text-sm", secondaryTextClasses)}>No unwatched items to swipe on.</p>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              onClick={() => void onReload()}
            >
              Reload
            </button>
          </div>
        )}

        {isInPickMode ? (
          <div className="space-y-3">
            <p className={cn("text-sm", secondaryTextClasses)}>
              You liked 3. Pick one to watch:
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {liked.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400",
                    chosenId === e.id ? "ring-2 ring-indigo-500" : ""
                  )}
                  onClick={() => setChosenId(e.id)}
                >
                  <div className={cn("font-semibold", primaryHeadingClasses)}>{e.title}</div>
                  {e.releaseYear && <div className={cn("text-sm", secondaryTextClasses)}>{e.releaseYear}</div>}
                  {e.overview && (
                    <div className={cn("mt-2 text-sm line-clamp-3", secondaryTextClasses)}>{e.overview}</div>
                  )}
                </button>
              ))}
            </div>
            {markError && <p className="text-sm text-red-500">{markError}</p>}
            {markSuccess && (
              <p className={cn("text-sm text-indigo-600 dark:text-indigo-400")}>Marked watched.</p>
            )}
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => {
                  setLiked([]);
                  setChosenId(null);
                  setMarkError(null);
                  setMarkSuccess(false);
                }}
                disabled={markingWatched}
              >
                Start over
              </button>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                onClick={() => {
                  if (!chosenId) return;
                  void markWatched(chosenId);
                }}
                disabled={!chosenId || markingWatched}
              >
                {markingWatched ? "Marking..." : "Watch this"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mx-auto w-full max-w-md h-[520px] md:h-[560px]">
              {top && (
                <WatchCard
                  entry={top}
                  isTop={true}
                  likeOpacity={likeOpacity}
                  nopeOpacity={nopeOpacity}
                  style={{
                    zIndex: 50,
                    transform: `translate3d(${drag.dx}px, ${drag.dy}px, 0) rotate(${drag.dx / 14}deg)`,
                    transition: drag.isDragging ? "none" : "transform 220ms ease",
                  }}
                  onPointerDown={(e) => {
                    if (!top) return;
                    if (drag.animatingOut) return;
                    if (liked.length >= 3) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const { x, y } = getPointerXY(e);
                    setDrag((d) => ({
                      ...d,
                      activeId: top.id,
                      startX: x,
                      startY: y,
                      dx: 0,
                      dy: 0,
                      isDragging: true,
                      animatingOut: false,
                      decision: null,
                    }));
                  }}
                />
              )}

              {next.map((e, idx) => (
                <WatchCard
                  key={e.id}
                  entry={e}
                  isTop={false}
                  likeOpacity={0}
                  nopeOpacity={0}
                  style={{
                    zIndex: 40 - idx,
                    transform: `translate3d(0, ${10 + idx * 10}px, 0) scale(${1 - (idx + 1) * 0.03})`,
                    transition: "transform 220ms ease",
                  }}
                />
              ))}

              {/* Pointer move/up are easiest on a wrapper so we keep tracking even if image steals events */}
              <div
                className="absolute inset-0"
                onPointerMove={(e) => {
                  if (!top) return;
                  if (!drag.isDragging) return;
                  if (drag.activeId !== top.id) return;
                  const { x, y } = getPointerXY(e);
                  setDrag((d) => ({ ...d, dx: x - d.startX, dy: y - d.startY }));
                }}
                onPointerUp={() => {
                  if (!top) return;
                  if (!drag.isDragging) return;
                  if (drag.activeId !== top.id) return;
                  if (drag.dx > swipeThreshold) return animateOut("like");
                  if (drag.dx < -swipeThreshold) return animateOut("nope");
                  setDrag((d) => ({ ...d, isDragging: false, dx: 0, dy: 0 }));
                }}
                onPointerCancel={() => {
                  setDrag((d) => ({ ...d, isDragging: false, dx: 0, dy: 0 }));
                }}
              />
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-md items-center justify-between gap-3">
              <button
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-60"
                onClick={() => animateOut("nope")}
                disabled={!top || drag.animatingOut || liked.length >= 3}
              >
                Nope
              </button>
              <div className={cn("text-sm", secondaryTextClasses)}>
                Liked: <span className="font-semibold">{liked.length}</span>/3
              </div>
              <button
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                onClick={() => animateOut("like")}
                disabled={!top || drag.animatingOut || liked.length >= 3}
              >
                Like
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
