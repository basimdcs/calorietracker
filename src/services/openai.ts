import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedFoodItem, VOICE_PROCESSING_CONSTANTS } from '../types';

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

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log('🎤 Starting transcription for:', audioUri);
      
      if (!this.isValidApiKey()) {
        throw new Error('OpenAI API key is not configured');
      }
      
      const formData = this.createTranscriptionFormData(audioUri);
      const response = await this.sendTranscriptionRequest(formData);
      
      return this.handleTranscriptionResponse(response);
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw this.createTranscriptionError(error);
    }
  }

  private createTranscriptionFormData(audioUri: string): FormData {
    const formData = new FormData();

    // @ts-ignore - React Native FormData expects this object structure
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });

    formData.append('model', 'whisper-1');
    formData.append('language', 'ar');
    formData.append('response_format', 'text');

    return formData;
  }

  private async sendTranscriptionRequest(formData: FormData): Promise<Response> {
    console.log('📤 Sending transcription request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📥 OpenAI response status:', response.status);
    return response;
  }

  private async handleTranscriptionResponse(response: Response): Promise<string> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', response.status, errorText);
      throw this.createApiError(response.status, errorText);
    }

    const transcriptionText = await response.text();
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

  // MAIN PARSING METHOD - Now uses O3 approach as primary
  async parseFoodFromText(text: string): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔬 Using O3 Enhanced Approach for parsing:', text);
      console.log('API Key present:', OPENAI_API_KEY ? 'Yes' : 'No');
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

      // Use O3 approach as primary method
      return await this.parseFoodFromTextO3(text);
      
    } catch (error) {
      console.error('❌ O3 approach failed, falling back to legacy method:', error);
      
      // Fallback to legacy approach if O3 fails
      try {
        console.log('🔄 Attempting fallback to legacy 2-step approach...');
        return await this.parseFoodFromTextLegacy(text);
      } catch (fallbackError) {
        console.error('❌ Both O3 and legacy approaches failed:', fallbackError);
        
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
      max_tokens: 200,
    });

    const englishText = translationResponse.choices[0]?.message?.content?.trim();
    console.log('Translated to English:', englishText);
    
    return englishText || '';
  }

  // Step 1: Parse food items and quantities from Arabic/Egyptian Arabic text
  private async parseFoodAndQuantity(text: string): Promise<{name: string, quantity: number, unit: string}[]> {
    const client = this.initializeClient();
    
    const prompt = `Parse this Arabic/Egyptian Arabic food text and extract food items with their quantities. Convert portions to grams.

          Text: ${text}
          
          Extract:
          - Food items 
          - Quantities in grams (realistic portion sizes)
          
          Return JSON: [{"name": "food item", "quantity": number_in_grams, "unit": "grams"}]`;
    
    console.log('📤 STEP 1 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 STEP 1 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI');
    
    const parsed = JSON.parse(this.extractJsonContent(content));
    console.log('📥 STEP 1 RESPONSE - Parsed JSON:', parsed);
    
    return parsed;
  }

  // Step 2: Get calories based on food and quantity
  private async calculateCalories(foods: {name: string, quantity: number, unit: string}[]): Promise<ParsedFoodItem[]> {
    const client = this.initializeClient();
    
    const foodsList = foods.map(f => `- ${f.name}: ${f.quantity}g`).join('\n');
    
    const prompt = `Calculate calories, protein, carbs, and fat for these food items and quantities. Return ONLY JSON, no explanations:

          Foods with quantities:
          ${foodsList}
          
          Return ONLY this JSON format:
          [{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number}]`;
    
    console.log('📤 STEP 2 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 STEP 2 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI');
    
    const nutritionData = JSON.parse(this.extractJsonContent(content));
    console.log('📥 STEP 2 RESPONSE - Parsed JSON:', nutritionData);
    
    // Convert to ParsedFoodItem format with validation
    return nutritionData.map((item: any, index: number): ParsedFoodItem => {
      // Validate required fields
      const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Food Item ${index + 1}`;
      const calories = typeof item.calories === 'number' && item.calories >= 0 ? item.calories : 0;
      const protein = typeof item.protein === 'number' && item.protein >= 0 ? item.protein : 0;
      const carbs = typeof item.carbs === 'number' && item.carbs >= 0 ? item.carbs : 0;
      const fat = typeof item.fat === 'number' && item.fat >= 0 ? item.fat : 0;
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 100;
      
      return {
        name,
        calories,
        protein,
        carbs,
        fat,
        confidence: 0.9,
        quantity,
        unit: 'grams',
        cookingMethod: item.cookingMethod || null,
        needsQuantity: false,
        suggestedQuantity: [],
        needsCookingMethod: false,
        suggestedCookingMethods: [],
        isNutritionComplete: true,
        nutritionNotes: null,
      };
    }).filter(item => item.calories > 0); // Remove items with no calories
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



  // O3 APPROACH: Step 1 - Parse to edible grams with ambiguity detection
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

    console.log('📤 O3 STEP 1 REQUEST - Input text:', text);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition normalizer for Arabic/Egyptian Arabic voice logs.
Goal: extract foods and convert to EDIBLE cooked grams (remove bones/shells; keep edible skin if typical).

Rules:
- If the phrase implies a whole or bone-in item (e.g., "نص فرخة", "ورك", "جناح", whole fish), treat the mentioned amount as GROSS, then estimate EDIBLE grams using realistic yields. Record the assumption used.
- If the phrase gives a net weight (e.g., "١٥٠ جرام", "ربع كيلو كفتة"), treat as EDIBLE unless clearly raw/gross.
- Map dialect numerals & measures (نص=0.5, ربع=0.25, نص كيلو=500g, ربع كيلو=250g, "مية/مي"=100g, "طبق صغير/كبير"→ pick a realistic range and midpoint).
- Cooking method: extract if present; else set "unknown".
- Default basis for unspecific "فرخة/دجاج": whole chicken, grilled/roasted, meat+skin, edible portion.
- If ambiguous, provide a range and choose a midpoint; set needs flags.

Return ONLY JSON. Do not include prose or code fences.
Each item in the foods array should include all required fields.`
        },
        {
          role: 'user',
          content: `Text: ${text}
Return the JSON with foods array only.`
        }
      ],
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_parsing_step1",
          schema: step1Schema
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 O3 STEP 1 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI Step 1');
    
    const parsed = JSON.parse(content);
    console.log('📥 O3 STEP 1 RESPONSE - Parsed JSON:', parsed);
    
    return parsed.foods;
  }

  // O3 APPROACH: Step 2 - Calculate macros with sanity checks
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
    
    console.log('📤 O3 STEP 2 REQUEST - Foods input:', foodsInput);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a deterministic nutrition calculator.
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

