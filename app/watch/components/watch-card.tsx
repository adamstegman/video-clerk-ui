import { useContext, useMemo } from "react";
import { motion, type MotionProps } from "framer-motion";
import { TMDBConfigurationContext } from "../../tmdb-api/tmdb-configuration";
import { cn, primaryHeadingClasses, secondaryTextClasses } from "../../lib/utils";

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

export function WatchCard({
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
