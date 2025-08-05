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
import { useAudioRecorderSafe } from '../../hooks/useAudioRecorderSafe';
import { openAIService } from '../../services/openai';
import { useFoodStore } from '../../stores/foodStore';
import { ParsedFoodItem } from '../../types';

// Voice processing states
type VoiceState = 'idle' | 'initializing' | 'ready' | 'recording' | 'processing' | 'transcribing' | 'parsing' | 'reviewing';

const VoiceScreenSafe: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  
  const { addFoodItem, logFood } = useFoodStore();
  const { state: recorderState, actions: recorderActions } = useAudioRecorderSafe();

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
    if (!recorderState.isInitialized) {
      await handleInitialize();
      return;
    }
    
    setVoiceState('recording');
    await recorderActions.startRecording();
  }, [recorderState.isInitialized, recorderActions, handleInitialize]);

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
      setVoiceState('ready');
      setTranscript('');
      setParsedFoods([]);
      
      Alert.alert('Success', 'Food items logged successfully!');
      
    } catch (error) {
      console.error('Failed to log foods:', error);
      Alert.alert('Error', 'Failed to save food items. Please try again.');
    }
  }, [parsedFoods, addFoodItem, logFood]);

  const handleCancel = useCallback(() => {
    setVoiceState('ready');
    setTranscript('');
    setParsedFoods([]);
  }, []);

  const getStatusText = () => {
    switch (voiceState) {
      case 'initializing': return 'Initializing audio recorder...';
      case 'ready': return 'Ready to record';
      case 'recording': return 'Recording your voice...';
      case 'processing': return 'Processing recording...';
      case 'transcribing': return 'Converting speech to text...';
      case 'parsing': return 'Analyzing food items...';
      case 'reviewing': return 'Review your meal';
      default: return 'Tap to initialize voice recording';
    }
  };

  const getStatusIcon = () => {
    switch (voiceState) {
      case 'initializing': return 'hourglass-empty';
      case 'ready': return 'mic';
      case 'recording': return 'stop';
      case 'processing': return 'sync';
      case 'transcribing': return 'hearing';
      case 'parsing': return 'psychology';
      case 'reviewing': return 'restaurant';
      default: return 'play-arrow';
    }
  };

  const isButtonDisabled = () => {
    return voiceState === 'initializing' || voiceState === 'processing' || recorderState.isProcessing;
  };

  const getButtonAction = () => {
    if (voiceState === 'idle') return handleInitialize;
    if (voiceState === 'ready' || voiceState === 'recording') {
      return recorderState.isRecording ? handleStopRecording : handleStartRecording;
    }
    return () => {};
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Voice Food Log 🎤"
        subtitle="Record your meals naturally"
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <MaterialIcons 
              name={getStatusIcon()} 
              size={32} 
              color={colors.primary} 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
            
            {recorderState.error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={16} color={colors.error} />
                <Text style={styles.errorText}>{recorderState.error}</Text>
              </View>
            )}
          </View>

          {/* Main Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              isButtonDisabled() && styles.actionButtonDisabled,
              recorderState.isRecording && styles.actionButtonRecording,
            ]}
            onPress={getButtonAction()}
            disabled={isButtonDisabled()}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={getStatusIcon()}
              size={48}
              color={isButtonDisabled() ? colors.gray400 : colors.white}
            />
          </TouchableOpacity>

          {/* Recording Info */}
          {recorderState.isRecording && (
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingText}>Recording...</Text>
              <Text style={styles.recordingTime}>{formatTime(recorderState.recordingTime)}</Text>
            </View>
          )}

          {/* Transcript Display */}
          <TranscriptDisplay
            transcript={transcript}
            isVisible={!!transcript && voiceState !== 'transcribing'}
            onClear={() => setTranscript('')}
          />

          {/* Voice Instructions */}
          <VoiceInstructions
            showExamples={!transcript && voiceState === 'ready'}
            compact={!!transcript || voiceState !== 'ready'}
          />

          {/* Debug Info */}
          {__DEV__ && (
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>State: {voiceState}</Text>
              <Text style={styles.debugText}>Initialized: {recorderState.isInitialized ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Has Permission: {recorderState.hasPermission ? 'Yes' : recorderState.hasPermission === false ? 'No' : 'Unknown'}</Text>
              <Text style={styles.debugText}>Recording: {recorderState.isRecording ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Processing: {recorderState.isProcessing ? 'Yes' : 'No'}</Text>
            </View>
          )}
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
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.red50,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  actionButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  actionButtonRecording: {
    backgroundColor: colors.error,
  },
  recordingInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  recordingText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  recordingTime: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  stepsList: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  debugCard: {
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});

export default VoiceScreenSafe;