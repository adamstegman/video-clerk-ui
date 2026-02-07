import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useContext, useState } from 'react';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { WatchCardEntry } from './watch-card';

interface WatchPickerViewProps {
  liked: WatchCardEntry[];
  onChooseWinner: (entry: WatchCardEntry) => void;
  onStartOver: () => void;
}

export function WatchPickerView({ liked, onChooseWinner, onStartOver }: WatchPickerViewProps) {
  const config = useContext(TMDBConfigurationContext);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleChoose = () => {
    if (!selectedId) return;
    const winner = liked.find((e) => e.id === selectedId);
    if (winner) {
      onChooseWinner(winner);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick one to watch</Text>
        <Text style={styles.subtitle}>You liked {liked.length}. Choose your winner:</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {liked.map((entry) => {
          const posterSize = config.images.poster_sizes[1] || config.images.poster_sizes[0];
          const posterUrl =
            entry.posterPath && config.images.secure_base_url
              ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
              : null;

          const isSelected = selectedId === entry.id;

          return (
            <Pressable
              key={entry.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedId(entry.id)}
            >
              <View style={styles.cardContent}>
                {posterUrl && (
                  <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
                )}
                <View style={styles.textContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {entry.title}
                  </Text>
                  {entry.releaseYear ? (
                    <Text style={styles.cardYear}>{entry.releaseYear}</Text>
                  ) : null}
                  {entry.overview ? (
                    <Text style={styles.cardOverview} numberOfLines={3}>
                      {entry.overview}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={onStartOver}>
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, !selectedId && styles.buttonDisabled]}
          onPress={handleChoose}
          disabled={!selectedId}
        >
          <Text style={styles.primaryButtonText}>Choose Winner</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e5e7eb',
  },
  textContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 4,
  },
  cardYear: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 8,
  },
  cardOverview: {
    fontSize: 14,
    color: '#52525b',
    lineHeight: 20,
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
