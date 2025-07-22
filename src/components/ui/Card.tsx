import React from 'react';
import { View } from 'react-native';
import { CardProps } from '../../types';
import { colors, components, shadows } from '../../constants/theme';

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'medium',
  padding = 'medium',
}) => {
  const getCardStyle = () => {
    const shadowMap = {
      low: shadows.sm,
      medium: shadows.md,
      high: shadows.lg,
    };

    return {
      backgroundColor: colors.surface,
      borderRadius: components.card.borderRadius,
      padding: components.card.padding[padding],
      ...shadowMap[elevation],
      // Add shadow color for iOS
      shadowColor: colors.black,
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}; 