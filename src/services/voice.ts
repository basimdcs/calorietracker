import { 
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  canRecord: boolean;
}

export const useVoiceRecording = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  // Create the audio recorder with HIGH_QUALITY preset
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to record audio',
          [{ text: 'OK' }]
        );
        setHasPermission(false);
        return false;
      }

      // Set audio mode for recording
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      // Check if we're in simulator (which doesn't have real microphone)
      if (__DEV__ && Platform.OS === 'ios') {
        console.warn('⚠️  SIMULATOR DETECTED: Audio recording may produce silent files in iOS Simulator. Test on real device for proper audio.');
      }

      console.log('Starting recording...');
      setRecordingUri(null);

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      console.log('Stopping recording...');

      // Stop the recording
      await audioRecorder.stop();
      
      // Get the recording URI
      const uri = audioRecorder.uri;
      setRecordingUri(uri);
      
      console.log('Recording stopped and stored at:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
      return null;
    }
  };

  // Convert recorderState to our interface format
  const recordingState: VoiceRecordingState = {
    isRecording: recorderState.isRecording,
    isPaused: false, // expo-audio doesn't seem to have pause state
    recordingDuration: recorderState.durationMillis || 0,
    canRecord: hasPermission,
  };

  return {
    recordingState,
    recordingUri,
    startRecording,
    stopRecording,
    requestPermissions,
    // Helper functions for UI
    formatDuration: (milliseconds: number): string => {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    getMaxDuration: (): number => 30000, // 30 seconds in milliseconds
  };
}; 