import { useState } from 'react';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { TMDBSearchResult } from './tmdb-search-result';
import { createClient } from '../lib/supabase/client';

export function TMDBSearchResultContainer({ result }: { result: TMDBSearchResultItem }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    <TMDBSearchResult
      result={result}
      onSave={handleSave}
      saving={saving}
      saved={saved}
      saveError={saveError}
    />
  );
}

