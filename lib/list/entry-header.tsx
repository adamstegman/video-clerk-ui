import { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { EditEntryData } from './edit-entry-page';
import { useThemeColors } from '../theme/colors';

interface EntryHeaderProps {
  entry: EditEntryData;
}

export function EntryHeader({ entry }: EntryHeaderProps) {
  const colors = useThemeColors();
  const config = useContext(TMDBConfigurationContext);

  const posterSize = config.images.poster_sizes[2] || config.images.poster_sizes[0];
  const posterUrl =
    entry.posterPath && config.images.secure_base_url
      ? `${config.images.secure_base_url}${posterSize}${entry.posterPath}`
      : null;

  return (
    <View style={styles.header}>
      {posterUrl && (
        <Image source={{ uri: posterUrl }} style={[styles.poster, { backgroundColor: colors.separator }]} contentFit="cover" />
      )}
      <View style={styles.headerText}>
        <Text style={styles.title}>{entry.title}</Text>
        {entry.releaseYear ? <Text style={styles.subtitle}>{entry.releaseYear}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 16,
    // backgroundColor set inline via colors.separator
  },
  headerText: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});
