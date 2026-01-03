import { useContext, useState } from 'react';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { TMDBSearchResult } from './tmdb-search-result';
import { createClient } from '../lib/supabase/client';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';

export function TMDBSearchResultContainer({ result }: { result: TMDBSearchResultItem }) {
  const api = useContext(TMDBAPIContext);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRuntimeMinutes = async () => {
    // Runtime is required for saving, but don't block on a missing API context.
    if (!api) return null;
    if (result.media_type === 'movie') {
      const details = await api.fetchMovieDetails(result.id);
      return typeof details.runtime === 'number' ? details.runtime : null;
    }
    if (result.media_type === 'tv') {
      const details = await api.fetchTVDetails(result.id);
      const times = Array.isArray(details.episode_run_time) ? details.episode_run_time : [];
      const valid = times.filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0);
      if (valid.length === 0) return null;
      return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    }
    return null;
  };

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const runtimeMinutes = await fetchRuntimeMinutes();
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
        p_runtime_minutes: runtimeMinutes,
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
    <TMDBSearchResult
      result={result}
      onSave={handleSave}
      saving={saving}
      saved={saved}
      saveError={saveError}
    />
  );
}

