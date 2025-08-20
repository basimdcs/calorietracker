import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors } from '../../constants/theme';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  duration?: number;
  showPulse?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 4,
  backgroundColor = 'rgba(255, 255, 255, 0.3)',
  progressColor = colors.white,
  animated = true,
  duration = 300,
  showPulse = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, duration, progressAnim]);

  useEffect(() => {
    if (showPulse && progress > 0 && progress < 100) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [showPulse, progress, pulseAnim]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, containerWidth],
    extrapolate: 'clamp',
  });

  return (
    <View 
      style={[styles.container, { height, backgroundColor }]}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: progressColor,
              transform: showPulse ? [{ scaleY: pulseAnim }] : [],
            },
          ]}
        />
      )}
      {showPulse && progress > 0 && progress < 100 && (
        <View style={styles.shimmer}>
          <Animated.View
            style={[
              styles.shimmerGradient,
              {
                transform: [
                  {
                    translateX: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [-100, 100],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },
});