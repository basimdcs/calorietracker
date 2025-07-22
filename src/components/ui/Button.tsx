import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ButtonProps } from '../../types';
import { colors, fonts, components, shadows } from '../../constants/theme';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      height: components.button.height[size],
      paddingHorizontal: components.button.paddingHorizontal[size],
      borderRadius: components.button.borderRadius,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      ...shadows.sm,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.gray300 : colors.primary,
          borderColor: disabled ? colors.gray300 : colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.gray100 : colors.secondary,
          borderColor: disabled ? colors.gray300 : colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: disabled ? colors.gray300 : colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          ...shadows.none,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: size === 'small' ? fonts.sm : size === 'large' ? fonts.lg : fonts.base,
      fontWeight: fonts.medium,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray500 : colors.textOnPrimary,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray500 : colors.textOnSecondary,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray400 : colors.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray400 : colors.primary,
        };
      default:
        return baseTextStyle;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && icon}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}; 