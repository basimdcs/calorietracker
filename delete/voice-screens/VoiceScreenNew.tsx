import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout';
import { RecordingButton } from '../../components/voice/RecordingButton';
import { TranscriptDisplay } from '../../components/voice/TranscriptDisplay';
import { VoiceInstructions } from '../../components/voice/VoiceInstructions';
import { FoodReviewNew } from '../../components/ui/FoodReview/FoodReviewNew';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { openAIService } from '../../services/openai';
import { useFoodStore } from '../../stores/foodStore';
import { ParsedFoodItem } from '../../types';

// Voice processing states
type VoiceState = 'idle' | 'transcribing' | 'parsing' | 'reviewing';

const VoiceScreenNew: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  
  const { addFoodItem, logFood } = useFoodStore();
  const { state: recorderState, actions: recorderActions } = useAudioRecorder();

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    try {
      setTranscript('');
      setParsedFoods([]);
      setVoiceState('idle');
      await recorderActions.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorderActions]);

  // Handle recording stop and process audio
  const handleStopRecording = useCallback(async () => {
    try {
      const uri = await recorderActions.stopRecording();
      if (!uri) return;

      setVoiceState('transcribing');
      
      // Step 1: Transcribe audio
      const transcriptionResult = await openAIService.transcribeAudio(uri);
      setTranscript(transcriptionResult);
      
      if (!transcriptionResult.trim()) {
        Alert.alert(
          'No Speech Detected',
          'We couldn\'t detect any speech in your recording. Please try again.',
          [{ text: 'OK' }]
        );
        setVoiceState('idle');
        return;
      }

      setVoiceState('parsing');
      
      // Step 2: Parse food from transcript
      const foods = await openAIService.parseFoodFromText(transcriptionResult);
      
      if (foods.length === 0) {
        Alert.alert(
          'No Food Detected',
          'We couldn\'t identify any food items in your description. Please try describing your meal again.',
          [{ text: 'OK' }]
        );
        setVoiceState('idle');
        return;
      }

      setParsedFoods(foods);
      setVoiceState('reviewing');
      
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert(
        'Processing Error',
        'There was an error processing your recording. Please try again.',
        [{ text: 'OK' }]
      );
      setVoiceState('idle');
    }
  }, [recorderActions]);

  // Handle food review actions
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
      
      for (const food of parsedFoods) {
        if (food.name && food.calories > 0) {
          const now = new Date();
          
          // Parse the quantity and unit properly
          const actualQuantity = food.quantity || 1;
          const actualUnit = food.unit || 'serving';
          
          // Normalize nutrition values to per-100g basis for consistent storage
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
            quantityMultiplier = actualQuantity / 100;
            servingSize = 100;
            servingSizeUnit = 'g';
          } else {
            // For piece-based foods, use nutrition as-is and treat quantity as serving multiplier
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

          // Create food item
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
          
          // Add to store and log
          addFoodItem(foodItem);
          
          console.log('📊 Logging food with quantity multiplier:', quantityMultiplier);
          logFood(foodItem.id, quantityMultiplier, 'snacks');
        }
      }

      console.log('✅ All foods logged successfully');

      // Reset state
      setVoiceState('idle');
      setTranscript('');
      setParsedFoods([]);
      
      Alert.alert('Success', `${parsedFoods.length} food item${parsedFoods.length !== 1 ? 's' : ''} logged successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to log foods:', error);
      Alert.alert('Error', 'Failed to save food items. Please try again.');
    }
  }, [parsedFoods, addFoodItem, logFood]);

  const handleCancel = useCallback(() => {
    setVoiceState('idle');
    setTranscript('');
    setParsedFoods([]);
  }, []);

  const handleClearTranscript = useCallback(() => {
    setTranscript('');
    setParsedFoods([]);
    setVoiceState('idle');
  }, []);

  // Show food review if we have parsed foods
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


  // Main voice recording interface
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
            isProcessing={voiceState !== 'idle'}
            recordingTime={recorderState.recordingTime}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={voiceState === 'transcribing' || voiceState === 'parsing'}
          />

          {/* Processing Status */}
          {voiceState === 'transcribing' && (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>🎯 Converting speech to text...</Text>
            </View>
          )}

          {voiceState === 'parsing' && (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>🤖 Analyzing food items...</Text>
            </View>
          )}

          {/* Transcript Display */}
          <TranscriptDisplay
            transcript={transcript}
            isVisible={!!transcript && voiceState !== 'transcribing'}
            onClear={handleClearTranscript}
          />

          {/* Instructions */}
          <VoiceInstructions
            showExamples={!transcript}
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
  },
  statusText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceScreenNew;