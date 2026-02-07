import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SwipeableCard } from './swipeable-card';
import { WatchCard, type WatchCardEntry } from './watch-card';
import { WatchPickerView } from './watch-picker-view';
import { WatchWinnerView } from './watch-winner-view';
import { WatchQuestionnaire, type QuestionnaireFilters } from './watch-questionnaire';

const STACK_OFFSET = 20;
const STACK_SCALE_STEP = 0.03;
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

function StackedCard({ entry, index }: { entry: WatchCardEntry; index: number }) {
  const translateY = useSharedValue(index * STACK_OFFSET);
  const scale = useSharedValue(1 - index * STACK_SCALE_STEP);

  useEffect(() => {
    translateY.value = withSpring(index * STACK_OFFSET, SPRING_CONFIG);
    scale.value = withSpring(1 - index * STACK_SCALE_STEP, SPRING_CONFIG);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: -index,
  }));

  return (
    <Animated.View style={[styles.stackedCard, animatedStyle]}>
      <WatchCard entry={entry} />
    </Animated.View>
  );
}

interface WatchPageProps {
  allEntries: WatchCardEntry[];
  deck: WatchCardEntry[];
  liked: WatchCardEntry[];
  likeGoal: number;
  chosenWinner: WatchCardEntry | null;
  loading: boolean;
  error: string | null;
  markingWatched: boolean;
  showQuestionnaire: boolean;
  filters: QuestionnaireFilters;
  availableTags: string[];
  matchingCount: number;
  onFiltersChange: (filters: QuestionnaireFilters) => void;
  onStartQuestionnaire: () => void;
  onSwipeLeft: (entry: WatchCardEntry) => void;
  onSwipeRight: (entry: WatchCardEntry) => void;
  onChooseWinner: (entry: WatchCardEntry) => void;
  onMarkWatched: (entryId: number) => Promise<void>;
  onStartOver: () => void;
}

export function WatchPage({
  allEntries,
  deck,
  liked,
  likeGoal,
  chosenWinner,
  loading,
  error,
  markingWatched,
  showQuestionnaire,
  filters,
  availableTags,
  matchingCount,
  onFiltersChange,
  onStartQuestionnaire,
  onSwipeLeft,
  onSwipeRight,
  onChooseWinner,
  onMarkWatched,
  onStartOver,
}: WatchPageProps) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Empty state
  if (!loading && !error && allEntries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No unwatched entries.</Text>
        <Text style={styles.subtitle}>Add some movies or shows to your list!</Text>
      </View>
    );
  }

  // Questionnaire view
  if (showQuestionnaire) {
    return (
      <WatchQuestionnaire
        availableTags={availableTags}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onStart={onStartQuestionnaire}
        matchingCount={matchingCount}
      />
    );
  }

  // Winner view - show chosen winner
  if (chosenWinner) {
    return (
      <WatchWinnerView
        winner={chosenWinner}
        markingWatched={markingWatched}
        onMarkWatched={onMarkWatched}
        onStartOver={onStartOver}
      />
    );
  }

  // Picker view - choose winner from liked entries
  const isDeckExhausted = deck.length === 0;
  const canPickWithRemainingLikes = isDeckExhausted && liked.length > 0 && liked.length < 3;
  const isInPickMode = likeGoal > 0 && (liked.length >= likeGoal || canPickWithRemainingLikes);

  // Auto-select winner if only 1 liked entry
  if (isInPickMode && liked.length === 1) {
    onChooseWinner(liked[0]);
    return null;
  }

  if (isInPickMode) {
    return (
      <WatchPickerView
        liked={liked}
        onChooseWinner={onChooseWinner}
        onStartOver={onStartOver}
      />
    );
  }

  // No matches state
  if (deck.length === 0 && liked.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No entries match your filters.</Text>
        <Text style={styles.subtitle}>Try different options.</Text>
        <Pressable style={styles.changeFiltersButton} onPress={onStartOver}>
          <Text style={styles.changeFiltersButtonText}>Change Filters</Text>
        </Pressable>
      </View>
    );
  }

  // Deck view - swipe through cards
  const currentEntry = deck[0];
  if (!currentEntry) {
    return null;
  }

  // Show up to 4 cards in the stack (bottom cards rendered first, top card last)
  const visibleDeck = deck.slice(0, 4);

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Render bottom-to-top so the top card is last (on top in z-order) */}
        {[...visibleDeck].reverse().map((entry, renderIndex) => {
          const deckIndex = visibleDeck.length - 1 - renderIndex;

          if (deckIndex === 0) {
            return (
              <SwipeableCard
                key={entry.id}
                onSwipeLeft={() => onSwipeLeft(entry)}
                onSwipeRight={() => onSwipeRight(entry)}
              >
                <WatchCard entry={entry} />
              </SwipeableCard>
            );
          }

          return (
            <StackedCard key={entry.id} entry={entry} index={deckIndex} />
          );
        })}
      </View>
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Swipe left to skip • Swipe right to like ({liked.length}/{likeGoal})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackedCard: {
    position: 'absolute',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  instructions: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  changeFiltersButton: {
    marginTop: 24,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  changeFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
