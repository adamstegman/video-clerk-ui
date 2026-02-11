import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

interface HeroSectionProps {
  isWide: boolean;
}

export function HeroSection({ isWide }: HeroSectionProps) {
  return (
    <View style={[styles.hero, isWide && styles.heroWide]}>
      <Ionicons
        name="tv-outline"
        size={isWide ? 192 : 128}
        color="#6366f1"
      />
      <View style={[styles.heroText, isWide && styles.heroTextWide]}>
        <Text style={[styles.title, isWide && styles.titleWide]}>
          Video Clerk
        </Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
          Solve the "what do we watch?" conundrum
        </Text>
        <View style={styles.buttonContainer}>
          <Link href="/login" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Log In</Text>
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
    color: '#1f2937',
  },
  titleWide: {
    fontSize: 48,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
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
    backgroundColor: '#6366f1',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
