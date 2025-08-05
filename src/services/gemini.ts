import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { ParsedFoodItem } from '../types';

// Use the environment configuration
const GEMINI_API_KEY = env.GEMINI_API_KEY;

// Debug the loaded key
console.log('🔍 Gemini API Key Loading Debug:', {
  envConfigKey: env.GEMINI_API_KEY,
  processEnvKey: process.env.GEMINI_API_KEY,
  finalKey: GEMINI_API_KEY,
  keyLength: GEMINI_API_KEY?.length,
  keyStart: GEMINI_API_KEY?.substring(0, 15) + '...'
});

// Gemini Response Types
interface GeminiStep1Response {
  name: string;
  original_phrase: string;
  cookingMethod: 'grilled' | 'roasted' | 'fried' | 'boiled' | 'raw' | 'unknown';
  quantity_input: string;
  quantity_is_gross: boolean;
  edible_grams_low: number;
  edible_grams_high: number;
  edible_grams: number;
  assumptions: string[];
  confidence: number;
  needsQuantity: boolean;
  needsCookingMethod: boolean;
  suggestedQuantity: string[];
  suggestedCookingMethods: string[];
}

interface GeminiStep2Food {
  name: string;
  quantity: number;
  unit: string;
  nutrition_basis: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calories_per_100g: number;
  quality: {
    passed_sanity_checks: boolean;
    notes: string;
    confidence: number;
  };
}