Output ONLY JSON. No prose, no code fences.`
        },
        {
          role: 'user',
          content: `Foods (edible grams from Step 1):
${foodsInput}
Return the JSON with foods array and total object.`
        }
      ],
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nutrition_calculation_step2",
          schema: step2Schema
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    console.log('📥 O3 STEP 2 RESPONSE - Raw content:', content);
    
    if (!content) throw new Error('No response from OpenAI Step 2');
    
    const parsed = JSON.parse(content);
    console.log('📥 O3 STEP 2 RESPONSE - Parsed JSON:', parsed);
    
    return parsed;
  }

  // O3 APPROACH: Combined flow
  async parseFoodFromTextO3(text: string): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔬 O3 APPROACH: Starting enhanced food parsing for:', text);
      
      // Step 1: Parse to edible grams with ambiguity detection
      const step1Results = await this.parseToEdibleGramsO3(text);
      
      if (step1Results.length === 0) {
        throw new Error('No food items detected in Step 1');
      }
      
      // Step 2: Calculate macros with sanity checks  
      const step2Results = await this.calculateMacrosO3(step1Results);
      
      // Map to ParsedFoodItem format
      const parsedFoods = this.mapO3ResultsToParsedFoodItems(step1Results, step2Results);
      
      console.log('✅ O3 APPROACH: Completed successfully with', parsedFoods.length, 'items');
      return parsedFoods;
      
    } catch (error) {
      console.error('❌ O3 APPROACH: Failed:', error);
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
        ].filter(Boolean).join('; ')
      };
    });
  }

  // Test method to query OpenAI without context
  async testBasicQuery(query: string): Promise<string> {
    try {
      const client = this.initializeClient();
      
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const result = response.choices[0]?.message?.content?.trim();
      console.log('🧪 Basic OpenAI query result:', result);
      return result || 'No response';
    } catch (error) {
      console.error('❌ Error in basic query:', error);
      throw error;
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

export { openAIService };