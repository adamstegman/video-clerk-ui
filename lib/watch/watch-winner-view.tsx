import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useContext, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react-native';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { WatchCardEntry } from './watch-card';

interface WatchWinnerViewProps {
  winner: WatchCardEntry;
  markingWatched: boolean;
  onMarkWatched: (entryId: number) => Promise<void>;
  onStartOver: () => void;
}

export function WatchWinnerView({
  winner,
  markingWatched,
  onMarkWatched,
  onStartOver,
}: WatchWinnerViewProps) {
  const config = useContext(TMDBConfigurationContext);
  const [error, setError] = useState<string | null>(null);

  const handleMarkWatched = async () => {
    try {
      setError(null);
      await onMarkWatched(winner.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as watched');
    }
  };

  const backdropSize = config.images.backdrop_sizes[1] || config.images.backdrop_sizes[0];
  const posterSize = config.images.poster_sizes[2] || config.images.poster_sizes[0];

  const backdropUrl =
    winner.backdropPath && config.images.secure_base_url
      ? `${config.images.secure_base_url}${backdropSize}${winner.backdropPath}`
      : null;

  const posterUrl =
    winner.posterPath && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${winner.posterPath}`
      : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {backdropUrl ? (
            <Image source={{ uri: backdropUrl }} style={styles.backdrop} contentFit="cover" />
          ) : (
            <View style={styles.backdropPlaceholder} />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎉 Winner!</Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.details}>
          <View style={styles.detailsHeader}>
            {posterUrl && (
              <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
            )}
            <View style={styles.detailsText}>
              <Text style={styles.title}>{winner.title}</Text>
              {winner.releaseYear ? <Text style={styles.year}>{winner.releaseYear}</Text> : null}
              <View style={styles.metadata}>
                <Text style={styles.metadataText}>
                  {winner.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                </Text>
                {winner.tags && winner.tags.length > 0 ? (
                  <Text style={styles.metadataText}> • {winner.tags.join(', ')}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {winner.overview ? (
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{winner.overview}</Text>
            </View>
          ) : null}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.secondaryButton, markingWatched && styles.buttonDisabled]}
          onPress={onStartOver}
          disabled={markingWatched}
        >
          <RotateCcw size={20} color="#18181b" />
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, markingWatched && styles.buttonDisabled]}
          onPress={handleMarkWatched}
          disabled={markingWatched}
        >
          {markingWatched ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Check size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Mark as Watched</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    height: 240,
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(79, 70, 229, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  badgeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  details: {
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e5e7eb',
  },
  detailsText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 8,
  },
  year: {
    fontSize: 16,
    color: '#71717a',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataText: {
    fontSize: 14,
    color: '#52525b',
  },
  overviewSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    color: '#52525b',
  },
  errorContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
