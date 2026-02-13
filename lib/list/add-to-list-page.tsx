import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/colors';
import type { TMDBConfigurationState } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResult, TMDBGenre } from '../tmdb-api/tmdb-api';
import { SearchResultRow } from './search-result-row';

export interface SearchResultItem extends TMDBSearchResult {
  genres: TMDBGenre[];
  displayName: string;
  releaseYear: string;
}

interface AddToListPageProps {
  query: string;
  onQueryChange: (text: string) => void;
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
  savingId: number | null;
  savedTmdbIds: Set<number>;
  config: TMDBConfigurationState;
  onAddToList: (item: SearchResultItem) => void;
}

export function AddToListPage({
  query,
  onQueryChange,
  results,
  loading,
  error,
  savingId,
  savedTmdbIds,
  config,
  onAddToList,
}: AddToListPageProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]} edges={['bottom']}>
      <View style={[styles.searchContainer, { borderBottomColor: colors.separator }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.input, color: colors.textPrimary, outlineColor: colors.primary }]}
          placeholder="Search movies and TV shows..."
          value={query}
          onChangeText={onQueryChange}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.textDanger }]}>{error}</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && query.length > 0 && (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && query.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Search for movies and TV shows</Text>
        </View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <SearchResultRow
              item={item}
              config={config}
              isSaved={savedTmdbIds.has(item.id)}
              isSaving={savingId === item.id}
              onAdd={onAddToList}
            />
          )}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
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
});
