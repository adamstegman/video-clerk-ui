import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useContext, useState } from 'react';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import { useThemeColors } from '../theme/colors';
import { ContentContainer } from '../components/content-container';
import type { WatchCardEntry } from './watch-card';

interface WatchPickerViewProps {
  liked: WatchCardEntry[];
  onChooseWinner: (entry: WatchCardEntry) => void;
  onStartOver: () => void;
}

export function WatchPickerView({ liked, onChooseWinner, onStartOver }: WatchPickerViewProps) {
  const config = useContext(TMDBConfigurationContext);
  const colors = useThemeColors();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleChoose = () => {
    if (!selectedId) return;
    const winner = liked.find((e) => e.id === selectedId);
    if (winner) {
      onChooseWinner(winner);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]} edges={['bottom']}>
      <ContentContainer maxWidth={720}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Pick one to watch</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>You liked {liked.length}. Choose your winner:</Text>
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
              style={[styles.card, { backgroundColor: colors.surface }, isSelected && styles.cardSelected, isSelected && { borderColor: colors.primary }]}
              onPress={() => setSelectedId(entry.id)}
            >
              <View style={styles.cardContent}>
                {posterUrl && (
                  <Image source={{ uri: posterUrl }} style={[styles.poster, { backgroundColor: colors.separator }]} contentFit="cover" />
                )}
                <View style={styles.textContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {entry.title}
                  </Text>
                  {entry.releaseYear ? (
                    <Text style={[styles.cardYear, { color: colors.textMuted }]}>{entry.releaseYear}</Text>
                  ) : null}
                  {entry.overview ? (
                    <Text style={[styles.cardOverview, { color: colors.textSubtle }]} numberOfLines={3}>
                      {entry.overview}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.separator }]}>
          <Pressable style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.separator }]} onPress={onStartOver}>
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Start Over</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }, !selectedId && styles.buttonDisabled]}
            onPress={handleChoose}
            disabled={!selectedId}
          >
            <Text style={[styles.primaryButtonText, { color: colors.textOnColor }]}>Choose Winner</Text>
          </Pressable>
        </View>
      </ContentContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
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
  },
  textContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardYear: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardOverview: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
