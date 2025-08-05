import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../../types';
import { colors, fonts, spacing } from '../../../constants/theme';
import { ScreenHeader } from '../../layout';
import { Button } from '../Button';
import { FoodItemCard } from '../../food/FoodItemCard';
import { QuantityModal } from '../../food/QuantityModal';
import { CookingMethodModal } from '../../food/CookingMethodModal';
import { EditFoodModal } from '../../food/EditFoodModal';


interface FoodReviewNewProps {
  foods: ParsedFoodItem[];
  onUpdateFood: (index: number, updatedFood: ParsedFoodItem) => void;
  onRemoveFood: (index: number) => void;
  onAddFood: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type ModalType = 'none' | 'quantity' | 'cooking' | 'edit';

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ValidationResult {
  totalNutrition: NutritionTotals;
  hasIssues: boolean;
  issueCount: number;
}

export const FoodReviewNew: React.FC<FoodReviewNewProps> = ({
  foods,
  onUpdateFood,
  onRemoveFood,
  onAddFood,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedFoodIndex, setSelectedFoodIndex] = useState<number | null>(null);

  // Calculate totals and validation
  const { totalNutrition, hasIssues, issueCount } = useMemo((): ValidationResult => {
    const total: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    let issuesCount = 0;

    foods.forEach(food => {
      // Safely add nutrition values
      total.calories += food.calories || 0;
      total.protein += food.protein || 0;
      total.carbs += food.carbs || 0;
      total.fat += food.fat || 0;

      // Count items that need more details
      if (food.needsQuantity || food.needsCookingMethod) {
        issuesCount++;
      }
    });

    return {
      totalNutrition: total,
      hasIssues: issuesCount > 0,
      issueCount: issuesCount,
    };
  }, [foods]);

  const selectedFood = useMemo(() => {
    return selectedFoodIndex !== null && selectedFoodIndex < foods.length 
      ? foods[selectedFoodIndex] 
      : null;
  }, [selectedFoodIndex, foods]);

  // Modal handlers
  const handleQuantityModal = useCallback((index: number) => {
    console.log('Opening quantity modal for index:', index);
    setSelectedFoodIndex(index);
    setActiveModal('quantity');
  }, []);

  const handleCookingModal = useCallback((index: number) => {
    console.log('Opening cooking modal for index:', index);
    setSelectedFoodIndex(index);
    setActiveModal('cooking');
  }, []);

  const handleEditModal = useCallback((index: number) => {
    console.log('Opening edit modal for index:', index);
    setSelectedFoodIndex(index);
    setActiveModal('edit');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('none');
    setSelectedFoodIndex(null);
  }, []);

  // Update handlers
  const handleQuantityUpdate = useCallback((quantity: number, unit: string, updatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    if (selectedFoodIndex === null || !selectedFood) {
      console.warn('No food selected for quantity update');
      return;
    }

    try {
      const updatedFood: ParsedFoodItem = {
        ...selectedFood,
        quantity,
        unit,
        calories: updatedNutrition.calories,
        protein: updatedNutrition.protein,
        carbs: updatedNutrition.carbs,
        fat: updatedNutrition.fat,
        needsQuantity: false,
      };

      onUpdateFood(selectedFoodIndex, updatedFood);
      closeModal();
    } catch (error) {
      console.error('Failed to update food quantity:', error);
    }
  }, [selectedFoodIndex, selectedFood, onUpdateFood, closeModal]);

  const handleCookingUpdate = useCallback((cookingMethod: string) => {
    if (selectedFoodIndex === null || !selectedFood) {
      console.warn('No food selected for cooking method update');
      return;
    }

    try {
      // Calculate cooking method impact on calories
      const multiplier = {
        'Raw': 1.0,
        'Boiled': 1.0,
        'Steamed': 1.0,
        'Grilled': 1.1,
        'Baked': 1.05,
        'Roasted': 1.1,
        'Sautéed': 1.2,
        'Stir-fried': 1.25,
        'Fried': 1.4,
        'Deep Fried': 1.8,
        'Braised': 1.15,
      }[cookingMethod] || 1.0;

      const updatedFood: ParsedFoodItem = {
        ...selectedFood,
        cookingMethod,
        calories: Math.round(selectedFood.calories * multiplier),
        protein: Math.round((selectedFood.protein * multiplier) * 10) / 10,
        carbs: Math.round((selectedFood.carbs * multiplier) * 10) / 10,
        fat: Math.round((selectedFood.fat * multiplier) * 10) / 10,
        needsCookingMethod: false,
      };

      onUpdateFood(selectedFoodIndex, updatedFood);
      closeModal();
    } catch (error) {
      console.error('Failed to update cooking method:', error);
    }
  }, [selectedFoodIndex, selectedFood, onUpdateFood, closeModal]);

  const handleEditUpdate = useCallback((updatedFood: ParsedFoodItem) => {
    if (selectedFoodIndex === null) {
      console.warn('No food selected for edit update');
      return;
    }

    try {
      onUpdateFood(selectedFoodIndex, updatedFood);
      closeModal();
    } catch (error) {
      console.error('Failed to update food:', error);
    }
  }, [selectedFoodIndex, onUpdateFood, closeModal]);

  const getConfirmButtonText = useCallback(() => {
    if (hasIssues) {
      return `Fix ${issueCount} issue${issueCount !== 1 ? 's' : ''} first`;
    }
    return `Log ${foods.length} item${foods.length !== 1 ? 's' : ''}`;
  }, [hasIssues, issueCount, foods.length]);

  const formatNutritionValue = useCallback((value: number, unit: string = '') => {
    return `${Math.round(value * 10) / 10}${unit}`;
  }, []);

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <ScreenHeader
          title="Review Your Meal 🍽️"
          subtitle={`${foods.length} food items detected`}
          rightIcon="close"
          onRightPress={onCancel}
        />

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatNutritionValue(totalNutrition.calories)}
              </Text>
              <Text style={styles.summaryLabel}>calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatNutritionValue(totalNutrition.protein, 'g')}
              </Text>
              <Text style={styles.summaryLabel}>protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatNutritionValue(totalNutrition.carbs, 'g')}
              </Text>
              <Text style={styles.summaryLabel}>carbs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatNutritionValue(totalNutrition.fat, 'g')}
              </Text>
              <Text style={styles.summaryLabel}>fat</Text>
            </View>
          </View>

          {hasIssues && (
            <View style={styles.issuesWarning}>
              <MaterialIcons name="warning" size={16} color={colors.warning} />
              <Text style={styles.issuesText}>
                {issueCount} item{issueCount > 1 ? 's need' : ' needs'} more details
              </Text>
            </View>
          )}
        </View>

        {/* Food Items List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.foodList}>
            {foods.map((food, index) => (
              <FoodItemCard
                key={index}
                food={food}
                index={index}
                onEdit={handleEditModal}
                onRemove={onRemoveFood}
                onQuickQuantity={handleQuantityModal}
                onQuickCooking={handleCookingModal}
              />
            ))}

          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={styles.footerButton}
          />
          <Button
            title={getConfirmButtonText()}
            onPress={onConfirm}
            variant="primary"
            style={[styles.footerButton, styles.confirmButton]}
            disabled={hasIssues || isLoading}
            loading={isLoading}
            accessibilityLabel={hasIssues ? 'Fix issues before logging food' : 'Log all food items'}
          />
        </View>
      </SafeAreaView>

      {/* Modals - Rendered outside SafeAreaView for proper z-index */}
      <QuantityModal
        visible={activeModal === 'quantity'}
        food={selectedFood}
        onConfirm={handleQuantityUpdate}
        onCancel={closeModal}
      />

      <CookingMethodModal
        visible={activeModal === 'cooking'}
        food={selectedFood}
        onConfirm={handleCookingUpdate}
        onCancel={closeModal}
      />

      <EditFoodModal
        visible={activeModal === 'edit'}
        food={selectedFood}
        onConfirm={handleEditUpdate}
        onCancel={closeModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  summaryValue: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  issuesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.yellow50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.yellow200,
  },
  issuesText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.warning,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  foodList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  footerButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});