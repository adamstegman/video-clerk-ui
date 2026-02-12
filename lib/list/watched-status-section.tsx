import { View, Text, StyleSheet, Switch } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface WatchedStatusSectionProps {
  watched: boolean;
  onWatchedChange: (value: boolean) => void;
}

export function WatchedStatusSection({ watched, onWatchedChange }: WatchedStatusSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Watched Status</Text>
      <View style={styles.watchedRow}>
        <Text style={[styles.watchedLabel, { color: colors.textLabel }]}>{watched ? 'Watched' : 'Not Watched'}</Text>
        <Switch
          value={watched}
          onValueChange={onWatchedChange}
          trackColor={{ false: colors.borderInput, true: colors.primaryDisabled }}
          thumbColor={watched ? colors.primary : colors.input}
        />
      </View>
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
    marginBottom: 12,
  },
  watchedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  watchedLabel: {
    fontSize: 16,
  },
});
