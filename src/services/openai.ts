import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedFoodItem, VOICE_PROCESSING_CONSTANTS } from '../types';
import { getFoodIcon } from '../utils/foodIcons';
import { 
  AIQuantityDetectionResult, 
  AINutritionResult, 
  Step2APIResponse, 
  Step3APIResponse,
  ModelUsageSession,
  ParsedFoodItemWithConfidence 
} from '../types/aiTypes';

/**
 * OpenAI Service - Updated to use GPT-4o Transcribe
 * 
 * This service now uses OpenAI's new GPT-4o transcribe model 
 * (https://platform.openai.com/docs/models/gpt-4o-transcribe)
 * instead of the legacy Whisper API. The new model provides:
 * - Better accuracy for Arabic/Egyptian Arabic
 * - Log probabilities for confidence scoring
 * - Token usage statistics
 * - Improved performance and cost efficiency
 * - Better handling of dialects and accents
 */

// Use the environment configuration
const OPENAI_API_KEY = env.OPENAI_API_KEY;

export interface FoodItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  confidence: number;
  quantity?: number;
  unit?: string;
  cookingMethod?: string;
  needsQuantity?: boolean;
  suggestedQuantity?: string[];
  needsCookingMethod?: boolean;
  suggestedCookingMethods?: string[];
  isNutritionComplete?: boolean;
  nutritionNotes?: string;
}

interface TranscriptionResponse {
  text: string;
  logprobs?: Array<{
    token: string;
    logprob: number;
    bytes: number[];
    top_logprobs: Array<{
      token: string;
      logprob: number;
      bytes: number[];
    }>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface NutritionCalculationResponse {
  foods: FoodItem[];
}

// O3 Approach Type Definitions
interface O3Step1Response {
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

interface O3Step2Food {
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

interface O3Step2Response {
  foods: O3Step2Food[];
  total: {
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

class OpenAIService {
  private client: OpenAI | null = null;

  private initializeClient(): OpenAI {
    if (this.client) return this.client;
    
    this.logInitializationDebug();
    
    if (!this.isValidApiKey()) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }

    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI client initialized successfully');
    return this.client;
  }

  private isValidApiKey(): boolean {
    return !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'your-api-key-here');
  }

  private logInitializationDebug(): void {
    const debugInfo = {
      hasApiKey: !!OPENAI_API_KEY,
      keyLength: OPENAI_API_KEY?.length || 0,
      keyPrefix: OPENAI_API_KEY?.substring(0, 10) + '...',
      isDefaultValue: OPENAI_API_KEY === 'your-api-key-here',
      environment: process.env.NODE_ENV,
      platform: process.env.EAS_PLATFORM,
    };
    
    console.log('🔍 OpenAI Client Initialization Debug:', debugInfo);
  }

  async transcribeAudio(audioUri: string, useGPT4o: boolean = false): Promise<string> {
    try {
      console.log('🎤 Starting transcription for:', audioUri, 'Method:', useGPT4o ? 'GPT-4o' : 'Whisper');
      
      if (!this.isValidApiKey()) {
        throw new Error('OpenAI API key is not configured');
      }
      
      // Normal operation - use selected model
      if (useGPT4o) {
        return await this.transcribeWithGPT4o(audioUri);
      } else {
        return await this.transcribeWithWhisper(audioUri);
      }
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw this.createTranscriptionError(error);
    }
  }

  private async transcribeWithWhisper(audioUri: string): Promise<string> {
    console.log('🎵 Using GPT-4o Transcribe model for transcription...');
    const formData = this.createWhisperFormData(audioUri);
    const response = await this.sendTranscriptionRequest(formData);
    return this.handleTranscriptionResponse(response);
  }

  private async transcribeWithGPT4o(audioUri: string): Promise<string> {
    console.log('🤖 Using GPT-4o for transcription...');
    const formData = this.createGPT4oFormData(audioUri);
    const response = await this.sendGPT4oTranscriptionRequest(formData);
    return this.handleTranscriptionResponse(response);
  }

  private createWhisperFormData(audioUri: string): FormData {
    const formData = new FormData();

    // @ts-ignore - React Native FormData expects this object structure
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });

    // Updated to use new GPT-4o transcribe model
    formData.append('model', 'gpt-4o-transcribe');
    formData.append('response_format', 'json');
    // Add logprobs for better confidence scoring (only works with json format)
    formData.append('include', JSON.stringify(['logprobs']));
    // Language hint to guide transcription (Arabic primary with English support)
    formData.append('language', 'ar'); // Model will auto-detect mixed Arabic/English speech
    
    return formData;
  }

  private createGPT4oFormData(audioUri: string): FormData {
    const formData = new FormData();

    // @ts-ignore - React Native FormData expects this object structure
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });

    // GPT-4o transcribe model for consistency
    formData.append('model', 'gpt-4o-transcribe');
    formData.append('response_format', 'json');
    // Add logprobs for better confidence scoring
    formData.append('include', JSON.stringify(['logprobs']));
    // Language hint to guide transcription (Arabic primary with English support)
    formData.append('language', 'ar'); // Model will auto-detect mixed Arabic/English speech
    
    return formData;
  }

  private async sendTranscriptionRequest(formData: FormData): Promise<Response> {
    console.log('📤 Sending GPT-4o Transcribe request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📥 GPT-4o Transcribe response status:', response.status);
    return response;
  }

  private async sendGPT4oTranscriptionRequest(formData: FormData): Promise<Response> {
    console.log('📤 Sending GPT-4o Audio request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📥 GPT-4o Audio response status:', response.status);
    return response;
  }

