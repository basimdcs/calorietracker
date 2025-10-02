import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { openAIService } from '../services/openai';
import { ParsedFoodItem } from '../types';
import { ParsedFoodItemWithConfidence } from '../types/aiTypes';
import { 
  startTrackingSession, 
  completeTrackingSession, 
  trackModelCall 
} from '../utils/modelTracking';

// Voice processing states
export type VoiceProcessingState = 'idle' | 'transcribing' | 'parsing' | 'completed' | 'error';

export interface VoiceProcessingData {
  state: VoiceProcessingState;
  transcript: string;
  parsedFoods: ParsedFoodItemWithConfidence[];
  error: string | null;
  progress?: number;
  sessionId?: string;
  modelStats?: {
    transcriptionModel: 'whisper' | 'gpt-4o-audio';
    nutritionModel: 'gpt-4o' | 'gpt-5-nano';
    transcriptionLatency?: number;
    nutritionLatency?: number;
    totalCost?: number;
  };
}

export interface VoiceProcessingActions {
  processRecording: (audioUri: string, useGPT5?: boolean, useGPT4oTranscription?: boolean) => Promise<boolean>;
  retryProcessing: (useGPT5?: boolean, useGPT4oTranscription?: boolean) => Promise<boolean>;
  clearTranscript: () => void;
  clearError: () => void;
  reset: () => void;
}

export interface UseVoiceProcessingResult {
  data: VoiceProcessingData;
  actions: VoiceProcessingActions;
}

