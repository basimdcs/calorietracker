import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
  useAudioRecorder as useExpoRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

export interface AudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  hasPermission: boolean | null;
  error: string | null;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  resetRecorder: () => void;
  requestPermission: () => Promise<boolean>;
}

export interface UseAudioRecorderResult {
  state: AudioRecorderState;
  actions: AudioRecorderActions;
}

export const useAudioRecorder = (): UseAudioRecorderResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Expo audio recorder setup
  const recorder = useExpoRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      outputFormat: 'aac',
      audioQuality: 96, // HIGH
    },
  });

  const recorderState = useAudioRecorderState(recorder, 100); // Update every 100ms
  const isInitialized = useRef(false);

  // Initialize audio recorder and check permissions
  useEffect(() => {
    if (!isInitialized.current) {
      checkPermissions();
      isInitialized.current = true;
    }

    return () => {
      // Cleanup on unmount
      if (recorderState.isRecording) {
        recorder.stop().catch(console.error);
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Microphone permission is required to record voice notes');
      }
    } catch (err) {
      console.error('Failed to check permissions:', err);
      setError('Failed to check microphone permissions');
      setHasPermission(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        setError('Microphone permission is required to record voice notes');
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
  };

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Check permissions first
      if (hasPermission !== true) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Configure audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();
      
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
  }, [hasPermission, recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setIsProcessing(true);
      
      await recorder.stop();
      const uri = recorder.uri;
      
      if (!uri) {
        throw new Error('No recording URI available');
      }
      
      return uri;
      
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
  }, [recorder]);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
      }
      setError(null);
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    }
  }, [recorder, recorderState.isRecording]);

  const resetRecorder = useCallback(() => {
    setError(null);
    setIsProcessing(false);
  }, []);

  const state: AudioRecorderState = {
    isRecording: recorderState.isRecording,
    isProcessing,
    recordingTime: Math.floor(recorderState.durationMillis / 1000),
    hasPermission,
    error,
  };

  const actions: AudioRecorderActions = {
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecorder,
    requestPermission,
  };

  return {
    state,
    actions,
  };
};