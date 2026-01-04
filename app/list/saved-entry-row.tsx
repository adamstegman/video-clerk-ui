import { useContext } from "react";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import { cn, primaryHeadingClasses, secondaryTextClasses } from "../lib/utils";

export interface SavedEntryRowData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
  tags: string[];
}

export function SavedEntryRow({ entry }: { entry: SavedEntryRowData }) {
  const config = useContext(TMDBConfigurationContext);

  // Use larger poster size on bigger screens
  const posterSizeIndex =
    config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  return (
    <div className="flex gap-4 md:gap-6 items-start">
      {entry.posterPath && config.images.secure_base_url && (
        <img
          src={`${config.images.secure_base_url}${posterSize}${entry.posterPath}`}
          alt={entry.title}
          className="flex-shrink-0 w-16 h-24 object-cover rounded md:w-20 md:h-[120px]"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-bold text-base md:text-lg", primaryHeadingClasses)}>
          {entry.title}
        </h3>
        {entry.releaseYear && (
          <p className={cn("text-sm md:text-base", secondaryTextClasses)}>{entry.releaseYear}</p>
        )}
        {entry.tags.length > 0 && (
          <p className={cn("text-sm md:text-base", secondaryTextClasses)}>
            {entry.tags.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

