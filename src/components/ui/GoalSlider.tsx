import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';

interface GoalSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label: string;
  unit?: string;
  style?: ViewStyle;
  formatValue?: (value: number) => string;
  showLabels?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

const GoalSlider: React.FC<GoalSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  label,
  unit = '',
  style,
  formatValue,
  showLabels = true,
  minLabel,
  maxLabel,
}) => {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit ? ` ${unit}` : ''}`;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          minimumTrackTintColor={colors.brandOuterSkin}
          maximumTrackTintColor={colors.gray300}
          thumbStyle={styles.thumb}
          trackStyle={styles.track}
        />
        
        {showLabels && (
          <View style={styles.labelsContainer}>
            <Text style={styles.labelText}>
              {minLabel || `${minimumValue}${unit ? ` ${unit}` : ''}`}
            </Text>
            <Text style={styles.labelText}>
              {maxLabel || `${maximumValue}${unit ? ` ${unit}` : ''}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.base,
    fontWeight: fonts.medium,
    color: colors.textPrimary,
  },
  value: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
  },
  sliderContainer: {
    // No additional styles needed
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    backgroundColor: colors.brandOuterSkin,
    width: 24,
    height: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  track: {
    height: 6,
    borderRadius: 3,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  labelText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
});

export default GoalSlider;