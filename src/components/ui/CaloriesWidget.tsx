/**
 * Reusable Calories Widget Component
 * 
 * This component displays the circular progress calories widget
 * Used in both Home screen and History screen for consistency
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants/theme';

interface CaloriesWidgetProps {
  consumed: number;
  goal: number;
  progress: number; // 0-1
  title?: string;
}

export const CaloriesWidget: React.FC<CaloriesWidgetProps> = ({
  consumed,
  goal,
  progress,
  title = "Calories Consumed",
}) => {
  const remaining = Math.max(0, goal - consumed);
  const strokeDasharray = 402; // Circumference for 64px radius circle
  const strokeDashoffset = strokeDasharray - (Math.min(progress, 1) * strokeDasharray);

  return (
    <LinearGradient
      colors={colors.gradients.calorie}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.progressSection}>
        <View style={styles.circularProgressContainer}>
          <Svg width={144} height={144} style={styles.svgProgress}>
            {/* Background Circle */}
            <Circle
              cx={72}
              cy={72}
              r={64}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={12}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={72}
              cy={72}
              r={64}
              stroke="white"
              strokeWidth={12}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 72 72)"
            />
          </Svg>
          <View style={styles.progressCenter}>
            <Text style={styles.caloriesNumber}>{Math.round(consumed)}</Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.remainingCalories}>
        Remaining: <Text style={styles.remainingNumber}>{Math.round(remaining)} kcal</Text>
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgProgress: {
    position: 'absolute',
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  caloriesNumber: {
    fontSize: fonts['4xl'],
    fontFamily: fonts.heading,
    color: colors.white,
    lineHeight: fonts['4xl'] * 1.1,
  },
  caloriesUnit: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: -4,
  },
  remainingCalories: {
    fontSize: fonts.sm,
    color: colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  remainingNumber: {
    fontWeight: '600',
    color: colors.textOnPrimary,
    opacity: 1,
  },
});