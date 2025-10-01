import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItemWithConfidence, SmartUnit, CookingMethodOption } from '../../types/aiTypes';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar';

interface FoodDetailsModalProps {
  visible: boolean;
  food: ParsedFoodItemWithConfidence | null;
  onConfirm: (updatedFood: ParsedFoodItemWithConfidence) => void;
  onCancel: () => void;
}

const QUICK_QUANTITIES = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  // State management
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('grams');
  const [selectedCookingMethod, setSelectedCookingMethod] = useState('');
  const [manualGramsInput, setManualGramsInput] = useState('');
  const [showManualGramsEdit, setShowManualGramsEdit] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Reset values when modal opens with new food
  useEffect(() => {
    if (visible && food) {
      setQuantityInput(String(food.quantity || 1));
      setSelectedUnit(food.unit || 'grams');
      setSelectedCookingMethod(food.cookingMethod || '');
      setManualGramsInput(String(food.gramEquivalent || 100));
      setShowManualGramsEdit(false);
      setIsCalculating(false);
    }
  }, [visible, food]);

  // Parse current quantity input
  const quantity = useMemo(() => {
    const parsed = parseFloat(quantityInput);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [quantityInput]);

  // Parse manual grams input
  const manualGrams = useMemo(() => {
    const parsed = parseFloat(manualGramsInput);
    return isNaN(parsed) || parsed <= 0 ? 100 : parsed;
  }, [manualGramsInput]);

  // Get smart unit for current selection
  const currentSmartUnit = useMemo((): SmartUnit | null => {
    if (!food) return null;
    return food.suggestedUnits.find(unit => unit.unit === selectedUnit) || null;
  }, [food, selectedUnit]);

  // Calculate AI-estimated grams based on quantity and unit
  const aiEstimatedGrams = useMemo(() => {
    if (!currentSmartUnit) return food?.gramEquivalent || 100;
    return Math.round(quantity * currentSmartUnit.gramsPerUnit);
  }, [quantity, currentSmartUnit, food]);

  // Get final grams value (manual override or AI calculation)
  const finalGrams = useMemo(() => {
    return showManualGramsEdit ? manualGrams : aiEstimatedGrams;
  }, [showManualGramsEdit, manualGrams, aiEstimatedGrams]);

  // Calculate live nutrition based on current selections
  const liveNutrition = useMemo(() => {
    if (!food || finalGrams <= 0) return null;

    // Base nutrition calculation
    const multiplier = finalGrams / (food.gramEquivalent || 100);
    let calories = Math.round((food.calories || 0) * multiplier);
    let protein = Math.round((food.protein || 0) * multiplier * 10) / 10;
    let carbs = Math.round((food.carbs || 0) * multiplier * 10) / 10;
    let fat = Math.round((food.fat || 0) * multiplier * 10) / 10;

    // Apply cooking method multiplier if changed
    if (selectedCookingMethod && selectedCookingMethod !== food.cookingMethod) {
      const cookingOption = food.alternativeMethods.find(m => m.method === selectedCookingMethod);
      if (cookingOption) {
        const cookingMultiplier = cookingOption.calorie_multiplier;
        calories = Math.round(calories * cookingMultiplier);
        protein = Math.round(protein * cookingMultiplier * 10) / 10;
        carbs = Math.round(carbs * cookingMultiplier * 10) / 10;
        fat = Math.round(fat * cookingMultiplier * 10) / 10;
      }
    }

    return { calories, protein, carbs, fat };
  }, [food, finalGrams, selectedCookingMethod]);

  // Determine what sections to show - always show if food exists (user can manually adjust)
  const showSections = useMemo(() => {
    if (!food) return { quantity: false, cooking: false };
    return {
      quantity: true, // Always allow quantity adjustment
      cooking: food.alternativeMethods && food.alternativeMethods.length > 0 // Show if cooking methods available
    };
  }, [food]);

  // Handle quick quantity selection
  const handleQuickQuantitySelect = useCallback((value: number) => {
    setQuantityInput(String(value));
    setShowManualGramsEdit(false); // Reset to AI calculation when changing quantity
  }, []);

  // Handle unit selection
  const handleUnitSelect = useCallback((unit: string) => {
    setSelectedUnit(unit);
    setShowManualGramsEdit(false); // Reset to AI calculation when changing unit
  }, []);

  // Handle cooking method selection
  const handleCookingMethodSelect = useCallback((method: string) => {
    setSelectedCookingMethod(method);
  }, []);

  // Handle manual grams toggle
  const handleToggleManualGrams = useCallback(() => {
    if (showManualGramsEdit) {
      // Switching back to AI calculation
      setShowManualGramsEdit(false);
    } else {
      // Switching to manual edit - pre-populate with current AI estimate
      setManualGramsInput(String(aiEstimatedGrams));
      setShowManualGramsEdit(true);
    }
  }, [showManualGramsEdit, aiEstimatedGrams]);

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    if (!food || !liveNutrition) return;

    setIsCalculating(true);

    try {
      // Create updated food item
      const updatedFood: ParsedFoodItemWithConfidence = {
        ...food,
        quantity,
        unit: selectedUnit,
        gramEquivalent: finalGrams,
        calories: liveNutrition.calories,
        protein: liveNutrition.protein,
        carbs: liveNutrition.carbs,
        fat: liveNutrition.fat,
        cookingMethod: selectedCookingMethod || food.cookingMethod,
        needsQuantityModal: false, // Mark as resolved
        needsCookingModal: false,  // Mark as resolved
        userModified: true,        // Mark as user-modified
        // Update original AI estimate if user made manual changes
        ...(showManualGramsEdit && {
          originalAIEstimate: {
            ...food.originalAIEstimate,
            grams: aiEstimatedGrams // Store what AI calculated vs what user chose
          }
        })
      };

      await new Promise(resolve => setTimeout(resolve, 300)); // Brief loading state
      onConfirm(updatedFood);
    } catch (error) {
      console.error('Failed to update food details:', error);
      Alert.alert('Error', 'Failed to update food details. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  }, [food, quantity, selectedUnit, finalGrams, selectedCookingMethod, liveNutrition, showManualGramsEdit, aiEstimatedGrams, onConfirm]);

  // Get confidence indicator
  const getConfidenceIndicator = useCallback((confidence: number) => {
    if (confidence >= 0.8) return { emoji: '🟢', label: 'High Confidence' };
    if (confidence >= 0.6) return { emoji: '🟡', label: 'Medium Confidence' };
    return { emoji: '🔴', label: 'Low Confidence' };
  }, []);

  if (!food) return null;

  const confidenceIndicator = getConfidenceIndicator(food.overallConfidence);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Food Details</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Food Info Section */}
              <View style={styles.foodSection}>
                <View style={styles.foodHeader}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceEmoji}>{confidenceIndicator.emoji}</Text>
                    <Text style={styles.confidenceLabel}>{confidenceIndicator.label}</Text>
                  </View>
                </View>
                
                <Text style={styles.finalGrams}>
                  {finalGrams}g {showManualGramsEdit && '(manual)'}
                </Text>
                
                {liveNutrition && (
                  <Text style={styles.nutritionSummary}>
                    {liveNutrition.calories} cal • {liveNutrition.protein}g protein • {liveNutrition.carbs}g carbs • {liveNutrition.fat}g fat
                  </Text>
                )}
              </View>

              {/* Quantity Section - Only show if needed */}
              {showSections.quantity && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount</Text>
                  
                  {/* Quantity Input */}
                  <View style={styles.quantityRow}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      placeholder="1"
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <View style={styles.unitSelector}>
                      {food.suggestedUnits.slice(0, 2).map((unit) => (
                        <TouchableOpacity
                          key={unit.unit}
                          style={[
                            styles.unitButton,
                            selectedUnit === unit.unit && styles.unitButtonActive,
                            unit.isRecommended && !selectedUnit === unit.unit && styles.unitButtonRecommended,
                          ]}
                          onPress={() => handleUnitSelect(unit.unit)}
                        >
                          <Text style={[
                            styles.unitButtonText,
                            selectedUnit === unit.unit && styles.unitButtonTextActive
                          ]}>
                            {unit.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Quick Select */}
                  <View style={styles.quickGrid}>
                    {QUICK_QUANTITIES.map((preset) => {
                      const isSelected = quantityInput === String(preset);
                      return (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.quickButton,
                            isSelected && styles.quickButtonActive
                          ]}
                          onPress={() => handleQuickQuantitySelect(preset)}
                        >
                          <Text style={[
                            styles.quickButtonText,
                            isSelected && styles.quickButtonTextActive
                          ]}>
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* AI Conversion Display */}
                  <View style={styles.conversionDisplay}>
                    <Text style={styles.conversionText}>
                      {quantity} {selectedUnit} → ≈ {aiEstimatedGrams}g
                    </Text>
                    {currentSmartUnit && currentSmartUnit.confidence < 0.8 && (
                      <Text style={styles.conversionWarning}>
                        ⚠️ AI estimate varies by size
                      </Text>
                    )}
                  </View>

                  {/* Manual Override */}
                  <TouchableOpacity 
                    style={styles.manualToggle}
                    onPress={handleToggleManualGrams}
                  >
                    <MaterialIcons 
                      name={showManualGramsEdit ? "edit-off" : "edit"} 
                      size={16} 
                      color={colors.primary} 
                    />
                    <Text style={styles.manualToggleText}>
                      {showManualGramsEdit ? 'Use AI estimate' : 'Edit grams manually'}
                    </Text>
                  </TouchableOpacity>

                  {showManualGramsEdit && (
                    <TextInput
                      style={styles.manualGramsInput}
                      value={manualGramsInput}
                      onChangeText={setManualGramsInput}
                      placeholder="Enter grams"
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  )}
                </View>
              )}

              {/* Cooking Method Section - Only show if needed */}
              {showSections.cooking && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cooking Method</Text>
                  <Text style={styles.sectionSubtitle}>How was this prepared?</Text>

                  {food.alternativeMethods.map((method) => {
                    const isSelected = selectedCookingMethod === method.method;
                    return (
                      <TouchableOpacity
                        key={method.method}
                        style={[
                          styles.cookingButton,
                          isSelected && styles.cookingButtonActive
                        ]}
                        onPress={() => handleCookingMethodSelect(method.method)}
                      >
                        <Text style={styles.cookingIcon}>{method.icon}</Text>
                        <View style={styles.cookingContent}>
                          <Text style={[
                            styles.cookingText,
                            isSelected && styles.cookingTextActive
                          ]}>
                            {method.method}
                          </Text>
                          <Text style={[
                            styles.cookingArabic,
                            isSelected && styles.cookingArabicActive
                          ]}>
                            {method.arabic_name}
                          </Text>
                        </View>
                        <View style={styles.cookingImpact}>
                          {method.calorie_multiplier !== 1.0 && (
                            <Text style={styles.cookingMultiplier}>
                              {method.calorie_multiplier > 1.0 ? '+' : ''}{Math.round((method.calorie_multiplier - 1) * 100)}%
                            </Text>
                          )}
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Live Nutrition Preview */}
              {liveNutrition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Updated Nutrition</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🔥</Text>
                      <Text style={styles.nutritionValue}>{liveNutrition.calories}</Text>
                      <Text style={styles.nutritionLabel}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>💪</Text>
                      <Text style={styles.nutritionValue}>{liveNutrition.protein}g</Text>
                      <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🍞</Text>
                      <Text style={styles.nutritionValue}>{liveNutrition.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🥑</Text>
                      <Text style={styles.nutritionValue}>{liveNutrition.fat}g</Text>
                      <Text style={styles.nutritionLabel}>fat</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* AI Assumptions Display */}
              {food.assumptions.length > 0 && (
                <View style={styles.assumptionsSection}>
                  <Text style={styles.assumptionsTitle}>AI Assumptions</Text>
                  {food.assumptions.map((assumption, index) => (
                    <Text key={index} style={styles.assumptionText}>• {assumption}</Text>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="secondary"
                style={styles.footerButton}
                disabled={isCalculating}
              />
              <Button
                title="Update"
                onPress={handleConfirm}
                variant="primary"
                style={[styles.footerButton, styles.confirmButton]}
                loading={isCalculating}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  foodSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray50,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  foodName: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  confidenceEmoji: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  confidenceLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  finalGrams: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  nutritionSummary: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quantityInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: fonts.lg,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: colors.white,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  unitButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    justifyContent: 'center',
    minWidth: 80,
  },
  unitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  unitButtonRecommended: {
    borderColor: colors.success,
    backgroundColor: colors.green50,
  },
  unitButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickButton: {
    flex: 1,
    minWidth: '22%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  quickButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickButtonTextActive: {
    color: colors.white,
  },
  conversionDisplay: {
    backgroundColor: colors.blue50,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  conversionText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  conversionWarning: {
    fontSize: fonts.xs,
    color: colors.warning,
    fontStyle: 'italic',
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  manualToggleText: {
    fontSize: fonts.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  manualGramsInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: fonts.lg,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  cookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  cookingButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  cookingIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  cookingContent: {
    flex: 1,
  },
  cookingText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cookingTextActive: {
    color: colors.primary,
  },
  cookingArabic: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  cookingArabicActive: {
    color: colors.primary,
  },
  cookingImpact: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cookingMultiplier: {
    fontSize: fonts.xs,
    fontWeight: 'bold',
    color: colors.warning,
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  nutritionIcon: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  nutritionValue: {
    fontSize: fonts.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  assumptionsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.yellow50,
    borderTopWidth: 1,
    borderTopColor: colors.yellow200,
  },
  assumptionsTitle: {
    fontSize: fonts.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  assumptionText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  footerButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});