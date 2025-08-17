import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedFoodItem, VOICE_PROCESSING_CONSTANTS } from '../types';

/**
 * OpenAI Service - Updated to use Speech-to-Text API
 * 
 * This service now uses OpenAI's Speech-to-Text API (https://platform.openai.com/docs/guides/speech-to-text)
 * instead of the legacy Whisper API. The new API provides:
 * - Better accuracy for Arabic/Egyptian Arabic
 * - Word-level timestamps
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
      console.log('🎤 Starting Speech-to-Text transcription for:', audioUri);
      
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

    // Use the new Speech-to-Text API
    formData.append('model', 'whisper-1');
    formData.append('language', 'ar');
    formData.append('response_format', 'text');
    formData.append('timestamp_granularities', 'word');

    return formData;
  }

  private async sendTranscriptionRequest(formData: FormData): Promise<Response> {
    console.log('📤 Sending Speech-to-Text request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📥 OpenAI Speech-to-Text response status:', response.status);
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

  // MAIN PARSING METHOD - Uses GPT-4o as primary, GPT-5-nano as backup option
  async parseFoodFromText(text: string, useGPT5?: boolean): Promise<ParsedFoodItem[]> {
    try {
      console.log('🔬 Parsing food with method:', useGPT5 ? 'GPT-5-nano Enhanced' : 'GPT-4o Legacy');
      console.log('API Key present:', OPENAI_API_KEY ? 'Yes' : 'No');
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

      // Choose method based on parameter
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

  // Step 1: Parse food items and quantities from Arabic/Egyptian Arabic text
  private async parseFoodAndQuantity(text: string): Promise<{name: string, quantity: number, unit: string}[]> {
    const client = this.initializeClient();
    
    const prompt = `Parse this Arabic/Egyptian Arabic food text and extract food items with their quantities. Convert portions to grams with smart defaults.

          Text: ${text}
          
          EXTRACTION WITH SMART LOGIC:
          - Food items with accurate Arabic/Egyptian context
          - Quantities in grams (use realistic Egyptian portion sizes)
          - Apply intelligent defaults for common Egyptian foods
          - Account for regional serving sizes and preparation methods
          
          SMART QUANTITY LOGIC:
          - Use standard Egyptian portions: "كوب رز" = 200g, "رغيف عيش" = 90g, "علبة زبادي" = 150g
          - Convert vague amounts intelligently: "شوية" = 50-100g depending on food type
          - Apply realistic portions for whole items: "فرخة" = 1200g gross (800g edible)
          
          Return JSON: [{"name": "food item", "quantity": number_in_grams, "unit": "grams"}]
          
          Provide accurate, contextually appropriate portions for Egyptian cuisine.`;
    
    console.log('📤 STEP 1 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing Arabic/Egyptian food descriptions. Extract food items with quantities and convert to grams.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 500,
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
    
    const prompt = `Calculate calories, protein, carbs, and fat for these Egyptian/Arabic food items with nutrition analysis. Return ONLY JSON, no explanations:

          Foods with quantities:
          ${foodsList}
          
          NUTRITION CALCULATION:
          - Use Egyptian/regional nutrition databases when applicable
          - Account for local cooking methods and ingredients (oil, ghee, spices)
          - Apply realistic macro distributions for Middle Eastern cuisine
          - Consider portion sizes typical in Egyptian diet
          - Use accurate values for local food brands (مراعي, جهينة, etc.)
          
          Return ONLY this JSON format:
          [{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number, "cookingMethod": "inferred method if applicable"}]
          
          Ensure nutrition values are accurate for Egyptian food context.`;
    
    console.log('📤 STEP 2 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in Arabic/Egyptian cuisine. Calculate accurate nutrition values for food items.'
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
      cookingMethod?: string;
    }, index: number): ParsedFoodItem => {
      // Validate required fields
      const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Food Item ${index + 1}`;
      const calories = typeof item.calories === 'number' && item.calories >= 0 ? item.calories : 0;
      const protein = typeof item.protein === 'number' && item.protein >= 0 ? item.protein : 0;
      const carbs = typeof item.carbs === 'number' && item.carbs >= 0 ? item.carbs : 0;
      const fat = typeof item.fat === 'number' && item.fat >= 0 ? item.fat : 0;
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 100;
      
      // Apply smart modal logic even in legacy fallback
      const smartNeedsQuantity = this.determineNeedsQuantity(name);
      const smartNeedsCookingMethod = this.determineNeedsCookingMethod(name, item.cookingMethod);
      
      return {
        name,
        calories,
        protein,
        carbs,
        fat,
        confidence: 0.8, // Slightly lower confidence for legacy method
        quantity,
        unit: 'grams',
        cookingMethod: item.cookingMethod || undefined,
        needsQuantity: smartNeedsQuantity,
        suggestedQuantity: smartNeedsQuantity ? ['0.5', '1', '1.5', '2'] : [],
        needsCookingMethod: smartNeedsCookingMethod,
        suggestedCookingMethods: smartNeedsCookingMethod ? ['Grilled', 'Fried', 'Baked', 'Boiled'] : [],
        isNutritionComplete: true,
        nutritionNotes: 'Legacy method with smart modal logic',
      };
    }).filter((item: ParsedFoodItem) => item.calories > 0); // Remove items with no calories
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
      instructions: `Parse Arabic/Egyptian food text into JSON format with smart modal flags.

TASK: Extract foods and convert to edible grams. Set needsQuantity and needsCookingMethod flags intelligently.

QUANTITY CONVERSION:
- نص=0.5, ربع=0.25, نص كيلو=500g, ربع كيلو=250g
- Standard portions: كوب رز=200g, رغيف عيش=90g, علبة زبادي=150g
- Whole items: estimate edible portion (chicken: 800g edible from 1200g gross)

MODAL FLAGS (BE CONSERVATIVE):
needsQuantity=TRUE ONLY for: "شوية", "كتير", "بعض", "قليل" (vague amounts)
needsQuantity=FALSE for: "واحد", "كوب", "علبة", "رغيف", "١٥٠ جرام" (clear portions)

needsCookingMethod=TRUE ONLY for: raw proteins without cooking method mentioned
needsCookingMethod=FALSE for: dairy, fruits, beverages, processed foods, foods with cooking method already mentioned

Return ONLY JSON array - no explanations, be fast and concise.`,
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
      instructions: `Calculate nutrition for Arabic/Egyptian foods. Return accurate calories, protein, carbs, fat.

TASK: Use food name + grams + cooking method to calculate precise nutrition values.

NUTRITION RULES:
- Use Egyptian food database values where applicable
- Apply cooking multipliers: fried +40% calories, grilled +10%, boiled/raw unchanged
- Validate: protein ≤35g/100g (≤40g for lean meat), fat ≤30g/100g (≤60g nuts, ≤45g fried)
- Check: calories ≈ 4*(P+C)+9*F within ±10%

FOOD-SPECIFIC:
- فرخة = whole roasted chicken, meat+skin, edible portion
- Egyptian rice/bread: account for typical oil/ghee preparation
- Local brands (مراعي, جهينة): use accurate fat content

Return ONLY JSON - be fast and precise, no explanations needed.`,
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
        ].filter(Boolean).join('; ')
      };
    });
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