export const useVoiceProcessing = (): UseVoiceProcessingResult => {
  const [state, setState] = useState<VoiceProcessingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItemWithConfidence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [modelStats, setModelStats] = useState<{
    transcriptionModel: 'whisper' | 'gpt-4o-audio';
    nutritionModel: 'gpt-4o' | 'gpt-5-nano';
    transcriptionLatency?: number;
    nutritionLatency?: number;
    totalCost?: number;
  } | undefined>(undefined);

  const processRecording = useCallback(async (audioUri: string, useGPT5?: boolean, useGPT4oTranscription?: boolean): Promise<boolean> => {
    let currentSessionId: string | undefined;
    const transcriptionModel = useGPT4oTranscription ? 'gpt-4o-audio' : 'whisper';
    const nutritionModel = useGPT5 ? 'gpt-5-nano' : 'gpt-4o';
    
    try {
      setError(null);
      setState('transcribing');
      setProgress(0);
      setLastAudioUri(audioUri);
      
      // Initialize model stats
      const stats = {
        transcriptionModel,
        nutritionModel,
        transcriptionLatency: undefined as number | undefined,
        nutritionLatency: undefined as number | undefined,
        totalCost: 0
      };
      setModelStats(stats);
      
      // Start session tracking
      currentSessionId = await startTrackingSession(transcriptionModel, nutritionModel);
      setSessionId(currentSessionId);
      
      console.log(`🎯 Starting enhanced voice processing session ${currentSessionId}`);
      console.log(`📊 Models: ${transcriptionModel} + ${nutritionModel}`);
      
      // Transcribe audio with performance tracking
      const transcriptionStart = Date.now();
      const transcriptionResult = await openAIService.transcribeAudio(audioUri, useGPT4oTranscription);
      const transcriptionLatency = Date.now() - transcriptionStart;
      
      // Track transcription performance
      trackModelCall(transcriptionModel, transcriptionLatency, 0, 0, 0, true);
      
      stats.transcriptionLatency = transcriptionLatency;
      setModelStats({ ...stats });
      setTranscript(transcriptionResult);
      setProgress(50);
      
      if (!transcriptionResult.trim()) {
        if (currentSessionId) {
          await completeTrackingSession(currentSessionId, {
            final_foods_count: 0,
            user_needed_modal: false,
            confidence_accurate: false,
            performance_notes: ['No speech detected in transcription']
          });
        }
        
        Alert.alert(
          'No Speech Detected',
          'We couldn\'t detect any speech in your recording. Please try again.',
          [{ text: 'OK', onPress: () => {
            setState('error');
            setError('No speech detected in the recording');
          } }]
        );
        return false;
      }

      setState('parsing');
      setProgress(75);
      console.log('🤖 Starting food parsing with improved cultural intelligence...');

      // Use improved Step 1 → Step 2 pipeline with GPT-4o and cultural intelligence
      const nutritionStart = Date.now();
      const parsedFoodsRaw = await openAIService.parseFoodFromText(transcriptionResult, useGPT5);
      const nutritionLatency = Date.now() - nutritionStart;

      // Convert ParsedFoodItem[] to ParsedFoodItemWithConfidence[]
      const enhancedFoods: ParsedFoodItemWithConfidence[] = parsedFoodsRaw.map(food => {
        // Calculate gramEquivalent based on unit - this is the single source of truth for quantity
        const quantity = food.quantity || 100;
        const unit = (food.unit || 'grams').toLowerCase();
        let gramEquivalent = 100; // default fallback

        if (unit === 'g' || unit === 'grams' || unit === 'gram') {
          gramEquivalent = quantity; // Direct grams
        } else if (unit === 'ml' || unit === 'milliliters' || unit === 'milliliter') {
          gramEquivalent = quantity; // 1ml ≈ 1g for most liquids
        } else {
          // For pieces/cups/servings, AI already calculated total nutrition for that quantity
          // We treat it as if it's that many grams for the modal
          gramEquivalent = quantity;
        }

        return {
          ...food,
          // Add confidence fields
          overallConfidence: food.confidence || 0.85,
          quantityConfidence: food.confidence || 0.85,
          cookingConfidence: food.cookingMethod ? 0.9 : 0.3,
          // Add required fields for confidence interface
          aiModel: (useGPT5 ? 'gpt-5-nano' : 'gpt-4o') as 'gpt-4o' | 'gpt-5-nano',
          gramEquivalent, // Single source of truth for quantity
          needsQuantityModal: food.needsQuantity || false,
          needsCookingModal: food.needsCookingMethod || false,
          suggestedUnits: food.suggestedQuantity?.map(q => ({
            unit: food.unit || 'grams',
            label: food.unit || 'grams',
            gramsPerUnit: parseFloat(q) || 1,
            confidence: 0.8,
            isRecommended: parseFloat(q) === 1,
            culturalContext: 'metric'
          })) || [],
          alternativeMethods: food.suggestedCookingMethods?.map(method => ({
            method,
            arabic_name: method,
            calorie_multiplier: method === 'Fried' ? 1.3 : 1.0,
            icon: method === 'Grilled' ? '🔥' : method === 'Fried' ? '🍳' : '🥘',
            confidence: 0.7
          })) || [],
          assumptions: food.nutritionNotes ? [food.nutritionNotes] : [],
          userModified: false,
          originalAIEstimate: {
            quantity: food.quantity || 1,
            unit: food.unit || 'grams',
            grams: gramEquivalent, // Use calculated gramEquivalent
            calories: food.calories || 0,
            cookingMethod: food.cookingMethod
          }
        };
      });
      
      stats.nutritionLatency = nutritionLatency;
      setModelStats({ ...stats });
      
      if (enhancedFoods.length === 0) {
        if (currentSessionId) {
          await completeTrackingSession(currentSessionId, {
            final_foods_count: 0,
            user_needed_modal: false,
            confidence_accurate: false,
            performance_notes: ['No food items detected in enhanced parsing']
          });
        }
        
        Alert.alert(
          'No Food Detected',
          'We couldn\'t identify any food items in your description. Please try describing your meal again.',
          [{ text: 'OK', onPress: () => {
            setState('error');
            setError('No food items detected in the description');
          } }]
        );
        return false;
      }

      // Analyze confidence and modal needs
      const needsModalItems = enhancedFoods.filter(food => food.needsQuantityModal || food.needsCookingModal);
      const avgConfidence = enhancedFoods.reduce((sum, food) => sum + food.overallConfidence, 0) / enhancedFoods.length;
      
      console.log(`✅ Enhanced processing completed: ${enhancedFoods.length} foods, ${needsModalItems.length} need clarification`);
      console.log(`📊 Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
      
      setParsedFoods(enhancedFoods);
      setState('completed');
      setProgress(100);
      
      // Complete session tracking
      if (currentSessionId) {
        await completeTrackingSession(currentSessionId, {
          transcription_latency_ms: transcriptionLatency,
          nutrition_latency_ms: nutritionLatency,
          final_foods_count: enhancedFoods.length,
          user_needed_modal: needsModalItems.length > 0,
          confidence_accurate: true, // Will be updated when user interacts with modals
          performance_notes: [
            `${enhancedFoods.length} foods detected`,
            `${needsModalItems.length} items need clarification`,
            `Average confidence: ${(avgConfidence * 100).toFixed(1)}%`
          ]
        });
      }
      
      return true;
      
    } catch (err) {
      console.error('❌ Enhanced voice processing failed:', err);
      
      // Complete session with error if we have a session
      if (currentSessionId) {
        await completeTrackingSession(currentSessionId, {
          final_foods_count: 0,
          user_needed_modal: false,
          confidence_accurate: false,
          performance_notes: [
            'Processing failed with error',
            err instanceof Error ? err.message : 'Unknown error'
          ]
        });
      }
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'There was an error processing your recording. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          errorMessage = 'Configuration error: Please check your API key setup.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('No speech detected')) {
          errorMessage = 'No speech detected in the recording. Please try speaking more clearly.';
        } else if (err.message.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message.includes('Invalid API key')) {
          errorMessage = 'API key is invalid. Please check your configuration.';
        } else {
          errorMessage = `Processing error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setState('error');
      setProgress(undefined);
      
      Alert.alert('Processing Error', errorMessage, [{ 
        text: 'OK', 
        onPress: () => setState('error')
      }]);
      
      return false;
    }
  }, []);

  const retryProcessing = useCallback(async (useGPT5?: boolean, useGPT4oTranscription?: boolean): Promise<boolean> => {
    if (!transcript.trim()) {
      console.log('⚠️ No transcript available for retry');
      return false;
    }

    let retrySessionId: string | undefined;
    const nutritionModel = useGPT5 ? 'gpt-5-nano' : 'gpt-4o';
    const transcriptionModel = useGPT4oTranscription ? 'gpt-4o-audio' : 'whisper';

    try {
      setError(null);
      setState('parsing');
      setProgress(75);

      // Start new session for retry
      retrySessionId = await startTrackingSession(transcriptionModel, nutritionModel);
      setSessionId(retrySessionId);

      console.log(`🔄 Retrying enhanced food parsing for session ${retrySessionId}`);
      console.log('📄 Using existing transcript:', transcript.substring(0, 100) + '...');

      // Use enhanced pipeline with confidence scoring
      const nutritionStart = Date.now();
      const parsedFoodsRaw = await openAIService.parseFoodFromText(transcript, useGPT5);
      const nutritionLatency = Date.now() - nutritionStart;

      // Convert ParsedFoodItem[] to ParsedFoodItemWithConfidence[]
      const enhancedFoods: ParsedFoodItemWithConfidence[] = parsedFoodsRaw.map(food => {
        // Calculate gramEquivalent based on unit - this is the single source of truth for quantity
        const quantity = food.quantity || 100;
        const unit = (food.unit || 'grams').toLowerCase();
        let gramEquivalent = 100; // default fallback

        if (unit === 'g' || unit === 'grams' || unit === 'gram') {
          gramEquivalent = quantity; // Direct grams
        } else if (unit === 'ml' || unit === 'milliliters' || unit === 'milliliter') {
          gramEquivalent = quantity; // 1ml ≈ 1g for most liquids
        } else {
          // For pieces/cups/servings, AI already calculated total nutrition for that quantity
          // We treat it as if it's that many grams for the modal
          gramEquivalent = quantity;
        }

        return {
          ...food,
          // Add confidence fields
          overallConfidence: food.confidence || 0.85,
          quantityConfidence: food.confidence || 0.85,
          cookingConfidence: food.cookingMethod ? 0.9 : 0.3,
          // Add required fields for confidence interface
          aiModel: (useGPT5 ? 'gpt-5-nano' : 'gpt-4o') as 'gpt-4o' | 'gpt-5-nano',
          gramEquivalent, // Single source of truth for quantity
          needsQuantityModal: food.needsQuantity || false,
          needsCookingModal: food.needsCookingMethod || false,
          suggestedUnits: food.suggestedQuantity?.map(q => ({
            unit: food.unit || 'grams',
            label: food.unit || 'grams',
            gramsPerUnit: parseFloat(q) || 1,
            confidence: 0.8,
            isRecommended: parseFloat(q) === 1,
            culturalContext: 'metric'
          })) || [],
          alternativeMethods: food.suggestedCookingMethods?.map(method => ({
            method,
            arabic_name: method,
            calorie_multiplier: method === 'Fried' ? 1.3 : 1.0,
            icon: method === 'Grilled' ? '🔥' : method === 'Fried' ? '🍳' : '🥘',
            confidence: 0.7
          })) || [],
          assumptions: food.nutritionNotes ? [food.nutritionNotes] : [],
          userModified: false,
          originalAIEstimate: {
            quantity: food.quantity || 1,
            unit: food.unit || 'grams',
            grams: gramEquivalent, // Use calculated gramEquivalent
            calories: food.calories || 0,
            cookingMethod: food.cookingMethod
          }
        };
      });
      
      // Update model stats for retry
      setModelStats({
        transcriptionModel,
        nutritionModel,
        transcriptionLatency: 0, // No transcription on retry
        nutritionLatency,
        totalCost: 0
      });
      
      if (enhancedFoods.length === 0) {
        if (retrySessionId) {
          await completeTrackingSession(retrySessionId, {
            final_foods_count: 0,
            user_needed_modal: false,
            confidence_accurate: false,
            performance_notes: ['Retry failed - no food items detected']
          });
        }
        
        Alert.alert(
          'No Food Detected',
          'We couldn\'t identify any food items in your description. Please try describing your meal again.',
          [{ text: 'OK', onPress: () => {
            setState('error');
            setError('No food items detected in the description');
          } }]
        );
        return false;
      }

      // Analyze retry results
      const needsModalItems = enhancedFoods.filter(food => food.needsQuantityModal || food.needsCookingModal);
      const avgConfidence = enhancedFoods.reduce((sum, food) => sum + food.overallConfidence, 0) / enhancedFoods.length;

      console.log(`✅ Enhanced retry completed: ${enhancedFoods.length} foods, ${needsModalItems.length} need clarification`);
      
      setParsedFoods(enhancedFoods);
      setState('completed');
      setProgress(100);
      
      // Complete retry session tracking
      if (retrySessionId) {
        await completeTrackingSession(retrySessionId, {
          transcription_latency_ms: 0, // No transcription on retry
          nutrition_latency_ms: nutritionLatency,
          final_foods_count: enhancedFoods.length,
          user_needed_modal: needsModalItems.length > 0,
          confidence_accurate: true,
          performance_notes: [
            'Retry successful',
            `${enhancedFoods.length} foods detected`,
            `${needsModalItems.length} items need clarification`
          ]
        });
      }
      
      return true;
      
    } catch (err) {
      console.error('❌ Enhanced retry processing failed:', err);
      
      if (retrySessionId) {
        await completeTrackingSession(retrySessionId, {
          final_foods_count: 0,
          user_needed_modal: false,
          confidence_accurate: false,
          performance_notes: ['Retry failed with error', err instanceof Error ? err.message : 'Unknown error']
        });
      }
      
      let errorMessage = 'There was an error processing your recording. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          errorMessage = 'Configuration error: Please check your API key setup.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message.includes('Invalid API key')) {
          errorMessage = 'API key is invalid. Please check your configuration.';
        } else {
          errorMessage = `Processing error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setState('error');
      setProgress(undefined);
      
      Alert.alert('Processing Error', errorMessage, [{ 
        text: 'OK', 
        onPress: () => setState('error')
      }]);
      
      return false;
    }
  }, [transcript]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    if (state === 'completed') {
      setParsedFoods([]);
      setState('idle');
      setProgress(undefined);
      setSessionId(undefined);
      setModelStats(undefined);
    }
  }, [state]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setParsedFoods([]);
    setError(null);
    setProgress(undefined);
    setSessionId(undefined);
    setModelStats(undefined);
  }, []);

  const data: VoiceProcessingData = {
    state,
    transcript,
    parsedFoods,
    error,
    progress,
    sessionId,
    modelStats,
  };

  const actions: VoiceProcessingActions = {
    processRecording,
    retryProcessing,
    clearTranscript,
    clearError,
    reset,
  };

  return {
    data,
    actions,
  };
};