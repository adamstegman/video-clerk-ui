import { View, Text, StyleSheet, Switch } from 'react-native';

interface WatchedStatusSectionProps {
  watched: boolean;
  onWatchedChange: (value: boolean) => void;
}

export function WatchedStatusSection({ watched, onWatchedChange }: WatchedStatusSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Watched Status</Text>
      <View style={styles.watchedRow}>
        <Text style={styles.watchedLabel}>{watched ? 'Watched' : 'Not Watched'}</Text>
        <Switch
          value={watched}
          onValueChange={onWatchedChange}
          trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
          thumbColor={watched ? '#4f46e5' : '#f3f4f6'}
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
    color: '#1f2937',
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
    color: '#374151',
  },
});
