import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout';
import { FoodReviewNew } from '../../components/ui/FoodReview/FoodReviewNew';
import { TranscriptDisplay } from '../../components/voice/TranscriptDisplay';
import { VoiceInstructions } from '../../components/voice/VoiceInstructions';
import { RecordingButton } from '../../components/voice/RecordingButton';
import { openAIService } from '../../services/openai';
import { useFoodStore } from '../../stores/foodStore';
import { ParsedFoodItem } from '../../types';

// Import expo-audio at component level (this is safe as we're not calling hooks)
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  setAudioModeAsync,
  RecordingPresets,
  AudioQuality,
  IOSOutputFormat,
} from 'expo-audio';

// Voice processing states
type VoiceState = 'ready' | 'recording' | 'processing' | 'transcribing' | 'parsing' | 'reviewing';

// Custom optimized recording preset for smaller files and cost savings
const OPTIMIZED_PRESET = {
  extension: '.m4a',
  sampleRate: 22050, // Lower sample rate
  numberOfChannels: 1, // Mono
  bitRate: 64000, // Lower bitrate
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4' as const,
    audioEncoder: 'aac' as const,
    sampleRate: 22050,
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM, // Medium quality for balance
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

const VoiceScreenProduction: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { addFoodItem, logFood } = useFoodStore();
  
  // Auto-stop timeout ref
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the correct expo-audio hooks at component level
  const audioRecorder = useAudioRecorder(OPTIMIZED_PRESET);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Initialize permissions and audio mode on component mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('🎤 Initializing audio...');
        
        // Request permissions
        const permissionResult = await AudioModule.requestRecordingPermissionsAsync();
        if (!permissionResult.granted) {
          setError('Microphone permission denied');
          Alert.alert('Permission Required', 'Microphone access is needed to record voice notes.');
          return;
        }

        // Configure audio mode
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        console.log('✅ Audio system initialized');
        
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize audio';
        setError(message);
        Alert.alert('Initialization Failed', message);
      }
    };

    initializeAudio();
  }, []);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording...');
      setError(null);
      
      // Prepare and start recording using the correct expo-audio v14 pattern
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      setVoiceState('recording');
      
      // Auto-stop after 20 seconds
      autoStopTimeoutRef.current = setTimeout(() => {
        void handleStopRecording();
      }, 20000);
      
      console.log('🎤 Recording started successfully');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setVoiceState('ready');
      Alert.alert('Recording Error', message);
    }
  }, [audioRecorder]);


  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      console.log('🛑 Stopping recording...');
      setVoiceState('processing');
      
      // Clear auto-stop timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Stop recording using expo-audio v14 API
      await audioRecorder.stop();
      
      // Get the recording URI
      const uri = audioRecorder.uri;
      
      if (!uri) {
        Alert.alert(
          'Recording Issue',
          'Recording completed but no audio file was generated.',
          [{ text: 'OK', onPress: () => setVoiceState('ready') }]
        );
        return;
      }

      // Process the recording
      try {
        setVoiceState('transcribing');
        console.log('🎯 Starting transcription for URI:', uri);
        
        const transcriptionResult = await openAIService.transcribeAudio(uri);
        setTranscript(transcriptionResult);
        
        if (!transcriptionResult.trim()) {
          Alert.alert(
            'No Speech Detected',
            'We couldn\'t detect any speech in your recording. Please try again.',
            [{ text: 'OK', onPress: () => setVoiceState('ready') }]
          );
          return;
        }

        setVoiceState('parsing');
        console.log('🤖 Starting food parsing for text:', transcriptionResult);
        
        const foods = await openAIService.parseFoodFromText(transcriptionResult);
        
        if (foods.length === 0) {
          Alert.alert(
            'No Food Detected',
            'We couldn\'t identify any food items in your description. Please try describing your meal again.',
            [{ text: 'OK', onPress: () => setVoiceState('ready') }]
          );
          return;
        }

        setParsedFoods(foods);
        setVoiceState('reviewing');
        
      } catch (error) {
        console.error('❌ Failed to process recording:', error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'There was an error processing your recording. Please try again.';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'Configuration error: Please check your API key setup.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error: Please check your internet connection and try again.';
          } else if (error.message.includes('No speech detected')) {
            errorMessage = 'No speech detected in the recording. Please try speaking more clearly.';
          } else if (error.message.includes('Rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (error.message.includes('Invalid API key')) {
            errorMessage = 'API key is invalid. Please check your configuration.';
          } else {
            errorMessage = `Processing error: ${error.message}`;
          }
        }
        
        Alert.alert('Processing Error', errorMessage, [{ text: 'OK', onPress: () => setVoiceState('ready') }]);
      }
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      setVoiceState('ready');
      Alert.alert('Recording Error', message);
    }
  }, [audioRecorder]);

  // Food review handlers
  const handleUpdateFood = useCallback((index: number, updatedFood: ParsedFoodItem) => {
    setParsedFoods(prev => {
      const newFoods = [...prev];
      newFoods[index] = updatedFood;
      return newFoods;
    });
  }, []);

  const handleRemoveFood = useCallback((index: number) => {
    setParsedFoods(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddFood = useCallback(() => {
    const newFood: ParsedFoodItem = {
      name: 'New Item',
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      confidence: 0.5,
      needsQuantity: true,
      quantity: 1,
      unit: 'pieces',
    };
    setParsedFoods(prev => [...prev, newFood]);
  }, []);

  const handleConfirmFoods = useCallback(async () => {
    try {
      console.log('🍽️ Starting to log foods:', parsedFoods);
      
      // Log foods with current date
      
      for (const food of parsedFoods) {
        if (food.name && food.calories > 0) {
          const now = new Date();
          
          // Parse the quantity and unit properly
          const actualQuantity = food.quantity || 1;
          const actualUnit = food.unit || 'serving';
          
          // Normalize nutrition values to per-100g basis for consistent storage
          // The ParsedFoodItem already contains the total nutrition for the specified quantity
          // We need to calculate per-100g values for proper serving size handling
          let nutritionPer100g;
          let servingSize = 100;
          let servingSizeUnit = 'g';
          let quantityMultiplier = 1;
          
          if (actualUnit === 'g' || actualUnit === 'grams') {
            // For gram-based foods, calculate per-100g nutrition
            nutritionPer100g = {
              calories: (food.calories / actualQuantity) * 100,
              protein: (food.protein / actualQuantity) * 100,
              carbs: (food.carbs / actualQuantity) * 100,
              fat: (food.fat / actualQuantity) * 100,
            };
            // The quantity multiplier should be actual grams / 100g
            quantityMultiplier = actualQuantity / 100;
            servingSize = 100;
            servingSizeUnit = 'g';
          } else {
            // For piece-based foods (cups, pieces, etc), use the provided nutrition as-is
            // and treat quantity as serving multiplier
            nutritionPer100g = {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
            };
            quantityMultiplier = actualQuantity;
            servingSize = 1;
            servingSizeUnit = actualUnit;
          }

          const foodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: food.name,
            nutrition: nutritionPer100g,
            servingSize: servingSize,
            servingSizeUnit: servingSizeUnit,
            isCustom: true,
            createdAt: now.toISOString(),
          };

          console.log('📝 Adding food item:', {
            ...foodItem,
            originalQuantity: actualQuantity,
            originalUnit: actualUnit,
            quantityMultiplier
          });
          
          addFoodItem(foodItem);
          
          console.log('📊 Logging food with quantity multiplier:', quantityMultiplier);
          logFood(foodItem.id, quantityMultiplier, 'snacks');
        }
      }

      console.log('✅ All foods logged successfully');

      // Reset state
      setVoiceState('ready');
      setTranscript('');
      setParsedFoods([]);
      
      Alert.alert('Success', `${parsedFoods.length} food item${parsedFoods.length !== 1 ? 's' : ''} logged successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to log foods:', error);
      Alert.alert('Error', 'Failed to save food items. Please try again.');
    }
  }, [parsedFoods, addFoodItem, logFood]);

  const handleCancel = useCallback(() => {
    // Clear auto-stop timeout if recording was in progress
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    // Reset all state
    setVoiceState('ready');
    setTranscript('');
    setParsedFoods([]);
  }, []);

  const handleClearTranscript = useCallback(() => {
    setTranscript('');
    if (voiceState === 'reviewing') {
      setParsedFoods([]);
      setVoiceState('ready');
    }
  }, [voiceState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
    };
  }, []);

  // Show food review screen
  if (voiceState === 'reviewing' && parsedFoods.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FoodReviewNew
          foods={parsedFoods}
          onUpdateFood={handleUpdateFood}
          onRemoveFood={handleRemoveFood}
          onAddFood={handleAddFood}
          onConfirm={handleConfirmFoods}
          onCancel={handleCancel}
          isLoading={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Voice Food Log 🎤"
        subtitle="Record your meals naturally"
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Recording Button */}
          <RecordingButton
            isRecording={recorderState.isRecording}
            isProcessing={voiceState !== 'ready' && !recorderState.isRecording}
            recordingTime={0}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={voiceState === 'transcribing' || voiceState === 'parsing' || voiceState === 'processing'}
          />

          {/* Processing Status */}
          {(voiceState === 'transcribing' || voiceState === 'parsing') && (
            <View style={styles.statusCard}>
              <MaterialIcons 
                name={voiceState === 'transcribing' ? 'hearing' : 'psychology'} 
                size={24} 
                color={colors.primary} 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>
                {voiceState === 'transcribing' && '🎯 Converting speech to text...'}
                {voiceState === 'parsing' && '🤖 Analyzing food items...'}
              </Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorCard}>
              <MaterialIcons name="error" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Transcript Display */}
          <TranscriptDisplay
            transcript={transcript}
            isVisible={!!transcript && voiceState !== 'transcribing'}
            onClear={handleClearTranscript}
          />

          {/* Voice Instructions */}
          <VoiceInstructions
            showExamples={!transcript && voiceState === 'ready'}
            compact={!!transcript}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statusCard: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  statusIcon: {
    color: colors.white,
  },
  statusText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
});

export default VoiceScreenProduction;