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
        style={[styles.saveButton, { backgroundColor: colors.primary }, isDisabled && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isDisabled}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textOnColor} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.textOnColor }]}>Save Changes</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.deleteButton, { backgroundColor: colors.secondaryButton, borderColor: colors.textDanger }, isDisabled && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={isDisabled}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={colors.textDanger} />
        ) : (
          <Text style={[styles.deleteButtonText, { color: colors.textDanger }]}>Delete Entry</Text>
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
