import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing } from '../../../constants/theme';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  calories: number;
  goal: number;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 144,
  strokeWidth = 12,
  calories,
  goal,
  color = colors.primary,
}) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402
  const strokeDasharray = circumference;
  // For 60% progress: show 60% of arc, hide 40%
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
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
          stroke={color}
          strokeWidth={12}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 72 72)"
        />
      </Svg>
      
      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={styles.caloriesText}>{Math.round(calories)}</Text>
        <Text style={styles.unitText}>kcal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesText: {
    fontSize: fonts['4xl'],
    fontWeight: 'bold',
    color: 'white',
    lineHeight: fonts['4xl'] * 1.1,
  },
  unitText: {
    fontSize: fonts.sm,
    color: 'white',
    opacity: 0.8,
    marginTop: -4,
  },
}); 