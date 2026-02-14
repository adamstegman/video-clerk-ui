import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../supabase/client';
import { normalizeDetails, normalizeTagName, getReleaseYear } from '../utils/normalize';
import { ListPage } from './list-page';
import type { SavedEntryRowData } from './saved-entry-row';

export function ListPageContainer() {
  const [entries, setEntries] = useState<SavedEntryRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select(
          `
            id,
            added_at,
            watched_at,
            tmdb_details (
              poster_path,
              name,
              release_date
            ),
            entry_tags (
              tags (
                name
              )
            )
          `
        )
        .order('added_at', { ascending: false });

      if (error) throw error;

      const normalized = (data ?? []).map((row) => {
        const details = normalizeDetails(row.tmdb_details);
        const title = details?.name || 'Untitled';
        const tags =
          row.entry_tags
            ?.map((et) => normalizeTagName(et.tags))
            .filter((n): n is string => !!n) ?? [];

        return {
          id: row.id,
          title,
          releaseYear: getReleaseYear(details?.release_date ?? null),
          posterPath: details?.poster_path ?? null,
          tags,
          isWatched: Boolean(row.watched_at),
        } satisfies SavedEntryRowData;
      });

      const unwatched = normalized.filter((entry) => !entry.isWatched);
      const watched = normalized.filter((entry) => entry.isWatched);
      const sorted = [...unwatched, ...watched];

      setEntries(sorted);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' &&
              err !== null &&
              'message' in err &&
              typeof (err as { message?: unknown }).message === 'string'
            ? String((err as { message: string }).message)
            : 'Failed to load list';
      setError(message);
      setEntries([]);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reload list when screen comes into focus (e.g., after adding/editing an entry)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (entryId: number) => {
    try {
      const { data: groupId, error: groupError } = await supabase.rpc('current_user_group_id');
      if (groupError) throw groupError;
      if (!groupId) {
        throw new Error('Could not determine group.');
      }

      // Optimistically remove from UI
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
        .eq('group_id', groupId);

      if (deleteError) {
        // Revert optimistic update on error
        await load();
        throw deleteError;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete entry';
      setError(message);
    }
  };

  return (
    <ListPage
      entries={entries}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onDelete={handleDelete}
    />
  );
}
