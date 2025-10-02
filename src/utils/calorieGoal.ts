/**
 * Single Source of Truth for Calorie Goals
 *
 * This utility ensures all components use the same calorie goal
 * from the user's profile settings.
 */

import { useUserStore } from '../stores/userStore';

/**
 * Get the user's calorie goal from the single source of truth
 *
 * Priority:
 * 1. Custom calorie goal (if user set a custom value)
 * 2. Calculated daily calorie goal (from BMR + activity level)
 *
 * @returns The user's calorie goal in kcal
 * @throws Error if no profile exists (user must complete onboarding)
 */
export function getUserCalorieGoal(): number {
  const profile = useUserStore.getState().profile;

  if (!profile) {
    throw new Error('User profile not found. Please complete onboarding.');
  }

  // Priority: custom goal > calculated goal
  return profile.customCalorieGoal || profile.dailyCalorieGoal || 0;
}

/**
 * Hook version for use in React components
 */
export function useUserCalorieGoal(): number {
  const profile = useUserStore((state) => state.profile);

  if (!profile) {
    throw new Error('User profile not found. Please complete onboarding.');
  }

  return profile.customCalorieGoal || profile.dailyCalorieGoal || 0;
}
