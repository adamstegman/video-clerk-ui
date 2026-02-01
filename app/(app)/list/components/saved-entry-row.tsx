import { useContext } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { TMDBConfigurationContext } from '../../../../lib/tmdb-api/tmdb-configuration';

export interface SavedEntryRowData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
  tags: string[];
  isWatched: boolean;
}

export function SavedEntryRow({ entry }: { entry: SavedEntryRowData }) {
  const config = useContext(TMDBConfigurationContext);
  const router = useRouter();

  // Use larger poster size
  const posterSizeIndex =
    config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];
  const posterUrl =
    entry.posterPath && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
      : null;

  return (
    <Pressable
      style={[styles.container, entry.isWatched && styles.containerWatched]}
      onPress={() => router.push(`/(app)/list/${entry.id}`)}
    >
      {posterUrl && (
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={150}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{entry.title}</Text>
        {entry.releaseYear ? <Text style={styles.subtitle}>{entry.releaseYear}</Text> : null}
        {entry.tags.length > 0 ? <Text style={styles.subtitle}>{entry.tags.join(', ')}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    marginHorizontal: -8,
    borderRadius: 12,
  },
  containerWatched: {
    opacity: 0.7,
  },
  poster: {
    width: 64,
    height: 96,
    borderRadius: 8,
    marginRight: 16,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
