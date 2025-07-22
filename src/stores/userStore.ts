import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ActivityLevel } from '../types';

interface UserState {
  profile: UserProfile | null;
  isOnboardingComplete: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
  completeOnboarding: () => void;
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
      isOnboardingComplete: false,

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

        const updatedProfile = { ...currentProfile, ...updates };
        const profileWithCalculations = {
          ...updatedProfile,
          bmr: calculateBMR(updatedProfile),
          dailyCalorieGoal: calculateDailyCalories(updatedProfile),
        };

        set({ profile: profileWithCalculations });
      },

      resetProfile: () => {
        console.log('userStore: Resetting profile...');
        set({ profile: null, isOnboardingComplete: false });
        console.log('userStore: Profile reset complete');
      },

      completeOnboarding: () => {
        set({ isOnboardingComplete: true });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 