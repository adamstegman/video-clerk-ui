import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface EntryActionsProps {
  saving: boolean;
  deleting: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export function EntryActions({ saving, deleting, onSave, onDelete }: EntryActionsProps) {
  const colors = useThemeColors();
  const isDisabled = saving || deleting;

  return (
    <View style={styles.actionsSection}>
      <Pressable
        style={[styles.saveButton, isDisabled && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isDisabled}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.deleteButton, { backgroundColor: colors.secondaryButton }, isDisabled && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={isDisabled}
      >
        {deleting ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsSection: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
