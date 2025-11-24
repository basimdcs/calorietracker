import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { useTranslation } from '../../hooks/useTranslation';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  leftIconColor?: string;
  onLeftPress?: () => void;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIconColor?: string;
  onRightPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  centerTitle?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  leftIconColor = colors.primary,
  onLeftPress,
  rightIcon,
  rightIconColor = colors.textSecondary,
  onRightPress,
  showBackButton = false,
  onBackPress,
  centerTitle = false,
}) => {
  const { currentLanguage } = useTranslation();

  // Use Cairo font for Arabic, Inter for English
  const titleFontFamily = currentLanguage === 'ar' ? 'Cairo_700Bold' : 'Inter_700Bold';
  const subtitleFontFamily = currentLanguage === 'ar' ? 'Cairo_400Regular' : 'Inter_400Regular';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {leftIcon && !showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onLeftPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name={leftIcon}
                size={24}
                color={leftIconColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section */}
        <View style={[styles.titleContainer, centerTitle && styles.titleContainerCentered]}>
          <Text style={[styles.title, { fontFamily: titleFontFamily }]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { fontFamily: subtitleFontFamily }]} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name={rightIcon}
                size={24}
                color={rightIconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  titleContainerCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 