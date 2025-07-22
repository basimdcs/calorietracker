export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extra-active';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
  goal: Goal;
  bmr?: number; // calculated
  dailyCalorieGoal?: number; // calculated
  createdAt: Date | string; // Date when created, string when retrieved from storage
  updatedAt: Date | string; // Date when created, string when retrieved from storage
}

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: NutritionInfo;
  servingSize: number; // in grams
  servingSizeUnit: string;
  category?: string;
  isCustom: boolean;
  createdAt: Date | string; // Date when created, string when retrieved from storage
}

export interface ParsedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  nutrition?: NutritionInfo;
}

// New interface for OpenAI parsed foods
export interface ParsedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  quantity?: number; // The actual quantity amount
  unit?: string; // The unit (pieces, grams, cups, etc.)
  cookingMethod?: string; // The cooking method (grilled, fried, baked, etc.)
  needsQuantity?: boolean; // Flag to indicate if quantity clarification is needed
  suggestedQuantity?: string; // Suggested quantity options
  needsCookingMethod?: boolean; // Flag to indicate if cooking method clarification is needed
  suggestedCookingMethods?: string[]; // Array of suggested cooking methods
}

export interface LoggedFood {
  id: string;
  foodItem: FoodItem;
  quantity: number; // multiplier for serving size
  nutrition: NutritionInfo; // calculated based on quantity
  loggedAt: Date | string; // Date when created, string when retrieved from storage
  mealType: MealType;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DailyLog {
  date: string; // YYYY-MM-DD format
  foods: LoggedFood[];
  totalNutrition: NutritionInfo;
  calorieGoal: number;
  waterIntake?: number; // in ml
  notes?: string;
}

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  transcript?: string;
  parsedFoods?: ParsedFood[];
  createdAt: Date;
}

// Navigation Types
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Voice: undefined;
  History: undefined;
  Settings: undefined;
};

// Component Props
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: any;
}

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  elevation?: 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  style?: any;
}

export interface ProgressProps {
  value: number; // 0-100
  variant?: 'linear' | 'circular';
  size?: number;
  color?: string;
  trackColor?: string;
  style?: any;
}

// Constants
export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise'
  },
  {
    value: 'lightly-active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week'
  },
  {
    value: 'moderately-active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week'
  },
  {
    value: 'very-active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week'
  },
  {
    value: 'extra-active',
    label: 'Extra Active',
    description: 'Very hard exercise, physical job'
  }
];

export const GOALS: { value: Goal; label: string; description: string }[] = [
  {
    value: 'lose',
    label: 'Lose Weight',
    description: 'Create a caloric deficit'
  },
  {
    value: 'maintain',
    label: 'Maintain Weight',
    description: 'Stay at current weight'
  },
  {
    value: 'gain',
    label: 'Gain Weight',
    description: 'Build muscle and gain weight'
  }
];

export const NUTRITION_CONSTANTS = {
  CALORIES_PER_GRAM: {
    PROTEIN: 4,
    CARBS: 4,
    FAT: 9,
    ALCOHOL: 7
  },
  DAILY_VALUES: {
    PROTEIN: 50, // grams
    CARBS: 300, // grams
    FAT: 65, // grams
    FIBER: 25, // grams
    SODIUM: 2300 // mg
  }
}; 