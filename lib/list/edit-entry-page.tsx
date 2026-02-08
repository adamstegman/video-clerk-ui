import { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';

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
  const config = useContext(TMDBConfigurationContext);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Entry not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const posterSize = config.images.poster_sizes[2] || config.images.poster_sizes[0];
  const posterUrl =
    entry.posterPath && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
      : null;

  const exactMatch = availableTags.find((tag) => tag.name.toLowerCase() === tagQuery.toLowerCase());
  const showCreateButton = tagQuery.trim().length > 0 && !exactMatch;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          {posterUrl && (
            <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{entry.title}</Text>
            {entry.releaseYear ? <Text style={styles.subtitle}>{entry.releaseYear}</Text> : null}
          </View>
        </View>

        {/* Watched Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watched Status</Text>
          <View style={styles.watchedRow}>
            <Text style={styles.watchedLabel}>{watched ? 'Watched' : 'Not Watched'}</Text>
            <Switch
              value={watched}
              onValueChange={onWatchedChange}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={watched ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map((tag) => (
                <Pressable
                  key={tag.id}
                  style={styles.selectedTag}
                  onPress={() => onToggleTag(tag)}
                >
                  <Text style={styles.selectedTagText}>{tag.name}</Text>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Tag Input */}
          <TextInput
            style={styles.tagInput}
            placeholder="Search or create tags..."
            value={tagQuery}
            onChangeText={onTagQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Create Tag Button */}
          {showCreateButton && (
            <Pressable style={styles.createTagButton} onPress={() => onCreateTag(tagQuery)}>
              <Text style={styles.createTagButtonText}>Create "{tagQuery}"</Text>
            </Pressable>
          )}

          {/* Available Tags */}
          {availableTags.length > 0 && (
            <View style={styles.availableTagsContainer}>
              {availableTags.map((tag) => {
                const isSelected = selectedTags.some((selected) => selected.id === tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    style={[styles.availableTag, isSelected && styles.availableTagSelected]}
                    onPress={() => onToggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.availableTagText,
                        isSelected && styles.availableTagTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Pressable
            style={[styles.saveButton, (saving || deleting) && styles.buttonDisabled]}
            onPress={onSave}
            disabled={saving || deleting}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.deleteButton, (saving || deleting) && styles.buttonDisabled]}
            onPress={onDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e5e7eb',
  },
  headerText: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  watchedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  watchedLabel: {
    fontSize: 16,
    color: '#374151',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  tagInput: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  createTagButton: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  createTagButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  availableTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  availableTag: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  availableTagSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#4f46e5',
  },
  availableTagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  availableTagTextSelected: {
    color: '#4f46e5',
    fontWeight: '500',
  },
  actionsSection: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
