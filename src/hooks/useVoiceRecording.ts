import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';

// Voice processing constants
const VOICE_CONSTANTS = {
  AUTO_STOP_TIMEOUT: 20000, // 20 seconds
  MAX_RECORDING_DURATION: 300, // 5 minutes in seconds
  RETRY_ATTEMPTS: 3,
  PROCESSING_TIMEOUT: 60000, // 1 minute
  DEBOUNCE_DELAY: 500, // Prevent rapid button presses
} as const;

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

export interface VoiceRecordingState {
  isRecording: boolean;
  recordingTime: number;
  remainingTime: number;
  isInitialized: boolean;
  error: string | null;
}

export interface VoiceRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  clearError: () => void;
}

export interface UseVoiceRecordingResult {
  state: VoiceRecordingState;
  actions: VoiceRecordingActions;
}

export const useVoiceRecording = (): UseVoiceRecordingResult => {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [remainingTime, setRemainingTime] = useState(VOICE_CONSTANTS.AUTO_STOP_TIMEOUT / 1000);
  
  // Auto-stop timeout ref
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Countdown interval ref
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Current countdown value ref
  const countdownRef = useRef<number>(VOICE_CONSTANTS.AUTO_STOP_TIMEOUT / 1000);
  
  // Race condition protection
  const processingRef = useRef(false);

  // Use the correct expo-audio hooks at component level
  const audioRecorder = useAudioRecorder(OPTIMIZED_PRESET);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Initialize permissions and audio mode on hook mount
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

        setIsInitialized(true);
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
  const startRecording = useCallback(async () => {
    // Prevent race conditions
    if (processingRef.current || recorderState.isRecording) {
      console.log('⚠️ Recording already in progress, ignoring request');
      return;
    }
    
    console.log('🎯 startRecording called');
    processingRef.current = true;
    
    try {
      console.log('🎤 Starting recording...');
      setError(null);
      
      // Clear any existing intervals first
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Reset countdown state
      const maxTime = VOICE_CONSTANTS.AUTO_STOP_TIMEOUT / 1000;
      console.log('🔧 Setting initial countdown to:', maxTime);
      countdownRef.current = maxTime;
      setRemainingTime(maxTime);
      console.log('🔧 countdownRef.current is now:', countdownRef.current);
      
      // Prepare and start recording using the correct expo-audio v14 pattern
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      // Start countdown timer AFTER recording starts with a small delay to ensure recording is active
      setTimeout(() => {
        console.log('🚀 Starting countdown timer from:', countdownRef.current);
        countdownIntervalRef.current = setInterval(() => {
          console.log('⏰ Interval tick! countdownRef.current:', countdownRef.current);
          
          if (countdownRef.current <= 0) {
            console.log('⏰ Countdown finished, clearing interval');
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return;
          }
          
          countdownRef.current = countdownRef.current - 1;
          console.log('⏰ Decremented countdown to:', countdownRef.current);
          
          setRemainingTime(countdownRef.current);
          console.log('⏰ Set remaining time state to:', countdownRef.current);
          
        }, 1000);
        
        console.log('⏰ Countdown interval started with ID:', countdownIntervalRef.current);
      }, 100);
      
      // Auto-stop after configured timeout
      autoStopTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stop timeout reached');
        void stopRecording();
      }, VOICE_CONSTANTS.AUTO_STOP_TIMEOUT);
      
      console.log('🎤 Recording started successfully');
      processingRef.current = false; // Allow stopping
      
    } catch (err) {
      processingRef.current = false;
      console.error('Failed to start recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      Alert.alert('Recording Error', message);
    }
  }, [audioRecorder, recorderState.isRecording]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Prevent race conditions - but allow if we're already processing from auto-stop
    if (processingRef.current && !recorderState.isRecording) {
      console.log('⚠️ Processing already in progress, ignoring request');
      return null;
    }
    
    try {
      console.log('🛑 Stopping recording...');
      processingRef.current = true;
      
      // Clear auto-stop timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Stop recording using expo-audio v14 API
      await audioRecorder.stop();
      
      // Get the recording URI
      const uri = audioRecorder.uri;
      
      if (!uri) {
        setError('Recording completed but no audio file was generated');
        return null;
      }

      console.log('✅ Recording stopped successfully, URI:', uri);
      return uri;
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      Alert.alert('Recording Error', message);
      return null;
    } finally {
      processingRef.current = false;
    }
  }, [audioRecorder, recorderState.isRecording]);

  const cancelRecording = useCallback(() => {
    // Clear auto-stop timeout if recording was in progress
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Reset processing flag and error
    setError(null);
    processingRef.current = false;
    
    // Reset countdown state
    const maxTime = VOICE_CONSTANTS.AUTO_STOP_TIMEOUT / 1000;
    countdownRef.current = maxTime;
    setRemainingTime(maxTime);
    
    console.log('Recording cancelled');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup timeout and audio recorder on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Cleanup audio recorder if still recording
      const cleanup = async () => {
        try {
          if (recorderState.isRecording) {
            console.log('🧹 Cleaning up audio recorder on unmount');
            await audioRecorder.stop();
          }
        } catch (error) {
          console.warn('Failed to cleanup audio recorder:', error);
        }
      };
      
      void cleanup();
    };
  }, [audioRecorder, recorderState.isRecording]);

  const state: VoiceRecordingState = {
    isRecording: recorderState.isRecording,
    recordingTime: Math.floor((recorderState.durationMillis || 0) / 1000),
    remainingTime,
    isInitialized,
    error,
  };

  const actions: VoiceRecordingActions = {
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  };

  return {
    state,
    actions,
  };
};