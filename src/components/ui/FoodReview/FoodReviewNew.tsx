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
import { ParsedFoodItemWithConfidence } from '../../../types/aiTypes';
import { colors, fonts, spacing } from '../../../constants/theme';
import { ScreenHeader } from '../../layout';
import { Button } from '../Button';
import { FoodItemCard } from '../../food/FoodItemCard';
import { FoodDetailsModal } from '../../food/FoodDetailsModal';


interface FoodReviewNewProps {
  foods: ParsedFoodItemWithConfidence[];
  onUpdateFood: (index: number, updatedFood: ParsedFoodItemWithConfidence) => void;
  onRemoveFood: (index: number) => void;
  onAddFood: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type ModalType = 'none' | 'details';

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

// Helper function to get confidence indicator
function getConfidenceIndicator(confidence: number) {
  if (confidence >= 0.8) return { emoji: '🟢', color: colors.success, label: 'High' };
  if (confidence >= 0.6) return { emoji: '🟡', color: colors.warning, label: 'Medium' };
  return { emoji: '🔴', color: colors.error, label: 'Low' };
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

  // Foods are already processed with confidence - use them directly
  const validatedFoods = foods;

  // Calculate totals and validation using confidence-based foods
  const { totalNutrition, hasIssues, issueCount } = useMemo((): ValidationResult => {
    const total: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    let issuesCount = 0;

    validatedFoods.forEach(food => {
      // Safely add nutrition values
      total.calories += food.calories || 0;
      total.protein += food.protein || 0;
      total.carbs += food.carbs || 0;
      total.fat += food.fat || 0;

      // Count items that need clarification (using confidence-based flags)
      if (food.needsQuantityModal || food.needsCookingModal) {
        issuesCount++;
      }
    });

    return {
      totalNutrition: total,
      hasIssues: issuesCount > 0,
      issueCount: issuesCount,
    };
  }, [validatedFoods]);

  const selectedFood = useMemo(() => {
    return selectedFoodIndex !== null && selectedFoodIndex < validatedFoods.length 
      ? validatedFoods[selectedFoodIndex] 
      : null;
  }, [selectedFoodIndex, validatedFoods]);

  // Modal handlers - unified for all food details
  const handleFoodDetailsModal = useCallback((index: number) => {
    console.log('Opening food details modal for index:', index);
    setSelectedFoodIndex(index);
    setActiveModal('details');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('none');
    setSelectedFoodIndex(null);
  }, []);

  // Update handler - unified for all food details
  const handleFoodDetailsUpdate = useCallback((updatedFood: ParsedFoodItemWithConfidence) => {
    if (selectedFoodIndex === null) {
      console.warn('No food selected for update');
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
    return `Log ${validatedFoods.length} item${validatedFoods.length !== 1 ? 's' : ''}`;
  }, [hasIssues, issueCount, validatedFoods.length]);

  const formatNutritionValue = useCallback((value: number, unit: string = '') => {
    return `${Math.round(value * 10) / 10}${unit}`;
  }, []);

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <ScreenHeader
          title="Review Your Meal 🍽️"
          subtitle={`${validatedFoods.length} food items detected`}
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
            {validatedFoods.map((food, index) => {
              const confidenceIndicator = getConfidenceIndicator(food.overallConfidence);
              const needsAttention = food.needsQuantityModal || food.needsCookingModal;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleFoodDetailsModal(index)}
                  style={[
                    styles.foodCard,
                    needsAttention && styles.foodCardNeedsAttention
                  ]}
                >
                  {/* Food Item Header */}
                  <View style={styles.foodHeader}>
                    <View style={styles.foodNameSection}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      {needsAttention && (
                        <View style={styles.attentionBadge}>
                          <MaterialIcons name="warning" size={12} color={colors.warning} />
                          <Text style={styles.attentionText}>Needs details</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.foodActions}>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceEmoji}>{confidenceIndicator.emoji}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onRemoveFood(index)}
                        style={styles.removeButton}
                      >
                        <MaterialIcons name="close" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Nutrition Summary */}
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionText}>
                      {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                    </Text>
                  </View>

                  {/* Quantity & Cooking Info */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      {food.quantity} {food.unit} ({food.gramEquivalent}g)
                    </Text>
                    {food.cookingMethod && (
                      <Text style={styles.cookingText}>• {food.cookingMethod}</Text>
                    )}
                  </View>

                  {/* Issues Indicators */}
                  {needsAttention && (
                    <View style={styles.issuesRow}>
                      {food.needsQuantityModal && (
                        <View style={styles.issueBadge}>
                          <MaterialIcons name="straighten" size={12} color={colors.warning} />
                          <Text style={styles.issueText}>Quantity</Text>
                        </View>
                      )}
                      {food.needsCookingModal && (
                        <View style={styles.issueBadge}>
                          <MaterialIcons name="restaurant" size={12} color={colors.warning} />
                          <Text style={styles.issueText}>Cooking</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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

      {/* Unified Food Details Modal */}
      <FoodDetailsModal
        visible={activeModal === 'details'}
        food={selectedFood}
        onConfirm={handleFoodDetailsUpdate}
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
    backgroundColor: colors.background,
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
    shadowColor: colors.black,
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
  // New food card styles with confidence indicators
  foodCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  foodCardNeedsAttention: {
    borderColor: colors.warning,
    borderWidth: 1.5,
    backgroundColor: colors.yellow50,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  foodNameSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  foodName: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  attentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.warning + '20',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  attentionText: {
    fontSize: fonts.xs,
    color: colors.warning,
    fontWeight: '600',
  },
  foodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  confidenceEmoji: {
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionRow: {
    marginBottom: spacing.sm,
  },
  nutritionText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailsText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cookingText: {
    fontSize: fonts.xs,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  issuesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.warning + '15',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  issueText: {
    fontSize: fonts.xs,
    color: colors.warning,
    fontWeight: '600',
  },
});