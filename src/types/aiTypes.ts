/**
 * Enhanced AI Types for Confidence-Based Food Processing
 * Supports dual model comparison (Whisper vs GPT-4o Audio, GPT-4o vs GPT-5-nano)
 */

// ============================================================================
// Smart Unit Conversion Types
// ============================================================================

export interface SmartUnit {
  unit: string;                    // "pieces", "cups", "tbsp", "grams", "ml"
  label: string;                   // "pieces (breast-sized)", "cups (Egyptian)", "grams"
  gramsPerUnit: number;            // AI-estimated conversion factor
  confidence: number;              // 0-1, how confident AI is about this conversion
  isRecommended: boolean;          // Should this be the default suggestion?
  culturalContext?: string;        // "egyptian", "us", "metric" for context-specific conversions
}

export interface UnitConversionResult {
  originalQuantity: number;        // What user entered: 2.5
  originalUnit: string;            // What user entered: "pieces"
  finalGrams: number;              // Final calculated value: 375
  aiEstimatedGrams: number;        // AI's original suggestion: 375
  userOverrideGrams?: number;      // User manual correction: null or different value
  conversionConfidence: number;    // AI confidence in the conversion: 0.85
  conversionNotes: string[];       // ["150g per medium chicken breast", "includes bone weight"]
}

// ============================================================================
// AI Step 2: Quantity Detection with Confidence
// ============================================================================

export interface AIQuantityDetectionItem {
  raw_text: string;                // Original transcript segment
  canonical_name: string;          // Normalized food name
  brand_or_place?: string;         // "مراعي", "McDonald's", "Starbucks", etc.
  quantity_spoken: number;         // Numeric from speech: 2, 0.5, 1
  unit_spoken: string;             // "slice", "قطعة", "كيلو", "فرخة", "cup"
  normalized_unit: 'g' | 'ml';     // Final unit type: solids->g, liquids->ml
  grams_range: {
    min: number;                   // Conservative estimate
    max: number;                   // Generous estimate
  };
  grams_estimate: number;          // Single best estimate within range
  assumptions: string[];           // ["medium-sized pieces", "cooked weight", "boneless"]
  confidence: number;              // 0-1, overall confidence in quantity estimation
  needs_clarification: boolean;    // True if confidence < 0.6
  suggested_units: SmartUnit[];    // Smart unit options for this food
}

export interface AIQuantityDetectionResult {
  items: AIQuantityDetectionItem[];
  overall_confidence: number;      // Average confidence across all items
  processing_notes: string[];      // Any issues or assumptions made during parsing
}

// ============================================================================
// AI Step 3: Nutrition Calculation with Cooking Methods
// ============================================================================

export interface CookingMethodOption {
  method: string;                  // "Grilled", "Fried", "Baked", "Raw"
  arabic_name: string;             // "مشوي", "مقلي", "في الفرن", "نيء"
  calorie_multiplier: number;      // 1.0 for raw/boiled, 1.4 for fried, etc.
  icon: string;                    // "🔥", "🍳", "🥖", "🥗"
  confidence: number;              // How likely this method applies to this food
}

export interface AINutritionItem {
  canonical_name: string;
  edible_grams: number;            // Final weight used for calculation
  
  // Nutrition per 100g (standardized)
  profile_per_100g: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    kcal: number;
  };
  
  // Total nutrition for the consumed amount
  totals: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    kcal: number;
  };
  
  // Cooking method detection and options
  detected_cooking_method?: string; // "Grilled" if detected in name
  cooking_confidence: number;      // Confidence in detected method
  alternative_methods: CookingMethodOption[]; // Other possible methods
  needs_cooking_clarification: boolean; // True if method unclear and impacts calories
  
  // Validation and quality checks
  validation: {
    kcal_from_macros: number;      // 4*protein + 4*carbs + 9*fat
    delta_kcal_pct: number;        // Difference percentage
    adjusted: boolean;             // True if macros were scaled to match calories
  };
  
  // AI metadata
  source_hint: string;             // "grilled chicken breast, skinless"
  assumptions: string[];           // ["restaurant-style portion", "includes marinade oil"]
  confidence: number;              // Overall confidence in nutrition estimate
}

