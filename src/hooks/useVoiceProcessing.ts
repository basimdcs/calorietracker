import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { openAIService } from '../services/openai';
import { ParsedFoodItem } from '../types';

// Voice processing states
export type VoiceProcessingState = 'idle' | 'transcribing' | 'parsing' | 'completed' | 'error';

export interface VoiceProcessingData {
  state: VoiceProcessingState;
  transcript: string;
  parsedFoods: ParsedFoodItem[];
  error: string | null;
  progress?: number;
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
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);

  const processRecording = useCallback(async (audioUri: string, useGPT5?: boolean, useGPT4oTranscription?: boolean): Promise<boolean> => {
    try {
      setError(null);
      setState('transcribing');
      setProgress(0);
      setLastAudioUri(audioUri);
      
      console.log('🎯 Starting transcription for URI:', audioUri, 'Method:', useGPT4oTranscription ? 'GPT-4o' : 'Whisper');
      
      // Transcribe audio with method selection
      const transcriptionResult = await openAIService.transcribeAudio(audioUri, useGPT4oTranscription);
      setTranscript(transcriptionResult);
      setProgress(50);
      
      if (!transcriptionResult.trim()) {
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
      console.log('🤖 Starting food parsing for text:', transcriptionResult);
      
      // Parse food items with method selection
      const foods = await openAIService.parseFoodFromText(transcriptionResult, useGPT5);
      
      if (foods.length === 0) {
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

      setParsedFoods(foods);
      setState('completed');
      setProgress(100);
      
      console.log('✅ Voice processing completed successfully');
      return true;
      
    } catch (err) {
      console.error('❌ Failed to process recording:', err);
      
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

    try {
      setError(null);
      setState('parsing');
      setProgress(75);
      
      console.log('🔄 Retrying food parsing for existing transcript:', transcript);
      
      // Parse food items using existing transcript with method selection
      const foods = await openAIService.parseFoodFromText(transcript, useGPT5);
      
      if (foods.length === 0) {
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

      setParsedFoods(foods);
      setState('completed');
      setProgress(100);
      
      console.log('✅ Retry processing completed successfully');
      return true;
      
    } catch (err) {
      console.error('❌ Failed to retry processing:', err);
      
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
  }, []);

  const data: VoiceProcessingData = {
    state,
    transcript,
    parsedFoods,
    error,
    progress,
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