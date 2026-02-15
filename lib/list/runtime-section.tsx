import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface RuntimeSectionProps {
  runtime: number | null;
  onRuntimeChange: (value: number | null) => void;
}

export function RuntimeSection({ runtime, onRuntimeChange }: RuntimeSectionProps) {
  const colors = useThemeColors();
  const [inputValue, setInputValue] = useState(runtime != null ? String(runtime) : '');

  const handleChangeText = (text: string) => {
    // Allow only digits and empty string
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputValue(cleaned);
    if (cleaned === '') {
      onRuntimeChange(null);
    } else {
      onRuntimeChange(Number(cleaned));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Runtime</Text>
      <View style={styles.runtimeRow}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.input, borderColor: colors.borderInput }]}
          value={inputValue}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={colors.textTertiary}
          inputMode="numeric"
        />
        <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>minutes</Text>
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
  runtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
});