export interface AINutritionResult {
  items: AINutritionItem[];
  overall_confidence: number;      // Average confidence across all items
  total_calories: number;          // Sum of all item calories
  processing_notes: string[];      // Any issues during nutrition calculation
}

// ============================================================================
// Enhanced ParsedFoodItem with Confidence
// ============================================================================

export interface ParsedFoodItemWithConfidence {
  // Core food data
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  
  // Quantity information with confidence
  quantity: number;
  unit: string;
  quantityConfidence: number;      // 0-1 confidence in quantity estimation
  gramEquivalent: number;          // Final grams/ml value
  suggestedUnits: SmartUnit[];     // Smart unit options
  
  // Cooking method information
  cookingMethod?: string;
  cookingConfidence: number;       // 0-1 confidence in cooking method
  alternativeMethods: CookingMethodOption[];
  
  // Modal trigger logic
  needsQuantityModal: boolean;     // True if quantityConfidence < 0.6
  needsCookingModal: boolean;      // True if cookingConfidence < 0.6 and cooking affects calories
  
  // AI metadata
  assumptions: string[];           // All assumptions made during processing
  overallConfidence: number;       // Combined confidence score
  aiModel: 'gpt-4o' | 'gpt-5-nano'; // Which model was used for processing
  
  // User override tracking
  userModified: boolean;           // Has user manually edited this item?
  originalAIEstimate?: {           // Store original for comparison
    quantity: number;
    unit: string;
    grams: number;
    calories: number;
    cookingMethod?: string;
  };
}

// ============================================================================
// Model Performance Tracking
// ============================================================================

export interface ModelPerformanceMetrics {
  model_name: string;              // "whisper", "gpt-4o-audio", "gpt-4o", "gpt-5-nano"
  total_calls: number;
  total_tokens?: number;           // For text models
  total_cost_usd: number;
  avg_latency_ms: number;
  success_rate: number;            // Percentage of successful calls
  confidence_accuracy: number;     // How often confidence scores match user validation
}

export interface ModelUsageSession {
  session_id: string;
  timestamp: Date;
  transcription_model: 'whisper' | 'gpt-4o-audio';
  nutrition_model: 'gpt-4o' | 'gpt-5-nano';
  
  // Performance metrics
  transcription_latency_ms: number;
  nutrition_latency_ms: number;
  total_tokens: number;
  estimated_cost_usd: number;
  
  // Quality metrics
  user_needed_modal: boolean;      // Did user need to clarify anything?
  confidence_accurate: boolean;    // Did confidence scores predict user needs accurately?
  final_foods_count: number;       // How many foods were successfully logged?
  
  // Model comparison data
  performance_notes: string[];     // Any issues or observations
}

// ============================================================================
// API Response Types (matching ChatGPT prompts)
// ============================================================================

export interface Step2APIResponse {
  items: Array<{
    raw_text: string;
    canonical_name: string;
    brand_or_place: string | null;
    quantity_spoken: number;
    unit_spoken: string;
    normalized_unit: 'g' | 'ml';
    grams_range: { min: number; max: number };
    grams_estimate: number;
    assumptions: string[];
    confidence: number;
    questions: string[];             // Only if confidence < 0.6
  }>;
}

export interface Step3APIResponse {
  items: Array<{
    canonical_name: string;
    edible_grams: number;
    profile_per_100g: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      kcal: number;
    };
    totals: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      kcal: number;
    };
    validation: {
      kcal_from_macros: number;
      delta_kcal_pct: number;
      adjusted: boolean;
    };
    source_hint: string;
    assumptions: string[];
    confidence: number;
  }>;
}

// ============================================================================
// Export all types for easy importing
// ============================================================================

export type {
  SmartUnit,
  UnitConversionResult,
  AIQuantityDetectionItem,
  AIQuantityDetectionResult,
  CookingMethodOption,
  AINutritionItem,
  AINutritionResult,
  ParsedFoodItemWithConfidence,
  ModelPerformanceMetrics,
  ModelUsageSession,
  Step2APIResponse,
  Step3APIResponse,
};