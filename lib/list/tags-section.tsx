import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { EditEntryTag } from './edit-entry-page';
import { useThemeColors } from '../theme/colors';

interface TagsSectionProps {
  selectedTags: EditEntryTag[];
  availableTags: EditEntryTag[];
  tagQuery: string;
  onToggleTag: (tag: EditEntryTag) => void;
  onTagQueryChange: (value: string) => void;
  onCreateTag: (value: string) => void;
}

export function TagsSection({
  selectedTags,
  availableTags,
  tagQuery,
  onToggleTag,
  onTagQueryChange,
  onCreateTag,
}: TagsSectionProps) {
  const colors = useThemeColors();
  const exactMatch = availableTags.find((tag) => tag.name.toLowerCase() === tagQuery.toLowerCase());
  const showCreateButton = tagQuery.trim().length > 0 && !exactMatch;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tags</Text>

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

      <TextInput
        style={[styles.tagInput, { backgroundColor: colors.input }]}
        placeholder="Search or create tags..."
        value={tagQuery}
        onChangeText={onTagQueryChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {showCreateButton && (
        <Pressable style={[styles.createTagButton, { backgroundColor: colors.primaryLight }]} onPress={() => onCreateTag(tagQuery)}>
          <Text style={styles.createTagButtonText}>Create "{tagQuery}"</Text>
        </Pressable>
      )}

      {availableTags.length > 0 && (
        <View style={styles.availableTagsContainer}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.some((selected) => selected.id === tag.id);
            return (
              <Pressable
                key={tag.id}
                style={[
                  styles.availableTag,
                  { backgroundColor: colors.input, borderColor: colors.separator },
                  isSelected && [styles.availableTagSelected, { backgroundColor: colors.primaryLight, borderColor: colors.primary }],
                ]}
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
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  createTagButton: {
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
    borderWidth: 1,
  },
  availableTagSelected: {
  },
  availableTagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  availableTagTextSelected: {
    color: '#4f46e5',
    fontWeight: '500',
  },
});
