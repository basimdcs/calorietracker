import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { UserProfile, Goal, ActivityLevel } from '../../types';

const { width } = Dimensions.get('window');

interface CalorieGoalScreenProps {
  userProfile: Partial<UserProfile>;
  onContinue: (calorieData: CalorieGoalData) => void;
  onBack: () => void;
}

interface CalorieGoalData {
  customCalorieGoal?: number;
  weeklyWeightGoal: number; // lbs per week
  useCustomGoal: boolean;
  preferredDeficit: number; // calories
}

const CalorieGoalScreen: React.FC<CalorieGoalScreenProps> = ({ 
  userProfile, 
  onContinue, 
  onBack 
}) => {
  const [useCustomGoal, setUseCustomGoal] = useState(false);
  const [customCalories, setCustomCalories] = useState(2000);
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState(1.0); // lbs per week
  const [selectedGoal, setSelectedGoal] = useState<Goal>('maintain');

  // Calculate BMR and TDEE for reference
  const calculateBMR = () => {
    if (!userProfile.weight || !userProfile.height || !userProfile.age || !userProfile.gender) {
      return 1800; // Fallback
    }
    
    const { weight, height, age, gender } = userProfile;
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9,
    };
    return bmr * (activityMultipliers[userProfile.activityLevel || 'moderately-active']);
  };

  const getRecommendedCalories = () => {
    const tdee = calculateTDEE();
    const deficit = weeklyWeightGoal * 500; // 500 cal deficit per lb per week
    
    switch (selectedGoal) {
      case 'lose':
        return Math.round(tdee - deficit);
      case 'gain':
        return Math.round(tdee + (deficit * 0.6)); // Smaller surplus for lean gains
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  };

  const getWeightChangePerWeek = () => {
    if (useCustomGoal) {
      const tdee = calculateTDEE();
      const difference = customCalories - tdee;
      return Math.round((difference / 500) * 10) / 10; // Round to 1 decimal
    }
    return selectedGoal === 'lose' ? -weeklyWeightGoal : 
           selectedGoal === 'gain' ? weeklyWeightGoal * 0.6 : 0;
  };

  const goalOptions: { goal: Goal; title: string; description: string; icon: string }[] = [
    {
      goal: 'lose',
      title: 'Lose Weight',
      description: 'Create a caloric deficit',
      icon: 'trending-down'
    },
    {
      goal: 'maintain',
      title: 'Maintain Weight',
      description: 'Stay at current weight',
      icon: 'trending-flat'
    },
    {
      goal: 'gain',
      title: 'Gain Weight',
      description: 'Build muscle gradually',
      icon: 'trending-up'
    }
  ];

  useEffect(() => {
    if (!useCustomGoal) {
      setCustomCalories(getRecommendedCalories());
    }
  }, [selectedGoal, weeklyWeightGoal, useCustomGoal]);

  const handleContinue = () => {
    const calorieData: CalorieGoalData = {
      customCalorieGoal: useCustomGoal ? customCalories : undefined,
      weeklyWeightGoal: getWeightChangePerWeek(),
      useCustomGoal,
      preferredDeficit: calculateTDEE() - (useCustomGoal ? customCalories : getRecommendedCalories())
    };
    onContinue(calorieData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.onboarding}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Customize Your Goals</Text>
            <Text style={styles.subtitle}>
              Set your calorie target and weight goals
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Goal Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your main goal?</Text>
            <View style={styles.goalGrid}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.goal}
                  style={[
                    styles.goalCard,
                    selectedGoal === option.goal && styles.goalCardSelected
                  ]}
                  onPress={() => setSelectedGoal(option.goal)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons 
                    name={option.icon as any} 
                    size={32} 
                    color={selectedGoal === option.goal ? colors.white : colors.brandOuterSkin} 
                  />
                  <Text style={[
                    styles.goalTitle,
                    selectedGoal === option.goal && styles.goalTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                    styles.goalDescription,
                    selectedGoal === option.goal && styles.goalDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weight Goal Slider (only for lose/gain) */}
          {selectedGoal !== 'maintain' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Target: {weeklyWeightGoal} lbs per week
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  step={0.25}
                  value={weeklyWeightGoal}
                  onValueChange={setWeeklyWeightGoal}
                  minimumTrackTintColor={colors.brandOuterSkin}
                  maximumTrackTintColor={colors.white}
                  thumbStyle={styles.sliderThumb}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0.5 lb</Text>
                  <Text style={styles.sliderLabel}>Conservative</Text>
                  <Text style={styles.sliderLabel}>2 lbs</Text>
                </View>
              </View>
            </View>
          )}

          {/* Calorie Calculation Display */}
          <View style={styles.section}>
            <View style={styles.calculationCard}>
              <View style={styles.calculationHeader}>
                <MaterialIcons name="calculate" size={28} color={colors.brandOuterSkin} />
                <Text style={styles.calculationTitle}>Your Calorie Breakdown</Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Base Metabolic Rate (BMR):</Text>
                <Text style={styles.calculationValue}>{Math.round(calculateBMR())} cal</Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Total Daily Energy (TDEE):</Text>
                <Text style={styles.calculationValue}>{Math.round(calculateTDEE())} cal</Text>
              </View>
              
              <View style={[styles.calculationRow, styles.calculationRowHighlight]}>
                <Text style={styles.calculationLabelHighlight}>Recommended Target:</Text>
                <Text style={styles.calculationValueHighlight}>
                  {useCustomGoal ? customCalories : getRecommendedCalories()} cal
                </Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Expected weekly change:</Text>
                <Text style={[
                  styles.calculationValue,
                  { color: getWeightChangePerWeek() > 0 ? colors.brandOuterSkin : 
                           getWeightChangePerWeek() < 0 ? colors.secondary : colors.gray600 }
                ]}>
                  {getWeightChangePerWeek() > 0 ? '+' : ''}{getWeightChangePerWeek()} lbs
                </Text>
              </View>
            </View>
          </View>

          {/* Custom Calorie Toggle */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.toggleRow}
              onPress={() => setUseCustomGoal(!useCustomGoal)}
              activeOpacity={0.8}
            >
              <View style={styles.toggleLeft}>
                <MaterialIcons name="tune" size={24} color={colors.white} />
                <Text style={styles.toggleText}>Set custom calorie target</Text>
              </View>
              <View style={[
                styles.toggle,
                useCustomGoal && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  useCustomGoal && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Custom Calorie Slider */}
          {useCustomGoal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Custom Goal: {customCalories} calories
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1200}
                  maximumValue={4000}
                  step={50}
                  value={customCalories}
                  onValueChange={setCustomCalories}
                  minimumTrackTintColor={colors.brandOuterSkin}
                  maximumTrackTintColor={colors.white}
                  thumbStyle={styles.sliderThumb}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1200</Text>
                  <Text style={styles.sliderLabel}>Moderate</Text>
                  <Text style={styles.sliderLabel}>4000</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue to Setup</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  goalGrid: {
    gap: spacing.sm,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.md,
  },
  goalCardSelected: {
    backgroundColor: colors.brandOuterSkin,
    borderColor: colors.white,
  },
  goalTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalTitleSelected: {
    color: colors.white,
  },
  goalDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalDescriptionSelected: {
    color: colors.white,
    opacity: 0.9,
  },
  sliderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.brandOuterSkin,
    width: 24,
    height: 24,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sliderLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  calculationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  calculationTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  calculationRowHighlight: {
    backgroundColor: colors.brandFlesh + '30',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  calculationLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  calculationLabelHighlight: {
    fontSize: fonts.sm,
    color: colors.brandLeaf,
    fontWeight: fonts.semibold,
    flex: 1,
  },
  calculationValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  calculationValueHighlight: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
    marginLeft: spacing.sm,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.white,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: colors.brandOuterSkin,
    alignSelf: 'flex-end',
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.white,
  },
});

export default CalorieGoalScreen;