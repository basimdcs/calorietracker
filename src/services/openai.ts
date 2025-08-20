import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedFoodItem, VOICE_PROCESSING_CONSTANTS } from '../types';
import { getFoodIcon } from '../utils/foodIcons';

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
      
      // For debugging, let's compare both models when possible
      if (__DEV__ && !useGPT4o) {
        try {
          console.log('🔬 DEVELOPMENT MODE: Testing both transcription models...');
          const whisperStart = Date.now();
          const whisperResult = await this.transcribeWithWhisper(audioUri);
          const whisperTime = Date.now() - whisperStart;
          
          const gpt4oStart = Date.now();
          const gpt4oResult = await this.transcribeWithGPT4o(audioUri);
          const gpt4oTime = Date.now() - gpt4oStart;
          
          console.log('📊 TRANSCRIPTION COMPARISON:');
          console.log('━'.repeat(50));
          console.log(`🎵 Whisper (${whisperTime}ms): "${whisperResult}"`);
          console.log(`🤖 GPT-4o (${gpt4oTime}ms): "${gpt4oResult}"`);
          console.log('━'.repeat(50));
          
          if (whisperResult !== gpt4oResult) {
            console.log('⚠️ TRANSCRIPTION DIFFERENCES DETECTED:');
            console.log(`Length difference: ${Math.abs(whisperResult.length - gpt4oResult.length)} characters`);
            console.log('Whisper unique words:', whisperResult.split(' ').filter(w => !gpt4oResult.includes(w)));
            console.log('GPT-4o unique words:', gpt4oResult.split(' ').filter(w => !whisperResult.includes(w)));
          } else {
            console.log('✅ Both models produced identical results');
          }
          
          // Return the primary choice (Whisper for this case)
          return whisperResult;
        } catch (comparisonError) {
          console.log('⚠️ Comparison failed, falling back to single model:', comparisonError);
          return await this.transcribeWithWhisper(audioUri);
        }
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

      // In development mode, run both approaches for comparison
      if (__DEV__ && !useGPT5) {
        try {
          console.log('🔬 DEVELOPMENT MODE: Running both GPT-4o and GPT-5-nano for comparison...');
          console.log('═'.repeat(80));
          
          const gpt4oStart = Date.now();
          const gpt4oResults = await this.parseFoodFromTextLegacy(text);
          const gpt4oTime = Date.now() - gpt4oStart;
          
          const gpt5Start = Date.now();
          const gpt5Results = await this.parseFoodFromTextO3(text);
          const gpt5Time = Date.now() - gpt5Start;
          
          console.log('📊 FOOD PARSING COMPARISON RESULTS:');
          console.log('━'.repeat(60));
          console.log(`📚 GPT-4o Legacy (${gpt4oTime}ms): Found ${gpt4oResults.length} items`);
          console.log(`🚀 GPT-5-nano Enhanced (${gpt5Time}ms): Found ${gpt5Results.length} items`);
          console.log('━'.repeat(60));
          
          // Detailed comparison of results
          console.log('\n🔍 DETAILED FOOD ITEM COMPARISON:');
          
          console.log('\n📚 GPT-4o Legacy Results:');
          gpt4oResults.forEach((food, index) => {
            console.log(`  ${index + 1}. ${food.name}`);
            console.log(`     Quantity: ${food.quantity} ${food.unit}`);
            console.log(`     Calories: ${food.calories}, P: ${food.protein}g, C: ${food.carbs}g, F: ${food.fat}g`);
            console.log(`     Cooking: ${food.cookingMethod || 'Not specified'}`);
            console.log(`     Confidence: ${food.confidence}`);
            console.log(`     Needs: Qty=${food.needsQuantity}, Cook=${food.needsCookingMethod}`);
            if (food.nutritionNotes) console.log(`     Notes: ${food.nutritionNotes}`);
          });
          
          console.log('\n🚀 GPT-5-nano Enhanced Results:');
          gpt5Results.forEach((food, index) => {
            console.log(`  ${index + 1}. ${food.name}`);
            console.log(`     Quantity: ${food.quantity} ${food.unit}`);
            console.log(`     Calories: ${food.calories}, P: ${food.protein}g, C: ${food.carbs}g, F: ${food.fat}g`);
            console.log(`     Cooking: ${food.cookingMethod || 'Not specified'}`);
            console.log(`     Confidence: ${food.confidence}`);
            console.log(`     Needs: Qty=${food.needsQuantity}, Cook=${food.needsCookingMethod}`);
            if (food.nutritionNotes) console.log(`     Notes: ${food.nutritionNotes}`);
          });
          
          // Calculate and compare totals
          const gpt4oTotals = gpt4oResults.reduce((acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fat: acc.fat + (food.fat || 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          const gpt5Totals = gpt5Results.reduce((acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fat: acc.fat + (food.fat || 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          console.log('\n🧮 TOTALS COMPARISON:');
          console.log(`📚 GPT-4o Totals: ${gpt4oTotals.calories} cal, ${gpt4oTotals.protein}g protein, ${gpt4oTotals.carbs}g carbs, ${gpt4oTotals.fat}g fat`);
          console.log(`🚀 GPT-5-nano Totals: ${gpt5Totals.calories} cal, ${gpt5Totals.protein}g protein, ${gpt5Totals.carbs}g carbs, ${gpt5Totals.fat}g fat`);
          
          const calorieDiff = Math.abs(gpt4oTotals.calories - gpt5Totals.calories);
          const proteinDiff = Math.abs(gpt4oTotals.protein - gpt5Totals.protein);
          
          console.log(`📊 Differences: ${calorieDiff} calories, ${proteinDiff.toFixed(1)}g protein`);
          console.log('═'.repeat(80));
          
          // Return the primary choice (GPT-4o for this case)
          return gpt4oResults;
          
        } catch (comparisonError) {
          console.log('⚠️ Comparison failed, falling back to single model:', comparisonError);
          console.log('📚 Using GPT-4o Legacy Approach (Primary)...');
          return await this.parseFoodFromTextLegacy(text);
        }
      }

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
  private async parseFoodAndQuantity(text: string): Promise<{name: string, quantity: number, unit: string}[]> {
    const client = this.initializeClient();
    
    const prompt = `You are analyzing a transcription that may contain errors or mixed languages. Think systematically:

Text: ${text}

REASONING FRAMEWORK:
1. LANGUAGE ANALYSIS
   - Identify primary language(s) present (Arabic, English, mixed)
   - For Arabic text: account for dialectal variations and transcription ambiguities
   - Recognize quantity expressions: Arabic fractions (نص, ربع, تلت), numbers, portion words
   - If quantity words are present, assume food context and interpret other words as food items

2. ITEM IDENTIFICATION
   - Distinguish consumables (foods/beverages) from non-consumables
   - Apply contextual reasoning: foods typically measured in grams, liquids in ml
   - Consider cultural and regional food contexts
   - If text contains quantity words (نص, ربع, etc.), strongly favor food interpretations for ambiguous terms
   - Use phonetic matching to identify likely food items even from garbled transcription

3. QUANTITY REASONING FOR CALORIE CALCULATION
   - OBJECTIVE: Determine the actual edible weight of food for accurate calorie counting
   - Extract explicit quantities and convert to appropriate units
   - For fractional/partial terms: calculate realistic edible portions based on typical food weights
   - Consider edible vs total weight: remove bones, skin, peels, inedible parts from calculations
   - For missing quantities: estimate realistic serving sizes that people actually consume
   - Apply nutritional reasoning: portion sizes should align with typical caloric intake patterns

4. ERROR CORRECTION & PHONETIC ANALYSIS
   - Aggressively correct obvious transcription errors using phonetic similarity
   - For unrecognized words, consider if they sound like common food terms
   - Apply contextual food knowledge: if text contains food-related context, interpret ambiguous words as food items
   - Consider common Arabic transcription patterns: missing prefixes (شوية→مشوية), character substitutions (خ→ح, ر→خ)
   - When in doubt between nonsense and food, choose food interpretation if context supports it

5. OUTPUT PREPARATION
   - Use "grams" for solid foods, "ml" for liquids
   - Return empty array if no consumable items are clearly identifiable
   - Ensure quantities reflect realistic edible weights suitable for accurate calorie calculation
   - Verify portion sizes make nutritional sense for typical human consumption

Return JSON only: [{"name": "item name", "quantity": number, "unit": "grams or ml"}]`;
    
    console.log('📤 STEP 1 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
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
  private async calculateCalories(foods: {name: string, quantity: number, unit: string}[]): Promise<ParsedFoodItem[]> {
    // If no foods were parsed, return empty array instead of calling AI
    if (!foods || foods.length === 0) {
      console.log('❌ No foods to calculate calories for, returning empty array');
      return [];
    }

    const client = this.initializeClient();
    
    const foodsList = foods.map(f => `- ${f.name}: ${f.quantity}g`).join('\n');
    
    const prompt = `Calculate nutrition values for these food/beverage items using systematic reasoning. Return ONLY JSON, no explanations:

Foods with quantities:
${foodsList}

SYSTEMATIC NUTRITION ANALYSIS:
1. FOOD CLASSIFICATION
   - Categorize each item by type (protein source, grain, vegetable, dairy, beverage, etc.)
   - Identify processing level (raw, cooked, processed, branded)
   - Determine appropriate nutrition database context (regional vs international)

2. COOKING METHOD IMPACT
   - Analyze how preparation affects nutrition (if cooking method mentioned/implied)
   - Apply systematic reasoning for cooking losses/additions
   - Consider oil, seasoning, and preparation additions

3. PORTION VALIDATION
   - Verify quantities are realistic for the food type
   - Apply contextual knowledge of typical serving sizes
   - Consider cultural and regional portion norms

4. MACRO CALCULATION REASONING
   - Use food category patterns to estimate macro distributions
   - Apply systematic validation: protein ≤ 40g/100g for most foods, realistic calorie density
   - Ensure macro calories align with total calories (4-4-9 rule)

5. BRAND/REGIONAL SPECIFICITY
   - Apply regional food characteristics when applicable
   - Use brand-specific data for processed foods when identifiable
   - Consider local preparation methods and ingredients

Return ONLY this JSON format:
[{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number, "cookingMethod": "inferred method if applicable"}]`;
    
    console.log('📤 STEP 2 REQUEST - Full prompt:', prompt);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
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
        icon: getFoodIcon(name),
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