import { useContext } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';

export interface WatchCardEntry {
  id: number;
  title: string;
  releaseYear: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  runtime: number | null;
  mediaType: string;
  tags?: string[];
}

interface WatchCardProps {
  entry: WatchCardEntry;
}

export function WatchCard({ entry }: WatchCardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - 48, 600);
  const cardHeight = screenHeight * 0.7;
  const config = useContext(TMDBConfigurationContext);

  const backdropSizeIndex = config.images.backdrop_sizes.length > 1 ? 1 : 0;
  const backdropSize =
    config.images.backdrop_sizes[backdropSizeIndex] || config.images.backdrop_sizes[0];
  const posterSizeIndex = config.images.poster_sizes.length > 4 ? 3 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  const imageUrl =
    config.images.secure_base_url && (entry.backdropPath || entry.posterPath)
      ? entry.backdropPath && backdropSize
        ? `${config.images.secure_base_url}${backdropSize}${entry.backdropPath}`
        : entry.posterPath && posterSize
          ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
          : null
      : null;

  const mediaLabel = entry.mediaType === 'movie' ? 'Movie' : entry.mediaType === 'tv' ? 'TV' : entry.mediaType;
  const tagLabel = entry.tags && entry.tags.length > 0 ? ` | ${entry.tags.join(', ')}` : '';

  return (
    <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
      {/* Backdrop area - 62% of card height */}
      <View style={styles.backdropContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.backdrop}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.backdropPlaceholder} />
        )}
        <View style={styles.gradient} />
      </View>

      {/* Text area - white background, remaining height */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {entry.title}
          </Text>
          {entry.releaseYear ? (
            <Text style={styles.year}>{entry.releaseYear}</Text>
          ) : null}
        </View>
        {entry.overview ? (
          <Text style={styles.overview} numberOfLines={4}>
            {entry.overview}
          </Text>
        ) : null}
        <Text style={styles.metadata}>
          {mediaLabel}
          {tagLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  backdropContainer: {
    width: '100%',
    height: '62%',
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#52525b',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181b',
    flex: 1,
  },
  year: {
    fontSize: 14,
    color: '#71717a',
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52525b',
    marginBottom: 12,
  },
  metadata: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 'auto',
  },
});
