import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  useAudioRecorder, 
  useAudioRecorderState, 
  requestRecordingPermissionsAsync,
  setAudioModeAsync 
} from 'expo-audio';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { FoodReview } from '../../components/ui/FoodReview';
import { openAIService } from '../../services/openai';
import { useFoodStore } from '../../stores/foodStore';
import { ParsedFoodItem } from '../../types';

const VoiceScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processedFoods, setProcessedFoods] = useState<ParsedFoodItem[]>([]);
  const [showFoodReview, setShowFoodReview] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  const { addFoodItem, logFood } = useFoodStore();

  // Use expo-audio hooks
  const recorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      outputFormat: 'aac ',
      audioQuality: 96, // HIGH
    },
  });

  const recorderState = useAudioRecorderState(recorder, 1000);

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [recorderState.isRecording, pulseAnimation]);

  const startRecording = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permission to record voice.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setTranscript('');
      setProcessedFoods([]);
      setShowFoodReview(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      
      if (uri) {
        setIsProcessing(true);
        await processRecording(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const processRecording = async (uri: string) => {
    try {
      // Transcribe audio
      const transcription = await openAIService.transcribeAudio(uri);
      setTranscript(transcription);

      // Parse food from transcription
      const foods = await openAIService.parseFoodFromText(transcription);
      setProcessedFoods(foods);
      setShowFoodReview(true);
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateFood = (index: number, updatedFood: ParsedFoodItem) => {
    const newFoods = [...processedFoods];
    newFoods[index] = updatedFood;
    setProcessedFoods(newFoods);
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = processedFoods.filter((_, i) => i !== index);
    setProcessedFoods(newFoods);
  };

  const handleAddFood = () => {
    // Add a new empty food item
    const newFood: ParsedFoodItem = {
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0.5,
      needsQuantity: true,
    };
    setProcessedFoods([...processedFoods, newFood]);
  };

  const handleConfirmFoods = async () => {
    try {
      for (const food of processedFoods) {
        if (food.name && food.calories > 0) {
          // Create food item
          const foodItem = {
            id: Date.now().toString(),
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

          // Add to food store
          addFoodItem(foodItem);

          // Log the food
          const quantity = food.quantity || 1;
          logFood(foodItem.id, quantity, 'snacks');
        }
      }

      // Reset and go back to recording view
      setProcessedFoods([]);
      setTranscript('');
      setShowFoodReview(false);
      
      Alert.alert('Success', 'Food items logged successfully!');
    } catch (error) {
      console.error('Failed to log foods:', error);
      Alert.alert('Error', 'Failed to log foods. Please try again.');
    }
  };

  const handleCancel = () => {
    setProcessedFoods([]);
    setTranscript('');
    setShowFoodReview(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If showing food review, render the FoodReview component
  if (showFoodReview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FoodReview
            foods={processedFoods}
            onUpdateFood={handleUpdateFood}
            onRemoveFood={handleRemoveFood}
            onAddFood={handleAddFood}
            onConfirm={handleConfirmFoods}
            onCancel={handleCancel}
            isLoading={isProcessing}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                🎤 Voice Food Log
              </Text>
              <Text style={styles.headerSubtitle}>
                Record your meals naturally
              </Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Recording Section */}
            <Card style={styles.recordingCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="mic" size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Voice Recording</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.recordingArea}>
                  <Animated.View
                    style={[
                      styles.recordButtonContainer,
                      { transform: [{ scale: pulseAnimation }] }
                    ]}
                  >
                                      <TouchableOpacity
                    style={[
                      styles.recordButton,
                      recorderState.isRecording && styles.recordButtonActive,
                    ]}
                    onPress={recorderState.isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={recorderState.isRecording ? "stop" : "mic"}
                      size={48}
                      color={recorderState.isRecording ? colors.error : colors.white}
                    />
                  </TouchableOpacity>
                </Animated.View>
                
                {recorderState.isRecording && (
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingText}>Recording...</Text>
                    <Text style={styles.recordingTime}>{formatTime(recorderState.durationMillis / 1000)}</Text>
                  </View>
                )}

                  {isProcessing && (
                    <View style={styles.processingInfo}>
                      <MaterialIcons name="hourglass-empty" size={24} color={colors.warning} />
                      <Text style={styles.processingText}>Processing voice...</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>

            {/* Transcript Section */}
            {transcript && (
              <Card style={styles.transcriptCard}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="volume-up" size={24} color={colors.secondary} />
                  <Text style={styles.cardTitle}>Transcript</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.transcriptText}>
                    {transcript}
                  </Text>
                </View>
              </Card>
            )}

            {/* Instructions */}
            <Card style={styles.instructionsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
                <Text style={styles.cardTitle}>How to Use</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>1</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Tap the microphone button to start recording
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>2</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Describe your meal in natural language
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>3</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Review and confirm the detected foods
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  recordingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transcriptCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  cardContent: {
    padding: spacing.lg,
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordingInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  recordingText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  recordingTime: {
    fontSize: fonts.lg,
    color: colors.primary,
    fontWeight: 'bold',
  },
  processingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  processingText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  transcriptText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    lineHeight: 24,
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
});

export default VoiceScreen; 