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
      <View style={[styles.subsectionHeader, styles.inviteFormHeader, { borderTopColor: colors.border }]}>
        <Text style={[styles.subsectionHeaderText, { color: colors.textLabel }]}>Invite to Group</Text>
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>They must accept while signed in</Text>
      </View>
      <TextInput
        style={[styles.inviteInput, { backgroundColor: colors.input, borderColor: colors.borderInput, color: colors.textPrimary, outlineColor: colors.primary }]}
        placeholder="friend@example.com"
        placeholderTextColor={colors.textTertiary}
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
          { backgroundColor: colors.primary },
          (pressed || inviting || inviteLink) && styles.inviteButtonPressed,
        ]}
        onPress={onInvite}
        disabled={inviting || !!inviteLink}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.textOnColor} />
        <Text style={[styles.inviteButtonText, { color: colors.textOnColor }]}>
          {inviting ? 'Creating...' : 'Create Invite'}
        </Text>
      </Pressable>

      {inviteLink && (
        <View style={[styles.inviteLinkContainer, { borderTopColor: colors.border }]}>
          <Text style={[styles.inviteLinkLabel, { color: colors.textLabel }]}>Invite Link:</Text>
          <ScrollView
            horizontal
            style={[styles.inviteLinkScroll, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderInput }]}
            contentContainerStyle={styles.inviteLinkScrollContent}
          >
            <Text style={[styles.inviteLinkText, { color: colors.textPrimary }]}>{inviteLink}</Text>
          </ScrollView>
          <View style={styles.inviteLinkActions}>
            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                { borderColor: colors.primary },
                pressed && styles.inviteButtonPressed,
              ]}
              onPress={onCopyInviteLink}
            >
              {copySuccess ? (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.textSuccess} />
                  <Text style={[styles.linkButtonTextSuccess, { color: colors.textSuccess }]}>Copied!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="copy-outline" size={18} color={colors.textBrand} />
                  <Text style={[styles.linkButtonText, { color: colors.textBrand }]}>Copy</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                { backgroundColor: colors.primary },
                pressed && styles.inviteButtonPressed,
              ]}
              onPress={onShareInvite}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.textOnColor} />
              <Text style={[styles.shareButtonText, { color: colors.textOnColor }]}>Share</Text>
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
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
  },
  inviteFormHeader: {
    borderTopWidth: 1,
    marginTop: 4,
  },
  inviteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  createInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonPressed: {
    opacity: 0.7,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteLinkContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  inviteLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviteLinkScroll: {
    borderWidth: 1,
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  linkButtonTextSuccess: {
    fontSize: 15,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
