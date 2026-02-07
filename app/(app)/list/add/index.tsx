import { useState, useContext, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { TMDBAPIContext } from '../../../../lib/tmdb-api/tmdb-api-provider';
import { TMDBConfigurationContext } from '../../../../lib/tmdb-api/tmdb-configuration';
import { TMDBGenresContext } from '../../../../lib/tmdb-api/tmdb-genres';
import { supabase } from '../../../../lib/supabase/client';
import type { TMDBSearchResult, TMDBGenre } from '../../../../lib/tmdb-api/tmdb-api';

interface SearchResultItem extends TMDBSearchResult {
  genres: TMDBGenre[];
  displayName: string;
  releaseYear: string;
}

export default function AddToListPage() {
  const router = useRouter();
  const api = useContext(TMDBAPIContext);
  const config = useContext(TMDBConfigurationContext);
  const genreData = useContext(TMDBGenresContext);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedTmdbIds, setSavedTmdbIds] = useState<Set<number>>(new Set());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch saved tmdb_ids on mount
  useEffect(() => {
    const fetchSavedIds = async () => {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('tmdb_details(tmdb_id)');

        if (error) throw error;

        const ids = new Set<number>();
        data?.forEach((entry: any) => {
          const details = entry.tmdb_details;
          if (details) {
            const tmdbId = Array.isArray(details) ? details[0]?.tmdb_id : details.tmdb_id;
            if (tmdbId) ids.add(tmdbId);
          }
        });

        setSavedTmdbIds(ids);
      } catch (err) {
        console.error('Failed to fetch saved IDs:', err);
      }
    };

    fetchSavedIds();
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      if (!api) {
        setError('TMDB API is not available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.multiSearch(searchQuery);
        const filtered = data.results
          .filter((r: TMDBSearchResult) => r.media_type === 'movie' || r.media_type === 'tv')
          .map((result: TMDBSearchResult) => {
            const genres =
              result.media_type === 'movie'
                ? result.genre_ids
                    .map((id) => genreData.movieGenres.find((g) => g.id === id))
                    .filter((g): g is TMDBGenre => !!g)
                : result.genre_ids
                    .map((id) => genreData.tvGenres.find((g) => g.id === id))
                    .filter((g): g is TMDBGenre => !!g);

            const displayName = result.title || result.name || 'Untitled';
            const releaseDate = result.release_date || result.first_air_date || '';
            const releaseYear = releaseDate ? releaseDate.split('-')[0] : '';

            return {
              ...result,
              genres,
              displayName,
              releaseYear,
            };
          });

        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [api, genreData]
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  };

  const handleAddToList = async (result: SearchResultItem) => {
    setSavingId(result.id);

    try {
      const { error } = await supabase.rpc('save_tmdb_result_to_list', {
        p_tmdb_id: result.id,
        p_media_type: result.media_type,
        p_adult: result.adult,
        p_backdrop_path: result.backdrop_path,
        p_genre_ids: result.genre_ids,
        p_genre_names: result.genres.map((g) => g.name),
        p_original_language: result.original_language,
        p_original_name: result.original_name || null,
        p_overview: result.overview,
        p_popularity: result.popularity,
        p_poster_path: result.poster_path,
        p_release_date: result.release_date || result.first_air_date || null,
        p_title: result.displayName,
        p_vote_average: result.vote_average,
        p_vote_count: result.vote_count,
        p_runtime: null,
        p_origin_country: result.origin_country || null,
      });

      if (error) throw error;

      // Add to saved IDs to update button state
      setSavedTmdbIds((prev) => new Set(prev).add(result.id));
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add to list');
    } finally {
      setSavingId(null);
    }
  };

  const renderItem = ({ item }: { item: SearchResultItem }) => {
    const posterSize = config.images.poster_sizes[1] || config.images.poster_sizes[0];
    const posterUrl =
      item.poster_path && config.images.secure_base_url
        ? `${config.images.secure_base_url}${posterSize}${item.poster_path}`
        : null;

    const isSaved = savedTmdbIds.has(item.id);
    const isSaving = savingId === item.id;
    const isDisabled = isSaved || isSaving;

    return (
      <View style={styles.resultItem}>
        {posterUrl && <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />}
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.displayName}</Text>
          {item.releaseYear ? <Text style={styles.resultSubtitle}>{item.releaseYear}</Text> : null}
          {item.genres.length > 0 ? (
            <Text style={styles.resultSubtitle}>{item.genres.map((g) => g.name).join(', ')}</Text>
          ) : null}
        </View>
        <Pressable
          style={[
            styles.addButton,
            isSaved && styles.savedButton,
            isDisabled && styles.addButtonDisabled,
          ]}
          onPress={() => handleAddToList(item)}
          disabled={isDisabled}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.addButtonText, isSaved && styles.savedButtonText]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies and TV shows..."
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}

      {error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && query.length > 0 && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && query.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Search for movies and TV shows</Text>
        </View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  savedButton: {
    backgroundColor: '#c7d2fe',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  savedButtonText: {
    color: '#1f2937',
  },
});
