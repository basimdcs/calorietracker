import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, LoggedFood, DailyLog, NutritionInfo, MealType } from '../types';
import { getUserCalorieGoal } from '../utils/calorieGoal';

interface FoodState {
  foodItems: FoodItem[];
  dailyLogs: DailyLog[];
  currentDate: string;
  
  // Food item actions
  addFoodItem: (food: FoodItem) => void;
  removeFoodItem: (id: string) => void;
  updateFoodItem: (id: string, updates: Partial<FoodItem>) => void;
  getFoodItem: (id: string) => FoodItem | undefined;
  
  // Daily log actions
  logFood: (foodId: string, quantity: number, mealType: MealType) => void;
  removeLoggedFood: (date: string, loggedFoodId: string) => void;
  updateLoggedFood: (date: string, loggedFoodId: string, quantity: number) => void;
  getDailyLog: (date: string) => DailyLog | undefined;
  getCurrentDayLog: () => DailyLog | undefined;
  
  // Utility actions
  setCurrentDate: (date: string) => void;
  calculateNutritionForQuantity: (food: FoodItem, quantity: number) => NutritionInfo;
  
  // Debug actions
  debugStoreState: () => void;
  clearAllData: () => void;
  updateCurrentDate: () => void;
  
  // Display helpers
  getDisplayQuantity: (food: LoggedFood) => { amount: number; unit: string };
  
  // Profile integration
  updateCalorieGoalForAllLogs: (newCalorieGoal: number) => void;
}

// Helper function to calculate nutrition based on quantity
const calculateNutritionForQuantity = (food: FoodItem, quantity: number): NutritionInfo => {
  const { nutrition } = food;
  
  // The quantity now represents the serving multiplier correctly
  // For gram-based foods: quantity = actualGrams / 100g (e.g., 100g input = 1.0x multiplier)
  // For piece-based foods: quantity = number of pieces (e.g., 2 pieces = 2.0x multiplier)
  
  return {
    calories: Math.round(nutrition.calories * quantity),
    protein: Math.round(nutrition.protein * quantity * 10) / 10,
    carbs: Math.round(nutrition.carbs * quantity * 10) / 10,
    fat: Math.round(nutrition.fat * quantity * 10) / 10,
    fiber: nutrition.fiber ? Math.round(nutrition.fiber * quantity * 10) / 10 : undefined,
    sugar: nutrition.sugar ? Math.round(nutrition.sugar * quantity * 10) / 10 : undefined,
    sodium: nutrition.sodium ? Math.round(nutrition.sodium * quantity) : undefined,
  };
};

