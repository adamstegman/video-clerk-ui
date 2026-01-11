import { useContext } from 'react';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { primaryHeadingClasses, secondaryTextClasses, cn } from '../lib/utils';
import { ActionButton } from '../components/action-button';

export function TMDBSearchResult({
  result,
  onSave,
  saving = false,
  saved = false,
  saveError = null,
}: {
  result: TMDBSearchResultItem;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  saveError?: string | null;
}) {
  const config = useContext(TMDBConfigurationContext);

  // Use larger poster size on bigger screens
  const posterSizeIndex = config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  return (
    <div className="flex gap-4 md:gap-6 items-start">
      {result.poster_path && config.images.secure_base_url && (
        <img
          src={`${config.images.secure_base_url}${posterSize}${result.poster_path}`}
          alt={result.name}
          className="flex-shrink-0 w-16 h-24 object-cover rounded md:w-20 md:h-[120px]"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-bold text-base md:text-lg", primaryHeadingClasses)}>{result.name}</h3>
        <p className={cn("text-sm md:text-base", secondaryTextClasses)}>{result.release_year} - {result.media_type_display}</p>
        <p className={cn("text-sm md:text-base", secondaryTextClasses)}>{result.genres.map((genre) => genre.name).join(', ')}</p>
        {saveError && (
          <p className="mt-2 text-sm text-red-500">{saveError}</p>
        )}
      </div>
      <ActionButton
        onClick={onSave}
        disabled={!onSave}
        loading={saving}
        completed={saved}
        loadingText="Saving…"
        completedText="Saved"
        className="flex-shrink-0"
        ariaLabel={saved ? `Saved ${result.name}` : `Save ${result.name}`}
      >
        Save
      </ActionButton>
    </div>
  );
}
