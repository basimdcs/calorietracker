// Unit conversion utilities for accurate nutrition calculations

export interface UnitConversion {
  unit: string;
  label: string;
  gramsPerUnit: number;
  isRecommended?: boolean;
}

// Base unit conversions (grams per unit)
const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Weight-based units
  grams: { unit: 'grams', label: 'جرام', gramsPerUnit: 1, isRecommended: true },
  
  // Volume-based units (approximate conversions)
  cups: { unit: 'cups', label: 'كوب', gramsPerUnit: 240 }, // 1 cup ≈ 240ml ≈ 240g for liquids
  tablespoons: { unit: 'tablespoons', label: 'ملعقة كبيرة', gramsPerUnit: 15 },
  teaspoons: { unit: 'teaspoons', label: 'ملعقة صغيرة', gramsPerUnit: 5 },
  
  // Count-based units (context-dependent)
  pieces: { unit: 'pieces', label: 'قطعة', gramsPerUnit: 120 }, // Default assumption for medium items
  slices: { unit: 'slices', label: 'شريحة', gramsPerUnit: 30 },
  bowls: { unit: 'bowls', label: 'طبق', gramsPerUnit: 200 },
  servings: { unit: 'servings', label: 'حصة', gramsPerUnit: 150 },
};

// Food-specific unit conversions for more accurate calculations
const FOOD_SPECIFIC_CONVERSIONS: Record<string, Record<string, number>> = {
  // Rice and grains
  rice: {
    cups: 185, // 1 cup cooked rice ≈ 185g
    bowls: 250, // 1 bowl ≈ 250g
  },
  
  // Bread
  bread: {
    pieces: 25, // 1 slice ≈ 25g
    slices: 25,
  },
  
  // Vegetables
  vegetables: {
    cups: 150, // 1 cup chopped vegetables ≈ 150g
    pieces: 80, // 1 medium vegetable ≈ 80g
  },
  
  // Meat and protein
  meat: {
    pieces: 120, // 1 piece/serving meat ≈ 120g
    cups: 140, // 1 cup diced meat ≈ 140g
  },
  
  // Fruits
  fruits: {
    pieces: 180, // 1 medium fruit ≈ 180g (more realistic for mango, apple, etc.)
    cups: 165, // 1 cup chopped fruit ≈ 165g
  },
};

// Get suggested units for a specific food type
export const getSuggestedUnits = (foodName: string): UnitConversion[] => {
  const name = foodName.toLowerCase();
  
  // Meat-based foods
  if (name.includes('كفتة') || name.includes('لحم') || name.includes('دجاج') || name.includes('فراخ')) {
    return [
      { ...UNIT_CONVERSIONS.grams, isRecommended: true },
      { ...UNIT_CONVERSIONS.pieces, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.meat.pieces },
      { ...UNIT_CONVERSIONS.cups, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.meat.cups },
    ];
  }
  
  // Rice and grains
  if (name.includes('رز') || name.includes('كشري') || name.includes('برغل')) {
    return [
      { ...UNIT_CONVERSIONS.cups, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.rice.cups, isRecommended: true },
      { ...UNIT_CONVERSIONS.bowls, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.rice.bowls },
      { ...UNIT_CONVERSIONS.grams },
    ];
  }
  
  // Bread and pastries
  if (name.includes('عيش') || name.includes('خبز') || name.includes('فطير')) {
    return [
      { ...UNIT_CONVERSIONS.pieces, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.bread.pieces, isRecommended: true },
      { ...UNIT_CONVERSIONS.slices, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.bread.slices },
      { ...UNIT_CONVERSIONS.grams },
    ];
  }
  
  // Vegetables and salads
  if (name.includes('خضار') || name.includes('سلطة') || name.includes('طماطم') || name.includes('خيار') || name.toLowerCase().includes('salad')) {
    return [
      { ...UNIT_CONVERSIONS.grams, isRecommended: true },
      { ...UNIT_CONVERSIONS.cups, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.vegetables.cups },
      { ...UNIT_CONVERSIONS.bowls, gramsPerUnit: 150 }, // Salad bowl
    ];
  }
  
  // Fruits (including mango, apple, etc.)
  if (name.includes('فاكهة') || name.includes('تفاح') || name.includes('موز') || name.includes('برتقال') || name.includes('مانجا') || name.includes('مانجو') || name.includes('مانج')) {
    return [
      { ...UNIT_CONVERSIONS.pieces, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.fruits.pieces, isRecommended: true },
      { ...UNIT_CONVERSIONS.cups, gramsPerUnit: FOOD_SPECIFIC_CONVERSIONS.fruits.cups },
      { ...UNIT_CONVERSIONS.grams },
    ];
  }
  
  // Default suggestions
  return [
    { ...UNIT_CONVERSIONS.grams, isRecommended: true },
    { ...UNIT_CONVERSIONS.pieces },
    { ...UNIT_CONVERSIONS.cups },
    { ...UNIT_CONVERSIONS.bowls },
  ];
};

// Calculate nutrition based on quantity and unit
export const calculateNutrition = (
  baseNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
  baseQuantity: number,
  baseUnit: string,
  newQuantity: number,
  newUnit: string,
  foodName: string
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} => {
  // Get the gram conversion for both base and new units
  const baseUnitConversion = getSuggestedUnits(foodName).find(u => u.unit === baseUnit) || UNIT_CONVERSIONS.grams;
  const newUnitConversion = getSuggestedUnits(foodName).find(u => u.unit === newUnit) || UNIT_CONVERSIONS.grams;
  
  // Calculate base weight in grams
  const baseWeightInGrams = baseQuantity * baseUnitConversion.gramsPerUnit;
  
  // Calculate new weight in grams
  const newWeightInGrams = newQuantity * newUnitConversion.gramsPerUnit;
  
  // Calculate the multiplier
  const multiplier = newWeightInGrams / baseWeightInGrams;
  
  return {
    calories: Math.round(baseNutrition.calories * multiplier),
    protein: Math.round((baseNutrition.protein * multiplier) * 10) / 10,
    carbs: Math.round((baseNutrition.carbs * multiplier) * 10) / 10,
    fat: Math.round((baseNutrition.fat * multiplier) * 10) / 10,
  };
};

// Get estimated weight for display
export const getEstimatedWeight = (quantity: number, unit: string, foodName: string): string => {
  const suggestedUnits = getSuggestedUnits(foodName);
  const unitConversion = suggestedUnits.find(u => u.unit === unit) || UNIT_CONVERSIONS[unit] || UNIT_CONVERSIONS.grams;
  const weightInGrams = Math.round(quantity * unitConversion.gramsPerUnit);
  
  // Debug logging
  console.log('Weight calculation:', {
    foodName,
    quantity,
    unit,
    gramsPerUnit: unitConversion.gramsPerUnit,
    weightInGrams,
    suggestedUnits: suggestedUnits.map(u => ({ unit: u.unit, grams: u.gramsPerUnit }))
  });
  
  if (weightInGrams >= 1000) {
    return `${(weightInGrams / 1000).toFixed(1)}kg`;
  }
  return `${weightInGrams}g`;
};