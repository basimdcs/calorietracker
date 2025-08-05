import React, { useState, useCallback } from 'react';
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
import { useAudioRecorderSafe } from '../../hooks/useAudioRecorderSafe';
import { openAIService } from '../../services/openai';
import { useFoodStore } from '../../stores/foodStore';
import { useUserStore } from '../../stores/userStore';
import { ParsedFoodItem } from '../../types';

// Voice processing states
type VoiceState = 'idle' | 'initializing' | 'ready' | 'recording' | 'processing' | 'transcribing' | 'parsing' | 'reviewing';

const VoiceScreen: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  
  const { addFoodItem, logFood } = useFoodStore();
  const { state: recorderState, actions: recorderActions } = useAudioRecorderSafe();
  const { canRecord, incrementRecordingUsage, getUsageStats, profile } = useUserStore();

  // Initialize audio recorder
  const handleInitialize = useCallback(async () => {
    setVoiceState('initializing');
    const success = await recorderActions.initialize();
    if (success) {
      setVoiceState('ready');
    } else {
      setVoiceState('idle');
      Alert.alert(
        'Initialization Failed',
        recorderState.error || 'Failed to initialize audio recorder. Please check your device permissions.',
        [{ text: 'OK' }]
      );
    }
  }, [recorderActions, recorderState.error]);

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    // Check if user can record based on subscription limits
    if (!canRecord()) {
      const usageStats = getUsageStats();
      const currentTier = profile?.subscriptionTier || 'FREE';
      
      Alert.alert(
        'Recording Limit Reached',
        `You've reached your monthly recording limit${usageStats?.monthlyLimit ? ` of ${usageStats.monthlyLimit} recordings` : ''}. ` +
        `${currentTier === 'FREE' ? 'Upgrade to Pro for 300 recordings per month or Elite for unlimited recordings.' : 'Your usage will reset next month.'}`,
        [
          { text: 'OK', style: 'cancel' },
          ...(currentTier === 'FREE' ? [{
            text: 'Upgrade',
            onPress: () => {
              // Navigate to settings or subscription screen
              Alert.alert('Upgrade', 'Please go to Settings to upgrade your subscription.');
            }
          }] : [])
        ]
      );
      return;
    }

    if (!recorderState.isInitialized) {
      await handleInitialize();
      return;
    }
    
    setVoiceState('recording');
    await recorderActions.startRecording();
  }, [recorderState.isInitialized, recorderActions, handleInitialize, canRecord, getUsageStats, profile]);

  // Handle recording stop and process audio
  const handleStopRecording = useCallback(async () => {
    setVoiceState('processing');
    const uri = await recorderActions.stopRecording();
    
    if (!uri) {
      Alert.alert(
        'Recording Issue',
        'Recording completed but no audio file was generated. This may be due to simulator limitations.',
        [{ text: 'OK', onPress: () => setVoiceState('ready') }]
      );
      return;
    }

    try {
      setVoiceState('transcribing');
      console.log('🎯 Starting transcription for URI:', uri);
      
      // Step 1: Transcribe audio
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

      // Increment usage counter after successful transcription
      const recordingAllowed = incrementRecordingUsage();
      if (!recordingAllowed) {
        console.warn('Recording usage increment failed - this should not happen if canRecord() passed');
      }

      setVoiceState('parsing');
      console.log('🤖 Starting food parsing for text:', transcriptionResult);
      
      // Step 2: Parse food from transcript
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
      console.error('Failed to process recording:', error);
      Alert.alert(
        'Processing Error',
        'There was an error processing your recording. Please try again.',
        [{ text: 'OK', onPress: () => setVoiceState('ready') }]
      );
    }
  }, [recorderActions, incrementRecordingUsage]);

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
      for (const food of parsedFoods) {
        if (food.name && food.calories > 0) {
          // Create food item
          const foodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: food.name,
            nutrition: {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
            },
            servingSize: 100,
            servingSizeUnit: 'g',
            isCustom: true,
            createdAt: new Date(),
          };

          // Add to store and log
          addFoodItem(foodItem);
          logFood(foodItem.id, food.quantity || 1, 'snacks');
        }
      }

      // Reset state
      setVoiceState('idle');
      setTranscript('');
      setParsedFoods([]);
      
      Alert.alert('Success', 'Food items logged successfully!');
      
    } catch (error) {
      console.error('Failed to log foods:', error);
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
    if (voiceState === 'reviewing') {
      setParsedFoods([]);
      setVoiceState('ready');
    }
  }, [voiceState]);

  // Show food review screen if we have parsed foods
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
            isProcessing={voiceState !== 'idle' && voiceState !== 'ready'}
            recordingTime={recorderState.recordingTime}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={voiceState === 'transcribing' || voiceState === 'parsing' || voiceState === 'processing'}
          />

          {/* Usage Stats */}
          {profile && (
            <View style={styles.usageCard}>
              <Text style={styles.usageTitle}>
                {profile.subscriptionTier} Plan
              </Text>
              <Text style={styles.usageText}>
                {(() => {
                  const stats = getUsageStats();
                  if (!stats) return 'Loading usage...';
                  
                  if (stats.monthlyLimit === null) {
                    return `${stats.recordingsUsed} recordings used (Unlimited)`;
                  }
                  
                  return `${stats.recordingsUsed} / ${stats.monthlyLimit} recordings used`;
                })()}
              </Text>
              {(() => {
                const stats = getUsageStats();
                if (stats && stats.monthlyLimit !== null) {
                  const percentage = Math.min(100, (stats.recordingsUsed / stats.monthlyLimit) * 100);
                  return (
                    <View style={styles.usageProgressContainer}>
                      <View style={styles.usageProgressBar}>
                        <View 
                          style={[
                            styles.usageProgressFill, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: percentage > 90 ? colors.error : colors.primary
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.usageProgressText}>
                        {stats.recordingsRemaining} remaining
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>
          )}

          {/* Processing Status */}
          {(voiceState === 'initializing' || voiceState === 'transcribing' || voiceState === 'parsing') && (
            <View style={styles.statusCard}>
              <MaterialIcons 
                name={
                  voiceState === 'initializing' ? 'settings' :
                  voiceState === 'transcribing' ? 'hearing' : 'psychology'
                } 
                size={24} 
                color={colors.primary} 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>
                {voiceState === 'initializing' && '⚙️ Initializing audio recorder...'}
                {voiceState === 'transcribing' && '🎯 Converting speech to text...'}
                {voiceState === 'parsing' && '🤖 Analyzing food items...'}
              </Text>
            </View>
          )}

          {/* Initialization Prompt */}
          {voiceState === 'idle' && (
            <TouchableOpacity style={styles.initButton} onPress={handleInitialize}>
              <MaterialIcons name="play-arrow" size={24} color={colors.primary} />
              <Text style={styles.initButtonText}>Initialize Voice Recording</Text>
              <Text style={styles.initButtonSubtext}>Tap to set up microphone</Text>
            </TouchableOpacity>
          )}

          {/* Error Display */}
          {recorderState.error && (
            <View style={styles.errorCard}>
              <MaterialIcons name="error" size={20} color={colors.error} />
              <Text style={styles.errorText}>{recorderState.error}</Text>
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
            showExamples={!transcript && (voiceState === 'ready' || voiceState === 'idle')}
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
  initButton: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  initButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  initButtonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  usageCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  usageText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  usageProgressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  usageProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  usageProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default VoiceScreen;