  private async handleTranscriptionResponse(response: Response): Promise<string> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', response.status, errorText);
      throw this.createApiError(response.status, errorText);
    }

    const jsonResponse: TranscriptionResponse = await response.json();
    const transcriptionText = jsonResponse.text || '';
    
    // Log usage statistics if available
    if (jsonResponse.usage) {
      console.log('📊 Token usage:', jsonResponse.usage);
    }
    
    // Calculate confidence from logprobs if available
    if (jsonResponse.logprobs && jsonResponse.logprobs.length > 0) {
      const avgLogprob = jsonResponse.logprobs.reduce((sum, item) => sum + item.logprob, 0) / jsonResponse.logprobs.length;
      const confidence = Math.exp(avgLogprob);
      console.log('🎯 Transcription confidence:', Math.round(confidence * 100) + '%');
    }

    const cleanedText = transcriptionText.trim();
    console.log('✅ Transcription result:', cleanedText);
    
    if (!cleanedText) {
      throw new Error('No speech detected in the recording. Please try again.');
    }
    
    return cleanedText;
  }


  private createApiError(status: number, errorText: string): Error {
    switch (status) {
      case 401:
        return new Error('Invalid API key. Please check your OpenAI API key configuration.');
      case 429:
        return new Error('Rate limit exceeded. Please try again in a moment.');
      case 413:
        return new Error('Audio file too large. Please record a shorter message.');
      default:
        return new Error(`OpenAI API error: ${status} - ${errorText}`);
    }
  }

  private createTranscriptionError(error: unknown): Error {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('api key') || message.includes('unauthorized')) {
        return new Error('API key configuration error. Please check your OpenAI API key.');
      }
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return new Error('Network error. Please check your internet connection and try again.');
      }
      if (message.includes('timeout')) {
        return new Error('Request timeout. Please try with a shorter recording.');
      }
      if (message.includes('rate limit')) {
        return new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (message.includes('file too large') || message.includes('413')) {
        return new Error('Audio file too large. Please record a shorter message.');
      }
      
      return new Error(`Transcription failed: ${error.message}`);
    }
    
    return new Error('Transcription failed due to an unknown error. Please try again.');
  }

  // MAIN PARSING METHOD - Uses GPT-4o as primary, GPT-5-nano as backup option
  async parseFoodFromText(text: string, useGPT5?: boolean): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔬 Parsing food with method:', useGPT5 ? 'GPT-5-nano Enhanced' : 'GPT-4o Legacy');
      console.log('API Key present:', OPENAI_API_KEY ? 'Yes' : 'No');
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

      // Normal operation - use selected method
      if (useGPT5) {
        console.log('🚀 Using GPT-5-nano Enhanced Approach...');
        return await this.parseFoodFromTextO3(text);
      } else {
        console.log('📚 Using GPT-4o Legacy Approach (Primary)...');
        return await this.parseFoodFromTextLegacy(text);
      }
      
    } catch (error) {
      console.error('❌ Primary approach failed, attempting backup method:', error);
      
      // Fallback to the other method if primary fails
      try {
        if (useGPT5) {
          console.log('🔄 GPT-5-nano failed, falling back to GPT-4o Legacy approach...');
          return await this.parseFoodFromTextLegacy(text);
        } else {
          console.log('🔄 GPT-4o failed, falling back to GPT-5-nano approach...');
          return await this.parseFoodFromTextO3(text);
        }
      } catch (fallbackError) {
        console.error('❌ Both approaches failed:', fallbackError);
        
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          
          if (message.includes('api key')) {
            throw new Error('API key configuration error. Please check your settings.');
          }
          if (message.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          }
          if (message.includes('network') || message.includes('fetch')) {
            throw new Error('Network error. Please check your connection and try again.');
          }
          if (message.includes('json')) {
            throw new Error('Failed to understand the food description. Please try describing your meal differently.');
          }
        }
        
        throw new Error('Failed to parse food information. Please try describing your meal again.');
      }
    }
  }

  // Legacy approach - kept as fallback
  async parseFoodFromTextLegacy(text: string): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔙 LEGACY: Parsing food from text:', text);

      const client = this.initializeClient();
      
      // Step 1: Parse food items and quantities
      const parsedFoods = await this.parseFoodAndQuantity(text);
      console.log('🔙 LEGACY Step 1 - Parsed food items and quantities:', parsedFoods);
      
      // Step 2: Get calories based on food and quantity
      const foods = await this.calculateCalories(parsedFoods);
      console.log('🔙 LEGACY Step 2 - Calories calculated for food and quantity:', foods);
      
      console.log('🔙 LEGACY: Parsed foods with enhanced uncertainty handling:', foods);
      return foods;
    } catch (error) {
      console.error('🔙 LEGACY: Error parsing food from text:', error);
      throw error;
    }
  }

  private async translateToEnglish(arabicText: string): Promise<string> {
    const client = this.initializeClient();
    
    const translationPrompt = `You are a food translation expert. Translate this Arabic food description to English, focusing on food items, quantities, and cooking methods.

Context: This is a food/meal description that needs nutrition calculation.

Arabic: ${arabicText}

Translate to English, preserving:
- Food names (chicken, rice, meat, etc.)
- Quantities and units (grams, pieces, etc.) 
- Cooking methods (grilled, fried, boiled, etc.)

If you're unsure about a word, try to infer from context that this is about food.`;

    const translationResponse = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a translator specializing in food descriptions. Translate Arabic food text to English while preserving quantities, units, and cooking methods. Focus on food context.'
        },
        {
          role: 'user',
          content: translationPrompt
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 200,
    });

    const englishText = translationResponse.choices[0]?.message?.content?.trim();
    console.log('Translated to English:', englishText);
    
    return englishText || '';
  }

  // Step 1: Parse food items and quantities from multilingual text (Arabic/English)
  private async parseFoodAndQuantity(text: string): Promise<{
    name: string;
    quantity: number;
    unit: string;
    type?: string;
    cooking_method?: string | null;
    zero_calorie?: boolean;
    needs_breakdown?: boolean;
  }[]> {
    const client = this.initializeClient();
    
    const prompt = `You are analyzing food transcriptions in Arabic/English/mixed languages with Egyptian and Saudi dialect awareness. Think systematically:

Text: ${text}

REASONING FRAMEWORK:

1. FOOD TYPE CLASSIFICATION
   Classify each item into one of these types (affects nutrition calculation):
   - solid_food: proteins, grains, vegetables, fruits (use grams)
   - liquid: water, juice, soda, milk (use ml)
   - mixed_beverage: coffee+milk, smoothies (use ml, needs component breakdown)
   - soup: lentil soup, chicken soup (use ml)
   - sauce: tahini, ketchup (use grams, small portions)

2. CULTURAL & LINGUISTIC INTELLIGENCE
   Apply regional food knowledge for Egyptian and Saudi dialects:

   PHONETIC CORRECTION PRINCIPLES:
   - Recognize dialectal variations (منجاويز → منجا عويس for Owais mango)
   - Account for transcription errors in Arabic names
   - Use context to interpret ambiguous words as food items
   - Common patterns: missing prefixes, character substitutions

   COOKING METHOD DETECTION:
   - Extract cooking keywords: مشوي (grilled), مقلي (fried), مسلوق (boiled), في الفرن (baked), نيء (raw)
   - For fast food items like burgers: assume "grilled" unless specified otherwise
   - For proteins without clear method: return null (user will clarify if needed)
   - Mark method in "cooking_method" field for Step 2 oil calculation

3. ZERO-CALORIE & MIXED BEVERAGE DETECTION

   ZERO-CALORIE ITEMS:
   - Pure water → 0 calories, mark "zero_calorie": true
   - Black coffee/tea (unsweetened) → ~5 cal (minimal, but not zero)

   MIXED BEVERAGES:
   - Detect beverages with multiple components (coffee + milk, smoothies with multiple fruits)
   - Mark "type": "mixed_beverage" and "needs_breakdown": true
   - Step 2 will calculate each component separately

4. QUANTITY CONVERSION (CRITICAL!)

   CORE PRINCIPLE: Convert ALL quantities to actual edible weight in grams/ml

   COUNT-BASED ITEMS (واحد, 1, one, two, etc.):
   - **NEVER** return "quantity: 1, unit: grams" for whole items!
   - **ALWAYS** estimate realistic portion weight based on the food type:
     * Burgers, sandwiches → typically 150-250g
     * Whole fruits (apple, orange, mango) → typically 120-200g
     * Whole chicken → ~900g edible (remove bones)
     * Eggs → ~50g each

   FRACTIONAL QUANTITIES (نص, ربع, تلت):
   - نص (half) = 0.5 × typical portion
   - ربع (quarter) = 0.25 × typical portion
   - تلت (third) = 0.33 × typical portion

   PORTION DESCRIPTORS:
   - طبق/plate → estimate based on food (usually 250-350g)
   - كوب/cup → 250ml for liquids
   - كان/can → 330ml (standard soda can)

   REASONING APPROACH:
   1. Identify if quantity is count-based ("واحد", "1", "one") vs weight-based ("100g", "كوب")
   2. For count-based: use your knowledge of typical serving sizes
   3. For portions with bones/peels: estimate edible portion only
   4. Validate: does the final weight make nutritional sense?

5. OUTPUT SCHEMA

   Return JSON array with these fields:
   [
     {
       "name": "normalized food name (clear, simple)",
       "quantity": number (MUST be realistic edible weight/volume, not 1 or 2 for count items!),
       "unit": "grams" | "ml",
       "type": "solid_food" | "liquid" | "mixed_beverage" | "soup" | "sauce",
       "cooking_method": "grilled" | "fried" | "boiled" | "baked" | "raw" | null,
       "zero_calorie": true (only include if actually zero calories),
       "needs_breakdown": true (only for mixed beverages)
     }
   ]

VALIDATION CHECKLIST:
✓ Quantity is realistic weight/volume (not literal count like "1" for "1 burger")
✓ Unit matches type (grams for solids, ml for liquids)
✓ Cooking method extracted from keywords or inferred for fast food
✓ Zero-calorie flag only for pure water
✓ Mixed beverages flagged for component breakdown

Return ONLY valid JSON, no explanations or markdown.`;
    
    console.log('📤 STEP 1 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for faster processing (was gpt-4o-mini)
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing food descriptions in Arabic, English, or mixed languages. Extract food items with quantities and convert to grams.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 STEP 1 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI');
    
    const parsed = JSON.parse(this.extractJsonContent(content));
    console.log('📥 STEP 1 RESPONSE - Parsed JSON:', parsed);
    
    return parsed;
  }

  // Step 2: Get calories based on food and quantity
  private async calculateCalories(foods: {
    name: string;
    quantity: number;
    unit: string;
    type?: string;
    cooking_method?: string | null;
    zero_calorie?: boolean;
    needs_breakdown?: boolean;
  }[]): Promise<ParsedFoodItem[]> {
    // If no foods were parsed, return empty array instead of calling AI
    if (!foods || foods.length === 0) {
      console.log('❌ No foods to calculate calories for, returning empty array');
      return [];
    }

    const client = this.initializeClient();

    const foodsList = foods.map(f =>
      `- ${f.name}: ${f.quantity}${f.unit}` +
      (f.type ? ` [type: ${f.type}]` : '') +
      (f.cooking_method ? ` [cooking: ${f.cooking_method}]` : '') +
      (f.zero_calorie ? ` [zero-calorie]` : '') +
      (f.needs_breakdown ? ` [needs component breakdown]` : '')
    ).join('\n');
    
    const prompt = `Calculate nutrition for these foods using unit-aware analysis. Think systematically:

Foods from Step 1:
${foodsList}

NUTRITION CALCULATION FRAMEWORK:

1. UNIT-AWARE CALCULATION (CRITICAL)
   For SOLIDS (unit: grams):
   - Calculate per 100g, then scale to quantity
   - Example: 200g chicken = (165 cal/100g) × 2 = 330 cal

   For LIQUIDS (unit: ml):
   - Calculate per 100ml, then scale to quantity
   - Example: 250ml orange juice = (45 cal/100ml) × 2.5 = 112 cal

   For MIXED BEVERAGES (needs_breakdown: true):
   - Break into components with individual calories
   - Example: "قهوة بحليب وسكر" → coffee (5 cal) + milk 150ml (100 cal) + sugar 10g (40 cal) = 145 cal

2. REGIONAL FOOD INTELLIGENCE

   Apply your knowledge of Egyptian and Saudi cuisine, including:
   - Traditional dishes (كشري, فول, طعمية, كفتة, كباب, كبسة, مندي, شاورما)
   - Regional fruit varieties (Owais mango variety from Egypt)
   - Typical preparation methods and ingredient combinations
   - Use your training data to provide accurate nutrition for these foods

3. COOKING METHOD & OIL ADDITION

   Apply cooking impact to nutrition:
   - **Fried (مقلي)**: Add ~100 calories (10g oil absorbed) + 11g fat
   - **Grilled/Boiled (مشوي/مسلوق)**: No additional oil
   - **Baked (في الفرن)**: Add ~30 calories (light oil coating) + 3g fat
   - Document oil additions in "reasoning" field: "Added 100 cal for frying oil"
   - Mark with: "oil_added": true, "oil_calories": 100

4. MIXED BEVERAGE COMPONENT BREAKDOWN

   If "needs_breakdown": true from Step 1:
   - Identify each component (coffee, milk, sugar, fruit)
   - Calculate nutrition for each component separately
   - Return components array with itemized calories
   - Sum to get total nutrition

5. VALIDATION & QUALITY CHECKS

   ZERO-CALORIE ITEMS:
   - If "zero_calorie": true → return 0 for all macros, skip calculations

   4-4-9 RULE:
   - Expected calories = (protein × 4) + (carbs × 4) + (fat × 9)
   - If difference > 5%: adjust macros proportionally to match

   BIOLOGICAL SANITY CHECKS:
   - Protein: reasonable for food type (meat ~20-30g/100g, plants ~5-15g/100g)
   - Fat: fruits should have <1g/100g, nuts/oils up to 60g/100g
   - Carbs: fruits/grains high, proteins low
   - If values seem wrong: recalculate using your nutritional knowledge

6. FOOD EMOJI SUGGESTION

   Suggest an appropriate emoji for each food item:
   - Choose the emoji that best represents the MAIN/PRIMARY ingredient or dish type
   - Prioritize protein/main ingredient over sides (e.g., chicken over salad in "chicken salad")
   - Use culturally appropriate emojis for Middle Eastern/Egyptian dishes
   - Return ONLY the emoji character (not the name)

7. OUTPUT SCHEMA

Return JSON array:
[
  {
    "name": "food name",
    "calories": number (total for the quantity),
    "protein": number (grams, total),
    "carbs": number (grams, total),
    "fat": number (grams, total),
    "quantity": number (from Step 1),
    "unit": "grams" | "ml" (from Step 1),
    "cookingMethod": "grilled" | "fried" | "boiled" | "baked" | null,
    "icon": "material-icon-name" (suggested Material Icon),
    "components": [ {"item": "name", "amount": "Xg/ml", "calories": Y} ] (for mixed beverages only),
    "oil_added": true (only if cooking oil was added),
    "oil_calories": number (if oil_added),
    "reasoning": "brief explanation of calculations, assumptions, or special handling"
  }
]

FINAL CHECKS BEFORE RETURNING:
✓ Unit from Step 1 preserved correctly
✓ Oil added for fried foods (mark oil_added, oil_calories)
✓ Fruits have <1g fat per 100g
✓ 4-4-9 rule validated (calories ≈ protein×4 + carbs×4 + fat×9)
✓ Mixed beverages have components array
✓ Nutrition values are realistic and biologically plausible
✓ Icon field included for each food item

Return ONLY valid JSON, no markdown formatting or explanations.`;
    
    console.log('📤 STEP 2 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for faster processing (was gpt-4o-mini)
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in Middle Eastern, international, and fast food cuisine. Calculate accurate nutrition values for food items.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 STEP 2 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI');
    
    const nutritionData = JSON.parse(this.extractJsonContent(content));
    console.log('📥 STEP 2 RESPONSE - Parsed JSON:', nutritionData);
    
    // Convert to ParsedFoodItem format with validation
    return nutritionData.map((item: {
      name?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      quantity?: number;
      unit?: string;
      cookingMethod?: string;
      components?: Array<{item: string; amount: string; calories: number}>;
      oil_added?: boolean;
      oil_calories?: number;
      reasoning?: string;
    }, index: number): ParsedFoodItem => {
      // Validate required fields
      const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Food Item ${index + 1}`;
      const calories = typeof item.calories === 'number' && item.calories >= 0 ? item.calories : 0;
      const protein = typeof item.protein === 'number' && item.protein >= 0 ? item.protein : 0;
      const carbs = typeof item.carbs === 'number' && item.carbs >= 0 ? item.carbs : 0;
      const fat = typeof item.fat === 'number' && item.fat >= 0 ? item.fat : 0;
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 100;
      const unit = item.unit || 'grams';

      // Apply smart modal logic with enhanced cooking method detection
      const cookingMethod = item.cookingMethod || undefined;
      const smartNeedsQuantity = this.determineNeedsQuantity(name);
      const smartNeedsCookingMethod = this.determineNeedsCookingMethod(name, cookingMethod);

      // Build nutrition notes from AI reasoning + oil addition
      let nutritionNotes = '';
      if (item.reasoning) nutritionNotes += item.reasoning;
      if (item.oil_added && item.oil_calories) {
        nutritionNotes += (nutritionNotes ? '; ' : '') + `+${item.oil_calories} cal from cooking oil`;
      }
      if (item.components && item.components.length > 0) {
        const componentStr = item.components.map(c => `${c.item} (${c.calories} cal)`).join(', ');
        nutritionNotes += (nutritionNotes ? '; ' : '') + `Components: ${componentStr}`;
      }

      return {
        name,
        calories,
        protein,
        carbs,
        fat,
        confidence: 0.85, // Good confidence for enhanced GPT-4o method
        quantity,
        unit,
        cookingMethod,
        needsQuantity: smartNeedsQuantity,
        suggestedQuantity: smartNeedsQuantity ? ['0.5', '1', '1.5', '2'] : [],
        needsCookingMethod: smartNeedsCookingMethod,
        suggestedCookingMethods: smartNeedsCookingMethod ? ['Grilled', 'Fried', 'Baked', 'Boiled'] : [],
        isNutritionComplete: true,
        nutritionNotes: nutritionNotes || 'Enhanced AI calculation with cultural intelligence',
        icon: item.icon || getFoodIcon(name), // Prefer AI-suggested icon, fallback to keyword matching
      };
    }).filter((item: ParsedFoodItem) => {
      // Keep zero-calorie items (water, black coffee) but remove items with errors
      return item.name !== undefined && item.name.length > 0;
    });
  }

  // Smart modal logic methods for legacy fallback
  private determineNeedsQuantity(foodName: string): boolean {
    const name = foodName.toLowerCase();
    
    // Vague quantities that need clarification
    const vagueIndicators = ['شوية', 'كتير', 'بعض', 'some', 'a little', 'قليل', 'كم', 'بشوية'];
    if (vagueIndicators.some(indicator => name.includes(indicator))) return true;
    
    // Ambiguous servings without context
    if (name.includes('طبق') && !name.includes('صغير') && !name.includes('كبير')) return true;
    if (name.includes('كوباية') && !name.includes('صغير') && !name.includes('كبير')) return true;
    
    // Clear standard portions don't need quantity modal
    const clearPortions = ['واحد', 'واحدة', 'كوب', 'علبة', 'رغيف', 'ساندوتش', 'برجر', 'وجبة'];
    if (clearPortions.some(portion => name.includes(portion))) return false;
    
    // Specific weights don't need quantity modal
    if (name.includes('جرام') || name.includes('كيلو') || name.includes('نص') || name.includes('ربع')) return false;
    
    return false; // Conservative - only show when truly needed
  }

  private determineNeedsCookingMethod(foodName: string, existingCookingMethod?: string): boolean {
    const name = foodName.toLowerCase();
    
    // If cooking method already specified, no need for modal
    if (existingCookingMethod && existingCookingMethod !== 'unknown') return false;
    
    // Check for cooking method keywords in the name
    const cookingKeywords = ['مشوي', 'مقلي', 'مسلوق', 'في الفرن', 'نيء', 'grilled', 'fried', 'baked', 'boiled', 'raw'];
    if (cookingKeywords.some(keyword => name.includes(keyword))) return false;
    
    // Foods that never need cooking method
    const noCookingNeeded = [
      // Dairy
      'زبادي', 'لبن', 'جبن', 'جبنة', 'مراعي', 'قشطة', 'yogurt', 'milk', 'cheese',
      // Fruits  
      'تفاح', 'موز', 'برتقال', 'مانجا', 'عنب', 'فراولة', 'apple', 'banana', 'orange', 'mango',
      // Beverages
      'قهوة', 'شاي', 'عصير', 'مياه', 'كابتشينو', 'ستاربوكس', 'كوكاكولا', 'coffee', 'tea', 'juice',
      // Processed foods
      'بسكويت', 'شيبسي', 'شوكولاتة', 'حلوى', 'عيش', 'خبز'
    ];
    
    if (noCookingNeeded.some(food => name.includes(food))) return false;
    
    // Foods that need cooking method
    const needsCooking = ['لحم', 'فراخ', 'دجاج', 'سمك', 'بيض', 'meat', 'chicken', 'fish', 'egg'];
    if (needsCooking.some(food => name.includes(food))) return true;
    
    return false; // Conservative - only show when truly needed
  }

  private extractJsonContent(content: string): string {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from AI service. Please try again.');
    }
    
    let jsonContent = content.trim();
    
    // Check if content contains any JSON array structure
    if (!jsonContent.includes('[') || !jsonContent.includes(']')) {
      console.error('❌ AI returned non-JSON response:', jsonContent.substring(0, 200));
      throw new Error('AI service did not return valid data. Please try describing your meal differently.');
    }
    
    // Try to extract JSON from code blocks first
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    } else {
      // Extract JSON array from the content
      const firstBracket = jsonContent.indexOf('[');
      const lastBracket = jsonContent.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonContent = jsonContent.substring(firstBracket, lastBracket + 1);
      } else {
        console.error('❌ No valid JSON array structure found');
        throw new Error('Could not extract valid data from AI response. Please try again.');
      }
    }
    
    // Basic validation that it looks like a JSON array
    if (!jsonContent.startsWith('[') || !jsonContent.endsWith(']')) {
      console.error('❌ Extracted content is not a valid JSON array:', jsonContent);
      throw new Error('Invalid data format from AI service. Please try again.');
    }
    
    return jsonContent;
  }



  // GPT-5-nano APPROACH: Step 1 - Parse to edible grams with ambiguity detection
  private async parseToEdibleGramsO3(text: string): Promise<O3Step1Response[]> {
    const client = this.initializeClient();
    
    // O3's Step 1 JSON Schema
    const step1Schema = {
      type: "object",
      properties: {
        foods: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              original_phrase: { type: "string" },
              cookingMethod: { 
                type: "string",
                enum: ["grilled", "roasted", "fried", "boiled", "raw", "unknown"]
              },
              quantity_input: { type: "string" },
              quantity_is_gross: { type: "boolean" },
              edible_grams_low: { type: "number" },
              edible_grams_high: { type: "number" },
              edible_grams: { type: "number" },
              assumptions: { 
                type: "array",
                items: { type: "string" }
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              needsQuantity: { type: "boolean" },
              needsCookingMethod: { type: "boolean" },
              suggestedQuantity: {
                type: "array",
                items: { type: "string" }
              },
              suggestedCookingMethods: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["name", "original_phrase", "cookingMethod", "quantity_input", "quantity_is_gross", "edible_grams_low", "edible_grams_high", "edible_grams", "assumptions", "confidence", "needsQuantity", "needsCookingMethod", "suggestedQuantity", "suggestedCookingMethods"]
          }
        }
      },
      required: ["foods"]
    };

    console.log('📤 GPT-5-nano STEP 1 REQUEST - Input text:', text);
    
    const response = await client.responses.create({
      model: 'gpt-5-nano',
      instructions: `Analyze transcription systematically for food extraction and modal logic. Think methodically:

SYSTEMATIC ANALYSIS FRAMEWORK:
1. LANGUAGE & ERROR ANALYSIS
   - Process mixed language input (Arabic/English/Egyptian dialect)
   - Aggressively correct transcription errors using phonetic similarity and food context
   - Apply contextual reasoning: if quantity words present (نص, ربع), interpret ambiguous words as food
   - Use phonetic matching for common Arabic food terms even from garbled transcription

2. QUANTITY REASONING FOR CALORIE ACCURACY
   - OBJECTIVE: Calculate actual edible weight for precise calorie counting
   - Recognize fractional/partial expressions across languages
   - Apply mathematical reasoning to realistic food weights (not arbitrary portions)
   - Distinguish between explicit quantities and vague descriptions
   - Convert to accurate edible gram estimates, accounting for bones/waste/inedible parts
   - Ensure portions align with typical consumption and nutritional requirements

3. MODAL LOGIC (CONSERVATIVE APPROACH)
   - needsQuantity: TRUE only for genuinely vague/ambiguous amounts
   - needsCookingMethod: TRUE only for proteins without clear preparation method
   - Consider cultural context and typical usage patterns

4. FOOD CONTEXT REASONING FOR CALORIE CALCULATION
   - OBJECTIVE: Ensure weights are suitable for accurate nutritional analysis
   - Apply regional food knowledge and realistic portion norms
   - Distinguish whole items from partial portions using actual food weights
   - Account for edible vs gross weight: subtract bones, peels, shells, inedible parts
   - Verify portions make sense for calorie counting and typical human consumption patterns

Return ONLY JSON array with systematic reasoning applied.`,
      input: `Text: ${text}
Return the JSON with foods array only.`
    });

    const content = response.output_text;
    console.log('📥 GPT-5-nano STEP 1 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI Step 1');
    
    const parsed = JSON.parse(this.extractJsonContent(content));
    console.log('📥 GPT-5-nano STEP 1 RESPONSE - Parsed JSON:', parsed);
    
    return parsed.foods || parsed;
  }

  // GPT-5-nano APPROACH: Step 2 - Calculate macros with sanity checks
  private async calculateMacrosO3(step1Foods: O3Step1Response[]): Promise<O3Step2Response> {
    const client = this.initializeClient();
    
    // O3's Step 2 JSON Schema
    const step2Schema = {
      type: "object",
      properties: {
        foods: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              nutrition_basis: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              calories_per_100g: { type: "number" },
              quality: {
                type: "object",
                properties: {
                  passed_sanity_checks: { type: "boolean" },
                  notes: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["passed_sanity_checks", "notes", "confidence"]
              }
            },
            required: ["name", "quantity", "unit", "nutrition_basis", "calories", "protein", "carbs", "fat", "calories_per_100g", "quality"]
          }
        },
        total: {
          type: "object",
          properties: {
            quantity: { type: "number" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" }
          },
          required: ["quantity", "calories", "protein", "carbs", "fat"]
        }
      },
      required: ["foods", "total"]
    };

    const foodsInput = step1Foods.map(f => `- ${f.name}: ${f.edible_grams}g (${f.cookingMethod})`).join('\n');
    
    console.log('📤 GPT-5-nano STEP 2 REQUEST - Foods input:', foodsInput);
    
    const response = await client.responses.create({
      model: 'gpt-5-nano',
      instructions: `Apply systematic nutrition analysis for multi-cultural food context. Use methodical approach:

SYSTEMATIC NUTRITION FRAMEWORK:
1. FOOD CLASSIFICATION & CONTEXT
   - Categorize by food type and processing level
   - Apply regional/cultural food knowledge when relevant
   - Consider preparation method impact on nutrition

2. COOKING METHOD ANALYSIS
   - Systematically assess cooking impact on macro/calorie content
   - Apply reasoning for oil additions, moisture changes, etc.
   - Use proportional adjustments rather than fixed multipliers

3. MACRO VALIDATION LOGIC
   - Apply biological limits and food category patterns
   - Cross-validate using calorie-macro relationships
   - Ensure realistic nutrient density for food type

4. PORTION & QUALITY ASSESSMENT  
   - Verify portions align with typical consumption
   - Apply confidence scoring based on data certainty
   - Flag unusual values for review

Return ONLY JSON with systematic validation applied.`,
      input: `Foods (edible grams from Step 1):
${foodsInput}
Return the JSON with foods array and total object.`
    });

    const content = response.output_text;
    console.log('📥 GPT-5-nano STEP 2 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI Step 2');
    
    const parsed = JSON.parse(this.extractJsonContent(content));
    console.log('📥 GPT-5-nano STEP 2 RESPONSE - Parsed JSON:', parsed);
    
    return parsed;
  }

  // GPT-5-nano APPROACH: Combined flow
  async parseFoodFromTextO3(text: string): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔬 GPT-5-nano APPROACH: Starting enhanced food parsing for:', text);
      
      // Step 1: Parse to edible grams with ambiguity detection
      const step1Results = await this.parseToEdibleGramsO3(text);
      
      if (step1Results.length === 0) {
        throw new Error('No food items detected in Step 1');
      }
      
      // Step 2: Calculate macros with sanity checks  
      const step2Results = await this.calculateMacrosO3(step1Results);
      
      // Map to ParsedFoodItem format
      const parsedFoods = this.mapO3ResultsToParsedFoodItems(step1Results, step2Results);
      
      console.log('✅ GPT-5-nano APPROACH: Completed successfully with', parsedFoods.length, 'items');
      return parsedFoods;
      
    } catch (error) {
      console.error('❌ GPT-5-nano APPROACH: Failed:', error);
      throw error;
    }
  }

  // Map O3 results to existing ParsedFoodItem interface
  private mapO3ResultsToParsedFoodItems(step1: O3Step1Response[], step2: O3Step2Response): ParsedFoodItem[] {
    return step2.foods.map((s2Food, index) => {
      const s1Food = step1[index];
      
      return {
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
          s2Food.nutrition_basis,
          ...s1Food.assumptions,
          s2Food.quality.notes
        ].filter(Boolean).join('; '),
        icon: getFoodIcon(s2Food.name),
      };
    });
  }

  // ============================================================================
  // ENHANCED AI PIPELINE WITH CONFIDENCE SCORING
  // ============================================================================

  /**
   * Enhanced Step 2: AI-Powered Quantity Detection with Confidence
   * Based on ChatGPT recommendation - AI chooses grams/ml with ranges and confidence
   */
  async detectQuantityWithConfidence(transcript: string, useGPT5: boolean = false): Promise<AIQuantityDetectionResult> {
    const startTime = Date.now();
    const model = useGPT5 ? 'gpt-5-nano' : 'gpt-4o-mini';
    
    try {
      console.log(`🔍 Step 2: Quantity Detection using ${model}...`);
      
      const client = this.initializeClient();
      
      const systemPrompt = `You convert free-text meal logs (Arabic incl. Egyptian dialect + mixed English) into quantified, edible amounts.

OBJECTIVE
- Infer quantities and convert to edible grams (solids) or ml (liquids) using LLM prior knowledge of typical portions, item sizes, and yields.
- Avoid fixed numbers; when exact size is unknown, provide a plausible RANGE and a single best ESTIMATE inside that range.
- Respect any explicit weights/sizes on the transcript. If unit is counts (slice/piece/chicken/cup/can/loaf), infer grams/ml from typical sizes for that item/category and local context.
- If a brand/restaurant is present, adjust using typical brand sizing from general knowledge (no external search). 
- Keep assumptions explicit and return a confidence score.

CONSTRAINTS
- Do not compute macros/calories here.
- Never output thoughts; return JSON only.
- Prefer narrower ranges when you're confident; widen ranges when you're not.
- If confidence < 0.6, add a short clarification question.

OUTPUT SCHEMA (JSON only):
{
  "items": [
    {
      "raw_text": string,
      "canonical_name": string,          // normalized food name
      "brand_or_place": string|null,     // e.g., "مراعي"
      "quantity_spoken": number,         // numeric from speech (e.g., 2, 0.5)
      "unit_spoken": string,             // e.g., "slice", "قطعة", "كيلو", "فرخة"
      "normalized_unit": "g"|"ml",       // solids -> g, liquids -> ml
      "grams_range": {"min": number, "max": number},  // edible amount range
      "grams_estimate": number,          // single chosen value within range
      "assumptions": [string],           // brief notes (size style, with/without skin, cooked vs raw)
      "confidence": number,              // 0..1
      "questions": [string]              // only if confidence < 0.6
    }
  ]
}`;

      const userPrompt = `TRANSCRIPT:
${transcript}

TASK:
Infer quantities and convert to edible grams/ml using typical sizes and yields from general knowledge. Use ranges + a best estimate. Be explicit about assumptions. Return JSON matching the schema, no prose.`;

      let response;
      
      if (useGPT5) {
        // Use GPT-5-nano structured output
        response = await client.responses.create({
          model: 'gpt-5-nano',
          instructions: systemPrompt,
          input: userPrompt
        });
        
        const result = JSON.parse(response.output_text || '{}');
        
        return this.processStep2Response(result, model);
        
      } else {
        // Use GPT-4o-mini traditional chat
        response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_completion_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('No response from OpenAI Step 2');
        
        const result = JSON.parse(content);
        
        return this.processStep2Response(result, model);
      }
      
    } catch (error) {
      console.error(`❌ Step 2 quantity detection failed with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced Step 3: AI Nutrition Estimation with Cooking Method Integration
   * Based on ChatGPT recommendation - AI estimates per 100g, validates via 4-4-9
   */
  async calculateNutritionWithConfidence(quantityResults: AIQuantityDetectionResult, useGPT5: boolean = false): Promise<AINutritionResult> {
    const startTime = Date.now();
    const model = useGPT5 ? 'gpt-5-nano' : 'gpt-4o-mini';
    
    try {
      console.log(`🍽️ Step 3: Nutrition Calculation using ${model}...`);
      
      const client = this.initializeClient();
      
      const systemPrompt = `You estimate nutrition from item names + edible grams.

OBJECTIVE
- For each item, infer a plausible nutrition profile per 100 g (or per 100 ml for liquids) from general food knowledge (category, cooking method implied by name, local styles).
- Avoid fixed constants; select values within realistic category ranges (e.g., lean poultry lower fat than fried poultry; pizza higher carbs/fat than grilled meats).
- Output both per 100g and totals, then validate with the 4-4-9 rule. If |kcal − (4P+4C+9F)| > 5%, scale macros proportionally and mark adjusted=true.
- Include a brief source_hint (e.g., "generic pepperoni pizza", "roasted chicken, mixed meat+skin") and confidence.

REALISM GUARDS (soft bounds; choose within them, but you may widen with justification):
- Energy density typical bands (kcal/100g): vegetables 15–60, fruits 40–80, cooked grains 110–180, lean meats 100–170, fatty meats 180–320, fried items 230–400, mixed dishes 150–300, pizza 220–330, sweets 300–550, dairy 50–200, sugary beverages 30–60 per 100 ml, diet/water 0–5.
- Macro sanity (per 100 g): protein ≤ ~40 g (most), carbs ≤ ~80 g, fat ≤ ~60 g. Use judgment; document exceptions.

OUTPUT SCHEMA (JSON only):
{
  "items": [
    {
      "canonical_name": string,
      "edible_grams": number,
      "profile_per_100g": {
        "protein_g": number, "carbs_g": number, "fat_g": number, "kcal": number
      },
      "totals": {
        "protein_g": number, "carbs_g": number, "fat_g": number, "kcal": number
      },
      "validation": {
        "kcal_from_macros": number,
        "delta_kcal_pct": number,
        "adjusted": boolean
      },
      "source_hint": string,     // short descriptor of the assumed food profile
      "assumptions": [string],   // e.g., "grilled, skin on", "regular crust"
      "confidence": number       // 0..1
    }
  ]
}`;

      // Prepare input from Step 2 results
      const itemsInput = quantityResults.items.map(item => ({
        canonical_name: item.canonical_name,
        edible_grams: item.grams_estimate,
        assumptions: item.assumptions
      }));

      const userPrompt = `INPUT:
${JSON.stringify({ items: itemsInput }, null, 2)}

TASK:
For each item, infer a plausible nutrition profile per 100 g from general knowledge (no fixed constants), compute totals, run 4-4-9 validation, adjust if needed, and return JSON matching the schema.`;

      let response;
      
      if (useGPT5) {
        // Use GPT-5-nano structured output
        response = await client.responses.create({
          model: 'gpt-5-nano',
          instructions: systemPrompt,
          input: userPrompt
        });
        
        const result = JSON.parse(response.output_text || '{}');
        
        // Track usage for GPT-5-nano
        this.trackModelUsage(model, Date.now() - startTime, 0, result.items?.length || 0);
        
        return this.processStep3Response(result, model);
        
      } else {
        // Use GPT-4o-mini traditional chat
        response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_completion_tokens: 1200,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('No response from OpenAI Step 3');
        
        const result = JSON.parse(content);
        
        // Track usage for GPT-4o-mini
        const usage = response.usage;
        this.trackModelUsage(model, Date.now() - startTime, usage?.total_tokens || 0, result.items?.length || 0);
        
        return this.processStep3Response(result, model);
      }
      
    } catch (error) {
      console.error(`❌ Step 3 nutrition calculation failed with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced Combined Pipeline: Quantity Detection + Nutrition Calculation with Confidence
   * Replaces the legacy parseFoodFromText method with AI-first confidence scoring
   */
  async parseFoodWithConfidence(transcript: string, useGPT5: boolean = false): Promise<ParsedFoodItemWithConfidence[]> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Enhanced AI Pipeline (${useGPT5 ? 'GPT-5-nano' : 'GPT-4o'}): Starting for "${transcript}"`);
      
      // Step 2: Quantity Detection with Confidence
      const quantityResults = await this.detectQuantityWithConfidence(transcript, useGPT5);
      
      if (quantityResults.items.length === 0) {
        console.log('⚠️ No food items detected in Step 2');
        return [];
      }
      
      // Step 3: Nutrition Calculation with Confidence
      const nutritionResults = await this.calculateNutritionWithConfidence(quantityResults, useGPT5);
      
      // Combine results into ParsedFoodItemWithConfidence
      const enhancedResults = this.combineResults(quantityResults, nutritionResults, useGPT5 ? 'gpt-5-nano' : 'gpt-4o');
      
      // Session tracking is handled externally in useVoiceProcessing hook
      
      console.log(`✅ Enhanced AI Pipeline completed in ${Date.now() - startTime}ms with ${enhancedResults.length} items`);
      return enhancedResults;
      
    } catch (error) {
      console.error('❌ Enhanced AI Pipeline failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS FOR ENHANCED PIPELINE
  // ============================================================================

  private processStep2Response(response: Step2APIResponse, model: string): AIQuantityDetectionResult {
    const items = response.items?.map(item => ({
      raw_text: item.raw_text,
      canonical_name: item.canonical_name,
      brand_or_place: item.brand_or_place || undefined,
      quantity_spoken: item.quantity_spoken,
      unit_spoken: item.unit_spoken,
      normalized_unit: item.normalized_unit,
      grams_range: item.grams_range,
      grams_estimate: item.grams_estimate,
      assumptions: item.assumptions || [],
      confidence: item.confidence,
      needs_clarification: item.confidence < 0.6,
      suggested_units: this.generateSuggestedUnits(item.canonical_name, item.unit_spoken, item.grams_estimate)
    })) || [];

    const overallConfidence = items.length > 0 
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length 
      : 0;

    return {
      items,
      overall_confidence: overallConfidence,
      processing_notes: [`Processed by ${model}`, `${items.length} items detected`]
    };
  }

  private processStep3Response(response: Step3APIResponse, model: string): AINutritionResult {
    const items = response.items?.map(item => ({
      ...item,
      detected_cooking_method: this.extractCookingMethod(item.canonical_name),
      cooking_confidence: this.assessCookingConfidence(item.canonical_name),
      alternative_methods: this.generateAlternativeMethods(item.canonical_name),
      needs_cooking_clarification: this.needsCookingClarification(item.canonical_name, item.confidence)
    })) || [];

    const totalCalories = items.reduce((sum, item) => sum + item.totals.kcal, 0);
    const overallConfidence = items.length > 0 
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length 
      : 0;

    return {
      items,
      overall_confidence: overallConfidence,
      total_calories: Math.round(totalCalories),
      processing_notes: [`Processed by ${model}`, `Total: ${Math.round(totalCalories)} calories`]
    };
  }

  private combineResults(
    quantityResults: AIQuantityDetectionResult, 
    nutritionResults: AINutritionResult, 
    aiModel: 'gpt-4o' | 'gpt-5-nano'
  ): ParsedFoodItemWithConfidence[] {
    return quantityResults.items.map((qItem, index) => {
      const nItem = nutritionResults.items[index];
      
      if (!nItem) {
        console.warn(`Missing nutrition data for item ${index}: ${qItem.canonical_name}`);
        return null;
      }

      const overallConfidence = (qItem.confidence + nItem.confidence) / 2;

      return {
        // Core food data
        name: nItem.canonical_name,
        calories: Math.round(nItem.totals.kcal),
        protein: Math.round(nItem.totals.protein_g * 10) / 10,
        carbs: Math.round(nItem.totals.carbs_g * 10) / 10,
        fat: Math.round(nItem.totals.fat_g * 10) / 10,

        // Quantity information with confidence
        quantity: qItem.quantity_spoken,
        unit: qItem.unit_spoken,
        quantityConfidence: qItem.confidence,
        gramEquivalent: qItem.grams_estimate,
        suggestedUnits: qItem.suggested_units,

        // Cooking method information  
        cookingMethod: nItem.detected_cooking_method,
        cookingConfidence: nItem.cooking_confidence,
        alternativeMethods: nItem.alternative_methods,

        // Modal trigger logic
        needsQuantityModal: qItem.confidence < 0.6,
        needsCookingModal: nItem.needs_cooking_clarification,

        // AI metadata
        assumptions: [...qItem.assumptions, ...nItem.assumptions],
        overallConfidence,
        aiModel,

        // User override tracking
        userModified: false,
        originalAIEstimate: {
          quantity: qItem.quantity_spoken,
          unit: qItem.unit_spoken,
          grams: qItem.grams_estimate,
          calories: Math.round(nItem.totals.kcal),
          cookingMethod: nItem.detected_cooking_method
        }
      };
    }).filter(Boolean) as ParsedFoodItemWithConfidence[];
  }

  // ============================================================================
  // MODEL PERFORMANCE TRACKING (Deprecated - Moved to external modelTracking utility)
  // ============================================================================
  
  // Note: Model tracking is now handled externally by the modelTracking utility
  // This ensures consistent tracking across all services and better separation of concerns

  // ============================================================================
  // UTILITY METHODS FOR SMART UNIT AND COOKING METHOD SUGGESTIONS
  // ============================================================================

  private generateSuggestedUnits(foodName: string, originalUnit: string, gramsEstimate: number) {
    // This will be implemented with smart unit suggestions based on food type
    // For now, return basic units
    return [
      {
        unit: 'grams',
        label: 'grams',
        gramsPerUnit: 1,
        confidence: 1.0,
        isRecommended: originalUnit === 'grams',
        culturalContext: 'metric'
      },
      {
        unit: originalUnit,
        label: originalUnit,
        gramsPerUnit: gramsEstimate,
        confidence: 0.8,
        isRecommended: true,
        culturalContext: 'egyptian'
      }
    ];
  }

  private extractCookingMethod(foodName: string): string | undefined {
    const name = foodName.toLowerCase();
    const methods = ['grilled', 'fried', 'baked', 'boiled', 'steamed', 'raw', 'مشوي', 'مقلي', 'مسلوق'];
    
    for (const method of methods) {
      if (name.includes(method)) {
        return method;
      }
    }
    
    return undefined;
  }

  private assessCookingConfidence(foodName: string): number {
    const detectedMethod = this.extractCookingMethod(foodName);
    return detectedMethod ? 0.9 : 0.3;
  }

  private generateAlternativeMethods(foodName: string) {
    // Basic implementation - will be enhanced based on food type
    return [
      { method: 'Grilled', arabic_name: 'مشوي', calorie_multiplier: 1.1, icon: '🔥', confidence: 0.8 },
      { method: 'Fried', arabic_name: 'مقلي', calorie_multiplier: 1.4, icon: '🍳', confidence: 0.7 },
      { method: 'Baked', arabic_name: 'في الفرن', calorie_multiplier: 1.05, icon: '🥖', confidence: 0.6 },
    ];
  }

  private needsCookingClarification(foodName: string, confidence: number): boolean {
    const hasProtein = ['chicken', 'meat', 'fish', 'فراخ', 'دجاج', 'لحم', 'لحمة', 'سمك', 'سمكة'].some(p => 
      foodName.toLowerCase().includes(p)
    );
    
    const hasCookingMethod = this.extractCookingMethod(foodName) !== undefined;
    
    return hasProtein && !hasCookingMethod && confidence > 0.6;
  }

  // Test method to query OpenAI without context
  async testBasicQuery(query: string): Promise<string> {
    try {
      const client = this.initializeClient();

      const response = await client.responses.create({
        model: 'gpt-5-nano',
        input: query
      });

      const result = response.output_text?.trim();
      console.log('🧪 Basic OpenAI query result:', result);
      return result || 'No response';
    } catch (error) {
      console.error('❌ Error in basic query:', error);
      throw error;
    }
  }

  /**
   * Track model usage for analytics (stub method)
   * Note: Actual tracking is handled by external modelTracking utility
   */
  private trackModelUsage(
    model: string,
    latency: number,
    tokens: number,
    itemCount: number
  ): void {
    // Optional: Log for debugging in development
    if (__DEV__) {
      console.log(`📊 ${model}: ${latency}ms, ${tokens} tokens, ${itemCount} items`);
    }
  }

  /**
   * Update model statistics (stub method)
   * Note: Actual tracking is handled by external modelTracking utility
   */
  private updateModelStats(stats: any): void {
    // Optional: Log for debugging in development
    if (__DEV__) {
      console.log('📊 Model stats updated:', stats);
    }
  }
}

// Initialize the service instance
let openAIService: OpenAIService;

try {
  openAIService = new OpenAIService();
} catch (error) {
  console.error('Failed to initialize OpenAI service:', error);
  openAIService = new OpenAIService();
}

// Test function to verify environment variable loading
export const testEnvironmentVariable = () => {
  const result = {
    direct: !!process.env.OPENAI_API_KEY,
    config: !!env.OPENAI_API_KEY,
    isValid: !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-api-key-here'),
    allOpenAIVars: Object.keys(process.env).filter(key => key.includes('OPENAI')),
  };
  
  console.log('🧪 Environment Variable Test Results:', result);
  return result;
};

// Test function for basic OpenAI queries with better error handling
export const testBasicOpenAIQuery = async (query: string) => {
  try {
    return await openAIService.testBasicQuery(query);
  } catch (error) {
    console.error('Basic OpenAI query failed:', error);
    throw error;
  }
};

// O3 Enhanced food parsing function
export const parseFoodFromTextO3 = async (text: string) => {
  try {
    return await openAIService.parseFoodFromTextO3(text);
  } catch (error) {
    console.error('O3 food parsing failed:', error);
    throw error;
  }
};

// Enhanced AI Pipeline functions with confidence scoring
export const parseFoodWithConfidence = async (transcript: string, useGPT5: boolean = false) => {
  try {
    return await openAIService.parseFoodWithConfidence(transcript, useGPT5);
  } catch (error) {
    console.error('Enhanced AI Pipeline failed:', error);
    throw error;
  }
};

export const detectQuantityWithConfidence = async (transcript: string, useGPT5: boolean = false) => {
  try {
    return await openAIService.detectQuantityWithConfidence(transcript, useGPT5);
  } catch (error) {
    console.error('Quantity detection with confidence failed:', error);
    throw error;
  }
};

export const calculateNutritionWithConfidence = async (quantityResults: AIQuantityDetectionResult, useGPT5: boolean = false) => {
  try {
    return await openAIService.calculateNutritionWithConfidence(quantityResults, useGPT5);
  } catch (error) {
    console.error('Nutrition calculation with confidence failed:', error);
    throw error;
  }
};

// Model performance tracking is now handled by the external modelTracking utility
// Import from utils/modelTracking instead

export { openAIService };