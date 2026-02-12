import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import type { TMDBConfigurationState } from '../tmdb-api/tmdb-configuration';
import { useThemeColors } from '../theme/colors';
import type { SearchResultItem } from './add-to-list-page';

interface SearchResultRowProps {
  item: SearchResultItem;
  config: TMDBConfigurationState;
  isSaved: boolean;
  isSaving: boolean;
  onAdd: (item: SearchResultItem) => void;
}

export function SearchResultRow({ item, config, isSaved, isSaving, onAdd }: SearchResultRowProps) {
  const colors = useThemeColors();
  const posterSize = config.images.poster_sizes[1] || config.images.poster_sizes[0];
  const posterUrl =
    item.poster_path && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${item.poster_path}`
      : null;

  const isDisabled = isSaved || isSaving;

  return (
    <View style={[styles.resultItem, { backgroundColor: colors.surface }]}>
      {posterUrl && <Image source={{ uri: posterUrl }} style={[styles.poster, { backgroundColor: colors.separator }]} contentFit="cover" />}
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{item.displayName}</Text>
        {item.releaseYear ? <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{item.releaseYear}</Text> : null}
        {item.genres.length > 0 ? (
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{item.genres.map((g) => g.name).join(', ')}</Text>
        ) : null}
      </View>
      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: colors.primary },
          isSaved && { backgroundColor: colors.primaryMuted },
          isDisabled && styles.addButtonDisabled,
        ]}
        onPress={() => onAdd(item)}
        disabled={isDisabled}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.textOnColor} />
        ) : (
          <Text style={[styles.addButtonText, { color: colors.textOnColor }, isSaved && { color: colors.textPrimary }]}>
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
    borderRadius: 12,
    padding: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
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
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
