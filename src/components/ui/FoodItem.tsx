/**
 * Reusable FoodItem Component
 *
 * Simple horizontal layout: [Icon] [Name + Quantity] [Calories] [Delete]
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { FoodItemProps } from '../../types/display';
import { getFoodIcon } from '../../utils/foodIcons';
import { useRTLStyles } from '../../utils/rtl';
import { useTranslation } from '../../hooks/useTranslation';

export const FoodItem: React.FC<FoodItemProps> = ({
  food,
  onDelete,
  showActions = true,
}) => {
  const foodEmoji = food.icon || getFoodIcon(food.name);
  const { rtlMarginRight, rtlRow } = useRTLStyles();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, rtlRow]}>
      {/* Food Icon */}
      <View style={[styles.iconContainer, rtlMarginRight(12)]}>
        <Text style={styles.emoji}>{foodEmoji}</Text>
      </View>

      {/* Food Info - Name and Quantity */}
      <View style={[styles.infoContainer, rtlMarginRight(12)]}>
        <Text style={styles.name} numberOfLines={1}>
          {food.name}
        </Text>
        <Text style={styles.quantity} numberOfLines={1}>
          {food.displayQuantity}
        </Text>
      </View>

      {/* Calories */}
      <Text style={[styles.calories, rtlMarginRight(12)]}>
        {Math.round(food.calories)} {t('nutrition.kcal')}
      </Text>

      {/* Delete Button */}
      {showActions && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(food.id)}
        >
          <MaterialIcons name="close" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    height: 70,
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  calories: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 0,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
