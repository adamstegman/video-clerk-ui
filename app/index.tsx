import { Link } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, iconBgColor, title, description }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Hero Section */}
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

          {/* Feature Cards */}
          <View style={[styles.cardsContainer, isWide && styles.cardsContainerWide]}>
            <FeatureCard
              icon={<Ionicons name="bulb-outline" size={isWide ? 32 : 24} color="#a16207" />}
              iconBgColor="#fef08a"
              title='Solve the "what do we watch?" conundrum'
              description="Never waste time deciding what to watch again. Video Clerk helps you make quick, satisfying choices."
            />
            <FeatureCard
              icon={<Ionicons name="list" size={isWide ? 32 : 24} color="#1d4ed8" />}
              iconBgColor="#93c5fd"
              title="Add things to watch to your list when you hear about them"
              description="Build your watchlist over time. When someone recommends a show or movie, add it instantly—no decision needed."
            />
            <FeatureCard
              icon={<Ionicons name="filter" size={isWide ? 32 : 24} color="#7e22ce" />}
              iconBgColor="#c084fc"
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
    backgroundColor: '#fafafa',
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
  cardsContainer: {
    width: '100%',
    maxWidth: 1024,
    gap: 24,
  },
  cardsContainerWide: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
});
