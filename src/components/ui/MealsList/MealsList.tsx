import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LoggedFood } from '../../../types';
import { colors, fonts, spacing } from '../../../constants/theme';
import { MealItem } from './MealItem';

interface MealsListProps {
  foods: LoggedFood[];
  onRemoveFood: (foodId: string) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
}

export const MealsList: React.FC<MealsListProps> = ({
  foods,
  onRemoveFood,
  onUpdateQuantity,
}) => {
  if (foods.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>No meals logged yet</Text>
        <Text style={styles.emptySubtitle}>
          Start by adding your first meal of the day
        </Text>
      </View>
    );
  }

  // Group foods by meal type
  const groupedFoods = foods.reduce((acc, food) => {
    const mealType = food.mealType;
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(food);
    return acc;
  }, {} as Record<string, LoggedFood[]>);

  const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const mealTypeLabels = {
    breakfast: '🌅 Breakfast',
    lunch: '🌞 Lunch',
    dinner: '🌙 Dinner',
    snacks: '🍎 Snacks',
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {mealTypeOrder.map((mealType) => {
        const mealFoods = groupedFoods[mealType];
        if (!mealFoods || mealFoods.length === 0) return null;

        const totalCalories = mealFoods.reduce((sum, food) => sum + food.nutrition.calories, 0);
        const totalProtein = mealFoods.reduce((sum, food) => sum + food.nutrition.protein, 0);
        const totalCarbs = mealFoods.reduce((sum, food) => sum + food.nutrition.carbs, 0);
        const totalFat = mealFoods.reduce((sum, food) => sum + food.nutrition.fat, 0);

        return (
          <View key={mealType} style={styles.mealSection}>
            <View style={styles.mealSectionHeader}>
              <Text style={styles.mealSectionTitle}>
                {mealTypeLabels[mealType as keyof typeof mealTypeLabels]}
              </Text>
              <View style={styles.mealSectionNutrition}>
                <Text style={styles.mealSectionCalories}>
                  {Math.round(totalCalories)} cal
                </Text>
                <Text style={styles.mealSectionMacros}>
                  P: {Math.round(totalProtein * 10) / 10}g • C: {Math.round(totalCarbs * 10) / 10}g • F: {Math.round(totalFat * 10) / 10}g
                </Text>
              </View>
            </View>
            
            <View style={styles.mealItems}>
              {mealFoods.map((food) => (
                <MealItem
                  key={food.id}
                  food={food}
                  onRemove={onRemoveFood}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  mealSection: {
    marginBottom: spacing.xl,
  },
  mealSectionHeader: {
    marginBottom: spacing.md,
  },
  mealSectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mealSectionNutrition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealSectionCalories: {
    fontSize: fonts.sm,
    fontWeight: '500' as const,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  mealSectionMacros: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  mealItems: {
    gap: spacing.sm,
  },
}); 