import { useContext, useState } from 'react';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { primaryHeadingClasses, secondaryTextClasses, cn } from '../lib/utils';
import { createClient } from '../lib/supabase/client';

export function TMDBSearchResult({ result }: { result: TMDBSearchResultItem }) {
  const config = useContext(TMDBConfigurationContext);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use larger poster size on bigger screens
  const posterSizeIndex = config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: result.id,
        p_media_type: result.media_type,
        p_title: result.name,
        p_adult: result.adult,
        p_backdrop_path: result.backdrop_path,
        p_poster_path: result.poster_path,
        p_original_language: result.original_language,
        p_overview: result.overview,
        p_popularity: result.popularity,
        p_vote_average: result.vote_average,
        p_vote_count: result.vote_count,
        p_original_name: result.original_name ?? null,
        p_release_date: result.release_date || null,
        p_origin_country: result.origin_country ?? null,
        p_genres: result.genres,
      });
      if (error) throw error;
      setSaved(true);
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
        <p className={cn("text-sm md:text-base", secondaryTextClasses)}>{result.genres.join(', ')}</p>
        {saveError && (
          <p className="mt-2 text-sm text-red-500">{saveError}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved}
        className={cn(
          "flex-shrink-0 rounded px-3 py-2 text-sm font-medium transition",
          saved
            ? "bg-emerald-600 text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label={saved ? `Saved ${result.name}` : `Save ${result.name}`}
      >
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
