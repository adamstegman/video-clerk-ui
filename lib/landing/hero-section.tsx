import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { TvMinimalPlayIcon } from '../icons/tv-minimal-play-icon';
import { useThemeColors } from '../theme/colors';

interface HeroSectionProps {
  isWide: boolean;
}

export function HeroSection({ isWide }: HeroSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.hero, isWide && styles.heroWide]}>
      <TvMinimalPlayIcon size={isWide ? 192 : 128} />
      <View style={[styles.heroText, isWide && styles.heroTextWide]}>
        <Text style={[styles.title, isWide && styles.titleWide, { color: colors.textPrimary }]}>
          Video Clerk
        </Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide, { color: colors.textSecondary }]}>
          Solve the "what do we watch?" conundrum
        </Text>
        <View style={styles.buttonContainer}>
          <Link href="/login" asChild>
            <Pressable style={{ ...styles.button, backgroundColor: colors.primaryHeader }}>
              <Text style={[styles.buttonText, { color: colors.textOnColor }]}>Log In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 32,
    maxWidth: 1024,
    width: '100%',
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 48,
  },
  heroText: {
    flex: 1,
    alignItems: 'center',
    gap: 24,
  },
  heroTextWide: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
  },
  titleWide: {
    fontSize: 48,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  subtitleWide: {
    fontSize: 22,
    textAlign: 'left',
  },
  buttonContainer: {
    paddingTop: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
