import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';

interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  remainingTime?: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  isProcessing,
  recordingTime,
  remainingTime,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: pulseAnimation }] }
        ]}
      >
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            disabled && styles.recordButtonDisabled,
          ]}
          onPress={isRecording ? onStopRecording : onStartRecording}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isRecording 
              ? `Stop recording. Current duration: ${formatTime(recordingTime)}`
              : 'Start recording'
          }
          accessibilityState={{ 
            disabled: disabled,
            busy: isProcessing 
          }}
        >
          <MaterialIcons
            name={isRecording ? "stop" : "mic"}
            size={48}
            color={
              disabled 
                ? colors.gray400 
                : isRecording 
                  ? colors.white 
                  : colors.white
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Status and Timer Display */}
      <View style={styles.statusContainer}>
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.recordingTimeText}>
              {formatTime(recordingTime)}
            </Text>
            <Text style={styles.limitText}>
              20 sec limit
            </Text>
          </View>
        )}
        {isProcessing && (
          <Text style={styles.statusText}>Processing...</Text>
        )}
        {!isRecording && !isProcessing && (
          <Text style={styles.statusText}>Tap to record</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    minHeight: 200,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  timerContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  recordingTimeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  limitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});