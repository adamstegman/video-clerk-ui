import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/colors';
import { EntryHeader } from './entry-header';
import { WatchedStatusSection } from './watched-status-section';
import { TagsSection } from './tags-section';
import { EntryActions } from './entry-actions';

export interface EditEntryData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
}

export interface EditEntryTag {
  id: number;
  name: string;
  is_custom: boolean;
}

interface EditEntryPageProps {
  entry: EditEntryData | null;
  loading: boolean;
  error: string | null;
  selectedTags: EditEntryTag[];
  availableTags: EditEntryTag[];
  tagQuery: string;
  watched: boolean;
  saving: boolean;
  deleting: boolean;
  onToggleTag: (tag: EditEntryTag) => void;
  onTagQueryChange: (value: string) => void;
  onCreateTag: (value: string) => void;
  onWatchedChange: (value: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function EditEntryPage({
  entry,
  loading,
  error,
  selectedTags,
  availableTags,
  tagQuery,
  watched,
  saving,
  deleting,
  onToggleTag,
  onTagQueryChange,
  onCreateTag,
  onWatchedChange,
  onSave,
  onDelete,
}: EditEntryPageProps) {
  const colors = useThemeColors();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Entry not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <EntryHeader entry={entry} />

        <WatchedStatusSection
          watched={watched}
          onWatchedChange={onWatchedChange}
        />

        <TagsSection
          selectedTags={selectedTags}
          availableTags={availableTags}
          tagQuery={tagQuery}
          onToggleTag={onToggleTag}
          onTagQueryChange={onTagQueryChange}
          onCreateTag={onCreateTag}
        />

        <EntryActions
          saving={saving}
          deleting={deleting}
          onSave={onSave}
          onDelete={onDelete}
        />
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});
