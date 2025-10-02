/**
 * Reusable FoodItem Component
 * 
 * This component ensures consistent food item display across all screens.
 * It prevents the property access inconsistencies that caused bugs.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { FoodItemProps } from '../../types/display';
import { getFoodIcon } from '../../utils/foodIcons';

/**
 * Consistent FoodItem component for all screens
 *
 * Usage:
 * ```tsx
 * <FoodItem
 *   food={displayFood}
 *   onDelete={(id) => handleDelete(id)}
 *   showMacros={true}
 *   showTime={true}
 * />
 * ```
 */
export const FoodItem: React.FC<FoodItemProps> = ({
  food,
  onDelete,
  onEdit,
  showActions = true,
  showMacros = true,
  showTime = true,
}) => {
  // Use the icon from the food item (set by AI or fallback from foodIcons utility)
  const foodEmoji = food.icon || getFoodIcon(food.name);

  return (
    <View style={styles.container}>
      {/* Food Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{foodEmoji}</Text>
      </View>
      
      {/* Food Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.quantity}>{food.displayQuantity}</Text>
        <Text style={styles.calories}>{Math.round(food.calories)} calories</Text>
        
        {showMacros && (
          <Text style={styles.macros}>
            P: {Math.round(food.protein)}g | C: {Math.round(food.carbs)}g | F: {Math.round(food.fat)}g
          </Text>
        )}
      </View>
      
      {/* Actions */}
      {showActions && (
        <View style={styles.actionsContainer}>
          {showTime && (
            <Text style={styles.time}>{food.displayTime}</Text>
          )}
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => onDelete(food.id)}
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary50,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quantity: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  calories: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  macros: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: `${colors.error}15`,
  },
});

/**
 * COMPONENT DOCUMENTATION:
 * 
 * This component solves the property access issues by:
 * 
 * 1. Using DisplayFood type which flattens nested properties
 * 2. Centralizing food emoji logic
 * 3. Providing consistent styling across all screens
 * 4. Handling optional props for different use cases
 * 
 * ALWAYS use this component instead of custom food item JSX
 * in Home, History, or any other screen that displays food items.
 */