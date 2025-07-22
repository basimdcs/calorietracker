import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-api-key-here';

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  quantity?: number; // The actual quantity amount
  unit?: string; // The unit (pieces, grams, cups, etc.)
  needsQuantity?: boolean; // Flag to indicate if quantity clarification is needed
  suggestedQuantity?: string; // Suggested quantity options
  needsCookingMethod?: boolean; // Flag to indicate if cooking method clarification is needed
  suggestedCookingMethods?: string[]; // Array of suggested cooking methods
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log('Starting transcription for:', audioUri);
      
      // Use the traditional React Native FormData approach that works with OpenAI
      // This is the proven pattern from the React Native community
      const formData = new FormData();

      // @ts-ignore - React Native FormData expects this object structure
      formData.append('file', {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      });

      formData.append('model', 'whisper-1');
      formData.append('language', 'ar'); // Arabic context for better Egyptian pronunciation
      formData.append('response_format', 'text');

      // Use fetch directly with FormData - this is the React Native way
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const transcriptionText = await response.text();
      const cleanedText = transcriptionText.trim();
      console.log('Transcription result:', cleanedText);
      
      return cleanedText;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  async parseFoodFromText(text: string): Promise<FoodItem[]> {
    try {
      console.log('Parsing food from text:', text);
      console.log('API Key present:', OPENAI_API_KEY ? 'Yes' : 'No');
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert nutritionist specializing in Egyptian cuisine. Your task is to precisely parse voice-transcribed meal descriptions into structured nutritional data in JSON.

DETAILED PARSING INSTRUCTIONS:

1. **Identify All Mentioned Foods:**
   - Detect every distinct food item, including multiple items connected by Arabic connectors like "و", "مع", "بجانب", "إضافة إلى".

2. **Extract Precise Quantities:**
   - Capture explicit quantities and units, including numbers and fraction terms such as "half", "quarter", "third".
   - If quantities aren't specified, set needsQuantity to true, and suggest realistic units and typical quantities (e.g., grams, pieces, cups, tablespoons).

3. **Detect Cooking Methods Clearly:**
   - Accurately capture cooking methods including: grilled, fried, roasted, boiled, steamed, baked, sautéed, مشوي, مقلي, مسلوق, محمر, في الفرن.
   - Set needsCookingMethod to true if unclear, and provide relevant suggested cooking methods.

4. **Adjust Nutritional Values Dynamically:**
   - Provide realistic calories, protein, carbs, and fat values adjusted dynamically based on detected cooking methods:
     - Fried (مقلي): +50-100% calories increase.
     - Roasted/Baked (في الفرن): +10-30% calories increase.
     - Grilled/Boiled/Steamed (مشوي/مسلوق): Base values without added calories.

5. **Common Food Reference (examples, not limits):**
   - Kofta (كفتة), Koshary (كشري), Molokhia (ملوخية), Ful (فول), Chicken (فراخ), Rice (رز), Falafel (فلافل), Bread (عيش).
   - Use general knowledge to estimate nutritional values for foods not explicitly listed.

6. **Clarify Ambiguities Explicitly:**
   - Clearly flag uncertainties with fields needsQuantity or needsCookingMethod.

7. **Always Return Strict JSON Format:**
   - Return only a JSON array.
   - Every food item must include these keys clearly:
     - name (string)
     - calories (number, realistically estimated)
     - protein (number)
     - carbs (number)
     - fat (number)
     - confidence (0.0-1.0)
     - quantity (number | null)
     - unit (string | null)
     - grams (number, always present, estimated if not explicit)
     - needsQuantity (boolean)
     - suggestedQuantity (string, optional)
     - needsCookingMethod (boolean)
     - suggestedCookingMethods (array of strings, optional)

EXAMPLE OUTPUT:
[
  {
    "name": "كفتة",
    "calories": 295,
    "protein": 18,
    "carbs": 6,
    "fat": 22,
    "confidence": 0.95,
    "quantity": 100,
    "unit": "grams",
    "grams": 100,
    "needsQuantity": false,
    "needsCookingMethod": true,
    "suggestedCookingMethods": ["grilled", "fried"]
  },
  {
    "name": "رز أبيض",
    "calories": 260,
    "protein": 4,
    "carbs": 57,
    "fat": 0.4,
    "confidence": 0.9,
    "quantity": 1,
    "unit": "cup",
    "grams": 200,
    "needsQuantity": false,
    "needsCookingMethod": false
  }
]

Respond ONLY with the JSON array, no additional explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2, // Even lower temperature for consistency
        max_tokens: 500, // Increased for multiple items
      });

      console.log('OpenAI completion response:', completion);
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      console.log('Raw OpenAI response:', content);
      
      // Robust JSON extraction and parsing
      let jsonContent = content.trim();
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = jsonContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      // Find the first [ and last ] to extract just the JSON array
      const firstBracket = jsonContent.indexOf('[');
      const lastBracket = jsonContent.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonContent = jsonContent.substring(firstBracket, lastBracket + 1);
      }
      
      // Clean up any potential issues with Arabic text affecting JSON
      jsonContent = jsonContent
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .trim();
      
      console.log('Cleaned JSON content:', jsonContent);
      
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Ensure it's an array
        if (!Array.isArray(parsed)) {
          throw new Error('Response is not an array');
        }
        
        // Validate and fix food items
        const foods: FoodItem[] = parsed.map((item: any) => ({
          name: String(item.name || 'Unknown Food'),
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
          confidence: Math.min(Math.max(Number(item.confidence) || 0.5, 0), 1),
          quantity: item.quantity !== undefined ? Number(item.quantity) : undefined,
          unit: item.unit || undefined,
          needsQuantity: Boolean(item.needsQuantity),
          suggestedQuantity: item.suggestedQuantity,
          needsCookingMethod: Boolean(item.needsCookingMethod),
          suggestedCookingMethods: Array.isArray(item.suggestedCookingMethods) ? item.suggestedCookingMethods : undefined,
        }));
        
        console.log('Parsed foods:', foods);
        return foods;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Failed to parse JSON content:', jsonContent);
        throw new Error('Failed to parse food data. Please try again.');
      }
    } catch (error) {
      console.error('Error parsing food from text:', error);
      throw new Error('Failed to parse food information. Please try again.');
    }
  }

  async calculateNutrition(foods: FoodItem[]): Promise<{
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }> {
    // Simple calculation - could be enhanced with AI for portion adjustments
    const totals = foods.reduce(
      (acc, food) => ({
        totalCalories: acc.totalCalories + food.calories,
        totalProtein: acc.totalProtein + food.protein,
        totalCarbs: acc.totalCarbs + food.carbs,
        totalFat: acc.totalFat + food.fat,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );

    return totals;
  }
}

export const openAIService = new OpenAIService();