import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, LoggedFood, DailyLog, NutritionInfo, MealType } from '../types';

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
}

// Helper function to calculate nutrition based on quantity
const calculateNutritionForQuantity = (food: FoodItem, quantity: number): NutritionInfo => {
  const { nutrition } = food;
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
        
        if (!food) return;

        const loggedFood: LoggedFood = {
          id: `${Date.now()}-${Math.random()}`,
          foodItem: food,
          quantity,
          nutrition: calculateNutritionForQuantity(food, quantity),
          loggedAt: new Date(),
          mealType,
        };

        const existingLogIndex = dailyLogs.findIndex(log => log.date === currentDate);
        
        if (existingLogIndex >= 0) {
          // Update existing daily log
          const updatedLogs = [...dailyLogs];
          const existingLog = updatedLogs[existingLogIndex];
          const updatedFoods = [...existingLog.foods, loggedFood];
          
          updatedLogs[existingLogIndex] = {
            ...existingLog,
            foods: updatedFoods,
            totalNutrition: sumNutrition(updatedFoods.map(f => f.nutrition)),
          };
          
          set({ dailyLogs: updatedLogs });
        } else {
          // Create new daily log
          const newLog: DailyLog = {
            date: currentDate,
            foods: [loggedFood],
            totalNutrition: loggedFood.nutrition,
            calorieGoal: 2000, // Default, should be updated from user profile
          };
          
          set({ dailyLogs: [...dailyLogs, newLog] });
        }
      },

      removeLoggedFood: (date: string, loggedFoodId: string) => {
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => {
            if (log.date === date) {
              const updatedFoods = log.foods.filter(food => food.id !== loggedFoodId);
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
    }),
    {
      name: 'food-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 