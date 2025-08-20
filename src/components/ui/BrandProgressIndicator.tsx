import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius } from '../../constants/theme';

interface BrandProgressIndicatorProps {
  progress: number; // 0 to 100
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
  showGradient?: boolean;
}

const BrandProgressIndicator: React.FC<BrandProgressIndicatorProps> = ({
  progress,
  height = 8,
  style,
  animated = true,
  showGradient = true,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  const renderProgressFill = () => {
    if (!containerWidth) return null; // Wait for container to measure

    if (showGradient) {
      return (
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              borderRadius: height / 2,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: [0, containerWidth],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradients.brandWave}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientFill, { borderRadius: height / 2 }]}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.progressFill,
          styles.solidFill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: colors.brandOuterSkin,
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: [0, containerWidth],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    );
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        {renderProgressFill()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  gradientFill: {
    flex: 1,
  },
  solidFill: {
    // No additional styles needed
  },
});

export default BrandProgressIndicator;