// Helper function to sum nutrition values
const sumNutrition = (nutritions: NutritionInfo[]): NutritionInfo => {
  return nutritions.reduce(
    (total, nutrition) => ({
      calories: total.calories + nutrition.calories,
      protein: total.protein + nutrition.protein,
      carbs: total.carbs + nutrition.carbs,
      fat: total.fat + nutrition.fat,
      fiber: (total.fiber || 0) + (nutrition.fiber || 0),
      sugar: (total.sugar || 0) + (nutrition.sugar || 0),
      sodium: (total.sodium || 0) + (nutrition.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      foodItems: [],
      dailyLogs: [],
      currentDate: getTodayString(),

      // Food item actions
      addFoodItem: (food: FoodItem) => {
        set((state) => ({
          foodItems: [...state.foodItems, food],
        }));
      },

      removeFoodItem: (id: string) => {
        set((state) => ({
          foodItems: state.foodItems.filter(item => item.id !== id),
        }));
      },

      updateFoodItem: (id: string, updates: Partial<FoodItem>) => {
        set((state) => ({
          foodItems: state.foodItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      getFoodItem: (id: string) => {
        return get().foodItems.find(item => item.id === id);
      },

      // Daily log actions
      logFood: (foodId: string, quantity: number, mealType: MealType) => {
        const { foodItems, dailyLogs, currentDate } = get();
        const food = foodItems.find(item => item.id === foodId);
        
        if (!food) {
          console.error('❌ Food item not found for logging:', foodId);
          return;
        }

        console.log('📊 Creating logged food entry for:', {
          foodId,
          foodName: food.name,
          quantity,
          mealType,
          currentDate
        });

        const loggedFood: LoggedFood = {
          id: `${Date.now()}-${Math.random().toString().slice(2)}`,
          foodItem: food,
          quantity,
          nutrition: calculateNutritionForQuantity(food, quantity),
          loggedAt: new Date().toISOString(),
          mealType,
        };

        const existingLogIndex = dailyLogs.findIndex(log => log.date === currentDate);
        
        if (existingLogIndex >= 0) {
          console.log('📅 Updating existing daily log for date:', currentDate);
          // Update existing daily log
          const updatedLogs = [...dailyLogs];
          const existingLog = updatedLogs[existingLogIndex];
          const updatedFoods = [...existingLog.foods, loggedFood];
          
          updatedLogs[existingLogIndex] = {
            ...existingLog,
            foods: updatedFoods,
            totalNutrition: sumNutrition(updatedFoods.map(f => f.nutrition)),
          };
          
          console.log('✅ Updated daily log:', updatedLogs[existingLogIndex]);
          set({ dailyLogs: updatedLogs });
        } else {
          console.log('📅 Creating new daily log for date:', currentDate);

          // Get user's calorie goal from single source of truth
          const userCalorieGoal = getUserCalorieGoal();

          // Create new daily log
          const newLog: DailyLog = {
            date: currentDate,
            foods: [loggedFood],
            totalNutrition: loggedFood.nutrition,
            calorieGoal: userCalorieGoal,
          };

          console.log('✅ Created new daily log with calorie goal:', userCalorieGoal, newLog);
          set({ dailyLogs: [...dailyLogs, newLog] });
        }
      },

      removeLoggedFood: (date: string, loggedFoodId: string) => {
        console.log('🗑️ Removing logged food:', { date, loggedFoodId });
        set((state) => {
          const updatedLogs = state.dailyLogs.map(log => {
            if (log.date === date) {
              const updatedFoods = log.foods.filter(food => food.id !== loggedFoodId);
              console.log('📊 Updated foods after removal:', updatedFoods);
              return {
                ...log,
                foods: updatedFoods,
                totalNutrition: sumNutrition(updatedFoods.map(f => f.nutrition)),
              };
            }
            return log;
          });
          
          console.log('✅ Food removed successfully');
          return { dailyLogs: updatedLogs };
        });
      },

      updateLoggedFood: (date: string, loggedFoodId: string, quantity: number) => {
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => {
            if (log.date === date) {
              const updatedFoods = log.foods.map(food => {
                if (food.id === loggedFoodId) {
                  return {
                    ...food,
                    quantity,
                    nutrition: calculateNutritionForQuantity(food.foodItem, quantity),
                  };
                }
                return food;
              });
              
              return {
                ...log,
                foods: updatedFoods,
                totalNutrition: sumNutrition(updatedFoods.map(f => f.nutrition)),
              };
            }
            return log;
          }),
        }));
      },

      getDailyLog: (date: string) => {
        return get().dailyLogs.find(log => log.date === date);
      },

      getCurrentDayLog: () => {
        const { currentDate } = get();
        return get().getDailyLog(currentDate);
      },

      setCurrentDate: (date: string) => {
        set({ currentDate: date });
      },

      calculateNutritionForQuantity,
      
      debugStoreState: () => {
        const state = get();
        console.log('🔍 Food Store Debug State:');
        console.log('📅 Current Date:', state.currentDate);
        console.log('🍎 Food Items Count:', state.foodItems.length);
        console.log('📊 Daily Logs Count:', state.dailyLogs.length);
        console.log('📋 Daily Logs:', state.dailyLogs);
        
        // Additional debugging info
        if (state.dailyLogs.length > 0) {
          const todayLog = state.dailyLogs.find(log => log.date === state.currentDate);
          if (todayLog) {
            console.log('📋 Today\'s Log:', todayLog);
            console.log('🍽️ Today\'s Foods:', todayLog.foods);
            console.log('📊 Today\'s Total Nutrition:', todayLog.totalNutrition);
          } else {
            console.log('❌ No log found for current date:', state.currentDate);
          }
        }
        
        // Display quantity examples
        if (state.dailyLogs.length > 0) {
          const firstLog = state.dailyLogs[0];
          if (firstLog.foods.length > 0) {
            const firstFood = firstLog.foods[0];
            const displayQty = get().getDisplayQuantity(firstFood);
            console.log('🧮 Display Quantity Example:', {
              foodName: firstFood.foodItem.name,
              storedQuantity: firstFood.quantity,
              servingSize: firstFood.foodItem.servingSize,
              servingSizeUnit: firstFood.foodItem.servingSizeUnit,
              displayQuantity: displayQty
            });
          }
        }
      },
      
      clearAllData: () => {
        console.log('🗑️ Clearing all food store data');
        set({
          foodItems: [],
          dailyLogs: [],
          currentDate: getTodayString(),
        });
        console.log('✅ All data cleared');
      },
      
      // Fix current date if it's wrong
      updateCurrentDate: () => {
        const todayString = getTodayString();
        const currentState = get();
        if (currentState.currentDate !== todayString) {
          console.log('📅 Updating current date from', currentState.currentDate, 'to', todayString);
          set({ currentDate: todayString });
        }
      },
      
      getDisplayQuantity: (food: LoggedFood) => {
        const { foodItem, quantity } = food;
        
        if (foodItem.servingSizeUnit === 'g' && foodItem.servingSize === 100) {
          // This is a gram-based food, convert quantity multiplier back to grams
          const actualGrams = quantity * 100;
          return {
            amount: Math.round(actualGrams * 10) / 10,
            unit: actualGrams === 1 ? 'g' : 'g'
          };
        } else {
          // This is a piece-based food, quantity is the actual count
          const unit = quantity === 1 ? 
            foodItem.servingSizeUnit.replace(/s$/, '') : // Remove plural 's' if quantity is 1
            foodItem.servingSizeUnit;
          return {
            amount: Math.round(quantity * 10) / 10,
            unit: unit
          };
        }
      },
      
      updateCalorieGoalForAllLogs: (newCalorieGoal: number) => {
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => ({
            ...log,
            calorieGoal: newCalorieGoal
          }))
        }));
      },
    }),
    {
      name: 'food-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 