import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { useThemeColors } from '../theme/colors';

interface FeatureCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, iconBgColor, title, description }: FeatureCardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.featureCard, borderColor: colors.separator }]}>
      <View style={[styles.cardIconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
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
