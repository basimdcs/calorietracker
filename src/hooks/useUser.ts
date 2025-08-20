import { useMemo } from 'react';
import { useUserStore } from '../stores/userStore';

export const useUser = () => {
  const { profile, updateProfile } = useUserStore();

  const bmr = useMemo(() => {
    if (!profile) return 0;
    
    // Mifflin-St Jeor Equation
    const baseBMR = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    return profile.gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  }, [profile]);

  const tdee = useMemo(() => {
    if (!profile) return 0;
    
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9,
    };
    
    const multiplier = activityMultipliers[profile.activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  }, [bmr, profile?.activityLevel]);

  const calorieGoal = useMemo(() => {
    if (!profile) return 2000;
    
    // If user has set a custom calorie goal, use that
    if (profile.customCalorieGoal) {
      return profile.customCalorieGoal;
    }
    
    // Otherwise calculate based on TDEE and goal
    const goalMultipliers = {
      'lose': 0.85,    // 15% deficit
      'maintain': 1.0, // no change
      'gain': 1.15,    // 15% surplus
    };
    
    const multiplier = goalMultipliers[profile.goal] || 1.0;
    return Math.round(tdee * multiplier);
  }, [tdee, profile?.goal, profile?.customCalorieGoal]);

  const userStats = useMemo(() => {
    if (!profile) return null;
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorieGoal: Math.round(calorieGoal),
      bmi: (profile.weight / Math.pow(profile.height / 100, 2)),
    };
  }, [profile, bmr, tdee, calorieGoal]);

  return {
    profile,
    updateProfile,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(calorieGoal),
    userStats,
    hasProfile: !!profile,
  };
}; 