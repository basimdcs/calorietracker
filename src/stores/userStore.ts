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
  // Usage tracking (will be connected to RevenueCat)
  monthlyRecordingUsage: number;
  incrementRecordingUsage: () => void;
  resetMonthlyUsage: () => void;
  getMonthlyUsage: () => number;
  getUsageStats: () => UsageStats;
  upgradeSubscription: (tier: SubscriptionTier) => void;
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

// Helper to check if we need to reset monthly usage
const isNewMonth = (lastUsageDate: Date | string): boolean => {
  const now = new Date();
  const lastDate = new Date(lastUsageDate);
  return now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear();
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboardingComplete: false,
      monthlyRecordingUsage: 0,

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
          isOnboardingComplete: false,
          monthlyRecordingUsage: 0
        });
        console.log('userStore: Profile reset complete');
      },

      completeOnboarding: () => {
        set({ isOnboardingComplete: true });
      },

      // Simplified usage tracking (RevenueCat will handle limits)
      incrementRecordingUsage: () => {
        const currentUsage = get().monthlyRecordingUsage;
        set({ monthlyRecordingUsage: currentUsage + 1 });
        console.log(`userStore: Recording usage incremented to ${currentUsage + 1}`);
      },

      resetMonthlyUsage: () => {
        set({ monthlyRecordingUsage: 0 });
        console.log('userStore: Monthly usage reset');
      },

      getMonthlyUsage: () => {
        return get().monthlyRecordingUsage;
      },

      getUsageStats: (): UsageStats => {
        const { profile, monthlyRecordingUsage } = get();
        const subscriptionTier = profile?.subscriptionTier || 'FREE';
        
        // Define monthly limits based on subscription tier (updated to match requirements)
        const monthlyLimits = {
          FREE: 10,
          PRO: null, // unlimited
        };
        
        const monthlyLimit = monthlyLimits[subscriptionTier];
        const recordingsUsed = monthlyRecordingUsage;
        const recordingsRemaining = monthlyLimit ? Math.max(0, monthlyLimit - recordingsUsed) : null;
        
        // Calculate usage percentage (0 for unlimited plans)
        const usagePercentage = monthlyLimit ? Math.min(100, (recordingsUsed / monthlyLimit) * 100) : 0;
        
        // Calculate reset date (first day of next month)
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        return {
          recordingsUsed,
          recordingsRemaining,
          monthlyLimit,
          resetDate: resetDate.toISOString(),
          usagePercentage,
        };
      },

      upgradeSubscription: (tier: SubscriptionTier) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          subscriptionStartDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
        console.log(`userStore: Subscription upgraded to ${tier}`);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure monthlyRecordingUsage is initialized
        if (state && typeof state.monthlyRecordingUsage !== 'number') {
          state.monthlyRecordingUsage = 0;
        }
      },
      version: 3, // Increment version for RevenueCat migration
    }
  )
); 