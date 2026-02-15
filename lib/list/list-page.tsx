import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColors } from '../theme/colors';
import { ContentContainer } from '../components/content-container';
import { SwipeableEntryRow } from './swipeable-entry-row';
import type { SavedEntryRowData } from './saved-entry-row';

interface ListPageProps {
  entries: SavedEntryRowData[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onDelete: (entryId: number) => void;
}

export function ListPage({ entries, loading, error, refreshing, onRefresh, onDelete }: ListPageProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const watchedStartIndex = entries.findIndex((entry) => entry.isWatched);
  const showWatchedHeader = watchedStartIndex > 0;

  const renderItem = ({ item, index }: { item: SavedEntryRowData; index: number }) => {
    const items: React.ReactElement[] = [];

    if (showWatchedHeader && index === watchedStartIndex) {
      items.push(
        <View key="watched-header" style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>WATCHED</Text>
        </View>
      );
    }

    items.push(<SwipeableEntryRow key={item.id} entry={item} onDelete={onDelete} />);

    return <>{items}</>;
  };

  if (loading && !error && entries.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.textDanger }]}>{error}</Text>
      </View>
    );
  }

  if (!loading && !error && entries.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Your list is empty.</Text>
        <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(app)/list/add')}>
          <Text style={[styles.addButtonText, { color: colors.textOnColor }]}>Add Something</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ContentContainer maxWidth={720}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
        <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => router.push('/(app)/list/add')}>
          <Ionicons name="add" color={colors.textOnColor} size={24} />
        </Pressable>
      </ContentContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },
  sectionHeader: {
    paddingTop: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
