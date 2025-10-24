import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Button, Card, Input, BrandProgressIndicator } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { UserProfile, ACTIVITY_LEVELS, GOALS, ActivityLevel, Goal } from '../../types';
import { colors, fonts, spacing, layout, borderRadius, shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import WelcomeScreen from './WelcomeScreen';
import CalorieEditor from '../../components/ui/CalorieEditor';

// No external slider - we'll use a custom implementation

interface OnboardingData {
  name: string;
  age: string;
  weight: string;
  height: string;
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: Goal;
}

const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(0); // Start with welcome screen
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderately-active',
    goal: 'maintain',
  });
  const [showCalorieEditor, setShowCalorieEditor] = useState(false);
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  const { setProfile } = useUserStore();

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 0:
        return true; // Welcome screen - always valid
      case 1:
        const nameValid = data.name.trim() !== '';
        const ageNum = parseInt(data.age);
        const ageValid = data.age !== '' && !isNaN(ageNum) && ageNum > 0 && ageNum <= 120;
        return nameValid && ageValid;
      case 2:
        const heightNum = parseFloat(data.height);
        const weightNum = parseFloat(data.weight);
        const heightValid = data.height !== '' && !isNaN(heightNum) && heightNum >= 50 && heightNum <= 250;
        const weightValid = data.weight !== '' && !isNaN(weightNum) && weightNum >= 20 && weightNum <= 300;
        return heightValid && weightValid;
      case 3:
        return true; // Activity level has defaults
      case 4:
        return true; // Goal selection has defaults
      case 5:
        return true; // Confirmation screen
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 5) {
        setStep(step + 1);
      } else {
        completeOnboarding();
      }
    } else {
      // Give detailed, user-friendly error messages
      let errorMessages: string[] = [];
      
      if (step === 1) {
        // Name validation
        if (data.name.trim() === '') {
          errorMessages.push('• Please enter your name');
        }
        
        // Age validation with specific feedback
        if (data.age === '') {
          errorMessages.push('• Please enter your age');
        } else if (isNaN(parseInt(data.age))) {
          errorMessages.push('• Age must be a number (e.g., 25)');
        } else if (parseInt(data.age) <= 0) {
          errorMessages.push('• Age must be greater than 0');
        } else if (parseInt(data.age) > 120) {
          errorMessages.push('• Please enter a valid age (1-120)');
        }
        
      } else if (step === 2) {
        // Height validation
        if (data.height === '') {
          errorMessages.push('• Please enter your height');
        } else if (isNaN(parseFloat(data.height))) {
          errorMessages.push('• Height must be a number (e.g., 175)');
        } else if (parseFloat(data.height) < 50) {
          errorMessages.push('• Height seems too low (minimum 50cm)');
        } else if (parseFloat(data.height) > 250) {
          errorMessages.push('• Height seems too high (maximum 250cm)');
        }
        
        // Weight validation
        if (data.weight === '') {
          errorMessages.push('• Please enter your weight');
        } else if (isNaN(parseFloat(data.weight))) {
          errorMessages.push('• Weight must be a number (e.g., 70)');
        } else if (parseFloat(data.weight) < 20) {
          errorMessages.push('• Weight seems too low (minimum 20kg)');
        } else if (parseFloat(data.weight) > 300) {
          errorMessages.push('• Weight seems too high (maximum 300kg)');
        }
      }
      
      const title = errorMessages.length === 1 ? 'Please Fix This:' : 'Please Fix These:';
      Alert.alert(title, errorMessages.join('\n'));
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = () => {
    const bmr = calculateBMR();
    const dailyCalories = customCalories || calculateDailyCalories();
    
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: data.name,
      age: parseInt(data.age),
      gender: data.gender,
      height: parseFloat(data.height),
      weight: parseFloat(data.weight),
      activityLevel: data.activityLevel,
      goal: data.goal,
      bmr: Math.round(bmr),
      dailyCalorieGoal: dailyCalories,
      customCalorieGoal: customCalories || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProfile(profile);
  };

  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>👋 Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>Basic information to get started</Text>
      
      <Input
        label="Name"
        value={data.name}
        onChangeText={(text) => updateData('name', text)}
        placeholder="e.g., John Doe"
        style={styles.input}
        returnKeyType="next"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      
      <Input
        label="Age (years)"
        value={data.age}
        onChangeText={(text) => updateData('age', text)}
        placeholder="e.g., 25"
        keyboardType="numeric"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.optionButton, data.gender === 'male' && styles.selectedButton]}
          onPress={() => updateData('gender', 'male')}
        >
          <Text style={[styles.optionText, data.gender === 'male' && styles.selectedButtonText]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, data.gender === 'female' && styles.selectedButton]}
          onPress={() => updateData('gender', 'female')}
        >
          <Text style={[styles.optionText, data.gender === 'female' && styles.selectedButtonText]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>📏 Physical Details</Text>
      <Text style={styles.stepSubtitle}>Help us calculate your daily needs</Text>
      
      <Input
        label="Height (centimeters)"
        value={data.height}
        onChangeText={(text) => updateData('height', text)}
        placeholder="e.g., 175"
        keyboardType="numeric"
        style={styles.input}
        returnKeyType="next"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      
      <Input
        label="Weight (kilograms)"
        value={data.weight}
        onChangeText={(text) => updateData('weight', text)}
        placeholder="e.g., 70"
        keyboardType="numeric"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>🏃‍♂️ Activity Level</Text>
      <Text style={styles.stepSubtitle}>How active are you during the week?</Text>
      
      {ACTIVITY_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[styles.optionCard, data.activityLevel === level.value && styles.selectedCard]}
          onPress={() => updateData('activityLevel', level.value)}
        >
          <Text style={[styles.optionCardTitle, data.activityLevel === level.value && styles.selectedText]}>
            {level.label}
          </Text>
          <Text style={[styles.optionCardDesc, data.activityLevel === level.value && styles.selectedDescText]}>{level.description}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );

  const renderStep4 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>🎯 Weight Goal</Text>
      <Text style={styles.stepSubtitle}>What's your main fitness goal?</Text>
      
      {GOALS.map((goal) => (
        <TouchableOpacity
          key={goal.value}
          style={[styles.optionCard, data.goal === goal.value && styles.selectedCard]}
          onPress={() => updateData('goal', goal.value)}
        >
          <Text style={[styles.optionCardTitle, data.goal === goal.value && styles.selectedText]}>
            {goal.label}
          </Text>
          <Text style={[styles.optionCardDesc, data.goal === goal.value && styles.selectedDescText]}>{goal.description}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );

  const calculateBMR = () => {
    const { weight, height, age, gender } = data;
    const weightNum = parseFloat(weight) || 70;
    const heightNum = parseFloat(height) || 170;
    const ageNum = parseInt(age) || 25;
    
    if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
      return 1500; // Fallback BMR
    }
    
    if (gender === 'male') {
      return (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else {
      return (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9,
    };
    const multiplier = activityMultipliers[data.activityLevel] || 1.55;
    return bmr * multiplier;
  };

  const calculateDailyCalories = () => {
    const tdee = calculateTDEE();
    switch (data.goal) {
      case 'lose':
        return Math.round(tdee - 500);
      case 'gain':
        return Math.round(tdee + 300);
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  };

  const renderStep5 = () => {
    const bmr = Math.round(calculateBMR());
    const tdee = Math.round(calculateTDEE());
    const recommendedCalories = calculateDailyCalories();
    const currentCalories = customCalories || recommendedCalories;

    // Calculate deficit/surplus for display
    const getDeficitSurplus = () => {
      const difference = tdee - currentCalories;
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

    const { type, amount } = getDeficitSurplus();
    const weeklyChange = getWeeklyWeightChange();

    return (
      <Card style={styles.compactStepCard}>
        <Text style={styles.compactStepTitle}>🔥 Your Daily Target</Text>
        <Text style={styles.compactStepSubtitle}>
          {showCustomEditor ? 'Adjust your target' : 'Ready to start tracking!'}
        </Text>
        
        {!showCustomEditor ? (
          // Compact Summary View
          <>
            {/* Compact Calorie Target Display */}
            <View style={styles.compactCalorieTargetContainer}>
              <Text style={styles.compactCalorieTargetNumber}>{currentCalories.toLocaleString()}</Text>
              <Text style={styles.compactCalorieTargetLabel}>calories/day</Text>
              {customCalories && (
                <Text style={styles.compactCustomLabel}>✨ Custom</Text>
              )}
              <TouchableOpacity
                onPress={async () => {
                  const url = 'https://pubmed.ncbi.nlm.nih.gov/2305711/';
                  const supported = await Linking.canOpenURL(url);
                  if (supported) {
                    await Linking.openURL(url);
                  } else {
                    Alert.alert('Error', 'Unable to open link');
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.medicalCitation}>
                  Calculated using Mifflin-St Jeor Equation{'\n'}(American Journal of Clinical Nutrition, 1990)
                  {'\n'}
                  <Text style={styles.citationLink}>Tap for medical source →</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Compact Summary Stats */}
            <View style={styles.compactStatsContainer}>
              <View style={styles.compactStatItem}>
                <Text style={styles.compactStatValue}>{bmr}</Text>
                <Text style={styles.compactStatLabel}>BMR</Text>
              </View>
              <View style={styles.compactStatItem}>
                <Text style={styles.compactStatValue}>{tdee}</Text>
                <Text style={styles.compactStatLabel}>TDEE</Text>
              </View>
              <View style={styles.compactStatItem}>
                <Text style={styles.compactStatValue}>
                  {data.goal === 'lose' ? 'Lose' : data.goal === 'gain' ? 'Gain' : 'Maintain'}
                </Text>
                <Text style={styles.compactStatLabel}>Goal</Text>
              </View>
            </View>

            {/* Compact Customize Button */}
            <TouchableOpacity 
              style={styles.compactCustomizeButton}
              onPress={() => setShowCustomEditor(true)}
            >
              <MaterialIcons name="tune" size={16} color={colors.brandOuterSkin} />
              <Text style={styles.compactCustomizeButtonText}>
                {customCalories ? 'Edit' : 'Customize'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Custom Editor View
          <>
            {/* Free-Form Calorie Input */}
            <View style={styles.compactCalorieContainer}>
              <Text style={styles.compactCalorieLabel}>Enter your daily calorie target:</Text>
              
              {/* Manual Input */}
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.calorieInput}
                  value={Math.round(currentCalories).toString()}
                  onChangeText={(text) => {
                    // Allow any number input, validate on blur/submit
                    const numValue = parseInt(text) || 0;
                    setCustomCalories(numValue);
                  }}
                  onBlur={() => {
                    // Very gentle validation - only prevent extreme values
                    if (currentCalories < 800) {
                      setCustomCalories(800);
                    } else if (currentCalories > 6000) {
                      setCustomCalories(6000);
                    }
                  }}
                  keyboardType="numeric"
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder="e.g., 2000"
                />
                <Text style={styles.caloriesUnit}>calories</Text>
              </View>

              <Text style={styles.rangeHint}>💡 Recommended: 1,200 - 4,000 calories</Text>
              <Text style={styles.freeFormHint}>Enter any value between 800 - 6,000 that fits your goals</Text>
            </View>

            {/* Compact Impact Display */}
            <View style={styles.compactImpactContainer}>
              <View style={styles.compactImpactRow}>
                <View style={styles.compactImpactItem}>
                  <Text style={styles.compactImpactLabel}>Daily {type}:</Text>
                  <Text style={[
                    styles.compactImpactValue,
                    { color: type === 'deficit' ? colors.secondary : 
                             type === 'surplus' ? colors.brandOuterSkin : colors.gray600 }
                  ]}>
                    {amount > 0 ? `${amount.toLocaleString()} cal` : 'Balanced'}
                  </Text>
                </View>
                
                <View style={styles.compactImpactItem}>
                  <Text style={styles.compactImpactLabel}>Weekly change:</Text>
                  <Text style={[
                    styles.compactImpactValue,
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

            {/* Reset Button */}
            {customCalories && customCalories !== recommendedCalories && (
              <TouchableOpacity 
                style={styles.editorResetButton} 
                onPress={() => setCustomCalories(null)}
              >
                <MaterialIcons name="refresh" size={18} color={colors.brandOuterSkin} />
                <Text style={styles.editorResetButtonText}>Reset to Recommended</Text>
              </TouchableOpacity>
            )}

            {/* Back to Summary */}
            <TouchableOpacity 
              style={styles.backToSummaryButton}
              onPress={() => setShowCustomEditor(false)}
            >
              <MaterialIcons name="check" size={18} color={colors.white} />
              <Text style={styles.backToSummaryButtonText}>Done Customizing</Text>
            </TouchableOpacity>
          </>
        )}
      </Card>
    );
  };

  // Handle welcome screen
  if (step === 0) {
    return <WelcomeScreen onContinue={() => setStep(1)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Small Banner */}
          <View style={styles.smallBanner}>
            <View style={styles.smallBannerContent}>
              <Text style={styles.smallBannerTitle}>Profile Setup</Text>
              <Text style={styles.smallBannerStep}>Step {step} of 5</Text>
            </View>
            <BrandProgressIndicator 
              progress={((step - 1) / 4) * 100} 
              height={3}
              style={styles.smallProgressIndicator}
            />
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <Button
              title="Back"
              onPress={prevStep}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <Button
            title={
              step === 0 ? "Get Started" :
              step === 1 ? "Continue" :
              step === 2 ? "Continue" : 
              step === 3 ? "Continue" :
              step === 4 ? "Set My Goals" :
              step === 5 ? "Complete Setup" : "Continue"
            }
            onPress={nextStep}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  smallBanner: {
    backgroundColor: colors.brandFlesh + '15',
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '20',
  },
  smallBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  smallBannerTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  smallBannerStep: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  smallProgressIndicator: {
    // No additional styling needed
  },
  stepCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 0,
    padding: spacing.xl,
    ...shadows.lg,
  },
  stepTitle: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  input: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: colors.brandOuterSkin,
    borderColor: colors.brandLeaf,
    borderWidth: 2,
  },
  optionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: fonts.medium,
  },
  selectedText: {
    color: colors.brandOuterSkin,
    fontWeight: fonts.bold,
  },
  selectedDescText: {
    color: colors.brandLeaf,
    fontWeight: fonts.medium,
  },
  selectedButtonText: {
    color: colors.white,
    fontWeight: fonts.bold,
  },
  optionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.surfaceSecondary,
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  selectedCard: {
    backgroundColor: colors.white,
    borderColor: colors.brandOuterSkin,
    borderWidth: 2,
    ...shadows.md,
  },
  optionCardTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionCardDesc: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  // Confirmation screen styles
  calorieTargetContainer: {
    alignItems: 'center',
    backgroundColor: colors.brandFlesh + '20',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  calorieTargetNumber: {
    fontSize: fonts['4xl'],
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
    marginBottom: spacing.xs,
  },
  calorieTargetLabel: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  customLabel: {
    fontSize: fonts.sm,
    color: colors.brandOuterSkin,
    fontWeight: fonts.semibold,
    marginTop: spacing.xs,
  },
  breakdownContainer: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  editTargetButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brandOuterSkin + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '30',
    alignItems: 'center',
  },
  editTargetText: {
    fontSize: fonts.sm,
    color: colors.brandOuterSkin,
    fontWeight: fonts.medium,
  },
  // New integrated editor styles
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brandFlesh + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.brandOuterSkin + '40',
    gap: spacing.sm,
  },
  customizeButtonText: {
    fontSize: fonts.base,
    color: colors.brandOuterSkin,
    fontWeight: fonts.semibold,
  },
  // Editor view styles
  editorTargetContainer: {
    alignItems: 'center',
    backgroundColor: colors.brandFlesh + '15',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '20',
  },
  editorTargetNumber: {
    fontSize: 42,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  editorTargetLabel: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  // Compact Editor Styles
  compactCalorieContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  compactCalorieLabel: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: fonts.medium,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  calorieInput: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.brandOuterSkin + '40',
    minWidth: 140,
    textAlign: 'center',
    ...shadows.sm,
  },
  caloriesUnit: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  rangeHint: {
    fontSize: fonts.xs,
    color: colors.brandOuterSkin,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: fonts.medium,
  },
  freeFormHint: {
    fontSize: fonts.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Compact Impact Styles
  compactImpactContainer: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  compactImpactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  compactImpactItem: {
    alignItems: 'center',
    flex: 1,
  },
  compactImpactLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  compactImpactValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.bold,
    textAlign: 'center',
  },
  // Impact display styles
  editorImpactContainer: {
    marginBottom: spacing.lg,
  },
  editorImpactTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  editorImpactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  editorImpactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  editorImpactLabel: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  editorImpactValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
  },
  // Action buttons
  editorResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  editorResetButtonText: {
    fontSize: fonts.sm,
    color: colors.brandOuterSkin,
    fontWeight: fonts.medium,
  },
  backToSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandOuterSkin,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  backToSummaryButtonText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.semibold,
  },
  
  // Compact styles for step 5
  compactHeader: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.md, // Reduced from lg
  },
  compactHeaderGradient: {
    borderRadius: borderRadius.xl, // Reduced from 2xl
    paddingVertical: spacing.lg, // Reduced from xl
    paddingHorizontal: spacing.lg,
    ...shadows.md, // Reduced from lg
  },
  compactTitle: {
    fontSize: fonts.xl, // Reduced from 2xl
    fontWeight: fonts.bold,
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  compactSubtitle: {
    fontSize: fonts.sm, // Reduced from base
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: spacing.sm, // Reduced from md
  },
  compactStepCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.md, // Reduced from lg
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, // Reduced from 2xl
    borderWidth: 0,
    padding: spacing.lg, // Reduced from xl
    ...shadows.md, // Reduced from lg
  },
  compactStepTitle: {
    fontSize: fonts.xl, // Reduced from 2xl
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs, // Reduced from sm
    letterSpacing: -0.5,
  },
  compactStepSubtitle: {
    fontSize: fonts.base, // Reduced from lg
    color: colors.textSecondary,
    marginBottom: spacing.lg, // Reduced from xl
    lineHeight: 20, // Reduced from 24
  },
  compactCalorieTargetContainer: {
    alignItems: 'center',
    backgroundColor: colors.brandFlesh + '20',
    borderRadius: borderRadius.md, // Reduced from lg
    paddingVertical: spacing.lg, // Reduced from xl
    paddingHorizontal: spacing.md, // Reduced from lg
    marginVertical: spacing.md, // Reduced from lg
  },
  compactCalorieTargetNumber: {
    fontSize: fonts['3xl'], // Reduced from 4xl
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
    marginBottom: spacing.xs,
  },
  compactCalorieTargetLabel: {
    fontSize: fonts.sm, // Reduced from base
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  compactCustomLabel: {
    fontSize: fonts.xs, // Reduced from sm
    color: colors.brandOuterSkin,
    fontWeight: fonts.semibold,
    marginTop: spacing.xs,
  },
  medicalCitation: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  citationLink: {
    fontSize: 9,
    color: colors.brandOuterSkin,
    textDecorationLine: 'underline',
    fontStyle: 'normal',
  },
  compactStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.sm, // Reduced from md
    marginVertical: spacing.sm, // Reduced from md
  },
  compactStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  compactStatValue: {
    fontSize: fonts.base, // Reduced from lg
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  compactStatLabel: {
    fontSize: fonts.xs, // Reduced from sm
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  compactCustomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md, // Reduced from lg
    paddingVertical: spacing.sm, // Reduced from md
    paddingHorizontal: spacing.md, // Reduced from lg
    backgroundColor: colors.brandFlesh + '20',
    borderRadius: borderRadius.md, // Reduced from lg
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '40',
    gap: spacing.xs, // Reduced from sm
  },
  compactCustomizeButtonText: {
    fontSize: fonts.sm, // Reduced from base
    color: colors.brandOuterSkin,
    fontWeight: fonts.semibold,
  },
});

export default OnboardingScreen; 