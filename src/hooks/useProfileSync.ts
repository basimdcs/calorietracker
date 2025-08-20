/**
 * Profile Synchronization Hook
 * 
 * This hook ensures that user profile changes are properly synchronized
 * across all parts of the application, including:
 * - Daily logs calorie goals
 * - Food data calculations
 * - UI displays
 * 
 * Use this hook in App.tsx or main components to ensure data consistency.
 */

import { useEffect } from 'react';
import { useUser } from './useUser';
import { useFoodStore } from '../stores/foodStore';

export const useProfileSync = () => {
  const { profile, calorieGoal } = useUser();
  const { updateCalorieGoalForAllLogs } = useFoodStore();

  // Sync calorie goal whenever it changes
  useEffect(() => {
    if (profile && calorieGoal) {
      console.log('🔄 Syncing calorie goal:', calorieGoal);
      updateCalorieGoalForAllLogs(calorieGoal);
    }
  }, [profile?.customCalorieGoal, profile?.goal, profile?.activityLevel, calorieGoal, updateCalorieGoalForAllLogs]);

  return {
    isSynced: !!profile,
    calorieGoal,
  };
};