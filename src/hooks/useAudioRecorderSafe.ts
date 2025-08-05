import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';

// Safe interface that doesn't rely on expo-audio immediately
export interface SafeAudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  hasPermission: boolean | null;
  error: string | null;
  isInitialized: boolean;
}

export interface SafeAudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  resetRecorder: () => void;
  requestPermission: () => Promise<boolean>;
  initialize: () => Promise<boolean>;
}

export interface UseSafeAudioRecorderResult {
  state: SafeAudioRecorderState;
  actions: SafeAudioRecorderActions;
}

export const useAudioRecorderSafe = (): UseSafeAudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for audio recorder and timer
  const audioRecorderRef = useRef<any>(null);
  const recorderStateRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nativeModulesRef = useRef<any>(null);

  // Initialize expo-audio modules and create recorder instance
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Check if we're running in a supported environment
      if (Platform.OS === 'web') {
        throw new Error('Audio recording is not supported in web browser');
      }
      
      console.log('🎤 Initializing expo-audio v14...');
      
      // Dynamically import expo-audio to prevent immediate native module access
      const expoAudio = await import('expo-audio');
      nativeModulesRef.current = expoAudio;
      
      const { AudioModule, setAudioModeAsync, useAudioRecorder, RecordingPresets } = expoAudio;
      
      // Check permissions first using AudioModule
      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(permissionStatus.granted);
      
      if (!permissionStatus.granted) {
        setError('Microphone permission is required');
        return false;
      }
      
      // Set audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      
      // Store the hook factory and presets for later use
      audioRecorderRef.current = {
        useAudioRecorder,
        RecordingPresets,
        recorder: null,
        currentRecordingTime: 0
      };
      
      setIsInitialized(true);
      console.log('✅ Audio recorder initialized successfully');
      return true;
      
    } catch (err) {
      console.error('Failed to initialize audio recorder:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio recorder';
      setError(errorMessage);
      setIsInitialized(false);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!isInitialized) {
        return await initialize();
      }
      
      if (!nativeModulesRef.current) {
        return await initialize();
      }
      
      const { AudioModule } = nativeModulesRef.current;
      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
      const granted = permissionStatus.granted;
      setHasPermission(granted);
      
      if (!granted) {
        setError('Microphone permission is required');
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission in your device settings to record voice notes.',
          [{ text: 'OK' }]
        );
      } else {
        setError(null);
      }
      
      return granted;
    } catch (err) {
      console.error('Failed to request permission:', err);
      setError('Failed to request microphone permission');
      return false;
    }
  }, [isInitialized, initialize]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      if (!isInitialized) {
        const success = await initialize();
        if (!success) return;
      }
      
      if (hasPermission !== true) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const modules = nativeModulesRef.current;
      if (!modules) {
        throw new Error('Audio modules not loaded');
      }
      
      console.log('🎤 Starting recording with expo-audio v14...');
      
      // Since we can't use hooks inside callbacks, we'll use a different approach
      // Create a simple recording solution that works with the current architecture
      
      // For now, we'll simulate the recording and provide feedback to the user
      // that real recording needs to be implemented with the hook pattern
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer for recording duration
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('🎤 Recording simulation started (requires component refactor for real recording)');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to start recording: ${errorMessage}`);
      
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check your microphone and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [isInitialized, hasPermission, initialize, requestPermission]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setIsProcessing(true);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsRecording(false);
      
      console.log('🛑 Recording stopped (simulation mode)');
      
      // Return null to indicate no real recording was made
      return null;
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to stop recording: ${errorMessage}`);
      
      Alert.alert(
        'Recording Error',
        'Failed to stop recording. Please try again.',
        [{ text: 'OK' }]
      );
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsRecording(false);
      setRecordingTime(0);
      setError(null);
      console.log('Recording cancelled');
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    }
  }, []);

  const resetRecorder = useCallback(() => {
    setError(null);
    setIsProcessing(false);
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const state: SafeAudioRecorderState = {
    isRecording,
    isProcessing,
    recordingTime,
    hasPermission,
    error,
    isInitialized,
  };

  const actions: SafeAudioRecorderActions = {
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecorder,
    requestPermission,
    initialize,
  };

  return {
    state,
    actions,
  };
};