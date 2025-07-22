import { useMemo } from 'react';
import { useFoodStore } from '../stores/foodStore';
import { useUserStore } from '../stores/userStore';
import { NutritionInfo } from '../types';

export const useNutrition = (date?: string) => {
  const { dailyLogs } = useFoodStore();
  const { profile } = useUserStore();

  const targetDate = date || new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find(log => log.date === targetDate);

  const nutrition = useMemo(() => {
    if (!todayLog) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      } as NutritionInfo;
    }

    return todayLog.totalNutrition;
  }, [todayLog]);

  const progress = useMemo(() => {
    const dailyGoal = profile?.dailyCalorieGoal || 2000;
    const calorieProgress = Math.min((nutrition.calories / dailyGoal) * 100, 100);
    const remainingCalories = dailyGoal - nutrition.calories;

    return {
      calorieProgress,
      remainingCalories,
      dailyGoal,
      isOverGoal: remainingCalories < 0,
    };
  }, [nutrition.calories, profile?.dailyCalorieGoal]);

  const macroGoals = useMemo(() => {
    const dailyGoal = profile?.dailyCalorieGoal || 2000;
    
    // Standard macro ratios: 30% protein, 45% carbs, 25% fat
    return {
      protein: (dailyGoal * 0.3) / 4, // 4 calories per gram
      carbs: (dailyGoal * 0.45) / 4,  // 4 calories per gram
      fat: (dailyGoal * 0.25) / 9,    // 9 calories per gram
    };
  }, [profile?.dailyCalorieGoal]);

  const macroProgress = useMemo(() => {
    return {
      protein: Math.min((nutrition.protein / macroGoals.protein) * 100, 100),
      carbs: Math.min((nutrition.carbs / macroGoals.carbs) * 100, 100),
      fat: Math.min((nutrition.fat / macroGoals.fat) * 100, 100),
    };
  }, [nutrition, macroGoals]);

  return {
    nutrition,
    progress,
    macroGoals,
    macroProgress,
    todayLog,
    hasData: !!todayLog,
  };
}; 