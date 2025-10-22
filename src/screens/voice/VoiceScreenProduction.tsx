import React, { useState, useCallback, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout';
import { FoodReviewNew } from '../../components/ui/FoodReview/FoodReviewNew';
import { TranscriptDisplay } from '../../components/voice/TranscriptDisplay';
import { VoiceInstructions } from '../../components/voice/VoiceInstructions';
import { RecordingButton } from '../../components/voice/RecordingButton';
import { ProcessingStatus } from '../../components/voice/ProcessingStatus';
import { UsageProgressBar } from '../../components/ui/UsageProgressBar';
import { useFoodStore } from '../../stores/foodStore';
import { useUserStore } from '../../stores/userStore';
import { ParsedFoodItem } from '../../types';
import { ParsedFoodItemWithConfidence } from '../../types/aiTypes';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useVoiceProcessing } from '../../hooks/useVoiceProcessing';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';
import { usePaywall } from '../../hooks/usePaywall';

// Voice processing states for UI
type VoiceState = 'ready' | 'recording' | 'processing' | 'reviewing';

const VoiceScreenProduction: React.FC = () => {
  const navigation = useNavigation();
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItemWithConfidence[]>([]);

  const { addFoodItem, logFood, updateCurrentDate } = useFoodStore();
  const { profile } = useUserStore();
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCatContext();
  const { presentPaywallIfNeededWithAlert } = usePaywall();
  
  // Custom hooks for voice functionality
  const voiceRecording = useVoiceRecording();
  const voiceProcessing = useVoiceProcessing();

  // Derive current error from hooks
  const currentError = voiceRecording.state.error || voiceProcessing.data.error;

  // Get usage stats from RevenueCat (single source of truth)
  const getCurrentUsageStats = () => {
    return {
      recordingsUsed: revenueCatState.usageInfo.recordingsUsed,
      recordingsRemaining: revenueCatState.usageInfo.recordingsRemaining,
      monthlyLimit: revenueCatState.usageInfo.recordingsLimit,
      resetDate: revenueCatState.usageInfo.resetDate.toISOString(),
      usagePercentage: revenueCatState.usageInfo.recordingsLimit 
        ? Math.min(100, (revenueCatState.usageInfo.recordingsUsed / revenueCatState.usageInfo.recordingsLimit) * 100) 
        : 0,
    };
  };

  // Start recording
  const handleStartRecording = useCallback(async () => {
    const usageStats = getCurrentUsageStats();
    
    if (usageStats.recordingsRemaining !== null && usageStats.recordingsRemaining <= 0) {
      const currentTier = revenueCatState.subscriptionStatus.tier;
      
      if (currentTier === 'FREE') {
        Alert.alert(
          'Recording Limit Reached',
          `You've reached your monthly limit of ${usageStats.monthlyLimit} recordings. Upgrade to PRO for 300 recordings per month!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Pro', onPress: async () => {
              await presentPaywallIfNeededWithAlert({
                requiredEntitlement: 'pro',
              });
            }}
          ]
        );
      } else {
        Alert.alert(
          'Recording Limit Reached',
          `You've reached your monthly limit of ${usageStats.monthlyLimit} recordings. Your limit will reset next month.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
      return;
    }
    
    await voiceRecording.actions.startRecording();
    if (!voiceRecording.state.error) {
      setVoiceState('recording');
      voiceProcessing.actions.clearError();
    }
  }, [voiceRecording.actions, voiceRecording.state.error, voiceProcessing.actions, getCurrentUsageStats, presentPaywallIfNeededWithAlert]);


  // Stop recording
  const handleStopRecording = useCallback(async () => {
    const audioUri = await voiceRecording.actions.stopRecording();
    
    if (audioUri) {
      setVoiceState('processing');
      const success = await voiceProcessing.actions.processRecording(audioUri);
      
      if (success) {
        console.log('🎉 Processing successful, parsed foods:', voiceProcessing.data.parsedFoods);
        // Processing completed successfully - state will be handled by useEffect
      } else {
        setVoiceState('ready');
      }
    } else {
      setVoiceState('ready');
      if (!voiceRecording.state.error) {
        Alert.alert(
          'Recording Issue',
          'Recording completed but no audio file was generated.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [voiceRecording.actions, voiceProcessing.actions, voiceProcessing.data.parsedFoods, voiceRecording.state.error]);

  // Handle voice processing completion
  useEffect(() => {
    if (voiceProcessing.data.state === 'completed' && voiceProcessing.data.parsedFoods.length > 0) {
      console.log('📋 Setting parsed foods for review:', voiceProcessing.data.parsedFoods);
      setParsedFoods(voiceProcessing.data.parsedFoods);
      setVoiceState('reviewing');
    }
  }, [voiceProcessing.data.state, voiceProcessing.data.parsedFoods]);

  // Food review handlers
  const handleUpdateFood = useCallback((index: number, updatedFood: ParsedFoodItemWithConfidence) => {
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
      
      // Update current date to ensure we're logging to the right day
      updateCurrentDate();
      
      // Log foods with current date
      
      for (const food of parsedFoods) {
        if (food.name && food.calories > 0) {
          const now = new Date();

          // Use gramEquivalent (updated by FoodDetailsModal) instead of quantity/unit
          // The modal already recalculated calories/protein/carbs/fat based on the grams entered
          const gramsEntered = food.gramEquivalent || 100;

          // Calculate per-100g nutrition from the UPDATED nutrition values
          const nutritionPer100g = {
            calories: (food.calories / gramsEntered) * 100,
            protein: (food.protein / gramsEntered) * 100,
            carbs: (food.carbs / gramsEntered) * 100,
            fat: (food.fat / gramsEntered) * 100,
          };

          const foodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: food.name,
            nutrition: nutritionPer100g,
            servingSize: 100,
            servingSizeUnit: 'g',
            isCustom: true,
            createdAt: now.toISOString(),
          };

          // Calculate quantity multiplier based on grams entered
          const quantityMultiplier = gramsEntered / 100;

          console.log('📝 Adding food item:', {
            ...foodItem,
            gramsEntered,
            quantityMultiplier,
            totalCalories: food.calories,
            totalProtein: food.protein,
          });

          // Add food item to the store
          addFoodItem(foodItem);

          // Log the food consumption
          console.log('📊 Logging food with quantity multiplier:', quantityMultiplier);
          logFood(foodItem.id, quantityMultiplier, 'snacks');
        }
      }

      console.log('✅ All foods logged successfully');

      // Update RevenueCat usage count (single source of truth)
      revenueCatActions.updateUsageCount(1);
      console.log('📊 Recording usage incremented after successful food logging');

      // Reset state
      setVoiceState('ready');
      voiceProcessing.actions.reset();
      setParsedFoods([]);

      // Navigate to home screen after successful logging
      Alert.alert(
        'Success',
        `${parsedFoods.length} food item${parsedFoods.length !== 1 ? 's' : ''} logged successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never)
          }
        ]
      );

    } catch (error) {
      console.error('❌ Failed to log foods:', error);
      Alert.alert('Error', 'Failed to save food items. Please try again.');
    }
  }, [parsedFoods, addFoodItem, logFood, voiceProcessing.actions, updateCurrentDate, revenueCatActions, navigation]);

  const handleCancel = useCallback(() => {
    // Cancel recording if in progress
    voiceRecording.actions.cancelRecording();
    
    // Reset processing state
    voiceProcessing.actions.reset();
    
    // Reset UI state
    setVoiceState('ready');
    setParsedFoods([]);
  }, [voiceRecording.actions, voiceProcessing.actions]);

  const handleClearTranscript = useCallback(() => {
    voiceProcessing.actions.clearTranscript();
    if (voiceState === 'reviewing') {
      setParsedFoods([]);
      setVoiceState('ready');
    }
  }, [voiceState, voiceProcessing.actions]);

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
      
      {/* Usage Progress Bar */}
      <View style={styles.usageContainer}>
        <UsageProgressBar usageStats={getCurrentUsageStats()} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Recording Button */}
          <RecordingButton
            isRecording={voiceRecording.state.isRecording}
            isProcessing={voiceState === 'processing' || voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing'}
            recordingTime={voiceRecording.state.recordingTime}
            remainingTime={voiceRecording.state.remainingTime}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={!voiceRecording.state.isInitialized || voiceState === 'processing' || voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing'}
          />

          {/* Processing Status */}
          {(voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing') && (
            <ProcessingStatus
              state={voiceProcessing.data.state}
              progress={voiceProcessing.data.progress || 0}
              transcriptionMethod="whisper"
              parsingMethod="gpt4o"
            />
          )}

          {/* Error Display */}
          {currentError && (
            <View style={styles.errorCard}>
              <View style={styles.errorContent}>
                <MaterialIcons name="error" size={20} color={colors.error} />
                <Text style={styles.errorText}>{currentError}</Text>
              </View>
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    voiceRecording.actions.clearError();
                    voiceProcessing.actions.clearError();
                  }}
                >
                  <Text style={styles.retryButtonText}>Dismiss</Text>
                </TouchableOpacity>
                {(voiceProcessing.data.state === 'error' && voiceProcessing.data.transcript) && (
                  <TouchableOpacity
                    style={[styles.retryButton, styles.retryButtonPrimary]}
                    onPress={async () => {
                      // Retry processing with existing transcript
                      const success = await voiceProcessing.actions.retryProcessing();
                      if (success) {
                        // The useEffect will handle state transition to reviewing
                        console.log('🔄 Retry successful, waiting for state update');
                      }
                    }}
                  >
                    <Text style={[styles.retryButtonText, styles.retryButtonTextPrimary]}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Transcript Display */}
          <TranscriptDisplay
            transcript={voiceProcessing.data.transcript}
            isVisible={!!voiceProcessing.data.transcript && voiceProcessing.data.state !== 'transcribing'}
            onClear={handleClearTranscript}
          />

          {/* Voice Instructions */}
          <VoiceInstructions
            showExamples={!voiceProcessing.data.transcript && voiceState === 'ready'}
            compact={!!voiceProcessing.data.transcript}
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
  usageContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // Removed old status card styles - now using ProcessingStatus component
  // Removed old progress bar styles - now using AnimatedProgressBar component
  errorCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  retryButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  retryButtonTextPrimary: {
    color: colors.white,
  },
});

export default VoiceScreenProduction;