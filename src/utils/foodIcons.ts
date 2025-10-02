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
  // Water (most common, check first)
  {
    keywords: ['water', 'مياه', 'ماء', 'مية'],
    icon: 'water-drop',
  },

  // Coffee & Hot Beverages
  {
    keywords: ['coffee', 'قهوة', 'cappuccino', 'كابتشينو', 'latte', 'لاتيه', 'espresso', 'اسبريسو', 'starbucks', 'ستاربوكس', 'dancing goat', 'دانسينج'],
    icon: 'local-cafe',
  },

  // Cold Beverages & Sodas
  {
    keywords: ['cola', 'كولا', 'كوكاكولا', 'pepsi', 'بيبسي', 'sprite', 'سبرايت', 'fanta', 'فانتا', 'soda', 'صودا'],
    icon: 'local-drink',
  },

  // Juices & Smoothies
  {
    keywords: ['juice', 'عصير', 'smoothie', 'سموذي', 'orange juice', 'برتقال'],
    icon: 'emoji-food-beverage',
  },

  // Fruits
  {
    keywords: ['apple', 'تفاح', 'banana', 'موز', 'orange', 'برتقال', 'mango', 'منجا', 'منجاويز', 'عويس', 'grape', 'عنب', 'peach', 'خوخ', 'strawberry', 'فراولة', 'fruit', 'فاكهة'],
    icon: 'apple',
  },

  // Vegetables & Salads
  {
    keywords: ['vegetables', 'خضار', 'salad', 'سلطة', 'سلو', 'coleslaw', 'كول سلو', 'tomato', 'طماطم', 'cucumber', 'خيار', 'lettuce', 'خس'],
    icon: 'eco',
  },

  // Burgers & Sandwiches
  {
    keywords: ['burger', 'برجر', 'همبرجر', 'sandwich', 'ساندوتش', 'بيج تيستي', 'big tasty', 'whopper'],
    icon: 'lunch-dining',
  },

  // Poultry & Chicken
  {
    keywords: ['chicken', 'فرخة', 'دجاج', 'فراخ', 'poultry', 'kfc', 'تشيكن', 'nuggets', 'ناجتس'],
    icon: 'set-meal',
  },

  // Meat & Beef
  {
    keywords: ['beef', 'meat', 'لحمة', 'لحم', 'steak', 'ستيك'],
    icon: 'restaurant-menu',
  },

  // Fish & Seafood
  {
    keywords: ['fish', 'سمك', 'salmon', 'سالمون', 'tuna', 'تونة', 'seafood', 'shrimp', 'جمبري'],
    icon: 'phishing',
  },

  // Rice & Grains
  {
    keywords: ['rice', 'رز', 'ارز', 'grain', 'quinoa', 'كينوا', 'koshari', 'كشري'],
    icon: 'rice-bowl',
  },

  // Bread & Baked Goods
  {
    keywords: ['bread', 'عيش', 'خبز', 'toast', 'توست', 'croissant', 'كرواسون', 'بسكويت', 'biscuit', 'مخبوزات'],
    icon: 'bakery-dining',
  },

  // Dairy Products
  {
    keywords: ['milk', 'لبن', 'حليب', 'yogurt', 'زبادي', 'cheese', 'جبن', 'جبنة', 'مراعي', 'cream', 'قشطة'],
    icon: 'coffee',
  },

  // Pizza
  {
    keywords: ['pizza', 'بيتزا'],
    icon: 'local-pizza',
  },

  // Fast Food
  {
    keywords: ['mcdonald', 'ماكدونالدز', 'kfc', 'كنتاكي', 'burger king', 'fries', 'بطاطس'],
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
    icon: 'grain',
  },

  // Eggs
  {
    keywords: ['egg', 'بيض', 'بيضة', 'omelet', 'اومليت'],
    icon: 'egg-alt',
  },

  // Pasta
  {
    keywords: ['pasta', 'مكرونة', 'باستا', 'spaghetti', 'اسباجيتي', 'نودلز', 'noodles', 'bolognese', 'بولونيز'],
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