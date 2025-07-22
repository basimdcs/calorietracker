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
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  isProcessing,
  recordingTime,
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

      {/* Recording Info */}
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Processing Info */}
      {isProcessing && (
        <View style={styles.processingInfo}>
          <MaterialIcons name="hourglass-empty" size={20} color={colors.primary} />
          <Text style={styles.processingText}>Processing audio...</Text>
        </View>
      )}

      {/* Instructions */}
      {!isRecording && !isProcessing && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap to record your meal description
          </Text>
          <Text style={styles.instructionSubtext}>
            Speak naturally about what you ate
          </Text>
        </View>
      )}
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
  recordingInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    opacity: 0.8,
  },
  recordingText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  recordingTime: {
    fontSize: fonts.xl,
    color: colors.primary,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], // Monospace numbers
  },
  processingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.blue50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.blue200,
  },
  processingText: {
    fontSize: fonts.base,
    color: colors.primary,
    fontWeight: '500',
  },
  instructions: {
    alignItems: 'center',
    maxWidth: 280,
  },
  instructionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  instructionSubtext: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});