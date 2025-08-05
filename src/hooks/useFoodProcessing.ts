import { useCallback } from 'react';
import { ParsedFoodItem, VOICE_PROCESSING_CONSTANTS } from '../types';
import { useFoodStore } from '../stores/foodStore';

export interface FoodProcessingResult {
  success: boolean;
  processedCount: number;
  error?: string;
}

export const useFoodProcessing = () => {
  const { addFoodItem, logFood } = useFoodStore();

  const processAndLogFoods = useCallback(async (foods: ParsedFoodItem[]): Promise<FoodProcessingResult> => {
    if (!foods.length) {
      return { success: false, processedCount: 0, error: 'No foods to process' };
    }

    let processedCount = 0;
    const errors: string[] = [];

    console.log('🍽️ Processing foods for logging:', foods.length);

    for (const food of foods) {
      try {
        if (!food.name || food.calories <= 0) {
          console.warn('Skipping invalid food item:', food);
          continue;
        }

        const now = new Date();
        
        // Parse the quantity and unit properly
        const actualQuantity = food.quantity || 1;
        const actualUnit = food.unit || 'serving';
        
        // Normalize nutrition values to per-100g basis for consistent storage
        const { nutritionPer100g, servingSize, servingSizeUnit, quantityMultiplier } = 
          normalizeNutrition(food, actualQuantity, actualUnit);

        // Create food item with generated ID
        const foodItem = {
          id: generateFoodId(),
          name: food.name,
          nutrition: nutritionPer100g,
          servingSize,
          servingSizeUnit,
          isCustom: true,
          createdAt: now.toISOString(),
        };

        console.log('📝 Adding food item:', {
          ...foodItem,
          originalQuantity: actualQuantity,
          originalUnit: actualUnit,
          quantityMultiplier
        });
        
        // Add to store and log
        addFoodItem(foodItem);
        logFood(foodItem.id, quantityMultiplier, 'snacks');
        
        processedCount++;
      } catch (error) {
        console.error('❌ Failed to process food item:', food.name, error);
        errors.push(`Failed to process ${food.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && processedCount === 0) {
      return { 
        success: false, 
        processedCount: 0, 
        error: `All items failed to process: ${errors.join(', ')}` 
      };
    }

    if (errors.length > 0) {
      console.warn('⚠️ Some items failed to process:', errors);
    }

    console.log('✅ Food processing completed:', { processedCount, errors: errors.length });
    
    return { 
      success: true, 
      processedCount,
      error: errors.length > 0 ? `${errors.length} items failed to process` : undefined
    };
  }, [addFoodItem, logFood]);

  return {
    processAndLogFoods,
  };
};

// Helper function to normalize nutrition data
const normalizeNutrition = (
  food: ParsedFoodItem, 
  actualQuantity: number, 
  actualUnit: string
) => {
  let nutritionPer100g;
  let servingSize = VOICE_PROCESSING_CONSTANTS.DEFAULT_SERVING_SIZE;
  let servingSizeUnit = VOICE_PROCESSING_CONSTANTS.DEFAULT_SERVING_UNIT;
  let quantityMultiplier = 1;
  
  if (actualUnit === 'g' || actualUnit === 'grams') {
    // For gram-based foods, calculate per-100g nutrition
    nutritionPer100g = {
      calories: (food.calories / actualQuantity) * 100,
      protein: (food.protein / actualQuantity) * 100,
      carbs: (food.carbs / actualQuantity) * 100,
      fat: (food.fat / actualQuantity) * 100,
    };
    quantityMultiplier = actualQuantity / 100;
    servingSize = VOICE_PROCESSING_CONSTANTS.DEFAULT_SERVING_SIZE;
    servingSizeUnit = VOICE_PROCESSING_CONSTANTS.DEFAULT_SERVING_UNIT;
  } else {
    // For piece-based foods, use nutrition as-is and treat quantity as serving multiplier
    nutritionPer100g = {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    };
    quantityMultiplier = actualQuantity;
    servingSize = 1;
    servingSizeUnit = actualUnit as string;
  }

  return {
    nutritionPer100g,
    servingSize,
    servingSizeUnit,
    quantityMultiplier,
  };
};

// Helper function to generate unique food IDs
const generateFoodId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `food_${timestamp}_${random}`;
};