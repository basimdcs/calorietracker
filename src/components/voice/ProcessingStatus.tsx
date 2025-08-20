import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar';

interface ProcessingStatusProps {
  state: 'transcribing' | 'parsing';
  progress?: number;
  transcriptionMethod?: 'whisper' | 'gpt4o';
  parsingMethod?: 'gpt4o' | 'gpt5';
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  state,
  progress = 0,
  transcriptionMethod = 'whisper',
  parsingMethod = 'gpt4o',
}) => {
  const iconRotation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for processing icon
    const rotationAnimation = Animated.loop(
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotationAnimation.start();

    return () => {
      rotationAnimation.stop();
    };
  }, [iconRotation, fadeAnim]);

  const rotation = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusInfo = () => {
    switch (state) {
      case 'transcribing':
        return {
          icon: 'hearing' as const,
          title: '🎯 Converting speech to text...',
          subtitle: `Using ${transcriptionMethod === 'gpt4o' ? 'GPT-4o Audio' : 'Whisper API'} • Multilingual Support`,
          color: colors.info,
        };
      case 'parsing':
        return {
          icon: 'psychology' as const,
          title: '🤖 Analyzing food items...',
          subtitle: `Using ${parsingMethod === 'gpt5' ? 'GPT-5-nano Enhanced' : 'GPT-4o Legacy'} • Egyptian Context`,
          color: colors.primary,
        };
      default:
        return {
          icon: 'sync' as const,
          title: 'Processing...',
          subtitle: 'Please wait',
          color: colors.gray500,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialIcons 
            name={statusInfo.icon} 
            size={28} 
            color={colors.white} 
          />
        </Animated.View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{statusInfo.title}</Text>
        <Text style={styles.subtitle}>{statusInfo.subtitle}</Text>
        
        <View style={styles.progressContainer}>
          <AnimatedProgressBar
            progress={progress}
            height={6}
            backgroundColor="rgba(255, 255, 255, 0.2)"
            progressColor={colors.white}
            animated={true}
            duration={500}
            showPulse={progress > 0 && progress < 100}
          />
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        
        {/* Processing dots animation */}
        <ProcessingDots />
      </View>
    </Animated.View>
  );
};

const ProcessingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

    const animation1 = createDotAnimation(dot1, 0);
    const animation2 = createDotAnimation(dot2, 200);
    const animation3 = createDotAnimation(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: fonts.lg,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fonts.sm,
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontFamily: fonts.heading,
    marginLeft: spacing.sm,
    minWidth: 40,
    textAlign: 'right',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginHorizontal: 2,
  },
});