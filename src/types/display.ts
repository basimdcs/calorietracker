/**
 * Display-specific TypeScript types
 * 
 * These types ensure consistent data display across components
 * and prevent property access errors like food.name vs food.foodItem.name
 */

import { LoggedFood } from './index';

/**
 * Flattened food item for display purposes
 * This prevents the nested property access issues
 */
export interface DisplayFood {
  // Core identification
  id: string;
  
  // Display properties (flattened for easy access)
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  
  // Quantity information
  quantity: number;
  servingSize: number;
  servingSizeUnit: string;
  displayQuantity: string; // e.g., "2 × 100g"
  
  // Time information
  loggedAt: Date | string;
  displayTime: string; // e.g., "10:30 AM"
  
  // Original data (for actions like delete/edit)
  originalFood: LoggedFood;
}

/**
 * Utility function to convert LoggedFood to DisplayFood
 * Use this to ensure consistent data transformation
 */
export const toDisplayFood = (food: LoggedFood): DisplayFood => {
  const loggedAtDate = new Date(food.loggedAt);
  
  return {
    id: food.id,
    name: food.foodItem.name,
    calories: food.nutrition.calories,
    protein: food.nutrition.protein,
    carbs: food.nutrition.carbs,
    fat: food.nutrition.fat,
    quantity: food.quantity,
    servingSize: food.foodItem.servingSize,
    servingSizeUnit: food.foodItem.servingSizeUnit,
    displayQuantity: `${food.quantity} × ${food.foodItem.servingSize}${food.foodItem.servingSizeUnit}`,
    loggedAt: food.loggedAt,
    displayTime: loggedAtDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    originalFood: food,
  };
};

/**
 * Props interface for food item components
 * Use this for consistent component interfaces
 */
export interface FoodItemProps {
  food: DisplayFood;
  onDelete?: (foodId: string) => void;
  onEdit?: (foodId: string, quantity: number) => void;
  showActions?: boolean;
  showMacros?: boolean;
  showTime?: boolean;
}

/**
 * USAGE EXAMPLE:
 * 
 * ```tsx
 * // In your component:
 * const { todayItems } = useFoodData();
 * const displayItems = todayItems.map(toDisplayFood);
 * 
 * return (
 *   <div>
 *     {displayItems.map(food => (
 *       <FoodItem 
 *         key={food.id}
 *         food={food}
 *         onDelete={(id) => removeFood(todayDate, id)}
 *         showMacros={true}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */