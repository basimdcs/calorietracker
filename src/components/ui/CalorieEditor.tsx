import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

// Note: This component is now deprecated in favor of integrated onboarding editor

interface CalorieEditorProps {
  visible: boolean;
  currentCalories: number;
  bmr: number;
  tdee: number;
  onSave: (newCalories: number, isCustom: boolean) => void;
  onCancel: () => void;
}

const CalorieEditor: React.FC<CalorieEditorProps> = ({
  visible,
  currentCalories,
  bmr,
  tdee,
  onSave,
  onCancel,
}) => {
  // Ensure we have valid numbers
  const validCurrentCalories = isNaN(currentCalories) ? 2000 : currentCalories;
  const validBmr = isNaN(bmr) ? 1500 : bmr;
  const validTdee = isNaN(tdee) ? 2000 : tdee;
  
  const [calories, setCalories] = useState(validCurrentCalories);
  const [useCustom, setUseCustom] = useState(false);

  // Update calories when props change
  React.useEffect(() => {
    if (visible && !isNaN(currentCalories)) {
      setCalories(currentCalories);
    }
  }, [visible, currentCalories]);

  const handleSave = () => {
    onSave(calories, useCustom);
  };

  const handleReset = () => {
    setCalories(validCurrentCalories);
    setUseCustom(false);
  };

  const getDeficitSurplus = () => {
    const difference = validTdee - calories;
    if (difference > 0) {
      return { type: 'deficit', amount: Math.abs(difference) };
    } else if (difference < 0) {
      return { type: 'surplus', amount: Math.abs(difference) };
    } else {
      return { type: 'maintenance', amount: 0 };
    }
  };

  const getWeeklyWeightChange = () => {
    const { type, amount } = getDeficitSurplus();
    const weeklyChange = (amount * 7) / 3500; // 3500 calories = 1 pound
    
    if (type === 'deficit') {
      return -weeklyChange;
    } else if (type === 'surplus') {
      return weeklyChange;
    } else {
      return 0;
    }
  };

  const weeklyChange = getWeeklyWeightChange();
  const { type, amount } = getDeficitSurplus();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[colors.brandFlesh, colors.brandWaveMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <MaterialIcons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customize Your Target</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Current Target */}
            <View style={styles.targetContainer}>
              <Text style={styles.targetNumber}>{Math.round(calories).toLocaleString()}</Text>
              <Text style={styles.targetLabel}>calories per day</Text>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Adjust your daily target</Text>
              {Slider ? (
                <Slider
                  style={styles.slider}
                  value={calories}
                  minimumValue={1200}
                  maximumValue={4000}
                  step={50}
                  onValueChange={(value) => {
                    setCalories(Math.round(value));
                    setUseCustom(Math.round(value) !== validCurrentCalories);
                  }}
                  minimumTrackTintColor={colors.white}
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbStyle={styles.sliderThumb}
                />
              ) : (
                <View style={styles.sliderFallback}>
                  <View style={styles.sliderButtonRow}>
                    <TouchableOpacity
                      style={styles.sliderButton}
                      onPress={() => {
                        const newVal = Math.max(1200, calories - 100);
                        setCalories(newVal);
                        setUseCustom(newVal !== validCurrentCalories);
                      }}
                    >
                      <MaterialIcons name="remove" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.sliderValue}>{Math.round(calories).toLocaleString()}</Text>
                    <TouchableOpacity
                      style={styles.sliderButton}
                      onPress={() => {
                        const newVal = Math.min(4000, calories + 100);
                        setCalories(newVal);
                        setUseCustom(newVal !== validCurrentCalories);
                      }}
                    >
                      <MaterialIcons name="add" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>1,200</Text>
                <Text style={styles.sliderLabelText}>4,000</Text>
              </View>
            </View>

            {/* Impact Display */}
            <View style={styles.impactContainer}>
              <Text style={styles.impactTitle}>Expected Impact</Text>
              
              <View style={styles.impactCard}>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Daily {type}</Text>
                  <Text style={[
                    styles.impactValue,
                    { color: type === 'deficit' ? colors.secondary : 
                             type === 'surplus' ? colors.brandOuterSkin : colors.gray600 }
                  ]}>
                    {amount > 0 ? `${amount.toLocaleString()} cal` : 'Balanced'}
                  </Text>
                </View>
                
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Weekly weight change</Text>
                  <Text style={[
                    styles.impactValue,
                    { color: weeklyChange < 0 ? colors.secondary : 
                             weeklyChange > 0 ? colors.brandOuterSkin : colors.gray600 }
                  ]}>
                    {weeklyChange !== 0 
                      ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)} lbs`
                      : 'Maintain'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Reference Values */}
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceTitle}>Your Metabolism</Text>
              <View style={styles.referenceRow}>
                <Text style={styles.referenceLabel}>BMR (Base rate)</Text>
                <Text style={styles.referenceValue}>{Math.round(validBmr).toLocaleString()} cal</Text>
              </View>
              <View style={styles.referenceRow}>
                <Text style={styles.referenceLabel}>TDEE (With activity)</Text>
                <Text style={styles.referenceValue}>{Math.round(validTdee).toLocaleString()} cal</Text>
              </View>
            </View>

            {/* Reset Button */}
            {useCustom && (
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <MaterialIcons name="refresh" size={20} color={colors.white} />
                <Text style={styles.resetButtonText}>Reset to Recommended</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.brandOuterSkin,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  targetContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  targetNumber: {
    fontSize: 48,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: -1,
  },
  targetLabel: {
    fontSize: fonts.lg,
    color: colors.white,
    opacity: 0.95,
    fontWeight: fonts.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderContainer: {
    marginBottom: spacing.xl,
  },
  sliderLabel: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.white,
    width: 24,
    height: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sliderLabelText: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.8,
  },
  impactContainer: {
    marginBottom: spacing.xl,
  },
  impactTitle: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  impactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  impactLabel: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  impactValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
  },
  referenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  referenceTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  referenceLabel: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.8,
  },
  referenceValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.medium,
    color: colors.white,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  resetButtonText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
  },
  // Fallback slider styles
  sliderFallback: {
    paddingVertical: spacing.md,
  },
  sliderButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sliderValue: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minWidth: 120,
    textAlign: 'center',
  },
});

export default CalorieEditor;