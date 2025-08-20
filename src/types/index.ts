export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extra-active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type SubscriptionTier = 'FREE' | 'PRO';

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
  customCalorieGoal?: number; // user-set custom calorie goal
  weeklyWeightGoal?: number; // target lbs per week (positive for gain, negative for loss)
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: 'active' | 'inactive' | 'expired' | 'cancelled';
  subscriptionStartDate?: Date | string;
  subscriptionEndDate?: Date | string;
  recordingsUsedThisMonth?: number;
  monthlyResetDate?: Date | string;
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
  suggestedQuantity?: string[]; // Array of suggested quantity options
  needsCookingMethod?: boolean; // Flag to indicate if cooking method clarification is needed
  suggestedCookingMethods?: string[]; // Array of suggested cooking methods
  isNutritionComplete?: boolean; // Flag to indicate if nutrition calculation is complete
  nutritionNotes?: string; // Additional notes about nutrition calculation
  icon?: string; // Material icon name for the food item
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
  ProfileEdit: undefined;
  ActivityLevelEdit: undefined;
  WeightGoalEdit: undefined;
  Notifications: undefined;
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
  accessibilityLabel?: string;
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

// Error types
export type VoiceErrorType = 
  | 'RECORDING_PERMISSION_DENIED'
  | 'RECORDING_FAILED'
  | 'TRANSCRIPTION_FAILED'
  | 'PARSING_FAILED'
  | 'NETWORK_ERROR'
  | 'API_KEY_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUDIO_FILE_TOO_LARGE'
  | 'NO_SPEECH_DETECTED'
  | 'NO_FOOD_DETECTED'
  | 'UNKNOWN_ERROR';

export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  details?: string;
  retry?: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  stage: 'idle' | 'transcribing' | 'parsing' | 'reviewing';
  progress?: number;
  statusMessage?: string;
}

// Voice processing constants
export const VOICE_PROCESSING_CONSTANTS = {
  MAX_RECORDING_DURATION: 300, // 5 minutes in seconds
  MIN_RECORDING_DURATION: 1, // 1 second
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  DEFAULT_SERVING_SIZE: 100,
  DEFAULT_SERVING_UNIT: 'g',
  COOKING_METHOD_MULTIPLIERS: {
    'Raw': 1.0,
    'Boiled': 1.0,
    'Steamed': 1.0,
    'Grilled': 1.1,
    'Baked': 1.05,
    'Roasted': 1.1,
    'Sautéed': 1.2,
    'Stir-fried': 1.25,
    'Fried': 1.4,
    'Deep Fried': 1.8,
    'Braised': 1.15,
  } as const,
} as const;

// Subscription-related interfaces and constants
export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  currency: string;
  monthlyRecordingLimit: number; // Monthly recording limit
  features: string[];
  popular?: boolean;
}

export interface UsageStats {
  recordingsUsed: number;
  recordingsRemaining: number; // Recordings remaining this month
  monthlyLimit: number; // Monthly recording limit
  resetDate: Date | string;
  usagePercentage: number; // 0-100
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    currency: 'EGP',
    monthlyRecordingLimit: 10,
    features: [
      '10 voice recordings per month',
      'Basic food database',
      'Calorie tracking',
      'Basic nutrition insights'
    ]
  },
  {
    tier: 'PRO',
    name: 'Pro',
    monthlyPrice: 99,
    currency: 'EGP',
    monthlyRecordingLimit: 300,
    features: [
      '300 voice recordings per month',
      'Extended food database',
      'Advanced nutrition insights',
      'Detailed progress tracking',
      'Export data',
      'Priority support'
    ],
    popular: true
  }
]; 