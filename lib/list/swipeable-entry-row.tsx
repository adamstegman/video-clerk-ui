import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SavedEntryRow, type SavedEntryRowData } from './saved-entry-row';

interface SwipeableEntryRowProps {
  entry: SavedEntryRowData;
  onDelete: (entryId: number) => void;
}

export function SwipeableEntryRow({ entry, onDelete }: SwipeableEntryRowProps) {
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
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
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
      <View style={styles.rowContainer}>
        <SavedEntryRow entry={entry} />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: '#f4f4f5',
  },
  rightActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
