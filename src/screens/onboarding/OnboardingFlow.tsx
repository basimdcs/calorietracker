import React, { useState } from 'react';
import { UserProfile, ActivityLevel, Goal } from '../../types';
import { useUserStore } from '../../stores/userStore';
import WelcomeScreen from './WelcomeScreen';
import FeatureIntroScreen from './FeatureIntroScreen';
import PermissionsScreen from './PermissionsScreen';
import OnboardingScreen from './OnboardingScreen';
import CalorieGoalScreen from './CalorieGoalScreen';
import OnboardingCompleteScreen from './OnboardingCompleteScreen';

type OnboardingStep = 
  | 'welcome'
  | 'features' 
  | 'permissions'
  | 'profile'
  | 'goals'
  | 'complete';

interface CalorieGoalData {
  customCalorieGoal?: number;
  weeklyWeightGoal: number;
  useCustomGoal: boolean;
  preferredDeficit: number;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile'); // Skip external welcome, use internal one
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [calorieGoalData, setCalorieGoalData] = useState<CalorieGoalData | null>(null);
  const { setProfile } = useUserStore();

  const handleWelcomeContinue = () => {
    setCurrentStep('features');
  };

  const handleFeaturesContinue = () => {
    setCurrentStep('permissions');
  };

  const handleFeaturesSkip = () => {
    setCurrentStep('permissions');
  };

  const handlePermissionsContinue = () => {
    setCurrentStep('profile');
  };

  const handlePermissionsSkip = () => {
    setCurrentStep('profile');
  };

  const handleProfileComplete = () => {
    // This will be called when the built-in OnboardingScreen completes
    // We need to get the profile from the userStore and continue to goals
    const { profile } = useUserStore.getState();
    if (profile) {
      setUserProfile({
        ...profile,
        // Remove the calculated fields as they'll be recalculated
        bmr: undefined,
        dailyCalorieGoal: undefined,
      });
      setCurrentStep('goals');
    }
  };

  const handleGoalsComplete = (goalData: CalorieGoalData) => {
    setCalorieGoalData(goalData);
    
    // Calculate final profile with custom goals if specified
    const finalProfile: UserProfile = {
      ...userProfile,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;

    // Calculate BMR and TDEE
    const bmr = calculateBMR(finalProfile);
    const tdee = calculateTDEE(finalProfile, bmr);
    
    // Apply custom calorie goal or use calculated one
    const dailyCalorieGoal = goalData.useCustomGoal 
      ? goalData.customCalorieGoal!
      : calculateDailyCalories(finalProfile, tdee);

    const completeProfile: UserProfile = {
      ...finalProfile,
      bmr,
      dailyCalorieGoal,
      // Store custom goal preferences for later use
      customCalorieGoal: goalData.useCustomGoal ? goalData.customCalorieGoal : undefined,
      weeklyWeightGoal: goalData.weeklyWeightGoal,
    };

    setUserProfile(completeProfile);
    setProfile(completeProfile);
    setCurrentStep('complete');
  };

  const handleGoalsBack = () => {
    setCurrentStep('profile');
  };

  const handleOnboardingComplete = () => {
    // Navigation will be handled by the parent component
    // This completes the onboarding flow
  };

  // Helper calculation functions
  const calculateBMR = (profile: UserProfile): number => {
    const { weight, height, age, gender } = profile;
    
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateTDEE = (profile: UserProfile, bmr: number): number => {
    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9,
    };
    return bmr * activityMultipliers[profile.activityLevel];
  };

  const calculateDailyCalories = (profile: UserProfile, tdee: number): number => {
    const { goal } = profile;
    
    switch (goal) {
      case 'lose':
        return Math.round(tdee - 500); // 500 calorie deficit for 1lb/week loss
      case 'gain':
        return Math.round(tdee + 300); // 300 calorie surplus for lean gain
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  };

  // Render current step
  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen onContinue={handleWelcomeContinue} />;
      
    case 'features':
      return (
        <FeatureIntroScreen 
          onContinue={handleFeaturesContinue}
          onSkip={handleFeaturesSkip}
        />
      );
      
    case 'permissions':
      return (
        <PermissionsScreen
          onContinue={handlePermissionsContinue}
          onSkip={handlePermissionsSkip}
        />
      );
      
    case 'profile':
      return <OnboardingScreen />;
      
    case 'goals':
      return (
        <CalorieGoalScreen
          userProfile={userProfile}
          onContinue={handleGoalsComplete}
          onBack={handleGoalsBack}
        />
      );
      
    case 'complete':
      return (
        <OnboardingCompleteScreen
          userProfile={userProfile as UserProfile}
          onContinue={handleOnboardingComplete}
        />
      );
      
    default:
      return <WelcomeScreen onContinue={handleWelcomeContinue} />;
  }
};

export default OnboardingFlow;