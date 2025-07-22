import { ParsedFoodItem, NutritionInfo } from '../types';

// Food density database for accurate unit conversions
const FOOD_DENSITIES = {
  // Grains & Starches (g/cup)
  rice: 185,
  pasta: 220,
  quinoa: 170,
  oats: 80,
  bread: 30, // per slice
  
  // Proteins (g/piece or g/cup)
  chicken_breast: 150, // per piece
  beef: 150, // per serving
  fish: 140, // per fillet
  egg: 50, // per egg
  tofu: 240, // per cup
  
  // Dairy (g/cup)
  milk: 244,
  yogurt: 245,
  cheese: 113,
  
  // Vegetables (g/cup)
  broccoli: 91,
  carrots: 128,
  spinach: 30,
  tomato: 180,
  potato: 150, // medium potato
  
  // Fruits (g/piece or g/cup)
  apple: 180, // medium apple
  banana: 120, // medium banana
  orange: 150, // medium orange
  berries: 150, // per cup
  
  // Nuts & Seeds (g/cup)
  almonds: 143,
  walnuts: 117,
  peanuts: 146,
  
  // Liquids (ml/cup)
  water: 240,
  juice: 240,
  oil: 218,
  
  // Default fallback
  default: 100,
} as const;

// Cooking method multipliers for calorie adjustments
const COOKING_MULTIPLIERS = {
  raw: 1.0,
  boiled: 1.0,
  steamed: 1.0,
  grilled: 1.1,
  baked: 1.05,
  fried: 1.4,
  deep_fried: 1.8,
  sauteed: 1.2,
  roasted: 1.1,
  default: 1.0,
} as const;

// Standard serving sizes for common foods (in grams)
const STANDARD_SERVINGS = {
  chicken_breast: 85,
  beef: 85,
  fish: 85,
  rice: 45, // dry weight
  pasta: 56, // dry weight
  egg: 50,
  apple: 180,
  banana: 120,
  bread: 30, // per slice
  default: 100,
} as const;

export interface NutritionCalculationOptions {
  foodName: string;
  baseNutrition: NutritionInfo;
  quantity: number;
  unit: string;
  cookingMethod?: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  confidence: number;
}

class NutritionService {
  /**
   * Calculate accurate nutrition based on quantity, unit, and cooking method
   */
  calculateNutrition(options: NutritionCalculationOptions): NutritionInfo & ValidationResult {
    const { foodName, baseNutrition, quantity, unit, cookingMethod } = options;
    
    try {
      // Normalize food name for lookup
      const normalizedName = this.normalizeFoodName(foodName);
      
      // Get base multiplier for quantity and unit conversion
      const quantityMultiplier = this.getQuantityMultiplier(normalizedName, quantity, unit);
      
      // Get cooking method multiplier
      const cookingMultiplier = this.getCookingMultiplier(cookingMethod);
      
      // Calculate final nutrition values
      const finalMultiplier = quantityMultiplier * cookingMultiplier;
      
      const calculatedNutrition: NutritionInfo = {
        calories: Math.round(baseNutrition.calories * finalMultiplier),
        protein: Math.round(baseNutrition.protein * finalMultiplier * 10) / 10,
        carbs: Math.round(baseNutrition.carbs * finalMultiplier * 10) / 10,
        fat: Math.round(baseNutrition.fat * cookingMultiplier * finalMultiplier * 10) / 10, // Fat changes more with cooking
      };
      
      // Validate results
      const validation = this.validateNutrition(calculatedNutrition, options);
      
      return {
        ...calculatedNutrition,
        ...validation,
      };
    } catch (error) {
      console.error('Nutrition calculation error:', error);
      return {
        ...baseNutrition,
        isValid: false,
        warnings: [],
        errors: ['Failed to calculate nutrition accurately'],
        confidence: 0.1,
      };
    }
  }

