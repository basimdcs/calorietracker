import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { InputProps } from '../../types';
import { colors, fonts, components, spacing } from '../../constants/theme';

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  disabled = false,
  style,
}) => {
  const getInputStyle = () => {
    return {
      height: components.input.height,
      paddingHorizontal: components.input.paddingHorizontal,
      borderRadius: components.input.borderRadius,
      borderWidth: components.input.borderWidth,
      borderColor: error ? colors.error : colors.gray300,
      backgroundColor: disabled ? colors.gray100 : colors.white,
      fontSize: fonts.base,
      color: disabled ? colors.gray400 : colors.textPrimary,
    };
  };

  const getLabelStyle = () => {
    return {
      fontSize: fonts.sm,
      fontWeight: fonts.medium,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    };
  };

  const getErrorStyle = () => {
    return {
      fontSize: fonts.sm,
      color: colors.error,
      marginTop: spacing.xs,
    };
  };

  return (
    <View style={style}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <TextInput
        style={getInputStyle()}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
}; 