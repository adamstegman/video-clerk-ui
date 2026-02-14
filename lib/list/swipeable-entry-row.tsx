import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';
import { SavedEntryRow, type SavedEntryRowData } from './saved-entry-row';

interface SwipeableEntryRowProps {
  entry: SavedEntryRowData;
  onDelete: (entryId: number) => void;
}

export function SwipeableEntryRow({ entry, onDelete }: SwipeableEntryRowProps) {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Delete "${entry.title}" from your list?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeableRef.current?.close();
            onDelete(entry.id);
          },
        },
      ],
      { cancelable: true, onDismiss: () => swipeableRef.current?.close() }
    );
  };

  const renderRightActions = () => (
    <View style={styles.rightActionContainer}>
      <Pressable style={[styles.deleteButton, { backgroundColor: colors.danger }]} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={24} color={colors.textOnColor} />
        <Text style={[styles.deleteText, { color: colors.textOnColor }]}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <View style={[styles.rowContainer, { backgroundColor: colors.surface }]}>
        <SavedEntryRow entry={entry} />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    // backgroundColor comes from SavedEntryRow via theme
  },
  rightActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
