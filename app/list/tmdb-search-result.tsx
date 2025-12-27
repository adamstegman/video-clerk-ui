import { useContext } from 'react';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResultItem } from './tmdb-search-container';

export function TMDBSearchResult({ result }: { result: TMDBSearchResultItem }) {
  const config = useContext(TMDBConfigurationContext);

  // Use larger poster size on bigger screens
  const posterSizeIndex = config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  return (
    <div className="flex gap-4 md:gap-6">
      {result.poster_path && config.images.secure_base_url && (
        <img
          src={`${config.images.secure_base_url}${posterSize}${result.poster_path}`}
          alt={result.name}
          className="flex-shrink-0 w-16 h-24 object-cover rounded md:w-20 md:h-[120px] lg:w-24 lg:h-36"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base md:text-lg lg:text-xl text-zinc-900 dark:text-zinc-100">{result.name}</h3>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">{result.release_year} - {result.media_type}</p>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">{result.genres.join(', ')}</p>
      </div>
    </div>
  );
}

