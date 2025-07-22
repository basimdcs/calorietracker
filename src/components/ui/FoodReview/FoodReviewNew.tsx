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
import { nutritionService } from '../../../services/nutrition';

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
  const { totalNutrition, hasIssues, issueCount } = useMemo(() => {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    let issuesCount = 0;

    foods.forEach(food => {
      total.calories += food.calories || 0;
      total.protein += food.protein || 0;
      total.carbs += food.carbs || 0;
      total.fat += food.fat || 0;

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

  const selectedFood = selectedFoodIndex !== null ? foods[selectedFoodIndex] : null;

  // Modal handlers
  const handleQuantityModal = useCallback((index: number) => {
    setSelectedFoodIndex(index);
    setActiveModal('quantity');
  }, []);

  const handleCookingModal = useCallback((index: number) => {
    setSelectedFoodIndex(index);
    setActiveModal('cooking');
  }, []);

  const handleEditModal = useCallback((index: number) => {
    setSelectedFoodIndex(index);
    setActiveModal('edit');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('none');
    setSelectedFoodIndex(null);
  }, []);

  // Update handlers
  const handleQuantityUpdate = useCallback((quantity: number, unit: string) => {
    if (selectedFoodIndex === null || !selectedFood) return;

    // Calculate new nutrition values using the nutrition service
    const updatedNutrition = nutritionService.calculateNutrition({
      foodName: selectedFood.name,
      baseNutrition: {
        calories: selectedFood.calories / (selectedFood.quantity || 1),
        protein: selectedFood.protein / (selectedFood.quantity || 1),
        carbs: selectedFood.carbs / (selectedFood.quantity || 1),
        fat: selectedFood.fat / (selectedFood.quantity || 1),
      },
      quantity,
      unit,
      cookingMethod: selectedFood.cookingMethod,
    });

    const updatedFood: ParsedFoodItem = {
      ...selectedFood,
      quantity,
      unit,
      calories: updatedNutrition.calories,
      protein: updatedNutrition.protein,
      carbs: updatedNutrition.carbs,
      fat: updatedNutrition.fat,
      confidence: updatedNutrition.confidence,
      needsQuantity: false,
    };

    onUpdateFood(selectedFoodIndex, updatedFood);
    closeModal();
  }, [selectedFoodIndex, selectedFood, onUpdateFood, closeModal]);

  const handleCookingUpdate = useCallback((cookingMethod: string) => {
    if (selectedFoodIndex === null || !selectedFood) return;

    // Calculate new nutrition with cooking method
    const updatedNutrition = nutritionService.calculateNutrition({
      foodName: selectedFood.name,
      baseNutrition: {
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
      },
      quantity: selectedFood.quantity || 1,
      unit: selectedFood.unit || 'pieces',
      cookingMethod,
    });

    const updatedFood: ParsedFoodItem = {
      ...selectedFood,
      cookingMethod,
      calories: updatedNutrition.calories,
      protein: updatedNutrition.protein,
      carbs: updatedNutrition.carbs,
      fat: updatedNutrition.fat,
      confidence: updatedNutrition.confidence,
      needsCookingMethod: false,
    };

    onUpdateFood(selectedFoodIndex, updatedFood);
    closeModal();
  }, [selectedFoodIndex, selectedFood, onUpdateFood, closeModal]);

  const getConfirmButtonText = () => {
    if (hasIssues) {
      return `Fix ${issueCount} issue${issueCount > 1 ? 's' : ''} first`;
    }
    return `Log ${foods.length} item${foods.length > 1 ? 's' : ''}`;
  };

  return (
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
            <Text style={styles.summaryValue}>{Math.round(totalNutrition.calories)}</Text>
            <Text style={styles.summaryLabel}>calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalNutrition.protein)}g</Text>
            <Text style={styles.summaryLabel}>protein</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalNutrition.carbs)}g</Text>
            <Text style={styles.summaryLabel}>carbs</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalNutrition.fat)}g</Text>
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

          {/* Add More Button */}
          <TouchableOpacity style={styles.addButton} onPress={onAddFood}>
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add more food</Text>
          </TouchableOpacity>
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
        />
      </View>

      {/* Modals */}
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
    </SafeAreaView>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.blue50,
    marginTop: spacing.md,
  },
  addButtonText: {
    fontSize: fonts.base,
    color: colors.primary,
    fontWeight: '500',
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