import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';

interface TranscriptionMethodSwitchProps {
  useGPT4o: boolean;
  onToggle: (useGPT4o: boolean) => void;
  disabled?: boolean;
}

export const TranscriptionMethodSwitch: React.FC<TranscriptionMethodSwitchProps> = ({
  useGPT4o,
  onToggle,
  disabled = false,
}) => {
  const slideAnim = useRef(new Animated.Value(useGPT4o ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: useGPT4o ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [useGPT4o, slideAnim]);

  const handlePress = () => {
    if (disabled) return;
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(!useGPT4o);
  };

  const whisperConfig = {
    icon: 'mic' as const,
    title: '🎵 Whisper API',
    subtitle: 'Specialized speech-to-text • Fast & reliable',
    color: colors.info,
    bgColor: colors.info + '10',
  };

  const gpt4oConfig = {
    icon: 'auto-awesome' as const,
    title: '🤖 GPT-4o Audio',
    subtitle: 'Advanced reasoning • Better context',
    color: colors.success,
    bgColor: colors.success + '10',
  };

  const currentConfig = useGPT4o ? gpt4oConfig : whisperConfig;
  const oppositeConfig = useGPT4o ? whisperConfig : gpt4oConfig;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.switchContainer,
          { backgroundColor: currentConfig.bgColor },
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {/* Background sliding indicator */}
        <Animated.View
          style={[
            styles.slidingBackground,
            {
              backgroundColor: currentConfig.color,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 180], // Adjust based on your design
                  }),
                },
              ],
            },
          ]}
        />

        {/* Whisper Option */}
        <View style={[styles.option, !useGPT4o && styles.activeOption]}>
          <MaterialIcons
            name={whisperConfig.icon}
            size={24}
            color={!useGPT4o ? colors.white : whisperConfig.color}
          />
          <View style={styles.optionText}>
            <Text
              style={[
                styles.optionTitle,
                { color: !useGPT4o ? colors.white : whisperConfig.color },
              ]}
            >
              Whisper
            </Text>
            <Text
              style={[
                styles.optionSubtitle,
                { color: !useGPT4o ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
              ]}
            >
              Speech API
            </Text>
          </View>
        </View>

        {/* GPT-4o Option */}
        <View style={[styles.option, useGPT4o && styles.activeOption]}>
          <MaterialIcons
            name={gpt4oConfig.icon}
            size={24}
            color={useGPT4o ? colors.white : gpt4oConfig.color}
          />
          <View style={styles.optionText}>
            <Text
              style={[
                styles.optionTitle,
                { color: useGPT4o ? colors.white : gpt4oConfig.color },
              ]}
            >
              GPT-4o
            </Text>
            <Text
              style={[
                styles.optionSubtitle,
                { color: useGPT4o ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
              ]}
            >
              Audio AI
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>{currentConfig.title}</Text>
        <Text style={styles.descriptionSubtitle}>{currentConfig.subtitle}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  disabled: {
    opacity: 0.6,
  },
  slidingBackground: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 12,
    width: '50%',
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    zIndex: 1,
  },
  activeOption: {
    // Active styles handled by sliding background
  },
  optionText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  optionTitle: {
    fontSize: fonts.base,
    fontFamily: fonts.heading,
    lineHeight: 20,
  },
  optionSubtitle: {
    fontSize: fonts.xs,
    fontFamily: fonts.body,
    lineHeight: 16,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  descriptionTitle: {
    fontSize: fonts.sm,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  descriptionSubtitle: {
    fontSize: fonts.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});