/**
 * Food Emoji Mapping Utility
 * Maps food names to appropriate emojis
 */

interface FoodCategory {
  keywords: string[];
  icon: string; // Emoji character
}

// Food categories with keywords and corresponding emojis (PRIORITY ORDER!)
const FOOD_CATEGORIES: FoodCategory[] = [
  // Water (most common, check first)
  {
    keywords: ['water', 'مياه', 'ماء', 'مية'],
    icon: '💧',
  },

  // Poultry & Chicken (HIGH PRIORITY - before salads!)
  {
    keywords: ['chicken', 'فرخة', 'دجاج', 'فراخ', 'poultry', 'grilled chicken', 'fried chicken', 'chicken breast', 'chicken salad', 'تشيكن', 'nuggets', 'ناجتس'],
    icon: '🍗',
  },

  // Meat & Beef (HIGH PRIORITY)
  {
    keywords: ['beef', 'meat', 'لحمة', 'لحم', 'steak', 'ستيك', 'bacon', 'بيكون', 'kofta', 'كفتة', 'kebab', 'كباب', 'lamb', 'لحم ضاني', 'meatball', 'كرات اللحم'],
    icon: '🥩',
  },

  // Fish & Seafood (HIGH PRIORITY)
  {
    keywords: ['fish', 'سمك', 'salmon', 'سالمون', 'tuna', 'تونة', 'seafood'],
    icon: '🐟',
  },

  // Shrimp
  {
    keywords: ['shrimp', 'جمبري', 'prawn'],
    icon: '🍤',
  },

  // Coffee & Hot Beverages
  {
    keywords: ['coffee', 'قهوة', 'cappuccino', 'كابتشينو', 'latte', 'لاتيه', 'espresso', 'اسبريسو', 'starbucks', 'ستاربوكس', 'dancing goat', 'دانسينج'],
    icon: '☕',
  },

  // Cold Beverages & Sodas
  {
    keywords: ['cola', 'كولا', 'كوكاكولا', 'pepsi', 'بيبسي', 'sprite', 'سبرايت', 'fanta', 'فانتا', 'soda', 'صودا'],
    icon: '🥤',
  },

  // Juices & Smoothies
  {
    keywords: ['juice', 'عصير', 'smoothie', 'سموذي'],
    icon: '🧃',
  },

  // Milk & Dairy Drinks
  {
    keywords: ['milk', 'لبن', 'حليب', 'milkshake'],
    icon: '🥛',
  },

  // Pizza
  {
    keywords: ['pizza', 'بيتزا'],
    icon: '🍕',
  },

  // Burgers & Sandwiches
  {
    keywords: ['burger', 'برجر', 'همبرجر', 'بيج تيستي', 'big tasty', 'whopper'],
    icon: '🍔',
  },

  // Sandwiches & Wraps
  {
    keywords: ['sandwich', 'ساندوتش', 'wrap', 'راب', 'shawarma', 'شاورما'],
    icon: '🥙',
  },

  // Fries
  {
    keywords: ['fries', 'بطاطس', 'french fries'],
    icon: '🍟',
  },

  // Hot Dog
  {
    keywords: ['hot dog', 'هوت دوج'],
    icon: '🌭',
  },

  // Taco
  {
    keywords: ['taco', 'تاكو'],
    icon: '🌮',
  },

  // Rice & Rice Bowls
  {
    keywords: ['rice', 'رز', 'ارز', 'rice bowl', 'koshari', 'كشري', 'biryani', 'برياني'],
    icon: '🍱',
  },

  // Curry & Stews
  {
    keywords: ['curry', 'كاري', 'stew'],
    icon: '🍛',
  },

  // Pasta & Spaghetti
  {
    keywords: ['pasta', 'مكرونة', 'باستا', 'spaghetti', 'اسباجيتي', 'bolognese', 'بولونيز'],
    icon: '🍝',
  },

  // Noodles & Ramen
  {
    keywords: ['noodles', 'نودلز', 'ramen', 'رامن'],
    icon: '🍜',
  },

  // Soup
  {
    keywords: ['soup', 'شوربة', 'broth', 'مرق'],
    icon: '🍲',
  },

  // Sushi
  {
    keywords: ['sushi', 'سوشي'],
    icon: '🍣',
  },

  // Bread
  {
    keywords: ['bread', 'عيش', 'خبز', 'toast', 'توست'],
    icon: '🍞',
  },

  // Baguette & French bread
  {
    keywords: ['baguette', 'باجيت'],
    icon: '🥖',
  },

  // Croissant & Pastries
  {
    keywords: ['croissant', 'كرواسون', 'pastry'],
    icon: '🥐',
  },

  // Cheese
  {
    keywords: ['cheese', 'جبن', 'جبنة'],
    icon: '🧀',
  },

  // Yogurt & Dairy
  {
    keywords: ['yogurt', 'زبادي', 'مراعي', 'greek yogurt', 'يوجرت'],
    icon: '🥛',
  },

  // Eggs
  {
    keywords: ['egg', 'بيض', 'بيضة', 'omelet', 'اومليت'],
    icon: '🥚',
  },

  // Vegetables & Salads (AFTER proteins!)
  {
    keywords: ['vegetables', 'خضار', 'salad', 'سلطة', 'سلو', 'coleslaw', 'كول سلو', 'tomato', 'طماطم', 'cucumber', 'خيار', 'lettuce', 'خس'],
    icon: '🥗',
  },

  // Fruits - Apple
  {
    keywords: ['apple', 'تفاح'],
    icon: '🍎',
  },

  // Fruits - Banana
  {
    keywords: ['banana', 'موز'],
    icon: '🍌',
  },

  // Fruits - Orange
  {
    keywords: ['orange', 'برتقال'],
    icon: '🍊',
  },

  // Fruits - Grapes
  {
    keywords: ['grape', 'عنب'],
    icon: '🍇',
  },

  // Fruits - Watermelon
  {
    keywords: ['watermelon', 'بطيخ'],
    icon: '🍉',
  },

  // Fruits - Strawberry
  {
    keywords: ['strawberry', 'فراولة'],
    icon: '🍓',
  },

  // Fruits - Mango
  {
    keywords: ['mango', 'منجا', 'منجاويز', 'عويس'],
    icon: '🥭',
  },

  // Generic Fruits
  {
    keywords: ['fruit', 'فاكهة'],
    icon: '🍎',
  },

  // Cake & Desserts
  {
    keywords: ['cake', 'كيك', 'basbousa', 'بسبوسة', 'kunafa', 'كنافة'],
    icon: '🍰',
  },

  // Cookies
  {
    keywords: ['cookie', 'كوكيز', 'بسكويت', 'biscuit'],
    icon: '🍪',
  },

  // Chocolate
  {
    keywords: ['chocolate', 'شوكولاتة', 'candy', 'حلوى'],
    icon: '🍫',
  },

  // Ice Cream
  {
    keywords: ['ice cream', 'آيس كريم', 'gelato'],
    icon: '🍦',
  },

  // Nuts
  {
    keywords: ['nuts', 'مكسرات', 'almonds', 'لوز', 'peanuts', 'فول سوداني'],
    icon: '🥜',
  },

  // Chips & Snacks
  {
    keywords: ['chips', 'شيبسي', 'snack', 'سناك', 'popcorn', 'فشار'],
    icon: '🍿',
  },

  // Fast Food (generic)
  {
    keywords: ['mcdonald', 'ماكدونالدز', 'kfc', 'كنتاكي', 'burger king', 'fast food'],
    icon: '🍔',
  },
];

// Default emoji for unmatched foods
const DEFAULT_FOOD_ICON: string = '🍽️';

/**
 * Get the appropriate emoji for a food item based on its name
 */
export function getFoodIcon(foodName: string): string {
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