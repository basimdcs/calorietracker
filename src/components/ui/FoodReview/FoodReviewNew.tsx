import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../../types';
import { colors, fonts, spacing, borderRadius } from '../../../constants/theme';
import { Button } from '../Button';
import { useTranslation } from '../../../hooks/useTranslation';
import { useRTLStyles } from '../../../utils/rtl';

interface FoodReviewNewProps {
  foods: ParsedFoodItem[];
  onEditFood: (index: number) => void;
  onRemoveFood: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatNutritionValue = (value: number): string => {
  return Math.round(value).toString();
};

export const FoodReviewNew: React.FC<FoodReviewNewProps> = ({
  foods,
  onEditFood,
  onRemoveFood,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { rtlText, rtlRow } = useRTLStyles();

  // Validate foods and filter out invalid entries
  const validatedFoods = useMemo(() => {
    return foods.filter(food =>
      food &&
      typeof food.name === 'string' &&
      food.name.trim() !== ''
    );
  }, [foods]);

  // Calculate meal totals
  const totalNutrition = useMemo(() => {
    return validatedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [validatedFoods]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, rtlRow]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, rtlText]}>
            {t('foodReview.title') || 'Review Your Meal'}
          </Text>
          <Text style={[styles.headerSubtitle, rtlText]}>
            {t('foodReview.subtitle') || 'Confirm or edit the items from your recording.'}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Meal Totals Card */}
      <View style={styles.totalsCard}>
        <View style={[styles.totalsHeader, rtlRow]}>
          <View>
            <Text style={[styles.totalsTitle, rtlText]}>
              {t('foodReview.mealTotals') || 'Meal Totals'}
            </Text>
            <Text style={[styles.itemCount, rtlText]}>
              {validatedFoods.length} {validatedFoods.length === 1
                ? (t('foodReview.item') || 'item')
                : (t('foodReview.items') || 'items')}
            </Text>
          </View>
          <View style={styles.caloriesBadge}>
            <Text style={styles.caloriesValue}>
              {formatNutritionValue(totalNutrition.calories)}
            </Text>
            <Text style={styles.caloriesLabel}>KCAL</Text>
          </View>
        </View>

        {/* Macros Row */}
        <View style={[styles.macrosRow, rtlRow]}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, rtlText]}>
              {formatNutritionValue(totalNutrition.protein)}G
            </Text>
            <Text style={[styles.macroLabel, rtlText]}>P</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, rtlText]}>
              {formatNutritionValue(totalNutrition.carbs)}G
            </Text>
            <Text style={[styles.macroLabel, rtlText]}>C</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, rtlText]}>
              {formatNutritionValue(totalNutrition.fat)}G
            </Text>
            <Text style={[styles.macroLabel, rtlText]}>F</Text>
          </View>
        </View>
      </View>

      {/* Food Items List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.foodList}>
          {validatedFoods.map((food, index) => (
            <View key={index} style={styles.foodCard}>
              {/* Food Header */}
              <View style={[styles.foodHeader, rtlRow]}>
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, rtlText]}>{food.name}</Text>
                  {food.quantity && food.unit && (
                    <Text style={[styles.foodQuantity, rtlText]}>
                      {food.quantity} {food.unit}
                    </Text>
                  )}
                  {food.cookingMethod && (
                    <Text style={[styles.cookingMethod, rtlText]}>
                      {food.cookingMethod}
                    </Text>
                  )}
                </View>

                {/* Action Icons */}
                <View style={[styles.foodActions, rtlRow]}>
                  <TouchableOpacity
                    onPress={() => onEditFood(index)}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.gray400} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRemoveFood(index)}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={colors.gray400} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nutrition Row */}
              <View style={[styles.nutritionGrid, rtlRow]}>
                <View style={styles.nutritionItemFirst}>
                  <Text style={styles.nutritionLabel}>KCAL</Text>
                  <Text style={styles.nutritionValue}>{formatNutritionValue(food.calories)}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>P</Text>
                  <Text style={styles.nutritionValue}>{formatNutritionValue(food.protein)}G</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>C</Text>
                  <Text style={styles.nutritionValue}>{formatNutritionValue(food.carbs)}G</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>F</Text>
                  <Text style={styles.nutritionValue}>{formatNutritionValue(food.fat)}G</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, rtlRow]}>
        <Button
          title={t('common.cancel') || 'Cancel'}
          onPress={onCancel}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title={t('common.confirm') || 'Confirm'}
          onPress={onConfirm}
          variant="primary"
          style={styles.footerButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  headerSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    width: '100%',
  },
  closeButton: {
    padding: spacing.sm,
  },
  // Meal Totals Card
  totalsCard: {
    backgroundColor: '#FFFBEA',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFF4CC',
  },
  totalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalsTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemCount: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  caloriesValue: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },
  caloriesLabel: {
    fontSize: fonts.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FFF4CC',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Food List
  scrollView: {
    flex: 1,
  },
  foodList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  foodCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  foodInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  foodName: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  foodQuantity: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    width: '100%',
  },
  cookingMethod: {
    fontSize: fonts.xs,
    color: colors.primary,
    fontWeight: '500',
    width: '100%',
  },
  foodActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  // Nutrition Grid
  nutritionGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },
  nutritionItemFirst: {
    alignItems: 'flex-start',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  nutritionValue: {
    fontSize: fonts.base,
    fontWeight: 'normal',
    color: colors.textPrimary,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerButton: {
    flex: 1,
  },
});
