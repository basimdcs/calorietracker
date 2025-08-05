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

/**
 * Get food emoji based on food name
 */
const getFoodEmoji = (foodName: string): string => {
  const name = foodName.toLowerCase();
  if (name.includes('chicken') || name.includes('salad')) return '🥗';
  if (name.includes('apple') || name.includes('fruit')) return '🍎';
  if (name.includes('pasta') || name.includes('spaghetti')) return '🍝';
  if (name.includes('rice')) return '🍚';
  if (name.includes('bread')) return '🍞';
  if (name.includes('egg')) return '🥚';
  if (name.includes('fish')) return '🐟';
  if (name.includes('meat') || name.includes('beef')) return '🥩';
  if (name.includes('vegetable')) return '🥕';
  if (name.includes('milk') || name.includes('dairy')) return '🥛';
  return '🍽️';
};

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
  return (
    <View style={styles.container}>
      {/* Food Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{getFoodEmoji(food.name)}</Text>
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
              <MaterialIcons name="delete" size={20} color="#ef4444" />
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
    backgroundColor: '#f0f4f2',
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
    color: '#111714',
    marginBottom: spacing.xs,
  },
  quantity: {
    fontSize: fonts.sm,
    color: '#648772',
    marginBottom: spacing.xs,
  },
  calories: {
    fontSize: fonts.sm,
    color: '#111714',
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  macros: {
    fontSize: fonts.xs,
    color: '#648772',
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: fonts.xs,
    color: '#648772',
    marginBottom: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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