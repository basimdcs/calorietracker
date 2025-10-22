/**
 * Centralized Food Data Access Hook
 * 
 * This hook provides a consistent interface for accessing food data across all components.
 * It prevents the inconsistencies that caused the Home/History screen data mismatch.
 * 
 * ALWAYS use this hook instead of directly accessing useFoodStore or useNutrition
 * when you need to display food items in UI components.
 */

import { useMemo } from 'react';
import { useFoodStore } from '../stores/foodStore';
import { LoggedFood, DailyLog } from '../types';

export interface FoodDataHook {
  // Raw data access
  allDailyLogs: DailyLog[];
  todayLog: DailyLog | undefined;
  todayItems: LoggedFood[];
  
  // Helper functions
  getLogForDate: (date: string) => DailyLog | undefined;
  getItemsForDate: (date: string) => LoggedFood[];
  
  // Actions (consistent interface)
  removeFood: (date: string, foodId: string) => void;
  updateFood: (date: string, foodId: string, quantity: number) => void;
  
  // Debugging
  debug: {
    todayDate: string;
    totalLogs: number;
    todayItemCount: number;
  };
}

/**
 * Central hook for all food data access
 * 
 * Usage:
 * ```tsx
 * const { todayItems, removeFood } = useFoodData();
 * 
 * todayItems.map(food => (
 *   <div key={food.id}>
 *     <h3>{food.foodItem.name}</h3>
 *     <p>{food.nutrition.calories} calories</p>
 *     <button onClick={() => removeFood(todayDate, food.id)}>Delete</button>
 *   </div>
 * ))
 * ```
 */
export const useFoodData = (): FoodDataHook => {
  const {
    dailyLogs,
    removeLoggedFood,
    updateLoggedFood,
    currentDate
  } = useFoodStore();

  const todayDate = useMemo(() =>
    new Date().toISOString().split('T')[0],
    []
  );

  console.log('🔍 useFoodData hook:', {
    todayDate,
    storeCurrentDate: currentDate,
    dailyLogsCount: dailyLogs.length,
    allLogDates: dailyLogs.map(log => log.date),
  });

  const todayLog = useMemo(() => {
    const log = dailyLogs.find(log => log.date === todayDate);
    console.log('🔍 Finding today log:', {
      searchingFor: todayDate,
      found: !!log,
      foodsCount: log?.foods?.length || 0
    });
    return log;
  }, [dailyLogs, todayDate]);

  const todayItems = useMemo(() =>
    todayLog?.foods || [],
    [todayLog]
  );

  const getLogForDate = useMemo(() =>
    (date: string) => dailyLogs.find(log => log.date === date),
    [dailyLogs]
  );

  const getItemsForDate = useMemo(() =>
    (date: string) => getLogForDate(date)?.foods || [],
    [getLogForDate]
  );
  
  return {
    // Raw data
    allDailyLogs: dailyLogs,
    todayLog,
    todayItems,
    
    // Helper functions
    getLogForDate,
    getItemsForDate,
    
    // Actions
    removeFood: removeLoggedFood,
    updateFood: updateLoggedFood,
    
    // Debug info
    debug: {
      todayDate,
      totalLogs: dailyLogs.length,
      todayItemCount: todayItems.length,
    }
  };
};

/**
 * IMPORTANT NOTES FOR FUTURE DEVELOPMENT:
 * 
 * 1. ALWAYS use this hook instead of:
 *    - useFoodStore().dailyLogs directly
 *    - useNutrition().todayLog
 *    - Custom date filtering logic
 * 
 * 2. LoggedFood structure:
 *    - food.foodItem.name (NOT food.name)
 *    - food.loggedAt (NOT food.timestamp)
 *    - food.nutrition.calories (NOT food.totalCalories)
 *    - food.nutrition.protein/carbs/fat (NOT food.protein directly)
 * 
 * 3. Display patterns:
 *    - Name: food.foodItem.name
 *    - Quantity: `${food.quantity} × ${food.foodItem.servingSize}${food.foodItem.servingSizeUnit}`
 *    - Calories: food.nutrition.calories
 *    - Time: new Date(food.loggedAt).toLocaleTimeString()
 * 
 * 4. If you need to add new data access patterns, add them to this hook
 *    rather than creating custom logic in components.
 */