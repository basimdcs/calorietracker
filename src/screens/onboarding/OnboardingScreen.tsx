import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, Input } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { UserProfile, ACTIVITY_LEVELS, GOALS, ActivityLevel, Goal } from '../../types';
import { colors, fonts, spacing, layout } from '../../constants/theme';

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
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderately-active',
    goal: 'maintain',
  });

  const { setProfile } = useUserStore();

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
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
        return true; // Activity level and goal have defaults
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 3) {
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
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = () => {
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: data.name,
      age: parseInt(data.age),
      gender: data.gender,
      height: parseFloat(data.height),
      weight: parseFloat(data.weight),
      activityLevel: data.activityLevel,
      goal: data.goal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProfile(profile);
  };

  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>Basic information to get started</Text>
      
      <Input
        label="Name"
        value={data.name}
        onChangeText={(text) => updateData('name', text)}
        placeholder="e.g., John Doe"
        style={styles.input}
      />
      
      <Input
        label="Age (years)"
        value={data.age}
        onChangeText={(text) => updateData('age', text)}
        placeholder="e.g., 25"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.optionButton, data.gender === 'male' && styles.selectedButton]}
          onPress={() => updateData('gender', 'male')}
        >
          <Text style={[styles.optionText, data.gender === 'male' && styles.selectedText]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, data.gender === 'female' && styles.selectedButton]}
          onPress={() => updateData('gender', 'female')}
        >
          <Text style={[styles.optionText, data.gender === 'female' && styles.selectedText]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>Physical Details</Text>
      <Text style={styles.stepSubtitle}>Help us calculate your daily needs</Text>
      
      <Input
        label="Height (centimeters)"
        value={data.height}
        onChangeText={(text) => updateData('height', text)}
        placeholder="e.g., 175"
        keyboardType="numeric"
        style={styles.input}
      />
      
      <Input
        label="Weight (kilograms)"
        value={data.weight}
        onChangeText={(text) => updateData('weight', text)}
        placeholder="e.g., 70"
        keyboardType="numeric"
        style={styles.input}
      />
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>Activity & Goals</Text>
      <Text style={styles.stepSubtitle}>Set your activity level and weight goal</Text>
      
      <Text style={styles.label}>Activity Level</Text>
      {ACTIVITY_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[styles.optionCard, data.activityLevel === level.value && styles.selectedCard]}
          onPress={() => updateData('activityLevel', level.value)}
        >
          <Text style={[styles.optionCardTitle, data.activityLevel === level.value && styles.selectedText]}>
            {level.label}
          </Text>
          <Text style={styles.optionCardDesc}>{level.description}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Goal</Text>
      {GOALS.map((goal) => (
        <TouchableOpacity
          key={goal.value}
          style={[styles.optionCard, data.goal === goal.value && styles.selectedCard]}
          onPress={() => updateData('goal', goal.value)}
        >
          <Text style={[styles.optionCardTitle, data.goal === goal.value && styles.selectedText]}>
            {goal.label}
          </Text>
          <Text style={styles.optionCardDesc}>{goal.description}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
          
          <View style={styles.progressBar}>
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                style={[
                  styles.progressDot,
                  num <= step ? styles.progressDotActive : styles.progressDotInactive
                ]}
              />
            ))}
          </View>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
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
          title={step === 3 ? "Complete Setup" : "Next"}
          onPress={nextStep}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts['3xl'],
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotInactive: {
    backgroundColor: colors.gray300,
  },
  stepCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.base,
    fontWeight: fonts.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.white,
  },
  optionCard: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginBottom: spacing.sm,
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionCardTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionCardDesc: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
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
});

export default OnboardingScreen; 