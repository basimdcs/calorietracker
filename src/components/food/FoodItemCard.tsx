import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../ui/Card';
import { nutritionService } from '../../services/nutrition';

interface FoodItemCardProps {
  food: ParsedFoodItem;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onQuickQuantity: (index: number) => void;
  onQuickCooking: (index: number) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  food,
  index,
  onEdit,
  onRemove,
  onQuickQuantity,
  onQuickCooking,
}) => {
  const confidenceColor = food.confidence >= 0.8 ? colors.success : 
                         food.confidence >= 0.6 ? colors.warning : colors.error;
  
  const confidenceText = nutritionService.getConfidenceDescription(food.confidence);
  
  const handleRemove = () => {
    Alert.alert(
      'Remove Food Item',
      `Remove "${food.name}" from your meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => onRemove(index) 
        },
      ]
    );
  };

  const hasIssues = food.needsQuantity || food.needsCookingMethod;
  const quantityText = food.quantity ? 
    `${food.quantity} ${food.unit || 'pieces'}` : 
    'Quantity needed';
  
  return (
    <Card style={[styles.container, hasIssues && styles.containerNeedsAttention]}>
      {/* Header with food name and actions */}
      <View style={styles.header}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={2}>
            {food.name}
          </Text>
          <View style={styles.foodMeta}>
            <Text style={styles.quantityText}>
              📏 {quantityText}
            </Text>
            {food.cookingMethod && (
              <Text style={styles.cookingText}>
                🍳 {food.cookingMethod}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(index)}
            accessibilityLabel="Edit food item"
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
            accessibilityLabel="Remove food item"
            accessibilityRole="button"
          >
            <MaterialIcons name="delete" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nutrition information */}
      <View style={styles.nutrition}>
        <View style={styles.nutritionBadges}>
          <View style={[styles.nutritionBadge, styles.caloriesBadge]}>
            <Text style={styles.badgeIcon}>🔥</Text>
            <Text style={styles.badgeValue}>{Math.round(food.calories)}</Text>
            <Text style={styles.badgeLabel}>cal</Text>
          </View>
          
          <View style={[styles.nutritionBadge, styles.proteinBadge]}>
            <Text style={styles.badgeIcon}>💪</Text>
            <Text style={styles.badgeValue}>{Math.round(food.protein * 10) / 10}g</Text>
            <Text style={styles.badgeLabel}>protein</Text>
          </View>
          
          <View style={[styles.nutritionBadge, styles.carbsBadge]}>
            <Text style={styles.badgeIcon}>🍞</Text>
            <Text style={styles.badgeValue}>{Math.round(food.carbs * 10) / 10}g</Text>
            <Text style={styles.badgeLabel}>carbs</Text>
          </View>
          
          <View style={[styles.nutritionBadge, styles.fatBadge]}>
            <Text style={styles.badgeIcon}>🥑</Text>
            <Text style={styles.badgeValue}>{Math.round(food.fat * 10) / 10}g</Text>
            <Text style={styles.badgeLabel}>fat</Text>
          </View>
        </View>

        {/* Confidence indicator */}
        <View style={styles.confidence}>
          <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
          <Text style={styles.confidenceText}>{confidenceText}</Text>
        </View>
      </View>

      {/* Action buttons for missing info */}
      {hasIssues && (
        <View style={styles.issuesContainer}>
          {food.needsQuantity && (
            <TouchableOpacity
              style={styles.issueButton}
              onPress={() => onQuickQuantity(index)}
              accessibilityLabel="Set quantity"
              accessibilityRole="button"
            >
              <MaterialIcons name="straighten" size={16} color={colors.warning} />
              <Text style={styles.issueButtonText}>Set Quantity</Text>
            </TouchableOpacity>
          )}
          
          {food.needsCookingMethod && (
            <TouchableOpacity
              style={styles.issueButton}
              onPress={() => onQuickCooking(index)}
              accessibilityLabel="Set cooking method"
              accessibilityRole="button"
            >
              <MaterialIcons name="restaurant" size={16} color={colors.warning} />
              <Text style={styles.issueButtonText}>Set Cooking Method</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  containerNeedsAttention: {
    borderColor: colors.warning,
    borderWidth: 2,
    backgroundColor: colors.yellow50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  foodInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  foodName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  foodMeta: {
    gap: spacing.xs,
  },
  quantityText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  cookingText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  removeButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.red50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  nutrition: {
    gap: spacing.sm,
  },
  nutritionBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nutritionBadge: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    minHeight: 60,
    justifyContent: 'center',
  },
  caloriesBadge: {
    backgroundColor: colors.red50,
  },
  proteinBadge: {
    backgroundColor: colors.blue50,
  },
  carbsBadge: {
    backgroundColor: colors.yellow50,
  },
  fatBadge: {
    backgroundColor: colors.green50,
  },
  badgeIcon: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  badgeValue: {
    fontSize: fonts.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  badgeLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  confidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  issuesContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.yellow200,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  issueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  issueButtonText: {
    fontSize: fonts.sm,
    color: colors.warning,
    fontWeight: '500',
  },
});