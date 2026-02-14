import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../theme/colors';
import { HeroSection } from './hero-section';
import { FeatureCard } from './feature-card';

export function LandingPage() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.page }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <HeroSection isWide={isWide} />

          <View style={[styles.cardsContainer, isWide && styles.cardsContainerWide]}>
            <FeatureCard
              icon={<Ionicons name="bulb-outline" size={isWide ? 32 : 24} color={colors.iconAmber} />}
              iconBgColor={colors.iconAmberBg}
              title='Solve the "what do we watch?" conundrum'
              description="Never waste time deciding what to watch again. Video Clerk helps you make quick, satisfying choices."
            />
            <FeatureCard
              icon={<Ionicons name="list" size={isWide ? 32 : 24} color={colors.iconBlue} />}
              iconBgColor={colors.iconBlueBg}
              title="Add things to watch to your list when you hear about them"
              description="Build your watchlist over time. When someone recommends a show or movie, add it instantly—no decision needed."
            />
            <FeatureCard
              icon={<Ionicons name="filter" size={isWide ? 32 : 24} color={colors.iconPurple} />}
              iconBgColor={colors.iconPurpleBg}
              title="Filter that list based on your mood to find a winner"
              description="When it's time to watch, filter your list by mood, genre, or length. Find the perfect match for right now."
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
    gap: 48,
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 1024,
    gap: 24,
  },
  cardsContainerWide: {
    flexDirection: 'row',
  },
});
