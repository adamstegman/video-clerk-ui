import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

export interface QuestionnaireFilters {
  timeTypes: ('short-show' | 'long-show' | 'movie')[];
  selectedTags: string[];
}

interface WatchQuestionnaireProps {
  availableTags: string[];
  filters: QuestionnaireFilters;
  onFiltersChange: (filters: QuestionnaireFilters) => void;
  onStart: () => void;
  matchingCount: number;
}

export function WatchQuestionnaire({
  availableTags,
  filters,
  onFiltersChange,
  onStart,
  matchingCount,
}: WatchQuestionnaireProps) {
  const toggleTimeType = (type: 'short-show' | 'long-show' | 'movie') => {
    const newTimeTypes = filters.timeTypes.includes(type)
      ? filters.timeTypes.filter((t) => t !== type)
      : [...filters.timeTypes, type];
    onFiltersChange({ ...filters, timeTypes: newTimeTypes });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: newTags });
  };

  const hasSelections = filters.timeTypes.length > 0 || filters.selectedTags.length > 0;
  const canStart = hasSelections && matchingCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How much time do you have?</Text>
          <View style={styles.timeOptions}>
            <TimeOption
              label="Short Show"
              description="Quick episodes (under 30 min)"
              isSelected={filters.timeTypes.includes('short-show')}
              onPress={() => toggleTimeType('short-show')}
            />
            <TimeOption
              label="Long Show"
              description="Full episodes (30+ min)"
              isSelected={filters.timeTypes.includes('long-show')}
              onPress={() => toggleTimeType('long-show')}
            />
            <TimeOption
              label="Movie"
              description="Feature length film"
              isSelected={filters.timeTypes.includes('movie')}
              onPress={() => toggleTimeType('movie')}
            />
          </View>
        </View>

        {/* Mood/Tags Section */}
        {availableTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your mood?</Text>
            <Text style={styles.sectionSubtitle}>
              Select any tags that match how you're feeling
            </Text>
            <View style={styles.tagContainer}>
              {availableTags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  isSelected={filters.selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Matching Count Badge */}
        {hasSelections && (
          <View
            style={[
              styles.matchingBadge,
              matchingCount > 0 ? styles.matchingBadgeSuccess : styles.matchingBadgeWarning,
            ]}
          >
            <Text style={styles.matchingCount}>{matchingCount}</Text>
            <Text style={styles.matchingText}>
              {matchingCount === 1 ? 'entry matches' : 'entries match'} your filters
            </Text>
          </View>
        )}

        {/* Helper Text */}
        {!hasSelections && (
          <Text style={styles.helperText}>Select at least one option to start</Text>
        )}
        {hasSelections && matchingCount === 0 && (
          <Text style={styles.warningText}>
            No entries match these filters. Try different options.
          </Text>
        )}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={onStart}
          disabled={!canStart}
        >
          <Text style={[styles.startButtonText, !canStart && styles.startButtonTextDisabled]}>
            Start Swiping
          </Text>
          <Check size={20} color={canStart ? '#fff' : '#a1a1aa'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function TimeOption({
  label,
  description,
  isSelected,
  onPress,
}: {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
      onPress={onPress}
    >
      <View
        style={[styles.timeOptionCheckbox, isSelected && styles.timeOptionCheckboxSelected]}
      >
        {isSelected && <Check size={16} color="#fff" />}
      </View>
      <View style={styles.timeOptionContent}>
        <Text style={styles.timeOptionLabel}>{label}</Text>
        <Text style={styles.timeOptionDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function TagChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tagChip, isSelected && styles.tagChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 12,
  },
  timeOptions: {
    gap: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
  },
  timeOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  timeOptionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d4d4d8',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionCheckboxSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#4f46e5',
  },
  timeOptionContent: {
    flex: 1,
  },
  timeOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181b',
    marginBottom: 2,
  },
  timeOptionDescription: {
    fontSize: 14,
    color: '#71717a',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  tagChipSelected: {
    backgroundColor: '#4f46e5',
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3f3f46',
  },
  tagChipTextSelected: {
    color: '#fff',
  },
  matchingBadge: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  matchingBadgeSuccess: {
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  },
  matchingBadgeWarning: {
    borderColor: '#fde68a',
    backgroundColor: '#fef3c7',
  },
  matchingCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181b',
  },
  matchingText: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#e4e4e7',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  startButtonTextDisabled: {
    color: '#a1a1aa',
  },
});