  /**
   * Get quantity multiplier based on unit conversion
   */
  private getQuantityMultiplier(foodName: string, quantity: number, unit: string): number {
    const normalizedUnit = unit.toLowerCase();
    
    switch (normalizedUnit) {
      case 'grams':
      case 'g':
        return quantity / 100; // Base nutrition is per 100g
        
      case 'pieces':
      case 'piece':
      case 'items':
        const pieceWeight = this.getPieceWeight(foodName);
        return (quantity * pieceWeight) / 100;
        
      case 'cups':
      case 'cup':
        const cupWeight = this.getCupWeight(foodName);
        return (quantity * cupWeight) / 100;
        
      case 'tablespoons':
      case 'tbsp':
        const tbspWeight = this.getTbspWeight(foodName);
        return (quantity * tbspWeight) / 100;
        
      case 'teaspoons':
      case 'tsp':
        const tspWeight = this.getTspWeight(foodName);
        return (quantity * tspWeight) / 100;
        
      case 'ounces':
      case 'oz':
        return (quantity * 28.35) / 100; // 1 oz = 28.35g
        
      case 'pounds':
      case 'lbs':
        return (quantity * 453.6) / 100; // 1 lb = 453.6g
        
      case 'ml':
      case 'milliliters':
        // For liquids, assume 1ml = 1g (water density)
        const density = this.getLiquidDensity(foodName);
        return (quantity * density) / 100;
        
      default:
        console.warn(`Unknown unit: ${unit}, assuming pieces`);
        return quantity; // Assume 1:1 ratio as fallback
    }
  }

  /**
   * Get cooking method multiplier
   */
  private getCookingMultiplier(cookingMethod?: string): number {
    if (!cookingMethod) return COOKING_MULTIPLIERS.default;
    
    const normalized = cookingMethod.toLowerCase().replace(/\s+/g, '_');
    
    // Try exact match first
    if (normalized in COOKING_MULTIPLIERS) {
      return COOKING_MULTIPLIERS[normalized as keyof typeof COOKING_MULTIPLIERS];
    }
    
    // Try partial matches
    if (normalized.includes('fry')) {
      return normalized.includes('deep') ? COOKING_MULTIPLIERS.deep_fried : COOKING_MULTIPLIERS.fried;
    }
    if (normalized.includes('grill')) return COOKING_MULTIPLIERS.grilled;
    if (normalized.includes('bake')) return COOKING_MULTIPLIERS.baked;
    if (normalized.includes('roast')) return COOKING_MULTIPLIERS.roasted;
    if (normalized.includes('steam')) return COOKING_MULTIPLIERS.steamed;
    if (normalized.includes('boil')) return COOKING_MULTIPLIERS.boiled;
    if (normalized.includes('sauté') || normalized.includes('saute')) return COOKING_MULTIPLIERS.sauteed;
    
    return COOKING_MULTIPLIERS.default;
  }

