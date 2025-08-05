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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { getSuggestedUnits, calculateNutrition, getEstimatedWeight, UnitConversion } from '../../utils/unitConversions';

interface QuantityModalProps {
  visible: boolean;
  food: ParsedFoodItem | null;
  onConfirm: (quantity: number, unit: string, updatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  onCancel: () => void;
}

const QUICK_QUANTITIES = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('pieces');

  const suggestedUnits = useMemo((): UnitConversion[] => {
    if (!food) return [];
    return getSuggestedUnits(food.name);
  }, [food]);

  // Reset values when modal opens with valid food
  useEffect(() => {
    if (visible && food) {
      setQuantityInput(String(food.quantity || 1));
      setSelectedUnit(food.unit || suggestedUnits[0]?.unit || 'pieces');
    }
  }, [visible, food, suggestedUnits]);

  const quantity = useMemo(() => {
    const parsed = parseFloat(quantityInput);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [quantityInput]);

  // Calculate updated nutrition with proper unit conversions
  const updatedNutrition = useMemo(() => {
    if (!food || quantity <= 0) return null;

    return calculateNutrition(
      {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      },
      food.quantity || 1,
      food.unit || 'pieces',
      quantity,
      selectedUnit,
      food.name
    );
  }, [food, quantity, selectedUnit]);

  // Get estimated weight based on quantity and unit
  const estimatedWeight = useMemo(() => {
    if (!food || quantity <= 0) return '0g';
    return getEstimatedWeight(quantity, selectedUnit, food.name);
  }, [food, quantity, selectedUnit]);

  const handleConfirm = useCallback(() => {
    if (quantity > 0 && updatedNutrition) {
      onConfirm(quantity, selectedUnit, updatedNutrition);
    }
  }, [quantity, selectedUnit, updatedNutrition, onConfirm]);

  const handleQuickQuantitySelect = useCallback((value: number) => {
    setQuantityInput(String(value));
  }, []);

  const handleUnitSelect = useCallback((unit: string) => {
    setSelectedUnit(unit);
  }, []);

  if (!food) {
    return null;
  }

  const isValidQuantity = quantity > 0;

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
            {/* Header with close button */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Set Quantity</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Food Info Section */}
              <View style={styles.foodSection}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.estimatedWeight}>{estimatedWeight}</Text>
                {updatedNutrition && (
                  <Text style={styles.nutritionSummary}>
                    {updatedNutrition.calories} cal • {updatedNutrition.protein}g protein • {updatedNutrition.carbs}g carbs • {updatedNutrition.fat}g fat
                  </Text>
                )}
              </View>

              {/* Quick Select Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Select</Text>
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
              </View>

              {/* Manual Entry Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Custom Amount</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>

              {/* Unit Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Unit</Text>
                <View style={styles.unitGrid}>
                  {suggestedUnits.map((unitOption) => {
                    const isSelected = selectedUnit === unitOption.unit;
                    return (
                      <TouchableOpacity
                        key={unitOption.unit}
                        style={[
                          styles.unitButton,
                          isSelected && styles.unitButtonActive,
                          unitOption.isRecommended && !isSelected && styles.unitButtonRecommended,
                        ]}
                        onPress={() => handleUnitSelect(unitOption.unit)}
                      >
                        {unitOption.isRecommended && !isSelected && (
                          <MaterialIcons 
                            name="star" 
                            size={14} 
                            color={colors.success} 
                            style={styles.unitStar} 
                          />
                        )}
                        <Text style={[
                          styles.unitButtonText,
                          isSelected && styles.unitButtonTextActive
                        ]}>
                          {unitOption.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Updated Nutrition Preview */}
              {updatedNutrition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🔥</Text>
                      <Text style={styles.nutritionValue}>{updatedNutrition.calories}</Text>
                      <Text style={styles.nutritionLabel}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>💪</Text>
                      <Text style={styles.nutritionValue}>{updatedNutrition.protein}g</Text>
                      <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🍞</Text>
                      <Text style={styles.nutritionValue}>{updatedNutrition.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionIcon}>🥑</Text>
                      <Text style={styles.nutritionValue}>{updatedNutrition.fat}g</Text>
                      <Text style={styles.nutritionLabel}>fat</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="secondary"
                style={styles.footerButton}
              />
              <Button
                title="Update"
                onPress={handleConfirm}
                variant="primary"
                style={styles.footerButton}
                disabled={!isValidQuantity}
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
  foodName: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  estimatedWeight: {
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
  },
  sectionTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    minWidth: '22%',
    height: 44,
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
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickButtonTextActive: {
    color: colors.white,
  },
  quantityInput: {
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
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    minWidth: '48%',
    justifyContent: 'center',
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
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  unitStar: {
    marginRight: spacing.xs,
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
});