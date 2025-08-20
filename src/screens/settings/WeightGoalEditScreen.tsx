import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card, Input } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { Goal, GOALS } from '../../types';

const WeightGoalEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, updateProfile } = useUserStore();
  
  const [selectedGoal, setSelectedGoal] = useState<Goal>(
    profile?.goal || 'maintain'
  );
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState<string>(
    profile?.weeklyWeightGoal ? Math.abs(profile.weeklyWeightGoal).toString() : '1'
  );
  const [customCalorieGoal, setCustomCalorieGoal] = useState<string>(
    profile?.customCalorieGoal?.toString() || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedGoal !== 'maintain') {
      const weeklyGoal = parseFloat(weeklyWeightGoal);
      if (!weeklyGoal || weeklyGoal < 0.1 || weeklyGoal > 2) {
        newErrors.weeklyWeightGoal = 'Weekly goal must be between 0.1 and 2.0 lbs';
      }
    }

    if (customCalorieGoal) {
      const customGoal = parseInt(customCalorieGoal);
      if (!customGoal || customGoal < 800 || customGoal > 5000) {
        newErrors.customCalorieGoal = 'Custom calorie goal must be between 800 and 5000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors.');
      return;
    }

    if (!profile) return;

    let finalWeeklyGoal: number | undefined = undefined;
    if (selectedGoal !== 'maintain') {
      const weeklyGoal = parseFloat(weeklyWeightGoal);
      finalWeeklyGoal = selectedGoal === 'lose' ? -weeklyGoal : weeklyGoal;
    }

    const updatedProfile = {
      ...profile,
      goal: selectedGoal,
      weeklyWeightGoal: finalWeeklyGoal,
      customCalorieGoal: customCalorieGoal ? parseInt(customCalorieGoal) : undefined,
      updatedAt: new Date(),
    };

    updateProfile(updatedProfile);
    Alert.alert('Success', 'Your weight goals have been updated!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weight Goals</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Description */}
            <Card style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <MaterialIcons name="flag" size={24} color={colors.primary} />
                <Text style={styles.descriptionTitle}>Set Your Weight Goals</Text>
              </View>
              <Text style={styles.descriptionText}>
                Choose your weight goal and set a healthy weekly target. This will determine your daily calorie needs.
              </Text>
            </Card>

            {/* Goal Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Goal</Text>
              
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.optionCard,
                    selectedGoal === goal.value && styles.selectedOptionCard,
                  ]}
                  onPress={() => setSelectedGoal(goal.value)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.radioButton,
                        selectedGoal === goal.value && styles.selectedRadioButton,
                      ]}>
                        {selectedGoal === goal.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionTitle,
                          selectedGoal === goal.value && styles.selectedOptionTitle,
                        ]}>
                          {goal.label}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          selectedGoal === goal.value && styles.selectedOptionDescription,
                        ]}>
                          {goal.description}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons 
                      name={
                        goal.value === 'lose' ? 'trending-down' : 
                        goal.value === 'gain' ? 'trending-up' : 'trending-flat'
                      } 
                      size={24} 
                      color={selectedGoal === goal.value ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weekly Target - Only for lose/gain */}
            {selectedGoal !== 'maintain' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Weekly Target ({selectedGoal === 'lose' ? 'Loss' : 'Gain'})
                </Text>
                
                <Card style={styles.card}>
                  <Input
                    label={`Target lbs per week to ${selectedGoal}`}
                    value={weeklyWeightGoal}
                    onChangeText={setWeeklyWeightGoal}
                    placeholder="1.0"
                    keyboardType="decimal-pad"
                    error={errors.weeklyWeightGoal}
                  />
                  <Text style={styles.inputHelper}>
                    Recommended: 0.5-2.0 lbs per week for healthy {selectedGoal === 'lose' ? 'weight loss' : 'weight gain'}
                  </Text>
                </Card>
              </View>
            )}

            {/* Calorie Target */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Calorie Target</Text>
              
              <Card style={styles.card}>
                <View style={styles.calorieSection}>
                  <Text style={styles.inputLabel}>Target calories per day</Text>
                  
                  <View style={styles.calorieToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.calorieToggleButton,
                        !customCalorieGoal && styles.selectedToggleButton,
                      ]}
                      onPress={() => setCustomCalorieGoal('')}
                    >
                      <MaterialIcons 
                        name="auto-awesome" 
                        size={16} 
                        color={!customCalorieGoal ? colors.white : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.toggleButtonText,
                        !customCalorieGoal && styles.selectedToggleText,
                      ]}>
                        Automatic
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.calorieToggleButton,
                        customCalorieGoal && styles.selectedToggleButton,
                      ]}
                      onPress={() => setCustomCalorieGoal(profile?.customCalorieGoal?.toString() || '2000')}
                    >
                      <MaterialIcons 
                        name="edit" 
                        size={16} 
                        color={customCalorieGoal ? colors.white : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.toggleButtonText,
                        customCalorieGoal && styles.selectedToggleText,
                      ]}>
                        Custom
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {customCalorieGoal ? (
                    <Input
                      label="Custom daily calorie target"
                      value={customCalorieGoal}
                      onChangeText={setCustomCalorieGoal}
                      placeholder="2000"
                      keyboardType="numeric"
                      error={errors.customCalorieGoal}
                    />
                  ) : (
                    <View style={styles.autoCalorieDisplay}>
                      <Text style={styles.autoCalorieLabel}>Calculated based on your goals:</Text>
                      <Text style={styles.autoCalorieValue}>
                        Will be calculated automatically from BMR, activity level, and weight goal
                      </Text>
                    </View>
                  )}

                  <Text style={styles.inputHelper}>
                    {customCalorieGoal 
                      ? 'Custom target will override automatic calculations'
                      : 'Automatic calculation uses your BMR, activity level, and weight goal'
                    }
                  </Text>
                </View>
              </Card>
            </View>

            {/* Current Selection Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="assessment" size={24} color={colors.brandOuterSkin} />
                <Text style={styles.summaryTitle}>Goal Summary</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Primary Goal:</Text>
                <Text style={styles.summaryValue}>
                  {GOALS.find(goal => goal.value === selectedGoal)?.label}
                </Text>
              </View>
              
              {selectedGoal !== 'maintain' && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Weekly Target:</Text>
                  <Text style={styles.summaryValue}>
                    {weeklyWeightGoal} lbs per week
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Daily Calories:</Text>
                <Text style={styles.summaryValue}>
                  {customCalorieGoal 
                    ? `${customCalorieGoal} cal/day (Custom)`
                    : 'Auto-calculated'
                  }
                </Text>
              </View>
            </Card>

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  saveButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  descriptionCard: {
    padding: spacing.lg,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  descriptionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  descriptionText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedOptionCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedOptionTitle: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  selectedOptionDescription: {
    color: colors.textPrimary,
  },
  card: {
    padding: spacing.lg,
  },
  inputHelper: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  summaryCard: {
    padding: spacing.lg,
    backgroundColor: colors.brandFlesh + '20',
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '30',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.brandOuterSkin,
  },
  calorieSection: {
    gap: spacing.md,
  },
  calorieToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  calorieToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    gap: spacing.xs,
  },
  selectedToggleButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedToggleText: {
    color: colors.white,
  },
  autoCalorieDisplay: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  autoCalorieLabel: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  autoCalorieValue: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default WeightGoalEditScreen;