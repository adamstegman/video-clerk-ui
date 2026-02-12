import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import type { TMDBConfigurationState } from '../tmdb-api/tmdb-configuration';
import type { SearchResultItem } from './add-to-list-page';

interface SearchResultRowProps {
  item: SearchResultItem;
  config: TMDBConfigurationState;
  isSaved: boolean;
  isSaving: boolean;
  onAdd: (item: SearchResultItem) => void;
}

export function SearchResultRow({ item, config, isSaved, isSaving, onAdd }: SearchResultRowProps) {
  const posterSize = config.images.poster_sizes[1] || config.images.poster_sizes[0];
  const posterUrl =
    item.poster_path && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${item.poster_path}`
      : null;

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
        onPress={() => onAdd(item)}
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
}

const styles = StyleSheet.create({
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f4f4f5',
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
