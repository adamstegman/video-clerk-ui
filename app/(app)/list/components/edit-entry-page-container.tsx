import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../../../lib/supabase/client';
import { normalizeDetails, getReleaseYear, normalizeTagKey } from '../../../../lib/utils/normalize';
import { EditEntryPage, type EditEntryData, type EditEntryTag } from './edit-entry-page';

function normalizeInputTagName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function EditEntryPageContainer() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const entryId = params.entryId ? Number(params.entryId) : null;

  const [entry, setEntry] = useState<EditEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<EditEntryTag[]>([]);
  const [availableTags, setAvailableTags] = useState<EditEntryTag[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [watched, setWatched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!entryId) {
      setEntry(null);
      setError('Invalid entry.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [entryResponse, tagsResponse] = await Promise.all([
        supabase
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
                  id,
                  name,
                  is_custom
                )
              )
            `
          )
          .eq('id', entryId)
          .maybeSingle(),
        supabase.from('tags').select('id,name,is_custom').order('name'),
      ]);

      if (entryResponse.error) throw entryResponse.error;
      if (!entryResponse.data) {
        setEntry(null);
        setError('Entry not found.');
        return;
      }

      if (tagsResponse.error) {
        console.error('Failed to load tags', tagsResponse.error);
        setAvailableTags([]);
      } else {
        const normalizedTags =
          tagsResponse.data
            ?.filter((row) => row.name && typeof row.id === 'number')
            .map((row) => ({
              id: row.id,
              name: row.name as string,
              is_custom: Boolean(row.is_custom),
            })) ?? [];
        setAvailableTags(normalizedTags);
      }

      const row = entryResponse.data;
      const details = normalizeDetails(row.tmdb_details);
      const tags =
        row.entry_tags
          ?.map((et) => normalizeDetails(et.tags))
          .filter(
            (tag): tag is { id: number; name: string; is_custom: boolean } =>
              !!tag && typeof tag.id === 'number' && !!tag.name
          )
          .map((tag) => ({
            id: tag.id,
            name: tag.name,
            is_custom: Boolean(tag.is_custom),
          })) ?? [];

      setEntry({
        id: row.id,
        title: details?.name || 'Untitled',
        releaseYear: getReleaseYear(details?.release_date ?? null),
        posterPath: details?.poster_path ?? null,
      });
      setSelectedTags(tags);
      setWatched(Boolean(row.watched_at));
    } catch (err) {
      setEntry(null);
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleTag = useCallback((tag: EditEntryTag) => {
    setSelectedTags((prev) => {
      const exists = prev.some((selected) => selected.id === tag.id);
      if (exists) {
        return prev.filter((selected) => selected.id !== tag.id);
      }
      return [...prev, tag];
    });
    setTagQuery('');
  }, []);

  const ensureTagExists = useCallback(
    async (rawName: string): Promise<EditEntryTag | null> => {
      const normalizedName = normalizeInputTagName(rawName);
      if (!normalizedName) return null;
      const key = normalizeTagKey(normalizedName);
      const existing = availableTags.find((tag) => normalizeTagKey(tag.name) === key);
      if (existing) return existing;

      const { data: groupId, error: groupError } = await supabase.rpc('current_user_group_id');
      if (groupError) throw groupError;
      if (!groupId) {
        throw new Error('Could not determine group.');
      }

      const { data: created, error: createError } = await supabase
        .from('tags')
        .insert({
          name: normalizedName,
          tmdb_id: null,
          group_id: groupId,
          is_custom: true,
        })
        .select('id,name,is_custom')
        .maybeSingle();

      if (createError) {
        // Tag might already exist, try to fetch it
        const { data, error } = await supabase
          .from('tags')
          .select('id,name,is_custom')
          .ilike('name', normalizedName);
        if (!error && data && data.length > 0) {
          const tag = data[0];
          const newTag: EditEntryTag = {
            id: tag.id,
            name: tag.name as string,
            is_custom: Boolean(tag.is_custom),
          };
          setAvailableTags((prev) => {
            const exists = prev.some((t) => normalizeTagKey(t.name) === key);
            if (exists) return prev;
            return [...prev, newTag];
          });
          return newTag;
        }
        throw createError;
      }

      if (!created || !created.name || typeof created.id !== 'number') {
        return null;
      }

      const newTag: EditEntryTag = {
        id: created.id,
        name: created.name,
        is_custom: Boolean(created.is_custom),
      };
      setAvailableTags((prev) => {
        const exists = prev.some((tag) => normalizeTagKey(tag.name) === key);
        if (exists) return prev;
        return [...prev, newTag];
      });
      return newTag;
    },
    [availableTags]
  );

  const handleCreateTag = useCallback(
    async (value: string) => {
      const normalizedName = normalizeInputTagName(value);
      if (!normalizedName) return;
      try {
        const tag = await ensureTagExists(normalizedName);
        if (tag) {
          setSelectedTags((prev) => {
            const exists = prev.some(
              (selected) => normalizeTagKey(selected.name) === normalizeTagKey(tag.name)
            );
            if (exists) return prev;
            return [...prev, tag];
          });
          setTagQuery('');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create tag');
      }
    },
    [ensureTagExists]
  );

  const handleSave = useCallback(async () => {
    if (!entryId || !entry) return;
    setSaving(true);

    try {
      let finalTags = selectedTags;
      if (tagQuery.trim().length > 0) {
        const created = await ensureTagExists(tagQuery);
        if (created) {
          const exists = finalTags.some(
            (tag) => normalizeTagKey(tag.name) === normalizeTagKey(created.name)
          );
          if (!exists) {
            finalTags = [...finalTags, created];
          }
          setSelectedTags(finalTags);
        }
        setTagQuery('');
      }

      const { data: groupId, error: groupError } = await supabase.rpc('current_user_group_id');
      if (groupError) throw groupError;
      if (!groupId) {
        throw new Error('Could not determine group.');
      }

      const nextWatchedAt = watched ? new Date().toISOString() : null;
      const { error: watchedError } = await supabase
        .from('entries')
        .update({ watched_at: nextWatchedAt })
        .eq('id', entryId)
        .eq('group_id', groupId);

      if (watchedError) throw watchedError;

      const { error: clearError } = await supabase.from('entry_tags').delete().eq('entry_id', entryId);
      if (clearError) throw clearError;

      if (finalTags.length > 0) {
        const { error: insertError } = await supabase.from('entry_tags').insert(
          finalTags.map((tag) => ({
            entry_id: entryId,
            tag_id: tag.id,
          }))
        );
        if (insertError) throw insertError;
      }

      // Navigate immediately after successful save
      router.replace('/(app)/list');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [entry, entryId, ensureTagExists, router, selectedTags, tagQuery, watched]);

  const handleDelete = useCallback(async () => {
    if (!entryId || deleting) return;

    const confirmMessage = entry?.title
      ? `Delete "${entry.title}" from your list?`
      : 'Delete this entry from your list?';

    // Use window.confirm on web, Alert on native
    const performDelete = async () => {
      setDeleting(true);
      try {
        const { data: groupId, error: groupError } = await supabase.rpc(
          'current_user_group_id'
        );
        if (groupError) throw groupError;
        if (!groupId) {
          throw new Error('Could not determine group.');
        }

        const { error: deleteError } = await supabase
          .from('entries')
          .delete()
          .eq('id', entryId)
          .eq('group_id', groupId);

        if (deleteError) throw deleteError;

        router.replace('/(app)/list');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry';
        if (Platform.OS === 'web') {
          alert('Error: ' + errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(confirmMessage)) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Delete Entry',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  }, [entryId, entry, deleting, router]);

  const filteredAvailableTags = tagQuery.trim()
    ? availableTags.filter((tag) => tag.name.toLowerCase().includes(tagQuery.toLowerCase()))
    : availableTags;

  return (
    <EditEntryPage
      entry={entry}
      loading={loading}
      error={error}
      selectedTags={selectedTags}
      availableTags={filteredAvailableTags}
      tagQuery={tagQuery}
      watched={watched}
      saving={saving}
      deleting={deleting}
      onToggleTag={handleToggleTag}
      onTagQueryChange={setTagQuery}
      onCreateTag={handleCreateTag}
      onWatchedChange={setWatched}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