interface GeminiStep2Response {
  foods: GeminiStep2Food[];
  total: {
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

class GeminiService {
  private client: GoogleGenerativeAI | null = null;

  private initializeClient(): GoogleGenerativeAI {
    if (this.client) return this.client;
    
    this.logInitializationDebug();
    
    if (!this.isValidApiKey()) {
      throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }

    this.client = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    console.log('✅ Gemini client initialized successfully');
    return this.client;
  }

  private isValidApiKey(): boolean {
    const isValid = !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here' && GEMINI_API_KEY.length > 10);
    console.log('🔍 Gemini API Key Validation:', {
      hasKey: !!GEMINI_API_KEY,
      keyLength: GEMINI_API_KEY?.length || 0,
      keyPrefix: GEMINI_API_KEY?.substring(0, 15) + '...',
      isNotDefault: GEMINI_API_KEY !== 'your-gemini-api-key-here',
      isValid
    });
    return isValid;
  }

  private logInitializationDebug(): void {
    const debugInfo = {
      hasApiKey: !!GEMINI_API_KEY,
      keyLength: GEMINI_API_KEY?.length || 0,
      keyPrefix: GEMINI_API_KEY?.substring(0, 10) + '...',
      isDefaultValue: GEMINI_API_KEY === 'your-gemini-api-key-here',
      environment: process.env.NODE_ENV,
      platform: process.env.EAS_PLATFORM,
    };
    
    console.log('🔍 Gemini Client Initialization Debug:', debugInfo);
  }

  // Gemini Step 1: Parse to edible grams with ambiguity detection
  private async parseToEdibleGramsGemini(text: string): Promise<GeminiStep1Response[]> {
    const client = this.initializeClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a nutrition normalizer for Arabic/Egyptian Arabic voice logs.
Goal: extract foods and convert to EDIBLE cooked grams (remove bones/shells; keep edible skin if typical).

Rules:
- If the phrase implies a whole or bone-in item (e.g., "نص فرخة", "ورك", "جناح", whole fish), treat the mentioned amount as GROSS, then estimate EDIBLE grams using realistic yields. Record the assumption used.
- If the phrase gives a net weight (e.g., "١٥٠ جرام", "ربع كيلو كفتة"), treat as EDIBLE unless clearly raw/gross.
- Map dialect numerals & measures (نص=0.5, ربع=0.25, نص كيلو=500g, ربع كيلو=250g, "مية/مي"=100g, "طبق صغير/كبير"→ pick a realistic range and midpoint).
- Cooking method: extract if present; else set "unknown".
- Default basis for unspecific "فرخة/دجاج": whole chicken, grilled/roasted, meat+skin, edible portion.
- If ambiguous, provide a range and choose a midpoint; set needs flags.

Return ONLY valid JSON array. Do not include prose or code fences.
Format: [
  {
    "name": "canonical food name (Arabic or English)",
    "original_phrase": "exact user words for this item",
    "cookingMethod": "grilled|roasted|fried|boiled|raw|unknown",
    "quantity_input": "the user's quantity words",
    "quantity_is_gross": true|false,
    "edible_grams_low": number,
    "edible_grams_high": number,
    "edible_grams": number,
    "assumptions": ["short notes on yields/interpretation"],
    "confidence": number,
    "needsQuantity": true|false,
    "needsCookingMethod": true|false,
    "suggestedQuantity": ["100g","150g","200g"],
    "suggestedCookingMethods": ["grilled","roasted","fried"]
  }
]

Text: ${text}`;

    console.log('📤 GEMINI STEP 1 REQUEST - Input text:', text);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    console.log('📥 GEMINI STEP 1 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from Gemini Step 1');
    
    // Parse JSON response
    const cleanContent = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    console.log('📥 GEMINI STEP 1 RESPONSE - Parsed JSON:', parsed);
    
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  // Gemini Step 2: Calculate macros with sanity checks
  private async calculateMacrosGemini(step1Foods: GeminiStep1Response[]): Promise<GeminiStep2Response> {
    const client = this.initializeClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const foodsInput = step1Foods.map(f => `- ${f.name}: ${f.edible_grams}g (${f.cookingMethod})`).join('\n');
    
    const prompt = `You are a deterministic nutrition calculator.
Input: array with "name", "edible_grams", and "cookingMethod".
Tasks:
1) Map each item to a single nutrition basis deterministically:
   - If name implies chicken/فرخة and no cut/skin specified → "whole roasted chicken, meat+skin, edible portion".
   - Respect explicit cut/skin if provided (e.g., صدر/skinless breast, ورك/thigh).
   - Treat "grilled"≈"roasted" for chicken unless fried/breaded is explicit.
2) Compute macros and calories.
3) Apply sanity checks and adjust if needed.

Sanity checks (per 100g edible):
- protein_g ≤ 35
- fat_g ≤ 30 (higher only if clearly fatty and stated)
- carbs_g ≥ 0
- calories ≈ 4*(P+C)+9*F within ±10%. If outside, adjust calories to macro sum.
Also ensure totals scale linearly with quantity.

Return ONLY valid JSON. No prose, no code fences.
Format:
{
  "foods": [
    {
      "name": "string",
      "quantity": number,
      "unit": "grams",
      "nutrition_basis": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "calories_per_100g": number,
      "quality": {
        "passed_sanity_checks": true|false,
        "notes": "short note",
        "confidence": number
      }
    }
  ],
  "total": {
    "quantity": number,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Foods (edible grams from Step 1):
${foodsInput}`;

    console.log('📤 GEMINI STEP 2 REQUEST - Foods input:', foodsInput);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    console.log('📥 GEMINI STEP 2 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from Gemini Step 2');
    
    // Parse JSON response
    const cleanContent = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    console.log('📥 GEMINI STEP 2 RESPONSE - Parsed JSON:', parsed);
    
    return parsed;
  }

  // Gemini Combined flow
  async parseFoodFromTextGemini(text: string): Promise<ParsedFoodItem[]> {
    try {
      console.log('💎 GEMINI APPROACH: Starting enhanced food parsing for:', text);
      
      // Step 1: Parse to edible grams with ambiguity detection
      const step1Results = await this.parseToEdibleGramsGemini(text);
      
      if (step1Results.length === 0) {
        throw new Error('No food items detected in Step 1');
      }
      
      // Step 2: Calculate macros with sanity checks  
      const step2Results = await this.calculateMacrosGemini(step1Results);
      
      // Map to ParsedFoodItem format
      const parsedFoods = this.mapGeminiResultsToParsedFoodItems(step1Results, step2Results);
      
      console.log('✅ GEMINI APPROACH: Completed successfully with', parsedFoods.length, 'items');
      return parsedFoods;
      
    } catch (error) {
      console.error('❌ GEMINI APPROACH: Failed:', error);
      throw error;
    }
  }

  // Map Gemini results to existing ParsedFoodItem interface
  private mapGeminiResultsToParsedFoodItems(step1: GeminiStep1Response[], step2: GeminiStep2Response): ParsedFoodItem[] {
    // Handle cases where Step 2 might return more/fewer items than Step 1
    const mappedItems: ParsedFoodItem[] = [];
    
    // Use the minimum length to avoid undefined errors
    const itemCount = Math.min(step1.length, step2.foods.length);
    
    for (let i = 0; i < itemCount; i++) {
      const s1Food = step1[i];
      const s2Food = step2.foods[i];
      
      if (s1Food && s2Food) {
        mappedItems.push({
          name: s2Food.name,
          calories: Math.round(s2Food.calories),
          protein: Math.round(s2Food.protein * 10) / 10,
          carbs: Math.round(s2Food.carbs * 10) / 10,
          fat: Math.round(s2Food.fat * 10) / 10,
          confidence: s2Food.quality.confidence,
          quantity: s2Food.quantity,
          unit: s2Food.unit,
          cookingMethod: s1Food.cookingMethod === 'unknown' ? undefined : s1Food.cookingMethod,
          needsQuantity: s1Food.needsQuantity,
          suggestedQuantity: s1Food.suggestedQuantity,
          needsCookingMethod: s1Food.needsCookingMethod,
          suggestedCookingMethods: s1Food.suggestedCookingMethods,
          isNutritionComplete: s2Food.quality.passed_sanity_checks,
          nutritionNotes: [
            `💎 Gemini: ${s2Food.nutrition_basis}`,
            ...s1Food.assumptions,
            s2Food.quality.notes
          ].filter(Boolean).join('; ')
        });
      }
    }
    
    // If Step 1 has more items than Step 2, handle remaining Step 1 items
    if (step1.length > step2.foods.length) {
      console.warn(`⚠️ Gemini: Step 1 returned ${step1.length} items but Step 2 returned ${step2.foods.length} items. Missing nutrition data for some items.`);
    }
    
    // If Step 2 has more items than Step 1, handle remaining Step 2 items
    if (step2.foods.length > step1.length) {
      console.warn(`⚠️ Gemini: Step 2 returned ${step2.foods.length} items but Step 1 returned ${step1.length} items. Using first item from Step 1 for extra nutrition data.`);
      
      // Use first Step 1 item as template for extra Step 2 items
      const templateS1 = step1[0];
      if (templateS1) {
        for (let i = step1.length; i < step2.foods.length; i++) {
          const s2Food = step2.foods[i];
          mappedItems.push({
            name: s2Food.name,
            calories: Math.round(s2Food.calories),
            protein: Math.round(s2Food.protein * 10) / 10,
            carbs: Math.round(s2Food.carbs * 10) / 10,
            fat: Math.round(s2Food.fat * 10) / 10,
            confidence: s2Food.quality.confidence,
            quantity: s2Food.quantity,
            unit: s2Food.unit,
            cookingMethod: templateS1.cookingMethod === 'unknown' ? undefined : templateS1.cookingMethod,
            needsQuantity: templateS1.needsQuantity,
            suggestedQuantity: templateS1.suggestedQuantity,
            needsCookingMethod: templateS1.needsCookingMethod,
            suggestedCookingMethods: templateS1.suggestedCookingMethods,
            isNutritionComplete: s2Food.quality.passed_sanity_checks,
            nutritionNotes: [
              `💎 Gemini: ${s2Food.nutrition_basis}`,
              ...templateS1.assumptions,
              s2Food.quality.notes,
              '(Extra item from Step 2)'
            ].filter(Boolean).join('; ')
          });
        }
      }
    }
    
    console.log(`✅ Gemini mapping: ${step1.length} Step 1 items → ${step2.foods.length} Step 2 items → ${mappedItems.length} final items`);
    
    return mappedItems;
  }

  // Test method for Gemini
  async testBasicQuery(query: string): Promise<string> {
    try {
      const client = this.initializeClient();
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent(query);
      const response = await result.response;
      const content = response.text();
      
      console.log('🧪 Basic Gemini query result:', content);
      return content || 'No response';
    } catch (error) {
      console.error('❌ Error in basic Gemini query:', error);
      throw error;
    }
  }
}

// Initialize the service instance
let geminiService: GeminiService;

try {
  geminiService = new GeminiService();
} catch (error) {
  console.error('Failed to initialize Gemini service:', error);
  geminiService = new GeminiService();
}

// Test function to verify environment variable loading
export const testGeminiEnvironmentVariable = () => {
  const result = {
    direct: !!process.env.GEMINI_API_KEY,
    config: !!env.GEMINI_API_KEY,
    isValid: !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your-gemini-api-key-here'),
    allGeminiVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
  };
  
  console.log('🧪 Gemini Environment Variable Test Results:', result);
  return result;
};

// Gemini Enhanced food parsing function
export const parseFoodFromTextGemini = async (text: string) => {
  try {
    return await geminiService.parseFoodFromTextGemini(text);
  } catch (error) {
    console.error('Gemini food parsing failed:', error);
    throw error;
  }
};

// Test function for basic Gemini queries
export const testBasicGeminiQuery = async (query: string) => {
  try {
    return await geminiService.testBasicQuery(query);
  } catch (error) {
    console.error('Basic Gemini query failed:', error);
    throw error;
  }
};

export { geminiService };