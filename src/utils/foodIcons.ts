/**
 * Food Icon Mapping Utility
 * Maps food names to appropriate Material Icons
 */

import { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

interface FoodCategory {
  keywords: string[];
  icon: MaterialIconName;
  color?: string;
}

// Food categories with keywords and corresponding icons
const FOOD_CATEGORIES: FoodCategory[] = [
  // Poultry & Chicken
  {
    keywords: ['chicken', 'فرخة', 'دجاج', 'فراخ', 'poultry', 'kfc', 'تشيكن'],
    icon: 'restaurant',
  },
  
  // Meat & Beef
  {
    keywords: ['beef', 'meat', 'لحمة', 'لحم', 'steak', 'burger', 'برجر', 'همبرجر'],
    icon: 'restaurant-menu',
  },
  
  // Fish & Seafood
  {
    keywords: ['fish', 'سمك', 'salmon', 'tuna', 'seafood', 'shrimp', 'جمبري'],
    icon: 'set-meal',
  },
  
  // Fruits
  {
    keywords: ['apple', 'تفاح', 'banana', 'موز', 'orange', 'برتقال', 'mango', 'مانجا', 'grape', 'عنب', 'peach', 'خوخ', 'strawberry', 'فراولة', 'fruit'],
    icon: 'eco',
  },
  
  // Vegetables
  {
    keywords: ['vegetables', 'خضار', 'salad', 'سلطة', 'tomato', 'طماطم', 'cucumber', 'خيار', 'lettuce', 'خس'],
    icon: 'grass',
  },
  
  // Rice & Grains
  {
    keywords: ['rice', 'رز', 'ارز', 'grain', 'quinoa', 'كينوا', 'koshari', 'كشري'],
    icon: 'grain',
  },
  
  // Bread & Baked Goods
  {
    keywords: ['bread', 'عيش', 'خبز', 'toast', 'توست', 'croissant', 'كرواسون', 'بسكويت', 'biscuit', 'مخبوزات'],
    icon: 'bakery-dining',
  },
  
  // Dairy Products
  {
    keywords: ['milk', 'لبن', 'yogurt', 'زبادي', 'cheese', 'جبن', 'جبنة', 'مراعي', 'cream', 'قشطة'],
    icon: 'water-drop',
  },
  
  // Coffee & Hot Beverages
  {
    keywords: ['coffee', 'قهوة', 'cappuccino', 'كابتشينو', 'latte', 'لاتيه', 'espresso', 'starbucks', 'ستاربوكس', 'tea', 'شاي'],
    icon: 'local-cafe',
  },
  
  // Cold Beverages & Juices
  {
    keywords: ['juice', 'عصير', 'smoothie', 'سموذي', 'soda', 'cola', 'كولا', 'pepsi', 'بيبسي', 'water', 'مياه'],
    icon: 'local-drink',
  },
  
  // Pizza
  {
    keywords: ['pizza', 'بيتزا'],
    icon: 'local-pizza',
  },
  
  // Fast Food
  {
    keywords: ['mcdonald', 'ماكدونالدز', 'kfc', 'كنتاكي', 'burger king', 'sandwich', 'ساندوتش', 'fries', 'بطاطس', 'nuggets'],
    icon: 'fastfood',
  },
  
  // Sweets & Desserts
  {
    keywords: ['chocolate', 'شوكولاتة', 'cake', 'كيك', 'ice cream', 'آيس كريم', 'cookie', 'كوكيز', 'candy', 'حلوى', 'basbousa', 'بسبوسة', 'kunafa', 'كنافة'],
    icon: 'cake',
  },
  
  // Nuts & Snacks
  {
    keywords: ['nuts', 'مكسرات', 'almonds', 'لوز', 'chips', 'شيبسي', 'snack', 'سناك'],
    icon: 'scatter-plot',
  },
  
  // Eggs
  {
    keywords: ['egg', 'بيض', 'بيضة', 'omelet', 'اومليت'],
    icon: 'egg',
  },
  
  // Pasta
  {
    keywords: ['pasta', 'مكرونة', 'spaghetti', 'اسباجيتي', 'noodles'],
    icon: 'ramen-dining',
  },
  
  // Soup
  {
    keywords: ['soup', 'شوربة', 'broth', 'مرق'],
    icon: 'soup-kitchen',
  },
];

// Default icon for unmatched foods
const DEFAULT_FOOD_ICON: MaterialIconName = 'restaurant';

/**
 * Get the appropriate icon for a food item based on its name
 */
export function getFoodIcon(foodName: string): MaterialIconName {
  if (!foodName || typeof foodName !== 'string') {
    return DEFAULT_FOOD_ICON;
  }
  
  const normalizedName = foodName.toLowerCase().trim();
  
  // Find the first matching category
  for (const category of FOOD_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return category.icon;
      }
    }
  }
  
  return DEFAULT_FOOD_ICON;
}

/**
 * Get food icon with color suggestion (optional enhancement)
 */
export function getFoodIconWithColor(foodName: string): { icon: MaterialIconName; color?: string } {
  const icon = getFoodIcon(foodName);
  
  // Optional: Return color suggestions for specific food types
  // This can be used later if you want colored icons
  const colorMapping: Record<MaterialIconName, string> = {
    'eco': '#4CAF50',           // Green for fruits
    'grass': '#8BC34A',         // Light green for vegetables  
    'local-cafe': '#795548',    // Brown for coffee
    'local-drink': '#2196F3',   // Blue for beverages
    'cake': '#E91E63',          // Pink for sweets
    'local-pizza': '#FF5722',   // Orange for pizza
  };
  
  return {
    icon,
    color: colorMapping[icon],
  };
}

/**
 * Check if a food name matches a specific category
 */
export function isFoodCategory(foodName: string, categoryKeywords: string[]): boolean {
  if (!foodName || typeof foodName !== 'string') {
    return false;
  }
  
  const normalizedName = foodName.toLowerCase().trim();
  
  return categoryKeywords.some(keyword => 
    normalizedName.includes(keyword.toLowerCase())
  );
}

// Export some useful category checkers
export const isFruit = (foodName: string) => 
  isFoodCategory(foodName, ['apple', 'تفاح', 'banana', 'موز', 'orange', 'برتقال', 'mango', 'مانجا', 'fruit']);

export const isBeverage = (foodName: string) => 
  isFoodCategory(foodName, ['coffee', 'قهوة', 'juice', 'عصير', 'tea', 'شاي', 'water', 'مياه']);

export const isProtein = (foodName: string) => 
  isFoodCategory(foodName, ['chicken', 'فرخة', 'meat', 'لحمة', 'fish', 'سمك', 'egg', 'بيض']);