import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase/client';
import { normalizeDetails, normalizeTagName, getReleaseYear } from '../../../../lib/utils/normalize';
import { WatchPage } from './watch-page';
import type { WatchCardEntry } from './watch-card';
import type { QuestionnaireFilters } from './watch-questionnaire';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function filterEntries(
  entries: WatchCardEntry[],
  filters: QuestionnaireFilters
): WatchCardEntry[] {
  if (filters.timeTypes.length === 0 && filters.selectedTags.length === 0) {
    return entries;
  }

  return entries.filter((entry) => {
    // Time filter
    const matchesTime =
      filters.timeTypes.length === 0 ||
      filters.timeTypes.some((timeType) => {
        if (timeType === 'movie') {
          return entry.mediaType === 'movie';
        } else if (timeType === 'short-show') {
          return entry.mediaType === 'tv' && (entry.runtime ?? 0) < 30;
        } else if (timeType === 'long-show') {
          return entry.mediaType === 'tv' && (entry.runtime ?? 0) >= 30;
        }
        return false;
      });

    // Tag filter (OR logic - match any selected tag)
    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.some((tag) => entry.tags?.includes(tag));

    return matchesTime && matchesTags;
  });
}

export function WatchPageContainer() {
  const [allEntries, setAllEntries] = useState<WatchCardEntry[]>([]);
  const [deck, setDeck] = useState<WatchCardEntry[]>([]);
  const [liked, setLiked] = useState<WatchCardEntry[]>([]);
  const [chosenWinner, setChosenWinner] = useState<WatchCardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingWatched, setMarkingWatched] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [filters, setFilters] = useState<QuestionnaireFilters>({
    timeTypes: [],
    selectedTags: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select(
          `
            id,
            added_at,
            media_type,
            watched_at,
            tmdb_details (
              poster_path,
              backdrop_path,
              overview,
              name,
              release_date,
              runtime
            ),
            entry_tags (
              tags (
                name
              )
            )
          `
        )
        .is('watched_at', null)
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
          overview: details?.overview ?? null,
          posterPath: details?.poster_path ?? null,
          backdropPath: details?.backdrop_path ?? null,
          runtime: details?.runtime ?? null,
          mediaType: row.media_type,
          tags,
        } satisfies WatchCardEntry;
      });

      setAllEntries(normalized);
      setShowQuestionnaire(true);
      setFilters({ timeTypes: [], selectedTags: [] });
      setDeck([]);
      setLiked([]);
      setChosenWinner(null);
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
            : 'Failed to load entries';
      setError(message);
      setAllEntries([]);
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Extract all unique tags from entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allEntries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allEntries]);

  // Calculate matching count for questionnaire display
  const matchingCount = useMemo(() => {
    if (!showQuestionnaire) {
      return 0;
    }
    const filtered = filterEntries(allEntries, filters);
    return filtered.length;
  }, [allEntries, filters, showQuestionnaire]);

  // Apply filters and randomize when questionnaire is done
  const filteredAndRandomizedEntries = useMemo(() => {
    if (showQuestionnaire) {
      return [];
    }
    const filtered = filterEntries(allEntries, filters);
    return shuffleArray(filtered);
  }, [allEntries, filters, showQuestionnaire]);

  const likeGoal =
    filteredAndRandomizedEntries.length === 0
      ? 0
      : filteredAndRandomizedEntries.length <= 3
        ? 1
        : 3;

  const handleSwipeLeft = (entry: WatchCardEntry) => {
    // Remove from deck (nope)
    setDeck((prev) => prev.filter((e) => e.id !== entry.id));
  };

  const handleSwipeRight = (entry: WatchCardEntry) => {
    // Add to liked collection (don't mark as watched yet)
    setDeck((prev) => prev.filter((e) => e.id !== entry.id));
    setLiked((prev) => (prev.length >= likeGoal ? prev : [...prev, entry]));
  };

  const handleChooseWinner = (entry: WatchCardEntry) => {
    setChosenWinner(entry);
  };

  const handleMarkWatched = async (entryId: number) => {
    setMarkingWatched(true);
    try {
      await supabase
        .from('entries')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', entryId);

      // Reload entries after marking watched
      await load();
    } catch (err) {
      console.error('Failed to mark as watched:', err);
      throw err;
    } finally {
      setMarkingWatched(false);
    }
  };

  const handleStartQuestionnaire = () => {
    // Compute filtered entries directly instead of relying on memoized value
    const filtered = filterEntries(allEntries, filters);
    const randomized = shuffleArray(filtered);
    setShowQuestionnaire(false);
    setDeck(randomized);
  };

  const handleStartOver = () => {
    setShowQuestionnaire(true);
    setFilters({ timeTypes: [], selectedTags: [] });
    setDeck([]);
    setLiked([]);
    setChosenWinner(null);
  };

  return (
    <WatchPage
      allEntries={allEntries}
      deck={deck}
      liked={liked}
      likeGoal={likeGoal}
      chosenWinner={chosenWinner}
      loading={loading}
      error={error}
      markingWatched={markingWatched}
      showQuestionnaire={showQuestionnaire}
      filters={filters}
      availableTags={availableTags}
      matchingCount={matchingCount}
      onFiltersChange={setFilters}
      onStartQuestionnaire={handleStartQuestionnaire}
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onChooseWinner={handleChooseWinner}
      onMarkWatched={handleMarkWatched}
      onStartOver={handleStartOver}
    />
  );
}
