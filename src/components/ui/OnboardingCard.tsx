import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

interface OnboardingCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  variant?: 'default' | 'gradient' | 'glass';
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  children,
  title,
  subtitle,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  variant = 'default',
}) => {
  const renderContent = () => (
    <View style={[styles.container, contentStyle]}>
      {title && (
        <Text style={[styles.title, titleStyle]}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]}>
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={[colors.brandFlesh, colors.brandWaveMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        {renderContent()}
      </LinearGradient>
    );
  }

  if (variant === 'glass') {
    return (
      <View style={[styles.card, styles.glassCard, style]}>
        {renderContent()}
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.defaultCard, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  defaultCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.md,
  },
  gradientCard: {
    ...shadows.lg,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    ...shadows.md,
  },
  container: {
    // No additional styles needed for container
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default OnboardingCard;