import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ActivityLevel, SubscriptionTier, UsageStats } from '../types';

interface UserState {
  profile: UserProfile | null;
  isOnboardingComplete: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
  completeOnboarding: () => void;
  // Subscription sync from RevenueCat
  syncSubscriptionFromRevenueCat: (tier: SubscriptionTier, isActive: boolean) => void;
  // Goal management functions
  updateCalorieGoal: (newGoal: number, isCustom?: boolean) => void;
  updateWeightGoal: (newGoal: 'lose' | 'maintain' | 'gain', weeklyTarget?: number) => void;
  recalculateGoals: () => void;
}

// BMR calculation using Mifflin-St Jeor Equation
const calculateBMR = (profile: UserProfile): number => {
  const { weight, height, age, gender } = profile;
  
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

// Activity multipliers
const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extra-active': 1.9,
};

// Calculate daily calorie goal
const calculateDailyCalories = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  
  switch (profile.goal) {
    case 'lose':
      return Math.round(tdee - 500); // 500 calorie deficit for 1lb/week loss
    case 'gain':
      return Math.round(tdee + 300); // 300 calorie surplus for lean gain
    case 'maintain':
    default:
      return Math.round(tdee);
  }
};


export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboardingComplete: false, // Temporarily set to false to test onboarding

      setProfile: (profile: UserProfile) => {
        console.log('userStore: Setting profile for', profile.name);
        
        const profileWithCalculations = {
          ...profile,
          bmr: calculateBMR(profile),
          dailyCalorieGoal: calculateDailyCalories(profile),
        };
        
        set({ 
          profile: profileWithCalculations,
          isOnboardingComplete: true 
        });
        console.log('userStore: Profile set successfully, onboarding complete');
      },

      updateProfile: (updates: Partial<UserProfile>) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile = { 
          ...currentProfile, 
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        const profileWithCalculations = {
          ...updatedProfile,
          bmr: calculateBMR(updatedProfile),
          dailyCalorieGoal: calculateDailyCalories(updatedProfile),
        };

        set({ profile: profileWithCalculations });
      },

      resetProfile: () => {
        console.log('userStore: Resetting profile...');
        set({ 
          profile: null, 
          isOnboardingComplete: false
        });
        console.log('userStore: Profile reset complete');
      },

      completeOnboarding: () => {
        set({ isOnboardingComplete: true });
      },

      // Sync subscription status from RevenueCat
      syncSubscriptionFromRevenueCat: (tier: SubscriptionTier, isActive: boolean) => {
        const currentProfile = get().profile;
        if (!currentProfile) {
          console.log('userStore: No profile to sync subscription to');
          return;
        }

        const updatedProfile: UserProfile = {
          ...currentProfile,
          subscriptionTier: tier,
          subscriptionStatus: isActive ? 'active' : 'inactive',
          subscriptionStartDate: isActive ? (currentProfile.subscriptionStartDate || new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
        console.log(`userStore: Subscription synced from RevenueCat - ${tier} (${isActive ? 'active' : 'inactive'})`);
      },

      // Goal management functions
      updateCalorieGoal: (newGoal: number, isCustom = true) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          dailyCalorieGoal: newGoal,
          customCalorieGoal: isCustom ? newGoal : undefined,
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
        console.log(`userStore: Calorie goal updated to ${newGoal} (custom: ${isCustom})`);
      },

      updateWeightGoal: (newGoal: 'lose' | 'maintain' | 'gain', weeklyTarget = 1.0) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          goal: newGoal,
          weeklyWeightGoal: weeklyTarget,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate daily calories if not using custom goal
        if (!updatedProfile.customCalorieGoal) {
          const bmr = calculateBMR(updatedProfile);
          const tdee = bmr * activityMultipliers[updatedProfile.activityLevel];
          updatedProfile.bmr = bmr;
          updatedProfile.dailyCalorieGoal = calculateDailyCalories(updatedProfile);
        }

        set({ profile: updatedProfile });
        console.log(`userStore: Weight goal updated to ${newGoal} with ${weeklyTarget} lbs/week target`);
      },

      recalculateGoals: () => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const bmr = calculateBMR(currentProfile);
        const tdee = bmr * activityMultipliers[currentProfile.activityLevel];
        
        const updatedProfile: UserProfile = {
          ...currentProfile,
          bmr,
          // Only recalculate daily calorie goal if not using custom goal
          dailyCalorieGoal: currentProfile.customCalorieGoal || calculateDailyCalories(currentProfile),
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
        console.log('userStore: Goals recalculated based on current profile');
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4, // Increment version for RevenueCat usage migration
    }
  )
); 