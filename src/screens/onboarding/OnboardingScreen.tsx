import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Card, Input } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { UserProfile, ACTIVITY_LEVELS, GOALS, ActivityLevel, Goal } from '../../types';
import { colors, fonts, spacing, layout, borderRadius, shadows } from '../../constants/theme';

interface OnboardingData {
  name: string;
  age: string;
  weight: string;
  height: string;
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: Goal;
  calorieTarget?: number; // user editable
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
    calorieTarget: undefined,
  });

  const { setProfile } = useUserStore();

  const totalSteps = 3;
  const progress = step / totalSteps;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const parseNumber = (v?: string): number | undefined => {
    const n = v ? parseFloat(v) : undefined;
    return typeof n === 'number' && !isNaN(n) ? n : undefined;
  };

  const activityMultiplier = (level: ActivityLevel): number => {
    switch (level) {
      case 'sedentary': return 1.2;
      case 'lightly-active': return 1.375;
      case 'moderately-active': return 1.55;
      case 'very-active': return 1.725;
      case 'extra-active': return 1.9;
      default: return 1.55;
    }
  };

  const bmr = useMemo(() => {
    const age = parseNumber(data.age);
    const height = parseNumber(data.height);
    const weight = parseNumber(data.weight);
    if (!age || !height || !weight) return undefined;
    // Mifflin-St Jeor
    const s = data.gender === 'male' ? 5 : -161;
    return Math.round(10 * weight + 6.25 * height - 5 * age + s);
  }, [data.age, data.height, data.weight, data.gender]);

  const maintenance = useMemo(() => {
    if (!bmr) return undefined;
    return Math.round(bmr * activityMultiplier(data.activityLevel));
  }, [bmr, data.activityLevel]);

  const suggestedTarget = useMemo(() => {
    if (!maintenance) return 2000;
    switch (data.goal) {
      case 'lose': return Math.max(1200, Math.round(maintenance * 0.8));
      case 'gain': return Math.min(5000, Math.round(maintenance * 1.15));
      default: return Math.round(maintenance);
    }
  }, [maintenance, data.goal]);

  const currentTarget = Math.min(5000, Math.max(1000, Math.round(data.calorieTarget ?? suggestedTarget)));

  const adjustTarget = (delta: number) => {
    updateData('calorieTarget', Math.min(5000, Math.max(1000, currentTarget + delta)));
  };

  const setTargetPercentage = (pct: number) => {
    if (!maintenance) {
      updateData('calorieTarget', Math.round((data.calorieTarget ?? suggestedTarget) * pct));
    } else {
      updateData('calorieTarget', Math.round(maintenance * pct));
    }
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
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        completeOnboarding();
      }
    } else {
      let errorMessages: string[] = [];
      if (step === 1) {
        if (data.name.trim() === '') errorMessages.push('• Please enter your name');
        if (data.age === '') errorMessages.push('• Please enter your age');
        else if (isNaN(parseInt(data.age))) errorMessages.push('• Age must be a number (e.g., 25)');
        else if (parseInt(data.age) <= 0) errorMessages.push('• Age must be greater than 0');
        else if (parseInt(data.age) > 120) errorMessages.push('• Please enter a valid age (1-120)');
      } else if (step === 2) {
        if (data.height === '') errorMessages.push('• Please enter your height');
        else if (isNaN(parseFloat(data.height))) errorMessages.push('• Height must be a number (e.g., 175)');
        else if (parseFloat(data.height) < 50) errorMessages.push('• Height seems too low (minimum 50cm)');
        else if (parseFloat(data.height) > 250) errorMessages.push('• Height seems too high (maximum 250cm)');
        if (data.weight === '') errorMessages.push('• Please enter your weight');
        else if (isNaN(parseFloat(data.weight))) errorMessages.push('• Weight must be a number (e.g., 70)');
        else if (parseFloat(data.weight) < 20) errorMessages.push('• Weight seems too low (minimum 20kg)');
        else if (parseFloat(data.weight) > 300) errorMessages.push('• Weight seems too high (maximum 300kg)');
      }
      Alert.alert(errorMessages.length === 1 ? 'Please Fix This:' : 'Please Fix These:', errorMessages.join('\n'));
    }
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); };

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
      dailyCalorieGoal: currentTarget,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProfile(profile);
  };

  const Chip = ({ selected, children, onPress }: { selected: boolean; children: React.ReactNode; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>{children}</Text>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeaderRow}>
        <MaterialIcons name="person" size={20} color={colors.primary} />
        <Text style={styles.stepTitle}>Tell us about yourself</Text>
      </View>
      <Text style={styles.stepSubtitle}>Basic information to get started</Text>
      <Input label="Name" value={data.name} onChangeText={(t) => updateData('name', t)} placeholder="e.g., John Doe" style={styles.input} />
      <Input label="Age (years)" value={data.age} onChangeText={(t) => updateData('age', t)} placeholder="e.g., 25" keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.chipRow}>
        <Chip selected={data.gender === 'male'} onPress={() => updateData('gender', 'male')}>Male</Chip>
        <Chip selected={data.gender === 'female'} onPress={() => updateData('gender', 'female')}>Female</Chip>
      </View>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeaderRow}>
        <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
        <Text style={styles.stepTitle}>Physical Details</Text>
      </View>
      <Text style={styles.stepSubtitle}>Help us calculate your daily needs</Text>

      <Input label="Height (centimeters)" value={data.height} onChangeText={(t) => updateData('height', t)} placeholder="e.g., 175" keyboardType="numeric" style={styles.input} />
      <Input label="Weight (kilograms)" value={data.weight} onChangeText={(t) => updateData('weight', t)} placeholder="e.g., 70" keyboardType="numeric" style={styles.input} />
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeaderRow}>
        <MaterialIcons name="flag-circle" size={20} color={colors.primary} />
        <Text style={styles.stepTitle}>Activity, Goal & Target</Text>
      </View>
      <Text style={styles.stepSubtitle}>Choose your plan and adjust your daily calories</Text>

      <Text style={styles.label}>Activity Level</Text>
      <View style={styles.chipWrap}>
        {ACTIVITY_LEVELS.map((level) => (
          <Chip key={level.value} selected={data.activityLevel === level.value} onPress={() => updateData('activityLevel', level.value)}>
            {level.label}
          </Chip>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Goal</Text>
      <View style={styles.chipWrap}>
        {GOALS.map((goal) => (
          <Chip key={goal.value} selected={data.goal === goal.value} onPress={() => updateData('goal', goal.value)}>
            {goal.label}
          </Chip>
        ))}
      </View>

      {/* Colorful Calorie Target Editor */}
      <LinearGradient colors={[colors.primaryLight, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.targetCard}>
        <Text style={styles.targetLabel}>Daily Calorie Target</Text>
        <View style={styles.targetRow}>
          <TouchableOpacity onPress={() => adjustTarget(-100)} style={styles.targetButton} activeOpacity={0.8}>
            <MaterialIcons name="remove" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <View style={styles.targetValueBox}>
            <Text style={styles.targetValue}>{currentTarget.toLocaleString()}</Text>
            <Text style={styles.targetUnit}>kcal</Text>
          </View>
          <TouchableOpacity onPress={() => adjustTarget(100)} style={styles.targetButton} activeOpacity={0.8}>
            <MaterialIcons name="add" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.targetPresets}>
          <Chip selected={false} onPress={() => setTargetPercentage(0.8)}>Lose (−20%)</Chip>
          <Chip selected={false} onPress={() => setTargetPercentage(1.0)}>Maintain</Chip>
          <Chip selected={false} onPress={() => setTargetPercentage(1.15)}>Gain (+15%)</Chip>
        </View>
        {maintenance && (
          <Text style={styles.maintenanceHint} numberOfLines={1}>
            Suggested: {suggestedTarget.toLocaleString()} kcal • Maintenance est. {maintenance.toLocaleString()} kcal
          </Text>
        )}
      </LinearGradient>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={[colors.primaryLight, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientHeader}>
        <View style={styles.headerInner}> 
          <Text style={styles.headerTitle}>Setup Your Profile</Text>
          <Text style={styles.headerSubtitle}>Personalize your goals</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{`Step ${step} of ${totalSteps}`}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <Button title="Back" onPress={prevStep} variant="outline" style={styles.backButton} />
        )}
        <Button title={step === totalSteps ? 'Complete Setup' : 'Next'} onPress={nextStep} style={styles.nextButton} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradientHeader: {
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    paddingBottom: spacing.lg,
    ...shadows.md,
  },
  headerInner: { paddingTop: spacing.xl, paddingHorizontal: layout.screenPadding },
  headerTitle: { fontSize: fonts['3xl'], fontWeight: fonts.bold, color: colors.textOnPrimary },
  headerSubtitle: { fontSize: fonts.base, color: colors.textOnPrimary, opacity: 0.9, marginTop: spacing.xs },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.white, opacity: 0.9 },
  progressLabel: { color: colors.textOnPrimary, fontSize: fonts.sm, marginTop: spacing.xs, opacity: 0.9 },
  scrollContent: { flexGrow: 1, paddingTop: spacing.lg },
  stepCard: { marginHorizontal: layout.screenPadding, marginBottom: spacing.lg },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  stepTitle: { fontSize: fonts['2xl'], fontWeight: fonts.bold, color: colors.textPrimary },
  stepSubtitle: { fontSize: fonts.base, color: colors.textSecondary, marginBottom: spacing.lg },
  input: { marginBottom: spacing.md },
  label: { fontSize: fonts.base, fontWeight: fonts.medium, color: colors.textPrimary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.gray200 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fonts.sm, color: colors.textPrimary },
  chipTextSelected: { color: colors.textOnPrimary, fontWeight: fonts.semibold },
  targetCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg },
  targetLabel: { color: colors.textOnPrimary, fontSize: fonts.sm, opacity: 0.9, marginBottom: spacing.sm },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  targetValueBox: { alignItems: 'center', justifyContent: 'center' },
  targetValue: { color: colors.textOnPrimary, fontSize: fonts['3xl'], fontWeight: fonts.bold, lineHeight: fonts['3xl'] * 1.1 },
  targetUnit: { color: colors.textOnPrimary, opacity: 0.9 },
  targetPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  maintenanceHint: { color: colors.textOnPrimary, opacity: 0.9, fontSize: fonts.xs, marginTop: spacing.sm },
  footer: { flexDirection: 'row', paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg, gap: spacing.sm },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});

export default OnboardingScreen; 