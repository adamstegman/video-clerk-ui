import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';

interface InviteFormProps {
  inviteEmail: string;
  onInviteEmailChange: (text: string) => void;
  inviting: boolean;
  inviteLink: string | null;
  copySuccess: boolean;
  onInvite: () => void;
  onCopyInviteLink: () => void;
  onShareInvite: () => void;
}

export function InviteForm({
  inviteEmail,
  onInviteEmailChange,
  inviting,
  inviteLink,
  copySuccess,
  onInvite,
  onCopyInviteLink,
  onShareInvite,
}: InviteFormProps) {
  const colors = useThemeColors();

  return (
    <>
      <View style={[styles.subsectionHeader, styles.inviteFormHeader]}>
        <Text style={styles.subsectionHeaderText}>Invite to Group</Text>
        <Text style={styles.helpText}>They must accept while signed in</Text>
      </View>
      <TextInput
        style={[styles.inviteInput, { backgroundColor: colors.input }]}
        placeholder="friend@example.com"
        placeholderTextColor="#9ca3af"
        value={inviteEmail}
        onChangeText={onInviteEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!inviting}
      />
      <Pressable
        style={({ pressed }) => [
          styles.createInviteButton,
          (pressed || inviting || inviteLink) && styles.inviteButtonPressed,
        ]}
        onPress={onInvite}
        disabled={inviting || !!inviteLink}
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.inviteButtonText}>
          {inviting ? 'Creating...' : 'Create Invite'}
        </Text>
      </Pressable>

      {inviteLink && (
        <View style={styles.inviteLinkContainer}>
          <Text style={styles.inviteLinkLabel}>Invite Link:</Text>
          <ScrollView
            horizontal
            style={[styles.inviteLinkScroll, { backgroundColor: colors.surfaceSubtle }]}
            contentContainerStyle={styles.inviteLinkScrollContent}
          >
            <Text style={styles.inviteLinkText}>{inviteLink}</Text>
          </ScrollView>
          <View style={styles.inviteLinkActions}>
            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.inviteButtonPressed,
              ]}
              onPress={onCopyInviteLink}
            >
              {copySuccess ? (
                <>
                  <Ionicons name="checkmark" size={18} color="#22c55e" />
                  <Text style={styles.linkButtonTextSuccess}>Copied!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="copy-outline" size={18} color="#4f46e5" />
                  <Text style={styles.linkButtonText}>Copy</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.inviteButtonPressed,
              ]}
              onPress={onShareInvite}
            >
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  subsectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  subsectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  inviteFormHeader: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  createInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonPressed: {
    opacity: 0.7,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inviteLinkContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  inviteLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inviteLinkScroll: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    maxHeight: 60,
  },
  inviteLinkScrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inviteLinkText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#1f2937',
  },
  inviteLinkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
  },
  linkButtonTextSuccess: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