  /**
   * Normalize food name for lookups
   */
  private normalizeFoodName(foodName: string): string {
    return foodName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Get weight per piece for common foods
   */
  private getPieceWeight(foodName: string): number {
    const key = foodName as keyof typeof STANDARD_SERVINGS;
    return STANDARD_SERVINGS[key] || STANDARD_SERVINGS.default;
  }

  /**
   * Get weight per cup for foods
   */
  private getCupWeight(foodName: string): number {
    const key = foodName as keyof typeof FOOD_DENSITIES;
    return FOOD_DENSITIES[key] || FOOD_DENSITIES.default;
  }

  /**
   * Get weight per tablespoon (approximately 1/16 of a cup)
   */
  private getTbspWeight(foodName: string): number {
    return this.getCupWeight(foodName) / 16;
  }

  /**
   * Get weight per teaspoon (approximately 1/48 of a cup)
   */
  private getTspWeight(foodName: string): number {
    return this.getCupWeight(foodName) / 48;
  }

  /**
   * Get liquid density (ml to g conversion)
   */
  private getLiquidDensity(foodName: string): number {
    if (foodName.includes('oil')) return 0.92; // Oil is less dense than water
    if (foodName.includes('honey') || foodName.includes('syrup')) return 1.4;
    if (foodName.includes('milk')) return 1.03;
    return 1.0; // Water density default
  }

  /**
   * Validate nutrition calculations and provide confidence score
   */
  private validateNutrition(nutrition: NutritionInfo, options: NutritionCalculationOptions): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let confidence = 0.8;

    // Check for reasonable calorie ranges
    if (nutrition.calories > 2000) {
      warnings.push('Very high calorie content - please verify portion size');
      confidence -= 0.1;
    }
    
    if (nutrition.calories < 5 && options.quantity > 0) {
      warnings.push('Very low calorie content - may be inaccurate');
      confidence -= 0.2;
    }

    // Validate macronutrient ratios
    const totalMacroCalories = (nutrition.protein * 4) + (nutrition.carbs * 4) + (nutrition.fat * 9);
    const calorieDifference = Math.abs(nutrition.calories - totalMacroCalories);
    
    if (calorieDifference > nutrition.calories * 0.2) {
      warnings.push('Macronutrient calories don\'t match total calories');
      confidence -= 0.1;
    }

    // Check unit compatibility
    if (options.unit === 'cups' && this.isNotMeasurableByVolume(options.foodName)) {
      warnings.push(`"${options.unit}" may not be accurate for ${options.foodName}`);
      confidence -= 0.1;
    }

    // Cooking method warnings
    if (options.cookingMethod && this.getCookingMultiplier(options.cookingMethod) > 1.3) {
      warnings.push(`${options.cookingMethod} cooking adds significant calories from added fats`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
    };
  }

  /**
   * Check if food is not typically measured by volume
   */
  private isNotMeasurableByVolume(foodName: string): boolean {
    const volumeIncompatible = ['chicken', 'beef', 'fish', 'meat', 'egg', 'apple', 'banana', 'orange'];
    return volumeIncompatible.some(food => foodName.toLowerCase().includes(food));
  }

  /**
   * Get suggested units for a food item
   */
  getSuggestedUnits(foodName: string): Array<{ value: string; label: string; isRecommended?: boolean }> {
    const normalized = this.normalizeFoodName(foodName);
    
    const allUnits = [
      { value: 'grams', label: 'Grams (g)', isRecommended: true },
      { value: 'pieces', label: 'Pieces' },
      { value: 'cups', label: 'Cups' },
      { value: 'tablespoons', label: 'Tablespoons (tbsp)' },
      { value: 'teaspoons', label: 'Teaspoons (tsp)' },
      { value: 'ounces', label: 'Ounces (oz)' },
    ];

    // Recommend specific units based on food type
    if (normalized.includes('liquid') || normalized.includes('milk') || normalized.includes('juice')) {
      return [
        { value: 'ml', label: 'Milliliters (ml)', isRecommended: true },
        { value: 'cups', label: 'Cups', isRecommended: true },
        ...allUnits.filter(u => !['ml', 'cups'].includes(u.value)),
      ];
    }

    if (this.isNotMeasurableByVolume(foodName)) {
      return [
        { value: 'grams', label: 'Grams (g)', isRecommended: true },
        { value: 'pieces', label: 'Pieces', isRecommended: true },
        { value: 'ounces', label: 'Ounces (oz)' },
        ...allUnits.filter(u => !['grams', 'pieces', 'ounces'].includes(u.value)),
      ];
    }

    return allUnits;
  }

  /**
   * Get suggested cooking methods for a food
   */
  getSuggestedCookingMethods(foodName: string): string[] {
    const normalized = this.normalizeFoodName(foodName);
    
    if (normalized.includes('chicken') || normalized.includes('meat') || normalized.includes('fish')) {
      return ['Grilled', 'Baked', 'Fried', 'Sautéed', 'Roasted'];
    }
    
    if (normalized.includes('vegetable') || normalized.includes('broccoli') || normalized.includes('carrot')) {
      return ['Steamed', 'Boiled', 'Sautéed', 'Roasted', 'Raw'];
    }
    
    if (normalized.includes('rice') || normalized.includes('pasta')) {
      return ['Boiled', 'Steamed', 'Fried'];
    }
    
    return ['Raw', 'Boiled', 'Steamed', 'Grilled', 'Baked', 'Fried', 'Sautéed', 'Roasted'];
  }

  /**
   * Get nutrition confidence level description
   */
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.8) return 'High accuracy';
    if (confidence >= 0.6) return 'Good estimate';
    if (confidence >= 0.4) return 'Rough estimate';
    return 'Low accuracy - verify manually';
  }
}

export const nutritionService = new NutritionService();