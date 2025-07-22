import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LoggedFood } from '../../../types';
import { colors, fonts, spacing } from '../../../constants/theme';
import { Card } from '../Card';

interface MealItemProps {
  food: LoggedFood;
  onRemove: (foodId: string) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
}

export const MealItem: React.FC<MealItemProps> = ({
  food,
  onRemove,
  onUpdateQuantity,
}) => {
  const handleRemove = () => {
    Alert.alert(
      'Remove Food',
      `Remove ${food.foodItem.name} from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => onRemove(food.id) 
        },
      ]
    );
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snacks':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '#FEF3C7';
      case 'lunch':
        return '#DBEAFE';
      case 'dinner':
        return '#E0E7FF';
      case 'snacks':
        return '#D1FAE5';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.foodName} numberOfLines={1}>
              {food.foodItem.name}
            </Text>
            <View style={[
              styles.mealTypeBadge, 
              { backgroundColor: getMealTypeColor(food.mealType) }
            ]}>
              <Text style={styles.mealTypeIcon}>
                {getMealTypeIcon(food.mealType)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.quantityText}>
              {food.quantity} {food.foodItem.servingSizeUnit || 'serving'}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(food.loggedAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={handleRemove}
        >
          <MaterialIcons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.calories)}
          </Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.protein * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.carbs * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.fat * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>fat</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  mealCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  foodName: {
    fontSize: fonts.base,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  mealTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mealTypeIcon: {
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: fonts.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray200,
  },
}); 